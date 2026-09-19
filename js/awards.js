/* ================= Достижения ================= */
var AW_SPHERES = ['Олимпиады','Наука','IT и хакатоны','Спорт','Творчество','Музыка','Волонтёрство','Дебаты и клубы','Другое'];
var AW_FORMATS = ['Лично','В команде','Онлайн'];
var awSphere = '', awFormat = 'Лично', awOpen = false;
var awAi = null, awAiKey = '';
var awCont = null, awContKey = '';
function awHash(){
  var s=JSON.stringify(S.myAwards||[]);
  s+='|'+getChosen().map(function(u){ return u.name; }).sort().join(',');
  s+='|'+(S.dreamJob||'');
  var h=0;
  for(var i=0;i<s.length;i++){ h=((h<<5)-h+s.charCodeAt(i))|0; }
  return String(h);
}
function awAssessPrompt(){
  return 'Ты — наставник по поступлению. Школьник ведёт вкладку достижений, вузы: '+(unisLine()||'пока не выбраны')+'.\n\nПРОФИЛЬ:\n'+compactProfileText(PROFILE_BUDGETS.assess)+'\n\nОцени его УЖЕ ДОСТИГНУТЫЕ успехи и скажи чего не хватает. Верни СТРОГО JSON: {"level":"...","strong":["...","..."],"gaps":["...","..."],"next":["...","...","..."]}.\n- level: 1 короткая оценка уровня портфолио (например "Сильный старт" или "Пока слабо для топ-вузов").\n- strong: 2-3 конкретные сильные стороны из ЕГО достижений.\n- gaps: 2-3 конкретных пробела именно под его вузы и направление.\n- next: 3 конкретных следующих шага (что сделать, где участвовать).\nВсё на русском, конкретно, без воды. Только JSON.';
}
function fallbackAwAssess(){
  var list=S.myAwards||[], by={};
  list.forEach(function(a){ by[a.sphere||'Другое']=1; });
  var have=Object.keys(by);
  var strong=have.length?have.slice(0,3).map(function(s){ return 'Есть победы в сфере «'+s+'» — это уже выделяет.'; }):['Пока пусто — любое первое достижение уже будет плюсом.'];
  var want=['Олимпиады','IT и хакатоны','Наука'];
  var gaps=want.filter(function(s){ return !by[s]; }).slice(0,2).map(function(s){ return 'Нет достижений в сфере «'+s+'» — вузы это любят.'; });
  if(!gaps.length) gaps=['Добавь достижение повыше уровнем: республика, международный этап.'];
  return {level:list.length>=5?'Хорошая база':(list.length>=2?'Есть задел':'Самое начало'),
    strong:strong,gaps:gaps,
    next:['Возьми 1 олимпиаду или хакатон в этом семестре и доведи до результата.',
      'Оформи все победы в портфолио с датами и ссылками.',
      'Выбери следующую цель повыше уровнем и впиши её в план.'],
    fallback:true};
}
function fetchAwAssess(){
  return aiTry(awAssessPrompt(),function(o){
    if(!o.level&&!o.next) throw new Error('empty');
    function arr(x){ return Array.isArray(x)?x.slice(0,4).map(String):[]; }
    return {level:String(o.level||'—'),strong:arr(o.strong),gaps:arr(o.gaps),next:arr(o.next).slice(0,3)};
  });
}
function ensureAwAssess(){
  var list=S.myAwards||[];
  if(!list.length){ toast('Сначала добавь хотя бы одно достижение'); return; }
  var k=awHash();
  if(awAi&&awAiKey===k) return;
  awAi='loading'; awAiKey=k; renderAwards();
  withTimeout(fetchAwAssess()).then(function(out){
    if(awAiKey!==awHash()) return;
    awAi=out; renderAwards();
  }).catch(function(){
    if(awAiKey!==awHash()) return;
    var fb=fallbackAwAssess(); fb.fallback=true; awAi=fb; renderAwards();
  });
}
function awAssessHTML(){
  if(!awAi) return '';
  if(awAi==='loading') return '<div class="card" style="margin-bottom:12px"><div class="uspinner"><div class="spin"></div>ИИ смотрит твои успехи…</div></div>';
  function li(arr){ return (arr||[]).map(function(x){ return '<div>'+esc(x)+'</div>'; }).join(''); }
  return '<div class="card" style="margin-bottom:12px;border-color:rgba(0,210,255,.4)"><div class="bignum2">✨ '+esc(awAi.level)+'</div>'
    +(awAi.fallback?'<div class="cap" style="margin:4px 0">Базовая оценка (ИИ недоступен)</div>':'<div class="cap" style="margin:4px 0">ИИ видит твои достижения и учитывает их в тирлисте и планах ✓</div>')
    +'<div class="usec">Сильные стороны</div><div class="ulist">'+li(awAi.strong)+'</div>'
    +'<div class="usec">Чего не хватает</div><div class="ulist">'+li(awAi.gaps)+'</div>'
    +'<div class="usec">Что делать дальше</div><div class="ulist">'+li(awAi.next)+'</div></div>';
}
function awContestsPrompt(){
  return 'Ты — наставник по олимпиадам и конкурсам. Школьник: вузы — '+(unisLine()||'пока не выбраны')+'. Вот чего он УЖЕ добился: '+((S.myAwards||[]).map(function(a){ return '['+(a.sphere||'?')+'] '+a.title+' ('+(a.result||'')+')'; }).join(' | ')||'пока ничего не записано')+'.\n\nПРОФИЛЬ:\n'+compactProfileText(PROFILE_BUDGETS.contests)+'\n\nПодбери 5-6 РАЗНЫХ конкурсов, олимпиад и хакатонов, которые ИМЕННО ЕМУ подходят (по интересам, навыкам и уровню достижений: слабым — доступные, сильным — престижные). Верни СТРОГО JSON: {"contests":[{"name":"...","sphere":"...","why":"...","when":"...","link":"..."}]}.\n- name — название конкурса, sphere — сфера (Олимпиады, IT и хакатоны, Наука, Спорт, Творчество и т.д.), why — 1 предложение почему именно ему, when — когда проходит/дедлайн, link — официальный сайт если знаешь, иначе пусто.\nВсё на русском. Только JSON.';
}
function fallbackAwContests(){
  return [
    {name:'Республиканская предметная олимпиада (Дарын)',sphere:'Олимпиады',why:'Главный школьный конкурс страны — победа даёт льготы при поступлении.',when:'Школьный этап — осенью',link:'https://daryn.kz'},
    {name:'NASA Space Apps Challenge',sphere:'IT и хакатоны',why:'Международный онлайн-хакатон: команда, проект за 48 часов и строка в портфолио.',when:'Октябрь, онлайн',link:'https://www.spaceappschallenge.org'},
    {name:'Конкурс научных проектов «Дарын»',sphere:'Наука',why:'Если нравится исследовать — оформи свою работу и защити её.',when:'Зима–весна',link:'https://daryn.kz'},
    {name:'Хакатоны Astana Hub',sphere:'IT и хакатоны',why:'Регулярные хакатоны с призами и нетворком — быстрый опыт и победы.',when:'Круглый год',link:'https://astanahub.com'},
    {name:'Technovation Challenge',sphere:'IT и хакатоны',why:'Сделай своё приложение с пользой для общества и поборись за финал.',when:'Январь–апрель, онлайн',link:'https://www.technovationchallenge.org'},
    {name:'World Scholar’s Cup (региональный раунд)',sphere:'Дебаты и клубы',why:'Дебаты, эссе и тесты на английском — прокачка языка и мышления.',when:'Весна, Алматы/Астана',link:''}
  ];
}
function fetchAwContests(){
  return aiTry(awContestsPrompt(),function(o){
    var list=o.contests||o.items||[];
    if(!list.length) throw new Error('empty');
    var out=list.slice(0,8).map(function(r){
      return {name:String(r.name||''),sphere:String(r.sphere||''),why:String(r.why||r.reason||''),when:String(r.when||''),link:String(r.link||'')};
    }).filter(function(r){ return r.name; });
    if(!out.length) throw new Error('empty');
    return out;
  });
}
function ensureAwContests(){
  var k=awHash();
  if(awCont&&awContKey===k) return;
  awCont='loading'; awContKey=k; renderAwards();
  withTimeout(fetchAwContests()).then(function(out){
    if(awContKey!==awHash()) return;
    awCont=out; renderAwards();
  }).catch(function(){
    if(awContKey!==awHash()) return;
    var fb=fallbackAwContests(); fb._fb=true; awCont=fb; renderAwards();
  });
}
function awContestsHTML(){
  if(!awCont) return '';
  if(awCont==='loading') return '<div class="card" style="margin-bottom:12px"><div class="uspinner"><div class="spin"></div>ИИ ищет конкурсы под твои достижения…</div></div>';
  var h='<div class="card" style="margin-bottom:12px;border-color:rgba(255,209,102,.45)"><div class="bignum2">💡 Конкурсы именно для тебя</div>'
    +'<div class="cap" style="margin:4px 0">'+(awCont._fb?'Базовая подборка (ИИ недоступен)':'ИИ посмотрел на твои достижения и нашёл подходящее ✓')+'</div>';
  awCont.forEach(function(c){
    h+='<div class="rev"><b>'+esc(c.name)+'</b>'
      +(c.sphere?'<div style="margin:3px 0"><span class="mtag">'+esc(c.sphere)+'</span></div>':'')
      +(c.why?'<p>🎯 '+esc(c.why)+'</p>':'')
      +(c.when?'<p>🗓 '+esc(c.when)+'</p>':'')
      +(c.link?'<a href="'+esc(c.link)+'" target="_blank" rel="noopener" style="color:#7ee7ff;font-size:13px">Официальный сайт →</a>':'')
      +'</div>';
  });
  return h+'</div>';
}
function renderAwards(){
  var body=document.getElementById('awardsBody');
  var list=S.myAwards||[];
  document.getElementById('awSub').textContent = list.length?('Всего: '+list.length):'Твои победы в одном месте';
  var h='<button class="btn" id="awAdd">'+(awOpen?'✕ Закрыть':'＋ Добавить достижение')+'</button><div style="height:12px"></div>';
  if(awAi&&awAiKey!==awHash()){ awAi=null; awAiKey=''; }
  if(awCont&&awContKey!==awHash()){ awCont=null; awContKey=''; }
  if(list.length){
    h+='<button class="btn ghost" id="awAiBtn" style="margin-top:0">✨ Анализ ИИ: чего я уже добился и чего не хватает</button><div style="height:12px"></div>';
    h+='<div class="ainote">Синхронизация с ИИ ✓ — эти достижения уже учитываются в тирлисте вузов и планах.</div>';
  }
  h+=awAssessHTML();
  h+='<div class="card" style="margin-bottom:12px"><div class="bignum2">💡 Конкурсы для тебя</div>'
    +'<div class="cap" style="margin:4px 0 10px">ИИ смотрит на твои достижения и находит много разных конкурсов, которые именно тебе подходят.</div>'
    +'<button class="btn" id="awContBtn">🔍 Найти конкурсы для меня</button></div>';
  h+=awContestsHTML();
  if(awOpen){
    h+='<div class="card" style="margin-bottom:12px"><div class="qlabel">Сфера</div><div class="chips" id="awSpheres">'
      +AW_SPHERES.map(function(s){ return '<div class="chip'+(awSphere===s?' sel':'')+'" data-v="'+esc(s)+'">'+esc(s)+'</div>'; }).join('')
      +'</div><label>Что за достижение? *</label><input class="field" id="awTitle" placeholder="Например, 1 место на областной олимпиаде">'
      +'<label>Результат *</label><input class="field" id="awResult" placeholder="Например, 1 место / КМС / финалист">'
      +'<label>Год</label><input class="field" id="awYear" inputmode="numeric" placeholder="2026">'
      +'<label>Формат</label><div class="chips" id="awFormats">'
      +AW_FORMATS.map(function(s){ return '<div class="chip'+(awFormat===s?' sel':'')+'" data-v="'+esc(s)+'">'+esc(s)+'</div>'; }).join('')
      +'</div><label>Опиши подробнее</label><textarea class="area" id="awDesc" placeholder="Что делал(а), с кем, что дал этот опыт..."></textarea>'
      +'<label>Ссылка (необязательно)</label><input class="field" id="awLink" placeholder="https://...">'
      +'<div style="height:12px"></div><button class="btn" id="awSave">Сохранить ✓</button></div>';
  }
  if(!list.length && !awOpen) h+='<div class="card"><div class="cap">Пока пусто. Нажми «Добавить» и запиши первую победу — пригодится для портфолио и заявок.</div></div>';
  list.forEach(function(a,ix){
    h+='<div class="card" style="margin-bottom:10px"><span class="mtag">'+esc(a.sphere)+'</span> <span class="mtag">'+esc(a.format||'')+'</span>'
      +'<div class="bignum2">'+esc(a.title)+'</div><div class="cap" style="margin:4px 0">'+esc(a.result)+((a.year)?' • '+esc(a.year):'')+'</div>'
      +(a.desc?'<p class="cap" style="margin-bottom:6px">'+esc(a.desc)+'</p>':'')
      +(a.link?'<a href="'+esc(a.link)+'" target="_blank" rel="noopener" style="color:#7ee7ff;font-size:13px">Открыть ссылку →</a><br>':'')
      +'<button class="link" data-del="'+ix+'" style="color:#ff7b9c">удалить</button></div>';
  });
  body.innerHTML=h;
  document.getElementById('awAdd').onclick=function(){ awOpen=!awOpen; if(!awOpen){ awSphere=''; awFormat='Лично'; } renderAwards(); };
  var ab=document.getElementById('awAiBtn'); if(ab) ab.onclick=function(){ ensureAwAssess(); };
  var cb2=document.getElementById('awContBtn'); if(cb2) cb2.onclick=function(){ ensureAwContests(); };
  var sp=body.querySelectorAll('#awSpheres .chip');
  sp.forEach(function(c){ c.onclick=function(){ awSphere=c.getAttribute('data-v'); sp.forEach(function(x){ x.classList.remove('sel'); }); c.classList.add('sel'); }; });
  var fm=body.querySelectorAll('#awFormats .chip');
  fm.forEach(function(c){ c.onclick=function(){ awFormat=c.getAttribute('data-v'); fm.forEach(function(x){ x.classList.remove('sel'); }); c.classList.add('sel'); }; });
  var sv=document.getElementById('awSave');
  if(sv) sv.onclick=function(){
    var t=document.getElementById('awTitle').value.trim();
    var r=document.getElementById('awResult').value.trim();
    if(!awSphere){ toast('Выбери сферу'); return; }
    if(!t){ toast('Напиши, что за достижение'); return; }
    if(!r){ toast('Укажи результат'); return; }
    if(!S.myAwards) S.myAwards=[];
    S.myAwards.unshift({sphere:awSphere,title:t,result:r,
      year:document.getElementById('awYear').value.trim(),
      format:awFormat,
      desc:document.getElementById('awDesc').value.trim(),
      link:document.getElementById('awLink').value.trim()});
    save(); awOpen=false; awSphere=''; awFormat='Лично';
    renderAwards(); toast('Сохранено ✓');
  };
  body.querySelectorAll('[data-del]').forEach(function(b){
    b.onclick=function(){
      S.myAwards.splice(parseInt(b.getAttribute('data-del'),10),1);
      save(); renderAwards();
    };
  });
}

