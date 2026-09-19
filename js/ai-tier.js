/* ================= ИИ-тирлист (через свой бэкенд /api/gemini) ================= */
var GEMINI_MODELS = ['gemini-3.6-flash','gemma-4-31b-it'];
var AI_UNIS = null, AI_ERR = null;

function profileText(){
  var L = [];
  function r(t,v){ if(v&&(v.length||typeof v==='number')) L.push(t+': '+(Array.isArray(v)?v.join(', '):v)); }
  r('Имя',S.name); r('Возраст',S.age); r('Класс',S.grade); r('Страна',S.country);
  r('Школа',S.schoolType); r('Поступление',S.admitYear);
  r('Знает страну учёбы',(S.knowCountry==='yes'?'да':'нет')+(S.knowCountryWhich?' ('+S.knowCountryWhich+')':''));
  r('Профессия',S.professionText||S.dreamJob);
  var subs=Object.keys(S.subj||{}).map(function(s){ var d=S.subj[s];
    return s+' (оценка '+d.grade+', нравится '+d.like+'/5, лёгкость '+d.ease+'/5'+(d.deep==='yes'?'; хочет глубже':'')+')'; });
  if(subs.length) L.push('Предметы: '+subs.join('; '));
  r('Интересы',S.interests);
  var tc={tech:0,sci:0,biz:0,art:0};
  Object.keys(S.sittest||{}).forEach(function(k){ var t=S.sittest[k]; if(tc[t]!==undefined) tc[t]++; });
  L.push('Мини-тесты (10): технологии '+tc.tech+', наука '+tc.sci+', бизнес '+tc.biz+', творчество '+tc.art);
  var sk=(S.skills||[]).map(function(s){ return s+' ('+({new:'начинающий',base:'базовый',mid:'средний',pro:'продвинутый'}[S.skillLevel[s]]||'?')+')'; });
  if(sk.length) L.push('Навыки: '+sk.join(', '));
  r('Языки программирования',S.progLangs);
  r('Стаж в программировании',S.progExp); r('Проекты',S.progProjects);
  r('Интерес к медицине (1-5)',S.medInterest); r('Готов учиться 6+ лет',S.medLong);
  r('Инструменты дизайна',S.designTools); r('Портфолио',S.designPortfolio);
  r('О себе',S.freeText);
  r('Хобби',S.hobbies); r('Часов в неделю',S.hobbyHours);
  if(S.about&&typeof S.about==='object'&&!Array.isArray(S.about)) L.push('Спорт/музыка/книги/клубы: '+Object.keys(S.about).map(function(k){ return k+'='+S.about[k]; }).join(', '));
  r('Спортивные звания',S.sportAch); r('Музыка (что закончил)',S.musicDone); r('Клубы',S.clubsWhich);
  r('Кружки',S.circles);
  r('Достижения',S.achievements); r('Главное достижение',S.achDetail);
  if(S.myAwards&&S.myAwards.length){
    L.push('Портфолио из вкладки Достижения (чего УЖЕ добился): '+S.myAwards.map(function(a){
      return '['+(a.sphere||'?')+'] '+a.title+' — '+(a.result||'')+(a.year?', '+a.year:'')+(a.format?', '+a.format:'')+(a.desc?'. '+a.desc:'');
    }).join(' | '));
  }
  var w=S.work||{};
  L.push('Работа: '+(w.team==='solo'?'один':w.team==='team'?'команда':'по-разному')+', '+(w.people==='people'?'с людьми':w.people==='pc'?'с компьютером':'и то и другое')+', '+(w.practice==='prac'?'практика':w.practice==='theor'?'теория':'баланс'));
  ['create','solve','analyze','lead','speak','help','numbers','texts','research','variety'].forEach(function(k){ if(w[k]) L.push('  - '+k+': '+w[k]); });
  r('Мечта',S.dreamJob); r('Рассматривает',S.considerJobs); r('Не интересны',S.notJobs);
  var c=S.career||{};
  L.push('Карьера: KZ='+(c.kz||'?')+', abroad='+(c.abroad||'?')+', remote='+(c.remote||'?')+', business='+(c.business||'?')+', science='+(c.science||'?')+', bigco='+(c.bigco||'?'));
  var ll=(S.langs||[]).map(function(l){ return l+' ('+({a:'начальный',b1:'средний',b2:'уверенный',c:'свободный'}[S.langLevel[l]]||'?')+')'; });
  if(ll.length) L.push('Языки: '+ll.join(', '));
  r('Хочет выучить',S.newLangWhich);
  r('Страна учёбы',(S.studyCountry==='kz'?'Казахстан':S.studyCountry==='abroad'?'заграница':'не решил')+(S.studyCountryWhich?' ('+S.studyCountryWhich+')':''));
  r('Важен большой вуз (1-5)',S.bigUni); r('Грант',S.grant); r('Важность цены (1-5)',S.costImportant);
  r('Готов к переезду',S.relocate); r('Программы обмена',S.exchange);
  try{ L.push('Наш скоринг топ-3: '+scoreDirs().slice(0,3).map(function(d){ return d.name+' '+d.pct+'%'; }).join(', ')); }catch(e){}
  return L.join('\n');
}

