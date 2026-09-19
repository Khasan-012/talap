/* ================= Единый план поступления (все вузы вместе) ================= */
var PLAN_CACHE = {};
var PLAN_LOADING = {};
function chosenKey(){ migrateState(); return getChosen().map(function(u){ return u.name; }).sort().join('|'); }
function monthKey(y,m){ return y+'-'+m; }
function unisLine(){ return getChosen().map(function(u){ return u.name; }).join(', '); }
function ensureUnified(){
  migrateState();
  var ck=chosenKey();
  if(!ck){ S.plan=null; return false; }
  if(!S.plan||!S.plan.unis||S.plan.unisKey!==ck||!S.plan.range){
    S.plan={v:2,unisKey:ck,unis:getChosen().map(function(u){ return {name:u.name,place:u.place||''}; }),
      range:calRange(),years:null,yearPlans:{},monthPlans:{},dayGoals:{},dayChecks:{},ai:false};
  if(!S.planChecks||typeof S.planChecks!=='object') S.planChecks={};
  if(!S.collapsed||typeof S.collapsed!=='object') S.collapsed={};
    save();
  }
  return true;
}
function refreshViews(){ try{ renderMain(); }catch(e){} try{ renderCal(); }catch(e){} }
function withTimeout(p,ms){ return Promise.race([p,new Promise(function(_,rej){ setTimeout(function(){ rej(new Error('timeout')); },ms||30000); })]); }
function aiTry(prompt,parse){
  var i=0;
  function next(){
    if(i>=GEMINI_MODELS.length) return Promise.reject(new Error('all models failed'));
    var m=GEMINI_MODELS[i++];
    return Promise.resolve().then(function(){ return modelJSON(m,prompt); }).then(parse).catch(function(){ return next(); });
  }
  return next();
}
function yearsPrompt(){
  var R=S.plan.range;
  return 'Ты — наставник по поступлению. Школьник поступает в вузы: '+unisLine()+'. Горизонт: '+R.y0+'–'+R.y1+'.\n\nПРОФИЛЬ:\n'+compactProfileText(PROFILE_BUDGETS.plan)+'\n\nСоставь ОБЩИЙ план подготовки по годам (один для всех вузов). Верни СТРОГО JSON: {"years":[{"y":'+R.y0+',"t":"...","d":"..."}]} — по одному пункту на КАЖДЫЙ год с '+R.y0+' по '+R.y1+'. t — короткий заголовок года, d — 2-3 предложения что делать с учётом профиля. Только JSON.';
}
function yearPrompt(y){
  return 'Ты — наставник по поступлению. Школьник поступает в вузы: '+unisLine()+'.\n\nПРОФИЛЬ:\n'+compactProfileText(PROFILE_BUDGETS.plan)+'\n\nСоставь ОБЩИЙ план на '+y+' год по месяцам (один для всех вузов). Верни СТРОГО JSON: {"months":[{"m":"Январь","t":"...","d":"..."}]} — ровно 12 пунктов, m — название месяца, t — заголовок, d — 1-2 предложения. Только JSON.';
}
function monthPrompt(y,mName){
  var dim=new Date(y,CAL_MONTHS.indexOf(mName)+1,0).getDate();
  return 'Ты — наставник по поступлению. Школьник поступает в вузы: '+unisLine()+'.\n\nПРОФИЛЬ:\n'+compactProfileText(PROFILE_BUDGETS.plan)+'\n\nСоставь НАСЫЩЕННЫЙ план на '+mName+' '+y+' года: на КАЖДЫЙ день придумай по 3-4 РАЗНЫЕ конкретные задачи, чтобы каждый день обязательно покрывал: 1) АНГЛИЙСКИЙ язык (слова, чтение, аудирование, эссе), 2) УРОКИ и профильные предметы (математика, физика и др. из профиля), 3) АКТИВНОСТИ (олимпиады, хакатоны, проекты, портфолио, спорт). Плюс иногда документы и пробники. Каждая задача — подробно и понятно: что делать, как делать, сколько времени. Верни СТРОГО JSON: {"steps":[{"day":1,"c":"Английский","t":"...","how":"..."}]} — day число месяца от 1 до '+dim+', c — категория строго из списка (Английский, Уроки, Активности, Документы, Экзамены), t — что делать конкретно, how — как делать и сколько времени. Всего около '+(dim*3)+' пунктов. Без воды. Только JSON.';
}
function fallbackYears(){
  var R=S.plan?S.plan.range:calRange(), out=[];
  for(var y=R.y0;y<=R.y1;y++){
    var last=(y===R.y1), first=(y===R.y0);
    out.push({y:y,
      t:last?'Подача и поступление':(first?'Фундамент':'Углубление'),
      d:last?('Сдаёшь экзамены и подаёшь документы в '+unisLine()+', подтверждаешь грант.'):
        (first?'База: английский, математика и профильные предметы, первые олимпиады и проекты.':
          'IELTS, пробники и портфолио под требования: '+unisLine()+'.')});
  }
  return out;
}
function fallbackYearPlan(){
  var tpl=[
    ['Пробники','Сдай 2 полных пробника в условиях реального времени и разбери все ошибки.'],
    ['Документы','Готовь мотивационное письмо, рекомендации и транскрипт.'],
    ['Профильные предметы','Упор на математику и предметы по направлению, разбирай пробники.'],
    ['Английский','IELTS каждый день по 40 минут плюс 1 пробный тест в неделю.'],
    ['Активности','Олимпиада, хакатон или pet-проект — доведи один до конца.'],
    ['Портфолио','Собери всё в одну папку: грамоты, проекты, сертификаты.'],
    ['Повторение','Закрой пробелы по слабым темам, веди трекер ошибок.'],
    ['Экзамены','Запишись на нужные слоты и готовься по плану.'],
    ['Требования','Сверь требования вузов: баллы, дедлайны, экзамены.'],
    ['Интервью','Потренируй интервью и самопрезентацию с наставником.'],
    ['Заявки','Отправь документы и следи за статусами.'],
    ['Отдых и план','Восстанови силы и распиши следующий месяц.']
  ];
  return CAL_MONTHS.map(function(mn,mi){ return {m:mn,t:tpl[mi%tpl.length][0],d:tpl[mi%tpl.length][1]}; });
}
function fallbackMonthPlan(y,mi){
  var dim=new Date(y,mi+1,0).getDate(), out=[];
  var eng=[
    '15 новых слов + повторение вчерашних, 10 минут аудирования.',
    '1 текст с полным переводом + 5 новых выражений в словарь.',
    'Эссе 150 слов + проверка по чек-листу грамматики.',
    '30 минут сериала/подкаста на английском с субтитрами, выписать фразы.'
  ];
  var les=[
    'Математика: 1 тема и 10 задач с таймером, ошибки — в трекер.',
    'Профильный предмет: 1 параграф, конспект и 5 вопросов себе вслух.',
    'Мини-пробник 45 минут в тишине + разбор каждой ошибки.',
    'Повторение: 20 старых карточек и 1 слабая тема заново.'
  ];
  var act=[
    'Олимпиадные задачи: 1 час, зафиксируй решения и вопросы.',
    'Проект: 1 час кода/дизайна, закоммить результат.',
    'Портфолио: оформи 1 достижение — текст, фото, ссылки.',
    'Документы: 30 минут — требования вузов, дедлайны, письма.'
  ];
  for(var d=1;d<=dim;d++){
    out.push({day:d,c:'Английский',t:'Английский — день '+d,d:eng[(d-1)%eng.length]});
    out.push({day:d,c:'Уроки',t:'Уроки — день '+d,d:les[(d-1)%les.length]});
    out.push({day:d,c:'Активности',t:'Активности — день '+d,d:act[(d-1)%act.length]});
  }
  return out;
}
function fetchYears(){
  var ck=S.plan.unisKey, R=S.plan.range, ck2='years|'+ck+'|'+R.y0+'-'+R.y1;
  if(PLAN_CACHE[ck2]) return Promise.resolve(PLAN_CACHE[ck2]);
  return aiTry(yearsPrompt(),function(o){
    if(!o.years||!o.years.length) throw new Error('empty');
    var out=o.years.slice(0,10).map(function(r){ return {y:parseInt(r.y,10)||0,t:String(r.t||''),d:String(r.d||'')}; })
      .filter(function(r){ return r.y&&r.t; });
    if(!out.length) throw new Error('empty');
    PLAN_CACHE[ck2]=out; return out;
  });
}
function fetchYearPlan(y){
  var ck=S.plan.unisKey, ck2='year|'+ck+'|'+y;
  if(PLAN_CACHE[ck2]) return Promise.resolve(PLAN_CACHE[ck2]);
  return aiTry(yearPrompt(y),function(o){
    if(!o.months||!o.months.length) throw new Error('empty');
    var out=o.months.slice(0,12).map(function(r){ return {m:String(r.m||''),t:String(r.t||''),d:String(r.d||'')}; })
      .filter(function(r){ return r.m&&r.t; });
    if(out.length<6) throw new Error('too few');
    PLAN_CACHE[ck2]=out; return out;
  });
}
function fetchMonthPlan(y,mi){
  var ck=S.plan.unisKey, ck2='month|'+ck+'|'+y+'-'+mi;
  if(PLAN_CACHE[ck2]) return Promise.resolve(PLAN_CACHE[ck2]);
  return aiTry(monthPrompt(y,CAL_MONTHS[mi]),function(o){
    var arr=o.steps||o.days||[];
    if(!arr.length) throw new Error('empty');
    var out=arr.slice(0,140).map(function(r){
      return {day:parseInt((r.day!=null?r.day:r.n),10)||0,c:String(r.c||''),
        t:String(r.t||''),d:String((r.how!=null?r.how:(r.d||'')))};
    }).filter(function(r){ return r.t&&r.day; });
    if(out.length<20) throw new Error('too few');
    out.sort(function(a,b){ return a.day-b.day; });
    PLAN_CACHE[ck2]=out; return out;
  });
}
function removeUni(name){
  migrateState();
  S.chosenUnis=S.chosenUnis.filter(function(u){ return u.name!==name; });
  if(S.chosenUni&&S.chosenUni.name===name) S.chosenUni=S.chosenUnis[0]||null;
  save(); try{ renderTier(); }catch(e){}
  refreshViews();
  toast('Убрано: '+name);
}
function monthProgress(key){
  var steps=((S.plan&&S.plan.monthPlans&&S.plan.monthPlans[key])||[]);
  var chks=((S.planChecks&&S.planChecks[key])||{}), done=0;
  steps.forEach(function(_,ix){ if(chks[ix]) done++; });
  return {done:done,total:steps.length,pct:steps.length?Math.round(done/steps.length*100):0};
}
function toggleStep(key,ix){
  if(!S.planChecks||typeof S.planChecks!=='object') S.planChecks={};
  if(!S.planChecks[key]) S.planChecks[key]={};
  if(S.planChecks[key][ix]) delete S.planChecks[key][ix]; else S.planChecks[key][ix]=1;
  save(); refreshViews();
}
function planComplete(){
  if(!S.plan||!S.plan.years||!S.plan.range) return false;
  var R=S.plan.range;
  for(var y=R.y0;y<=R.y1;y++) if(!S.plan.yearPlans[y]) return false;
  var n=new Date();
  if(!S.plan.monthPlans[monthKey(n.getFullYear(),n.getMonth())]) return false;
  return true;
}
function buildProgress(){
  if(!S.plan||!S.plan.range) return null;
  var R=S.plan.range, total=1+(R.y1-R.y0+1)+1, done=0;
  if(S.plan.years) done++;
  for(var y=R.y0;y<=R.y1;y++) if(S.plan.yearPlans[y]) done++;
  var n=new Date();
  if(S.plan.monthPlans[monthKey(n.getFullYear(),n.getMonth())]) done++;
  var labels=['Строим общий план по годам…','Составляем планы на 12 месяцев…','Расписываем текущий месяц по дням…','Готово'];
  var stage=!S.plan.years?0:(done<total-1?1:(done<total?2:3));
  return {done:done,total:total,pct:Math.round(done/total*100),label:labels[stage],finished:done>=total};
}
function buildFullPlan(){
  if(!ensureUnified()){ refreshViews(); return; }
  if(planComplete()) return;
  var ck=S.plan.unisKey, lk='full|'+ck;
  if(PLAN_LOADING[lk]) return; PLAN_LOADING[lk]=1;
  refreshViews();
  function startYearPlans(){
    var R=S.plan.range, ys=[];
    for(var y=R.y0;y<=R.y1;y++) ys.push(y);
    var ps=ys.map(function(yy){
      return withTimeout(fetchYearPlan(yy)).then(
        function(o){ return {y:yy,o:o,ok:true}; },
        function(){ return {y:yy,o:fallbackYearPlan(),ok:false}; });
    });
    return Promise.all(ps);
  }
  withTimeout(fetchYears()).then(function(out){
    if(!S.plan||S.plan.unisKey!==ck) throw new Error('changed');
    S.plan.years=out; S.plan.ai=true; save(); refreshViews();
    return startYearPlans();
  },function(){
    if(!S.plan||S.plan.unisKey!==ck) throw new Error('changed');
    S.plan.years=fallbackYears(); save(); refreshViews();
    return startYearPlans();
  }).then(function(res){
    if(!S.plan||S.plan.unisKey!==ck) throw new Error('changed');
    var anyAi=S.plan.ai;
    res.forEach(function(r){ S.plan.yearPlans[r.y]=r.o; if(r.ok) anyAi=true; });
    S.plan.ai=anyAi; save(); refreshViews();
    var n=new Date();
    return withTimeout(fetchMonthPlan(n.getFullYear(),n.getMonth())).then(
      function(o){ return {o:o,ok:true}; },
      function(){ var nn=new Date(); return {o:fallbackMonthPlan(nn.getFullYear(),nn.getMonth()),ok:false}; });
  }).then(function(r){
    delete PLAN_LOADING[lk];
    if(!S.plan||S.plan.unisKey!==ck) return;
    var n=new Date();
    S.plan.monthPlans[monthKey(n.getFullYear(),n.getMonth())]=r.o;
    if(r.ok) S.plan.ai=true;
    save(); refreshViews();
  }).catch(function(){ delete PLAN_LOADING[lk]; save(); refreshViews(); });
}
function ensureYears(){
  if(!ensureUnified()){ refreshViews(); return; }
  if(S.plan.years) return;
  var ck=S.plan.unisKey, lk='years|'+ck;
  if(PLAN_LOADING[lk]) return; PLAN_LOADING[lk]=1;
  withTimeout(fetchYears()).then(function(out){
    delete PLAN_LOADING[lk];
    if(!S.plan||S.plan.unisKey!==ck) return;
    S.plan.years=out; S.plan.ai=true; save(); refreshViews();
  }).catch(function(){
    delete PLAN_LOADING[lk];
    if(!S.plan||S.plan.unisKey!==ck) return;
    S.plan.years=fallbackYears(); S.plan.ai=false; save(); refreshViews();
  });
}
function ensureYearPlan(y){
  if(!ensureUnified()){ refreshViews(); return; }
  if(S.plan.yearPlans[y]) return;
  var ck=S.plan.unisKey, lk='year|'+ck+'|'+y;
  if(PLAN_LOADING[lk]) return; PLAN_LOADING[lk]=1;
  withTimeout(fetchYearPlan(y)).then(function(out){
    delete PLAN_LOADING[lk];
    if(!S.plan||S.plan.unisKey!==ck) return;
    S.plan.yearPlans[y]=out; S.plan.ai=true; save(); refreshViews();
  }).catch(function(){
    delete PLAN_LOADING[lk];
    if(!S.plan||S.plan.unisKey!==ck) return;
    S.plan.yearPlans[y]=fallbackYearPlan(); S.plan.ai=false; save(); refreshViews();
  });
}
function ensureMonthPlan(y,mi){
  if(!ensureUnified()){ refreshViews(); return; }
  var key=monthKey(y,mi);
  if(S.plan.monthPlans[key]) return;
  var ck=S.plan.unisKey, lk='month|'+ck+'|'+key;
  if(PLAN_LOADING[lk]) return; PLAN_LOADING[lk]=1;
  withTimeout(fetchMonthPlan(y,mi)).then(function(out){
    delete PLAN_LOADING[lk];
    if(!S.plan||S.plan.unisKey!==ck) return;
    S.plan.monthPlans[key]=out; S.plan.ai=true; save(); refreshViews();
  }).catch(function(){
    delete PLAN_LOADING[lk];
    if(!S.plan||S.plan.unisKey!==ck) return;
    S.plan.monthPlans[key]=fallbackMonthPlan(y,mi); S.plan.ai=false; save(); refreshViews();
  });
}
function rebootPlan(){
  S.plan=null; S.planChecks={}; save();
  buildFullPlan();
  toast('План перестраивается…');
}
function ringSVG(pct){
  var C=2*Math.PI*38;
  return '<svg width="110" height="110" viewBox="0 0 110 110">'
    +'<circle cx="55" cy="55" r="38" stroke="rgba(255,255,255,.08)" stroke-width="11" fill="none"/>'
    +'<circle cx="55" cy="55" r="38" stroke="url(#pg)" stroke-width="11" fill="none" stroke-linecap="round" stroke-dasharray="'+C.toFixed(1)+'" stroke-dashoffset="'+(C*(1-pct/100)).toFixed(1)+'" transform="rotate(-90 55 55)" style="transition:stroke-dashoffset .6s ease"/>'
    +'<defs><linearGradient id="pg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00d2ff"/><stop offset="1" stop-color="#7b2ff7"/></linearGradient></defs></svg>';
}
function renderMain(){
  migrateState();
  var body=document.getElementById('mainBody');
  var chosen=getChosen();
  document.getElementById('mainSub').textContent=chosen.length?('Общий план • вузов: '+chosen.length):'Твой план поступления';
  if(!chosen.length){
    body.innerHTML='<div class="card"><div class="bignum">?</div><div class="cap">Сначала выбери вузы — можно несколько сразу. Составим один общий план: по годам, на год и подробный на текущий месяц.</div></div><div style="height:12px"></div>'
      +(S.done
        ?'<button class="btn" id="mTier">Открыть тирлист (20) →</button>'
        :'<button class="btn" id="mSurvey">Пройти анкету →</button>');
    var mt=document.getElementById('mTier'); if(mt) mt.onclick=function(){ finish(); };
    var ms=document.getElementById('mSurvey'); if(ms) ms.onclick=function(){ showTab('survey'); };
    return;
  }
  ensureUnified();
  buildFullPlan();
  var bp=buildProgress();
  var h='<div class="unichips">'+chosen.map(function(u){
    return '<div class="unichip">'+esc(u.name)+'<button class="x" data-remove="'+esc(u.name)+'">✕</button></div>';
  }).join('')+'</div>';
  var n=new Date(), key=monthKey(n.getFullYear(),n.getMonth()), todayN=n.getDate();
  var mp=S.plan.monthPlans[key];
  var wd=['Вс','Пн','Вт','Ср','Чт','Пт','Сб'][n.getDay()];
  h+='<div class="tier-head"><div class="tier-name">Сегодня • '+todayN+' '+esc(CAL_MONTHS[n.getMonth()])+'</div><div class="tier-sub">'+wd+' • цели только на сегодня</div></div>';
  if(!mp){
    h+='<div class="card"><div class="uspinner"><div class="spin"></div>'+esc(bp?bp.label:'Строим план…')+'</div>'
      +(bp?'<div class="bar"><i style="width:'+bp.pct+'%"></i></div><div class="pct">'+bp.done+'/'+bp.total+'</div>':'')+'</div>';
  } else {
    var tkIdxs=[], tkTasks=[];
    for(var tki=0;tki<mp.length;tki++) if(mp[tki].day===todayN){ tkIdxs.push(tki); tkTasks.push(mp[tki]); }
    if(!S.plan.dayGoals) S.plan.dayGoals={};
    var gk=key+'-'+todayN;
    var tdg=S.plan.dayGoals[gk];
    if(tkTasks.length&&!tdg) ensureDayGoals(n.getFullYear(),n.getMonth(),todayN);
    var tchks=(S.planChecks[key]||{}), tgch=(S.plan.dayChecks&&S.plan.dayChecks[gk])||{};
    var ttot=0, tdn=0;
    tkIdxs.forEach(function(ix){ ttot++; if(tchks[ix]) tdn++; });
    if(tdg) tdg.forEach(function(_,gi){ ttot++; if(tgch[gi]) tdn++; });
    var tpct=ttot?Math.round(tdn/ttot*100):100;
    var bolt='<div class="bbolt"><svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/></svg></div>';
    h+='<div class="card plan-top"><div class="pring">'+ringSVG(tpct)+'<div class="pring-num">'+tpct+'%</div></div>'
      +'<div class="cap"><b>Цели на сегодня</b>'
      +'<div class="battery"><div class="blevel'+(tpct<34?' low':'')+'" style="width:'+tpct+'%"><div class="bshine"></div></div>'+(tpct<100?bolt:'')+'</div>'
      +'<div class="bcap">'+tdn+' из '+ttot+'</div></div></div>';
    if(!tkTasks.length){
      h+='<div class="card"><div class="cap">На сегодня задач нет — отдыхай 🎉</div></div>';
    } else {
      tkIdxs.forEach(function(ix){
        var s=mp[ix], tkDone=!!tchks[ix];
        h+='<button class="step'+(tkDone?' done':'')+'" data-mkey="'+key+'" data-step="'+ix+'"><span class="cbox">'+(tkDone?'✓':'')+'</span><span class="st">'+(s.c?'<span class="mtag">'+esc(s.c)+'</span>':'')+'<b>'+esc(s.t)+'</b><span>'+esc(s.d||'')+'</span></span></button>';
      });
      h+='<div class="tier-sub" style="margin:12px 0 6px">Цели дня:</div>';
      if(!tdg){
        h+='<div class="card"><div class="uspinner"><div class="spin"></div>Разбиваем день на цели…</div></div>';
      } else {
        tdg.forEach(function(g,gi){
          h+='<button class="step'+(tgch[gi]?' done':'')+'" data-gkey="'+gk+'" data-gstep="'+gi+'"><span class="cbox">'+(tgch[gi]?'✓':'')+'</span><span class="st"><b>'+esc(g.t)+'</b>'+(g.d?'<span>'+esc(g.d)+'</span>':'')+'</span></button>';
        });
      }
    }
  }
  h+='<button class="btn ghost" id="mTier2">Тирлист (20) →</button>';
  h+='<button class="btn ghost" id="mAdd">＋ Добавить ещё вузы</button>';
  h+='<button class="btn ghost" id="mReboot">↻ Перестроить план</button>';
  body.innerHTML=h;
  bindMainChips(body);
  body.querySelectorAll('[data-step]').forEach(function(b){
    b.addEventListener('click',function(){ toggleStep(b.getAttribute('data-mkey'),parseInt(b.getAttribute('data-step'),10)); });
  });
  body.querySelectorAll('[data-gstep]').forEach(function(b){
    b.addEventListener('click',function(){ toggleDayGoal(b.getAttribute('data-gkey'),parseInt(b.getAttribute('data-gstep'),10)); });
  });
  document.getElementById('mTier2').onclick=function(){ finish(); };
  document.getElementById('mAdd').onclick=function(){ finish(); };
  document.getElementById('mReboot').onclick=function(){ rebootPlan(); };
}
function bindMainChips(body){
  body.querySelectorAll('[data-remove]').forEach(function(b){
    b.addEventListener('click',function(e){ e.stopPropagation(); removeUni(b.getAttribute('data-remove')); });
  });
}
var CAL_MONTHS=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
function calRange(){
  var nowY=new Date().getFullYear();
  var m=String(S.admitYear||'').match(/(\d{4})/);
  var y1=m?parseInt(m[1],10):(nowY+2);
  if(!(y1>=nowY)) y1=nowY;
  if(y1>nowY+6) y1=nowY+6;
  return {y0:nowY,y1:y1};
}
/* monthStepIdxs удалён: месяцы берутся из S.plan.yearPlans, детали — из S.plan.monthPlans */
function setCal(level,y,m,d){
  migrateState();
  S.cal={level:level,y:(y==null?null:y),m:(m==null?null:m),d:(d==null?null:d)};
  save(); renderCal();
}
function renderCal(){
  migrateState();
  var body=document.getElementById('calBody');
  var chosen=getChosen();
  if(!chosen.length){ body.innerHTML='<div class="card"><div class="cap">Календарь появится, когда выберешь вузы в тирлисте (можно несколько).</div></div>'; return; }
  if(!ensureUnified()){ body.innerHTML='<div class="card"><div class="cap">Календарь появится, когда выберешь вузы в тирлисте (можно несколько).</div></div>'; return; }
  buildFullPlan();
  if(!S.cal||!S.cal.level) S.cal={level:'years',y:null,m:null};
  var R=calRange(), nowD=new Date(), lv=S.cal.level;
  if(lv==='months'&&(S.cal.y==null||S.cal.y<R.y0||S.cal.y>R.y1)){ S.cal={level:'years',y:null,m:null}; lv='years'; }
  if(lv==='days'){
    if(S.cal.y==null||S.cal.y<R.y0||S.cal.y>R.y1) S.cal.y=Math.min(Math.max(nowD.getFullYear(),R.y0),R.y1);
    if(S.cal.m==null||S.cal.m<0||S.cal.m>11) S.cal.m=nowD.getMonth();
    S.cal.level='days'; lv='days';
  }
  var chips='<div class="unichips">'+chosen.map(function(u){
    return '<div class="unichip">'+esc(u.name)+'<button class="x" data-remove="'+esc(u.name)+'">✕</button></div>';
  }).join('')+'</div>';
  function bindChips(){ bindMainChips(body); }
  if(lv==='years'){
    var h=chips+'<div class="card"><div class="cap">Общий план: '+R.y0+' → '+R.y1+(S.admitYear?' • по анкете: '+esc(S.admitYear):'')+'. Выбери год — откроются месяцы.</div></div><div style="height:12px"></div>';
    if(!S.plan.years){
      h+='<div class="card"><div class="uspinner"><div class="spin"></div>ИИ строит общий план по годам…</div></div>';
    } else {
      for(var y=R.y0;y<=R.y1;y++){
        var ye=null;
        for(var yi=0;yi<S.plan.years.length;yi++) if(S.plan.years[yi].y===y) ye=S.plan.years[yi];
        var tag=(y===nowD.getFullYear())?' • текущий год':'';
        var fin=(y===R.y1)?' • поступление':'';
        h+='<button class="yearcard" data-year="'+y+'"><span class="yb">'+y+'</span><span class="ys">'+(ye?esc(ye.t):'12 месяцев')+tag+fin+(ye?'<br>'+esc(ye.d):'')+'</span><span class="ya">→</span></button>';
      }
    }
    body.innerHTML=h; bindChips();
    body.querySelectorAll('[data-year]').forEach(function(b){
      b.addEventListener('click',function(){ setCal('months',parseInt(b.getAttribute('data-year'),10),null); });
    });
    return;
  }
  if(lv==='months'){
    var y2=S.cal.y;
    ensureYearPlan(y2);
    var yp=S.plan.yearPlans[y2];
    var h2=chips+'<button class="backline" id="calBackYears">← Все годы ('+R.y0+'–'+R.y1+')</button>'
      +'<div class="tier-head"><div class="tier-name">'+y2+'</div><div class="tier-sub">'+(y2===R.y1?'год поступления':'до поступления: '+(R.y1-y2)+' г.')+' • общий план года</div></div>';
    if(!yp){
      h2+='<div class="card"><div class="uspinner"><div class="spin"></div>ИИ составляет общий план на '+y2+'…</div></div>';
    } else {
      h2+='<div class="monthgrid">'+yp.map(function(mo,mi){
        var cur=(y2===nowD.getFullYear()&&mi===nowD.getMonth())?' cur':'';
        var dk=monthKey(y2,mi), det=(S.plan.monthPlans[dk]||[]).length;
        return '<button class="monthbtn'+cur+'" data-month="'+mi+'"><b>'+esc(mo.m||CAL_MONTHS[mi])+'</b><span>'+esc(mo.t||'')+(det?' • '+det+' задач':'')+'</span></button>';
      }).join('')+'</div>';
    }
    body.innerHTML=h2; bindChips();
    document.getElementById('calBackYears').onclick=function(){ setCal('years',null,null); };
    body.querySelectorAll('[data-month]').forEach(function(b){
      b.addEventListener('click',function(){ setCal('days',y2,parseInt(b.getAttribute('data-month'),10)); });
    });
    return;
  }
  var months=CAL_MONTHS;
  calY=S.cal.y; calM=S.cal.m;
  var first=(new Date(calY,calM,1).getDay()+6)%7;
  var days=new Date(calY,calM+1,0).getDate();
  var today=new Date();
  var isCur=(today.getFullYear()===calY&&today.getMonth()===calM);
  var dkey=monthKey(calY,calM);
  var mpd=S.plan.monthPlans[dkey];
  if(!mpd) ensureMonthPlan(calY,calM);
  var mchks=(S.planChecks[dkey]||{}), doneD={};
  if(mpd) mpd.forEach(function(s,ix){ if(s.day&&mchks[ix]) doneD[s.day]=1; });
  var selD=S.cal.d;
  if(selD==null||selD<1||selD>days){
    selD=isCur?today.getDate():1;
    if(mpd&&!isCur){ for(var si=0;si<mpd.length;si++){ var sd=mpd[si].day||0; if(sd>=1&&sd<=days&&!mchks[si]){ selD=sd; break; } } }
    S.cal.d=selD; save();
  }
  var h=chips+'<button class="backline" id="calBackMonths">← '+calY+'</button>';
  h+='<div class="cal-card"><div class="cal-head"><button class="cal-arrow" id="calPrev">←</button><b>'+months[calM]+' '+calY+'</b><button class="cal-arrow" id="calNext">→</button></div>';
  h+='<div class="cal-grid">'+['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(function(d){ return '<div class="dow">'+d+'</div>'; }).join('');
  for(var i=0;i<first;i++) h+='<div class="day dim">•</div>';
  for(var d=1;d<=days;d++){
    var cls='day'+((isCur&&d===today.getDate())?' today':'')+((d===selD)?' sel':'')+((doneD[d])?' done':'');
    h+='<button class="'+cls+'" data-day="'+d+'">'+d+'</button>';
  }
  h+='</div></div>';
  var gkey=dkey+'-'+selD;
  var wd=['Вс','Пн','Вт','Ср','Чт','Пт','Сб'][new Date(calY,calM,selD).getDay()];
  h+='<div class="daydetail"><b>'+selD+' '+months[calM]+' • '+wd+'</b>';
  if(!mpd){
    h+='<div class="uspinner"><div class="spin"></div>ИИ составляет план на месяц…</div>';
  } else {
    var taskIdxs=[];
    for(var ti=0;ti<mpd.length;ti++) if(mpd[ti].day===selD) taskIdxs.push(ti);
    if(!taskIdxs.length){
      h+='<div class="cap">На этот день задач нет — отдыхай 🎉</div>';
    } else {
      taskIdxs.forEach(function(tix){
        var task=mpd[tix], tDone=!!mchks[tix];
        h+='<button class="mrow'+(tDone?' done':'')+'" data-mkey="'+dkey+'" data-step="'+tix+'"><span class="mdot"></span><span><b>'+(task.c?esc(task.c)+' • ':'')+esc(task.t)+'</b><br><small style="color:var(--mut)">'+esc(task.d||'')+'</small></span></button>';
      });
      if(!S.plan.dayGoals) S.plan.dayGoals={};
      var dg=S.plan.dayGoals[gkey];
      h+='<div class="tier-sub" style="margin:10px 0 6px">Цели дня:</div>';
      if(!dg){
        ensureDayGoals(calY,calM,selD);
        h+='<div class="uspinner"><div class="spin"></div>Разбиваем день на цели…</div>';
      } else {
        var gch=(S.plan.dayChecks&&S.plan.dayChecks[gkey])||{};
        dg.forEach(function(g,gi){
          h+='<button class="mrow'+(gch[gi]?' done':'')+'" data-gkey="'+gkey+'" data-gstep="'+gi+'"><span class="mdot"></span><span><b>'+esc(g.t)+'</b>'+(g.d?'<br><small style="color:var(--mut)">'+esc(g.d)+'</small>':'')+'</span></button>';
        });
      }
    }
  }
  h+='</div>';
  if(!mpd){
    h+='<div class="card"><div class="uspinner"><div class="spin"></div>ИИ составляет подробный план на '+esc(months[calM])+'…</div></div>';
  } else if(mpd.length){
    var dpr=monthProgress(dkey);
    var col=(S.collapsed&&S.collapsed[dkey])?1:0;
    h+='<div class="month"><button class="mhead2" data-collapse="'+dkey+'"><b>'+months[calM]+' '+calY+' — детальный план • '+dpr.done+'/'+dpr.total+'</b><span>'+(col?'▶':'▼')+'</span></button><div>';
    mpd.forEach(function(s,ix){
      if(col&&ix>=4) return;
      var dchks=(S.planChecks[dkey]||{}), ddone=!!dchks[ix];
      var dlab='День '+s.day+(s.c?(' • '+s.c):'');
      h+='<button class="mrow'+(ddone?' done':'')+'" data-mkey="'+dkey+'" data-step="'+ix+'"><span class="mdot"></span><span><b>'+esc(dlab)+': '+esc(s.t)+'</b>'+(s.d?'<br><small style="color:var(--mut)">'+esc(s.d)+'</small>':'')+'</span></button>';
    });
    if(col&&mpd.length>4) h+='<div class="cap" style="text-align:center;padding:8px 0 2px">··· ещё '+(mpd.length-4)+' ···</div>';
    h+='</div></div>';
  } else {
    h+='<div class="card"><div class="cap">На '+months[calM].toLowerCase()+' шагов нет — листай месяцы стрелками.</div></div>';
  }
  body.innerHTML=h;
  document.getElementById('calBackMonths').onclick=function(){ setCal('months',calY,null); };
  function calGo(dm){
    var nm=calM+dm, ny=calY;
    if(nm<0){ nm=11; ny--; } if(nm>11){ nm=0; ny++; }
    if(ny<R.y0||ny>R.y1){ toast('Горизонт: '+R.y0+'–'+R.y1); return; }
    setCal('days',ny,nm);
  }
  document.getElementById('calPrev').onclick=function(){ calGo(-1); };
  document.getElementById('calNext').onclick=function(){ calGo(1); };
  bindMainChips(body);
  body.querySelectorAll('[data-collapse]').forEach(function(b){
    b.addEventListener('click',function(){ toggleCollapse(b.getAttribute('data-collapse')); });
  });
  body.querySelectorAll('[data-day]').forEach(function(b){
    b.addEventListener('click',function(){ setCal('days',calY,calM,parseInt(b.getAttribute('data-day'),10)); });
  });
  body.querySelectorAll('[data-gstep]').forEach(function(b){
    b.addEventListener('click',function(){ toggleDayGoal(b.getAttribute('data-gkey'),parseInt(b.getAttribute('data-gstep'),10)); });
  });
  body.querySelectorAll('[data-step]').forEach(function(b){
    b.addEventListener('click',function(){ toggleStep(b.getAttribute('data-mkey'),parseInt(b.getAttribute('data-step'),10)); });
  });
}
/* ---------- Цели на день (тап по дню) ---------- */
function dayGoalsPrompt(y,mi,day,tasks){
  var list=tasks.map(function(t,i){ return (i+1)+'. ['+(t.c||'Задача')+'] '+t.t+' ('+t.d+')'; }).join('\n');
  return 'Ты — наставник по поступлению. Школьник поступает в вузы: '+unisLine()+'.\n\nЗадачи на '+day+' '+CAL_MONTHS[mi]+' '+y+':\n'+list+'\n\nРазбей этот день на 4-6 маленьких конкретных целей-шагов, покрывающих ВСЕ задачи выше (и английский, и уроки, и активности). Верни СТРОГО JSON: {"goals":[{"t":"...","d":"..."}]}. t — цель (коротко, глаголом), d — как сделать и сколько времени. Без воды. Только JSON.';
}
function fallbackDayGoals(tasks){
  var names=(tasks||[]).map(function(t){ return t.t; }).filter(function(x){ return !!x; });
  var out=[{t:'Разогрев — 10 минут',d:'Повтори вчерашнее и собери материалы на сегодня.'}];
  names.slice(0,3).forEach(function(nm,i){ out.push({t:'Блок '+(i+1)+': '+nm,d:'40 минут фокуса без телефона, фиксируй вопросы и результат.'}); });
  out.push({t:'Итог дня — 10 минут',d:'Запиши что сделал, что не успел, и план на завтра.'});
  return out.slice(0,6);
}
function fetchDayGoals(y,mi,day,tasks){
  var ck=S.plan.unisKey, ck2='day|'+ck+'|'+y+'-'+mi+'-'+day;
  if(PLAN_CACHE[ck2]) return Promise.resolve(PLAN_CACHE[ck2]);
  return aiTry(dayGoalsPrompt(y,mi,day,tasks),function(o){
    var arr=o.goals||o.steps||[];
    if(!arr.length) throw new Error('empty');
    var out=arr.slice(0,6).map(function(r){ return {t:String(r.t||''),d:String((r.how!=null?r.how:(r.d||'')))}; })
      .filter(function(r){ return r.t; });
    if(!out.length) throw new Error('empty');
    PLAN_CACHE[ck2]=out; return out;
  });
}
function ensureDayGoals(y,mi,day){
  if(!ensureUnified()) return;
  if(!S.plan.dayGoals) S.plan.dayGoals={};
  if(!S.plan.dayChecks) S.plan.dayChecks={};
  var key=monthKey(y,mi)+'-'+day;
  if(S.plan.dayGoals[key]) return;
  var mp=S.plan.monthPlans[monthKey(y,mi)], tasks=[];
  if(mp){ for(var i=0;i<mp.length;i++) if(mp[i].day===day) tasks.push(mp[i]); }
  if(!tasks.length) return;
  var ck=S.plan.unisKey, lk='day|'+ck+'|'+key;
  if(PLAN_LOADING[lk]) return; PLAN_LOADING[lk]=1;
  withTimeout(fetchDayGoals(y,mi,day,tasks)).then(function(out){
    delete PLAN_LOADING[lk];
    if(!S.plan||S.plan.unisKey!==ck) return;
    if(!S.plan.dayGoals) S.plan.dayGoals={};
    S.plan.dayGoals[key]=out; save(); refreshViews();
  }).catch(function(){
    delete PLAN_LOADING[lk];
    if(!S.plan||S.plan.unisKey!==ck) return;
    if(!S.plan.dayGoals) S.plan.dayGoals={};
    S.plan.dayGoals[key]=fallbackDayGoals(tasks); save(); refreshViews();
  });
}
function toggleDayGoal(key,ix){
  if(!S.plan) return;
  if(!S.plan.dayChecks) S.plan.dayChecks={};
  if(!S.plan.dayChecks[key]) S.plan.dayChecks[key]={};
  if(S.plan.dayChecks[key][ix]) delete S.plan.dayChecks[key][ix]; else S.plan.dayChecks[key][ix]=1;
  save(); refreshViews();
}
function toggleCollapse(key){
  if(!S.collapsed||typeof S.collapsed!=='object') S.collapsed={};
  if(S.collapsed[key]) delete S.collapsed[key]; else S.collapsed[key]=1;
  save();
  var sc=0, scroller=null;
  try{ scroller=document.getElementById('view-cal'); sc=scroller?scroller.scrollTop:0; }catch(e){}
  renderCal();
  try{ if(scroller) scroller.scrollTop=sc; }catch(e){}
}
var calY=null, calM=0;
function fallbackTier(){
  return [
    {tier:'DREAM',name:'MIT',place:'Кембридж, США',match:98,reason:'Мировой топ-1 по технологиям и AI — мечта для сильных в математике и программировании.'},
    {tier:'DREAM',name:'Stanford University',place:'Калифорния, США',match:96,reason:'Кремниевая долина, стартапы и исследования — идеал для tech и бизнеса.'},
    {tier:'DREAM',name:'University of Oxford',place:'Оксфорд, Великобритания',match:94,reason:'Престиж и сильная наука — мечта для академического трека.'},
    {tier:'DREAM',name:'Harvard University',place:'Кембридж, США',match:93,reason:'Бренд, нетворк и гранты — топ-цель при высоких амбициях.'},
    {tier:'DREAM',name:'Назарбаев Университет',place:'Астана, Казахстан',match:91,reason:'Топ-1 вуз страны на английском — реальная мечта внутри Казахстана.'},
    {tier:'TARGET',name:'КБТУ',place:'Алматы, Казахстан',match:88,reason:'Сильные IT, бизнес и инженерия, связи с индустрией.'},
    {tier:'TARGET',name:'МУИТ (IITU)',place:'Алматы, Казахстан',match:85,reason:'Профильный IT-вуз: AI, кибербезопасность, разработка.'},
    {tier:'TARGET',name:'University of Toronto',place:'Торонто, Канада',match:84,reason:'Сильный CS и инженерия, проще поступить чем в Ivy, есть стипендии.'},
    {tier:'TARGET',name:'SDU',place:'Каскелен, Казахстан',match:83,reason:'Обучение на английском, хорошая IT-школа.'},
    {tier:'TARGET',name:'KAIST',place:'Тэджон, Корея',match:82,reason:'Топ-техно Кореи с щедрыми стипендиями для иностранцев.'},
    {tier:'TARGET',name:'КазНУ им. аль-Фараби',place:'Алматы, Казахстан',match:81,reason:'Классический университет с сильной наукой и бюджетными местами.'},
    {tier:'TARGET',name:'Seoul National University',place:'Сеул, Корея',match:80,reason:'Престиж Азии, гранты KGSP, сильные инженерия и бизнес.'},
    {tier:'TARGET',name:'Astana IT University',place:'Астана, Казахстан',match:80,reason:'Молодой IT-вуз в столице, упор на практику и проекты.'},
    {tier:'TARGET',name:'METU (ODTÜ)',place:'Анкара, Турция',match:79,reason:'Обучение на английском, доступные цены и гранты Türkiye Burslari.'},
    {tier:'SAFETY',name:'КазНТУ им. Сатпаева',place:'Алматы, Казахстан',match:76,reason:'Лучший выбор для инженерии, много грантов.'},
    {tier:'SAFETY',name:'ЕНУ им. Гумилева',place:'Астана, Казахстан',match:74,reason:'Крупный госвуз в столице, высокий шанс на грант.'},
    {tier:'SAFETY',name:'КИМЭП',place:'Алматы, Казахстан',match:73,reason:'Бизнес, право и соцнауки на английском, понятные требования.'},
    {tier:'SAFETY',name:'КазНПУ им. Абая',place:'Алматы, Казахстан',match:72,reason:'Педагогика, психология и языки — доступный проходной.'},
    {tier:'SAFETY',name:' UIB (Университет Международного Бизнеса)',place:'Алматы, Казахстан',match:70,reason:'Бизнес и маркетинг, легко поступить, практика с 1 курса.'},
    {tier:'SAFETY',name:'MUIT College / Turan University',place:'Алматы, Казахстан',match:68,reason:'Запасной вариант: IT и бизнес с низким порогом входа.'}
  ];
}

function getChosen(){ migrateState(); return S.chosenUnis||[]; }
function isPicked(name){ return getChosen().some(function(u){ return u.name===name; }); }
function syncActive(){ if(getChosen().length && !S.chosenUni) S.chosenUni=getChosen()[0]; if(!getChosen().length) S.chosenUni=null; }
function toggleUni(name,place){
  migrateState();
  var ix=-1;
  for(var i=0;i<S.chosenUnis.length;i++) if(S.chosenUnis[i].name===name) ix=i;
  if(ix===-1){ S.chosenUnis.push({name:name,place:place||''}); toast('Добавлено: '+name+' ('+S.chosenUnis.length+')'); }
  else { S.chosenUnis.splice(ix,1); toast('Убрано: '+name); }
  syncActive(); save(); renderTier();
}
function chooseUni(name,place){
  migrateState();
  if(!isPicked(name)) S.chosenUnis.push({name:name,place:place||''});
  S.chosenUni={name:name,place:place||''};
  save(); try{ closeUni(); }catch(e){}
  toast('Выбран: '+name+' • всего '+S.chosenUnis.length);
  showTab('main');
}
function continueWithChosen(){
  var n=getChosen().length;
  if(!n){ toast('Выбери хотя бы один вуз тапом по кнопке'); return; }
  syncActive(); save();
  showTab('main');
}

function renderTier(){
  var box=document.getElementById('tierList');
  var raw=(AI_UNIS&&AI_UNIS.length)?AI_UNIS:fallbackTier();
  var list=raw.map(function(u){ return {tier:normTier(u.tier),name:u.name,place:u.place,match:u.match,reason:u.reason}; });
  var h='';
  if(!AI_UNIS||!AI_UNIS.length) h+='<div class="ainote">ИИ временно недоступен — показан базовый подбор из 20 вузов. Проверь интернет и попробуй пройти заново позже.</div>';
  else h+='<div class="ainote">Подобрано ИИ на основе твоей анкеты ✨ Всего '+list.length+' вузов: 5 Dream + 9 Target + 6 Safety</div>';
  var sel=getChosen().length;
  h+='<div class="multibar"><b>Выбрано: '+sel+'</b><span>Можно выбрать несколько — тапай «Выбрать» на карточках</span>'
    +'<div style="height:8px"></div><button class="btn" id="btnContinueMulti"'+(sel?'':' style="opacity:.5"')+'>Продолжить с выбранными ('+sel+') →</button></div>';
  [['DREAM','🌟 Dream — мечта','Топовые, сложно поступить','dream','★'],['TARGET','🎯 Target — целевые','Реальный шанс поступить','target','◉'],['SAFETY','🛟 Safety — страховочные','Почти гарантированно','safety','●']].forEach(function(g){
    var items=list.filter(function(u){ return u.tier===g[0]; });
    if(!items.length) return;
    h+='<div class="tier-head"><div class="tier-badge '+g[3]+'">'+g[4]+'</div><div><div class="tier-name">'+g[1]+'</div><div class="tier-sub">'+items.length+' вузов • '+g[2]+'</div></div></div>';
    items.forEach(function(u){
      var picked = isPicked(u.name);
      h+='<div class="unicard'+(picked?' picked':'')+'" data-uni="'+esc(u.name)+'">'+uniCardPhotoHTML(u.name)+'<h4>'+esc(u.name)+'</h4><div class="place">'+esc(u.place)+'</div><div class="bar"><i style="width:'+u.match+'%"></i></div><div class="pct">'+u.match+'% совпадение</div><p>'+esc(u.reason)+'</p><button class="choosebtn'+(picked?' picked':'')+'" data-choose="'+esc(u.name)+'">'+(picked?'✓ Выбран — нажать чтобы убрать':'＋ Выбрать этот вуз')+'</button><div class="tap">Нажми на карточку — как поступить →</div></div>';
    });
  });
  box.innerHTML=h;
  try{ upgradeUniPhotos(box); }catch(e){}
  var cb=document.getElementById('btnContinueMulti'); if(cb) cb.onclick=continueWithChosen;
  box.querySelectorAll('.unicard').forEach(function(c){
    c.addEventListener('click',function(){ openUni(c.getAttribute('data-uni')); });
  });
  box.querySelectorAll('[data-choose]').forEach(function(b){
    b.addEventListener('click',function(e){
      e.stopPropagation();
      var nm=b.getAttribute('data-choose');
      var u=currentTierList().filter(function(x){ return x.name===nm; })[0]||{name:nm,place:''};
      toggleUni(u.name,u.place);
    });
  });
}