/* Компактный профиль для промптов: приоритеты + бюджет символов.
   Полный profileText() остаётся для JSON-выгрузки, а в ИИ идёт сжатая
   версия, чтобы не упираться в лимит контекста/12000 API-прокси. */
var PROFILE_BUDGETS = {tier:4000, detail:2500, plan:3000, assess:2000, contests:2000};
function clipText(s, max){
  s = String(s == null ? '' : s);
  if(s.length <= max) return s;
  return s.slice(0, Math.max(0, max - 1)).trim() + '…';
}
function compactProfileText(budget){
  budget = budget || 3000;
  var L = [];
  function r(t, v){ if(v && (v.length || typeof v === 'number')) L.push(t + ': ' + (Array.isArray(v) ? v.join(', ') : v)); }
  // 1) база и цель — всегда
  r('Имя', S.name); r('Возраст', S.age); r('Класс', S.grade); r('Поступление', S.admitYear);
  r('Страна учёбы', (S.studyCountry === 'kz' ? 'Казахстан' : S.studyCountry === 'abroad' ? 'заграница' : 'не решил') + (S.studyCountryWhich ? ' (' + S.studyCountryWhich + ')' : ''));
  r('Грант', S.grant); r('Переезд', S.relocate);
  r('Профессия/мечта', clipText(S.professionText || S.dreamJob || '', 120));
  if(S.considerJobs && S.considerJobs.length) L.push('Рассматривает: ' + S.considerJobs.slice(0, 5).join(', '));
  // 2) сигналы направления
  if(S.interests && S.interests.length) L.push('Интересы: ' + S.interests.slice(0, 12).join(', '));
  var tc = {tech:0, sci:0, biz:0, art:0};
  Object.keys(S.sittest || {}).forEach(function(k){ var t = S.sittest[k]; if(tc[t] !== undefined) tc[t]++; });
  L.push('Тесты: tech ' + tc.tech + ', sci ' + tc.sci + ', biz ' + tc.biz + ', art ' + tc.art);
  try{ L.push('Скоринг: ' + scoreDirs().slice(0, 3).map(function(d){ return d.name + ' ' + d.pct + '%'; }).join(', ')); }catch(e){}
  var lvlMap = {new:'нач', base:'база', mid:'сред', pro:'прод'};
  if(S.skills && S.skills.length) L.push('Навыки: ' + S.skills.slice(0, 10).map(function(s){ return s + '(' + (lvlMap[(S.skillLevel || {})[s]] || '?') + ')'; }).join(', '));
  if(S.progLangs && S.progLangs.length) L.push('Код: ' + S.progLangs.slice(0, 7).join(', ') + (S.progExp ? ', стаж ' + S.progExp : ''));
  // 3) учёба коротко: только значимые предметы
  var subs = Object.keys(S.subj || {}).map(function(s){
    var d = S.subj[s] || {};
    return {s:s, like:+d.like || 0, grade:String(d.grade || ''), deep:d.deep};
  }).filter(function(x){ return x.like >= 4 || x.deep === 'yes' || x.grade === '5'; })
    .map(function(x){ return x.s + '(оц' + x.grade + ',♥' + x.like + (x.deep === 'yes' ? ',глубже' : '') + ')'; });
  if(subs.length) L.push('Предметы: ' + subs.slice(0, 8).join('; '));
  // 4) языки и карьера одной строкой
  if(S.langs && S.langs.length){
    var lm = {a:'A1-A2', b1:'B1', b2:'B2', c:'C1+'};
    L.push('Языки: ' + S.langs.slice(0, 6).map(function(l){ return l + '(' + (lm[(S.langLevel || {})[l]] || '?') + ')'; }).join(', '));
  }
  var c = S.career || {};
  L.push('Карьера: KZ=' + (c.kz || '?') + ', abroad=' + (c.abroad || '?') + ', biz=' + (c.business || '?') + ', sci=' + (c.science || '?'));
  // 5) достижения — максимум 3 свежих, описания режем
  if(S.myAwards && S.myAwards.length){
    L.push('Портфолио: ' + S.myAwards.slice(0, 3).map(function(a){
      return '[' + (a.sphere || '?') + '] ' + clipText(a.title || '', 60) + ' — ' + clipText(a.result || '', 40);
    }).join(' | '));
  } else if(S.achievements && S.achievements.length){
    L.push('Достижения: ' + S.achievements.slice(0, 6).join(', '));
  }
  r('Главное', clipText(S.achDetail || '', 200));
  r('О себе', clipText(S.freeText || '', 250));
  if(S.hobbies && S.hobbies.length) L.push('Хобби: ' + S.hobbies.slice(0, 6).join(', '));
  var out = L.join('\n');
  if(out.length > budget) out = out.slice(0, budget - 1).trim() + '…';
  return out;
}
function normTier(t){
  var s=String(t||'').toUpperCase().trim();
  if(s.indexOf('DREAM')!==-1||s.indexOf('МЕЧТ')!==-1) return 'DREAM';
  if(s.indexOf('TARGET')!==-1||s.indexOf('ЦЕЛ')!==-1) return 'TARGET';
  if(s.indexOf('SAFETY')!==-1||s.indexOf('СТРАХ')!==-1||s.indexOf('ЗАПАС')!==-1) return 'SAFETY';
  if(s==='S'||s==='D') return 'DREAM';
  if(s==='A'||s==='T') return 'TARGET';
  return 'SAFETY';
}

function aiPrompt(){
  return 'Ты — эксперт по поступлению в университеты мира и Казахстана. Внимательно изучи профиль школьника и составь тирлист из РОВНО 20 подходящих университетов.\n\nПРОФИЛЬ:\n'+compactProfileText(PROFILE_BUDGETS.tier)+'\n\nПРАВИЛА:\n- Всего РОВНО 20 вузов: 5 Dream (мечта — топовые, сложно поступить), 9 Target (целевые — реальный шанс), 6 Safety (страховочные — почти гарантированно).\n- Тирлист ВСЕГДА смешанный: обязательно включи И вузы Казахстана (НУ, КБТУ, МУИТ, SDU, КазНУ, Сатпаев, AITU, ЕНУ, КИМЭП и др.), И зарубежные топ-вузы по направлению (MIT, Stanford, Oxford, Cambridge, Harvard, KAIST, Toronto, METU и другие по смыслу).\n- Если хочет учиться за границей в конкретной стране — большинство бери из этой страны, но 2-3 казахстанских оставь как запасной вариант. Если Казахстан — вузы РК + зарубежные как цель.\n- Учитывай интересы, оценки, грант/бюджет, язык, готовность к переезду.\n- Верни СТРОГО JSON без пояснений: {"universities":[{"tier":"DREAM","name":"...","place":"Город, страна","match":95,"reason":"..."}]}.\n- tier — строго одно из: "DREAM" (ровно 5), "TARGET" (ровно 9), "SAFETY" (ровно 6). match — 0-100 (Dream 90+, Target 78-92, Safety 65-80).\n- reason — 1-2 предложения на русском, почему подходит именно этому школьнику.';
}

function modelJSON(model,prompt){
  return fetch('/api/gemini',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({model:model,prompt:prompt})
  }).then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
  .then(function(j){
    var parts=j.candidates&&j.candidates[0]&&j.candidates[0].content&&j.candidates[0].content.parts||[];
    var t=parts.filter(function(p){ return !p.thought; }).map(function(p){ return p.text||''; }).join('');
    var m=t.match(/\{[\s\S]*\}/);
    if(!m) throw new Error('no json');
    return JSON.parse(m[0]);
  });
}

function callModel(model,prompt){
  return modelJSON(model,prompt).then(function(o){
    var list=o.universities||o.tiers||[];
    if(!list.length) throw new Error('empty');
    var norm=list.map(function(u){
      return {tier:normTier(u.tier),name:u.name||'—',place:u.place||'',match:Math.max(0,Math.min(100,parseInt(u.match,10)||70)),reason:u.reason||''};
    }).filter(function(u){ return u.name && u.name!=='—'; });
    var dreams=norm.filter(function(u){ return u.tier==='DREAM'; }).slice(0,5);
    var targets=norm.filter(function(u){ return u.tier==='TARGET'; }).slice(0,9);
    var safeties=norm.filter(function(u){ return u.tier==='SAFETY'; }).slice(0,6);
    var out=dreams.concat(targets,safeties);
    if(out.length<10) throw new Error('too few');
    var seen={}, res=[];
    out.forEach(function(u){ var k=u.name.toLowerCase(); if(!seen[k]){ seen[k]=1; res.push(u); } });
    try{
      var fb=fallbackTier();
      for(var i=0;i<fb.length&&res.length<20;i++){ var f=fb[i], k2=String(f.name).toLowerCase(); if(!seen[k2]){ seen[k2]=1; res.push(f); } }
    }catch(e){}
    return res.slice(0,20);
  });
}

function fetchTierList(){
  var prompt=aiPrompt(), i=0;
  function next(){
    if(i>=GEMINI_MODELS.length) return Promise.reject(new Error('all models failed'));
    var m=GEMINI_MODELS[i++];
    return callModel(m,prompt).catch(function(){ return next(); });
  }
  return next();
}

/* ---------- Детали поступления в вуз ---------- */
var UNI_CACHE = {};
function uniDetailPrompt(u){
  return 'Ты — эксперт по поступлению. Школьник рассматривает университет "'+u.name+'" ('+u.place+').\n\nПРОФИЛЬ ШКОЛЬНИКА:\n'+compactProfileText(PROFILE_BUDGETS.detail)+'\n\nВерни СТРОГО JSON без пояснений: {"ielts":"...","grades":"...","exams":"...","activities":["...","...","..."],"grants":"...","deadlines":"...","tips":["...","..."]}.\n- ielts: какой IELTS/TOEFL нужен (конкретные баллы).\n- grades: какие оценки/ЕНТ нужны.\n- exams: какие экзамены/тесты сдавать.\n- activities: 3-4 конкретные активности именно в сфере школьника (его интересы и направление из профиля), которые усилят заявку.\n- grants: какие гранты/скидки реальны для него.\n- deadlines: когда подавать документы.\n- tips: 2-3 коротких совета.\nВсё на русском, конкретно, без воды.';
}
function fetchUniDetail(u){
  if(UNI_CACHE[u.name]) return Promise.resolve(UNI_CACHE[u.name]);
  var prompt=uniDetailPrompt(u), i=0;
  function next(){
    if(i>=GEMINI_MODELS.length) return Promise.reject(new Error('all models failed'));
    var m=GEMINI_MODELS[i++];
    return Promise.resolve().then(function(){ return modelJSON(m,prompt); }).then(function(o){
      if(!o.ielts&&!o.activities) throw new Error('empty');
      UNI_CACHE[u.name]=o; return o;
    }).catch(function(){ return next(); });
  }
  return next();
}
/* ---------- Отзывы о вузе + Reddit ---------- */
var REVIEW_CACHE = {};
function redditURL(u){
  return 'https://www.reddit.com/search/?q='+encodeURIComponent(u.name+' university review')+'&sort=relevance';
}
function reviewPrompt(u){
  return 'Ты — сборник отзывов студентов. Университет "'+u.name+'" ('+u.place+').\n\nВерни СТРОГО JSON без пояснений: {"reviews":[{"name":"...","text":"...","rating":5}]}.\n- 3 коротких живых отзыва студентов на русском, как на Reddit: имя + курс (например "Айгерим, 2 курс").\n- text — 1-2 предложения: что нравится / что бесит (общага, нагрузка, преподы, гранты).\n- rating — 1-5. Сделай разные: один 5, один 4, один 3.\nТолько JSON.';
}
function fallbackReviews(u){
  var n=u.name||'этот вуз';
  return [
    {name:'Студент, 2 курс',text:'Учусь в '+n+' — нагрузка серьёзная, но преподы сильные и комьюнити классное.',rating:5},
    {name:'Студентка, 1 курс',text:'Поступить было непросто, зато грант покрыл всё. Общага так себе, но учёба нравится.',rating:4},
    {name:'Выпускник',text:'Диплом '+n+' реально помогает с работой, хотя дедлайны жёсткие. Советую только если готов(а) пахать.',rating:4}
  ];
}
function starsHTML(r){
  r=Math.max(1,Math.min(5,parseInt(r,10)||5));
  var s=''; for(var i=0;i<5;i++) s+=(i<r?'★':'☆');
  return s;
}
function reviewsHTML(list){
  return list.map(function(r){
    return '<div class="rev"><b>'+esc(r.name||'Студент')+'</b><div class="stars">'+starsHTML(r.rating)+'</div><p>'+esc(r.text||'')+'</p></div>';
  }).join('');
}
function fetchUniReviews(u){
  if(REVIEW_CACHE[u.name]) return Promise.resolve(REVIEW_CACHE[u.name]);
  var i=0;
  function next(){
    if(i>=GEMINI_MODELS.length){ var fb=fallbackReviews(u); REVIEW_CACHE[u.name]=fb; return Promise.resolve(fb); }
    var m=GEMINI_MODELS[i++];
    return Promise.resolve().then(function(){ return modelJSON(m,reviewPrompt(u)); }).then(function(o){
      if(!o.reviews||!o.reviews.length) throw new Error('empty');
      var list=o.reviews.slice(0,3).map(function(r){ return {name:String(r.name||'Студент'),text:String(r.text||''),rating:Math.max(1,Math.min(5,parseInt(r.rating,10)||5))}; });
      REVIEW_CACHE[u.name]=list; return list;
    }).catch(function(){ return next(); });
  }
  return next();
}
function renderReviewsInto(u){
  var box=document.getElementById('ureviews');
  if(!box) return;
  fetchUniReviews(u).then(function(list){
    var b2=document.getElementById('ureviews');
    if(b2) b2.innerHTML=reviewsHTML(list);
  }).catch(function(){
    var b3=document.getElementById('ureviews');
    if(b3) b3.innerHTML=reviewsHTML(fallbackReviews(u));
  });
}
function currentTierList(){
  var raw=(AI_UNIS&&AI_UNIS.length)?AI_UNIS:fallbackTier();
  return raw.map(function(u){ return {tier:normTier(u.tier),name:u.name,place:u.place,match:u.match,reason:u.reason}; });
}
function openUni(name){
  var u=currentTierList().filter(function(x){ return x.name===name; })[0]||{name:name,place:'',match:0,reason:''};
  var modal=document.getElementById('uniModal'), body=document.getElementById('uniBody');
  modal.classList.add('open');
  body.innerHTML=uniTopPhotoHTML(u.name)
    +'<div class="ubody"><h3>'+esc(u.name)+'</h3><div class="place">'+esc(u.place)+'</div>'
    +'<div class="uspinner"><div class="spin"></div>ИИ собирает требования…</div></div>';
  try{ upgradeUniPhotos(body); }catch(e){}
  document.getElementById('uclose').onclick=closeUni;
  fetchUniDetail(u).then(function(d){
    function li(arr){ return (arr||[]).map(function(x,i){ return '<div><b>'+(i+1)+'.</b> '+esc(x)+'</div>'; }).join(''); }
    var picked=isPicked(u.name);
    body.innerHTML=uniTopPhotoHTML(u.name)
      +'<div class="ubody"><h3>'+esc(u.name)+'</h3><div class="place">'+esc(u.place)+(u.match?' • '+u.match+'% совпадение':'')+'</div>'
      +'<div class="usec">Что нужно</div>'
      +'<div class="ureq"><div class="k">IELTS</div><div class="v">'+esc(d.ielts||'—')+'</div></div>'
      +'<div class="ureq"><div class="k">Оценки</div><div class="v">'+esc(d.grades||'—')+'</div></div>'
      +'<div class="ureq"><div class="k">Экзамены</div><div class="v">'+esc(d.exams||'—')+'</div></div>'
      +'<div class="usec">Активности в твоей сфере</div><div class="ulist">'+li(d.activities)+'</div>'
      +'<div class="usec">Гранты</div><div class="ureq"><div class="k">Деньги</div><div class="v">'+esc(d.grants||'—')+'</div></div>'
      +'<div class="ureq"><div class="k">Дедлайны</div><div class="v">'+esc(d.deadlines||'—')+'</div></div>'
      +'<div class="usec">Советы</div><div class="ulist">'+li(d.tips)+'</div>'
      +'<div class="usec">Отзывы студентов</div><div id="ureviews"><div class="uspinner"><div class="spin"></div>Загружаем отзывы…</div></div>'
      +'<a class="redditbtn" href="'+redditURL(u)+'" target="_blank" rel="noopener">Читать отзывы на Reddit →</a>'
      +'<button class="choosebtn'+(picked?' picked':'')+'" id="uchoose">'+(picked?'✓ Выбран — убрать из списка':'＋ Добавить к выбранным')+'</button>'
      +'<button class="btn" id="ugoplan" style="margin-top:10px">К плану с выбранными ('+getChosen().length+') →</button></div>';
    document.getElementById('uclose').onclick=closeUni;
    document.getElementById('uchoose').onclick=function(){ toggleUni(u.name,u.place); openUniRefreshBtn(u); };
    document.getElementById('ugoplan').onclick=function(){ continueWithChosen(); };
    try{ upgradeUniPhotos(body); }catch(e){}
    renderReviewsInto(u);
  }).catch(function(){
    var picked2=isPicked(u.name);
    body.innerHTML=uniTopPhotoHTML(u.name)
      +'<div class="ubody"><h3>'+esc(u.name)+'</h3><div class="place">'+esc(u.place)+'</div>'
      +'<div class="ainote">Не удалось загрузить требования — проверь интернет и попробуй ещё раз.</div>'
      +'<div class="usec">Отзывы студентов</div><div id="ureviews"><div class="uspinner"><div class="spin"></div>Загружаем отзывы…</div></div>'
      +'<a class="redditbtn" href="'+redditURL(u)+'" target="_blank" rel="noopener">Читать отзывы на Reddit →</a>'
      +'<button class="choosebtn'+(picked2?' picked':'')+'" id="uchoose2">'+(picked2?'✓ Выбран — убрать':'✓ Всё равно выбрать этот вуз')+'</button>'
      +'<button class="btn" id="uretry">Попробовать снова</button></div>';
    document.getElementById('uclose').onclick=closeUni;
    document.getElementById('uchoose2').onclick=function(){ toggleUni(u.name,u.place); openUniRefreshBtn(u); };
    document.getElementById('uretry').onclick=function(){ openUni(name); };
    try{ upgradeUniPhotos(body); }catch(e){}
    renderReviewsInto(u);
  });
}
function openUniRefreshBtn(u){
  try{
    var b=document.getElementById('uchoose')||document.getElementById('uchoose2');
    if(b){ var p=isPicked(u.name); b.classList.toggle('picked',p); b.textContent=p?'✓ Выбран — убрать из списка':'＋ Добавить к выбранным'; }
    var g=document.getElementById('ugoplan'); if(g) g.textContent='К плану с выбранными ('+getChosen().length+') →';
  }catch(e){}
}
function closeUni(){ document.getElementById('uniModal').classList.remove('open'); }
document.getElementById('uniModal').addEventListener('click',function(e){
  if(e.target===this) closeUni();
});

