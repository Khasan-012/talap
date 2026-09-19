/* ================= Вопросы по разделам ================= */
function buildQuestions(sec){
  var a = [];
  function p(q){ q.sec=sec; a.push(q); return q; }
  if(sec===0){
    p({id:'name',title:'Имя',type:'text',key:'name',ph:'Твоё имя',req:1});
    p({id:'age',title:'Возраст',sub:'Покрути вниз-вверх',type:'wheel',key:'age'});
    p({id:'grade',title:'Класс',type:'single',key:'grade',options:strOpts(['6 класс','7 класс','8 класс','9 класс','10 класс','11 класс','12 класс (НИШ)'])});
    p({id:'country',title:'Страна',type:'text',key:'country',ph:'Например, Казахстан'});
    p({id:'schoolType',title:'Тип школы',type:'single',key:'schoolType',options:strOpts(['Обычная','НИШ','РФМШ / БИЛ','Лицей / гимназия','Частная','IB'])});
    p({id:'admitYear',title:'Когда планируешь поступать в университет?',type:'single',key:'admitYear',options:strOpts(['2026','2027','2028','2029 или позже','Ещё не знаю'])});
    p({id:'knowCountry',title:'Знаешь уже, в какой стране хочешь учиться?',type:'single',key:'knowCountry',restruct:1,options:[opt('yes','Да, уже знаю'),opt('no','Пока выбираю')]});
    if(S.knowCountry==='yes')
      p({id:'knowCountryWhich',title:'В какой стране?',type:'text',key:'knowCountryWhich',ph:'Например, США',req:1,fresh:1});
    p({id:'hasProfession',title:'Есть уже выбранная профессия или направление?',type:'single',key:'hasProfession',restruct:1,options:[opt('yes','Да, уже выбрал(а)'),opt('options','Есть несколько вариантов'),opt('no','Пока нет')]});
    if(S.hasProfession==='yes'||S.hasProfession==='options')
      p({id:'professionText',title:S.hasProfession==='yes'?'Какая профессия?':'Какие варианты рассматриваешь?',type:'text',key:'professionText',ph:'Например, врач',optional:1,fresh:1});
  }
  if(sec===1){
    SUBJECTS.forEach(function(s){ p({id:'subj:'+s,title:s,sub:'Опиши этот урок: оценка, интерес и сложность',type:'subjDetail',subject:s}); });
  }
  if(sec===2){
    p({id:'interests',title:'Какие области тебе интересны?',sub:'Выбери всё, что откликается, или добавь своё последним вариантом',type:'multi',key:'interests',options:INTERESTS,custom:1,restruct:1,req:1});
    p({id:'sittest',title:'Мини-тесты: выбери, что ближе',sub:'10 ситуаций — листай стрелками, отвечай тапом',type:'sittest'});
    if(needMed()){
      p({id:'medInterest',title:'Насколько тебе интересна медицина?',sub:'1 — совсем нет, 5 — очень',type:'scale',key:'medInterest',left:'Не интересно',right:'Очень'});
      p({id:'medLong',title:'Готов(а) учиться 6+ лет ради профессии врача?',type:'single',key:'medLong',options:[opt('yes','Да, готов(а)'),opt('doubt','Сомневаюсь'),opt('no','Нет, это не для меня')]});
    }
    if(needDesign()){
      p({id:'designTools',title:'Какими инструментами уже пользуешься?',sub:'Выбери всё, что пробовал(а)',type:'multi',key:'designTools',options:['Figma','Photoshop','Illustrator','Procreate','Canva','Blender','After Effects'],optional:1});
      p({id:'designPortfolio',title:'Есть портфолио работ?',type:'single',key:'designPortfolio',options:[opt('yes','Да, есть'),opt('want','Нет, хочу собрать'),opt('no','Нет')]});
    }
  }
  if(sec===3){
    p({id:'skills',title:'Чем уже умеешь заниматься?',sub:'Выбери всё, что умеешь хотя бы на базовом уровне',type:'multi',key:'skills',options:SKILLS,restruct:1,req:1});
    (S.skills||[]).forEach(function(s){ p({id:'skill:'+s,title:s,sub:'Твой уровень',type:'skillLevel',skill:s}); });
    if(needProg()){
      p({id:'progLangs',title:'Какие языки программирования знаешь?',sub:'Выбери всё, что пробовал(а)',type:'multi',key:'progLangs',options:['Python','JavaScript','Java','C++','C#','Go','Scratch'],optional:1});
      p({id:'progExp',title:'Как долго программируешь?',type:'single',key:'progExp',options:[opt('0','Меньше 6 месяцев'),opt('1','Около года'),opt('2','2 года'),opt('3','3 года и больше')]});
      p({id:'progProjects',title:'Есть свои проекты?',type:'single',key:'progProjects',options:[opt('yes','Да, есть свои проекты'),opt('want','Нет, но хочу сделать'),opt('no','Пока нет')]});
    }
    p({id:'freeText',title:'Расскажи своими словами, чем ты сейчас занимаешься',type:'textarea',key:'freeText',ph:'Например: делаю сайты на заказ и веду блог про дизайн...',optional:1});
    p({id:'achievements',title:'Какие у тебя достижения?',sub:'Выбери всё, что было, или добавь своё вручную',type:'multi',key:'achievements',options:ACHS,custom:1,req:1});
    p({id:'achDetail',title:'Расскажи подробнее о главном достижении',type:'textarea',key:'achDetail',ph:'Например: 2 место на областной олимпиаде по физике...',optional:1});
  }
  if(sec===4){
    p({id:'hobbies',title:'Чем занимаешься после школы? Какие хобби?',sub:'Выбери или добавь своё',type:'multi',key:'hobbies',options:HOBBIES,custom:1,req:1});
    var hobbyItems=[
      {key:'hobbyHours',title:'Сколько времени в неделю уделяешь своим занятиям?',options:[opt('l2','Меньше 2 часов'),opt('24','2–4 часа'),opt('57','5–7 часов'),opt('8p','8+ часов')]},
      {key:'about.sport',title:'Занимаешься ли спортом?',trig:1,options:[opt('yes','Да, регулярно'),opt('sometimes','Иногда'),opt('no','Нет')]},
      {key:'about.music',title:'Занимаешься ли музыкой?',trig:1,options:[opt('yes','Да'),opt('was','Раньше занимался(лась)'),opt('no','Нет')]},
      {key:'about.books',title:'Читаешь ли книги?',options:[opt('yes','Да, люблю читать'),opt('sometimes','Иногда'),opt('no','Почти нет')]},
      {key:'about.clubs',title:'Участвуешь ли в клубах?',trig:1,options:[opt('yes','Да'),opt('no','Нет')]}
    ];
    var sp=getVal('about.sport');
    if(sp==='yes'||sp==='sometimes') hobbyItems.push({key:'sportAch',title:'Есть спортивные достижения или звания? КМС, МС, разряды?',fresh:1,options:[opt('rank','Да — КМС / МС / разряд'),opt('medals','Есть медали и грамоты'),opt('none','Пока без званий')]});
    var mu=getVal('about.music');
    if(mu==='yes'||mu==='was') hobbyItems.push({key:'musicDone',title:'Что закончил по музыке?',fresh:1,type:'text',ph:'Например, музыкальную школу по фортепиано...'});
    if(getVal('about.clubs')==='yes') hobbyItems.push({key:'clubsWhich',title:'В каких клубах участвуешь?',fresh:1,type:'text',ph:'Например, дебатный клуб, robotics...'});
    p({id:'hobbyTest',title:'Мини-тест: твоё свободное время',sub:'Листай стрелками ← →, отвечай тапом',type:'carousel',items:hobbyItems});
    p({id:'circles',title:'Какие кружки посещаешь?',sub:'Через запятую',type:'text',key:'circles',ph:'Например, робототехника, домбра...',optional:1});
  }
  if(sec===5){
    p({id:'w_team',title:'Предпочитаешь работать один или в команде?',type:'single',key:'work.team',options:[opt('solo','Один'),opt('team','В команде'),opt('both','По-разному')]});
    p({id:'w_people',title:'Нравится работать с людьми или с компьютером?',type:'single',key:'work.people',options:[opt('people','С людьми'),opt('pc','С компьютером'),opt('both','И то, и другое')]});
    p({id:'w_practice',title:'Больше нравится практика или теория?',type:'single',key:'work.practice',options:[opt('prac','Практика — делать руками'),opt('theor','Теория — разбираться вглубь'),opt('both','Баланс')]});
    var WQ=[['create','Нравится создавать что-то новое?'],['solve','Нравится решать сложные задачи?'],['analyze','Нравится анализировать информацию?'],['lead','Нравится руководить?'],['speak','Нравится выступать перед людьми?'],['help','Нравится помогать другим?'],['numbers','Нравится работать с цифрами?'],['texts','Нравится работать с текстами?'],['research','Нравится проводить исследования?'],['variety','Нравится, когда каждый день разные задачи?']];
    WQ.forEach(function(w){ p({id:'w_'+w[0],title:w[1],type:'agree',key:'work.'+w[0]}); });
  }
  if(sec===6){
    p({id:'dreamJob',title:'Кем хотел(а) бы стать?',type:'text',key:'dreamJob',ph:'Например, AI-инженер',optional:1});
    p({id:'considerJobs',title:'Какие профессии рассматриваешь?',sub:'Выбери или добавь свою кнопкой +',type:'multi',key:'considerJobs',options:JOBS,custom:1,req:1});
    p({id:'notJobs',title:'Какие профессии тебе не интересны?',sub:'Выбери или добавь свою кнопкой +. Можно пропустить',type:'multi',key:'notJobs',options:JOBS,custom:1,optional:1});
    var CQ=[['kz','Хочешь работать в Казахстане?'],['abroad','Хочешь работать за границей?'],['remote','Хочешь работать удалённо?'],['business','Хочешь открыть собственный бизнес?'],['science','Хочешь заниматься наукой?'],['bigco','Хочешь работать в крупной компании?']];
    var YN=[opt('yes','Да'),opt('no','Нет')];
    CQ.forEach(function(w){ p({id:'c_'+w[0],title:w[1],type:'single',key:'career.'+w[0],options:YN}); });
  }
  if(sec===7){
    p({id:'langs',title:'Какие языки знаешь?',sub:'Выбери все, на которых можешь общаться',type:'multi',key:'langs',options:LANGS,restruct:1,req:1});
    (S.langs||[]).forEach(function(l){ p({id:'lang:'+l,title:l,sub:'Твой уровень',type:'langLevel',lang:l}); });
    p({id:'newLang',title:'Хочешь изучать новый язык?',type:'single',key:'newLang',restruct:1,options:[opt('yes','Да'),opt('no','Нет')]});
    if(S.newLang==='yes') p({id:'newLangWhich',title:'Какой язык хочешь выучить?',type:'text',key:'newLangWhich',ph:'Например, корейский',optional:1,fresh:1});
  }
  if(sec===8){
    p({id:'studyCountry',title:'В какой стране хочешь учиться?',type:'single',key:'studyCountry',restruct:1,options:[opt('kz','🇰🇿 В Казахстане'),opt('abroad','🌍 За границей'),opt('undecided','Пока не решил(а)')]});
    if(S.studyCountry==='abroad') p({id:'studyCountryWhich',title:'В какой стране?',type:'text',key:'studyCountryWhich',ph:'Например, США, Корея, Турция...',fresh:1});
    p({id:'bigUni',title:'Важен ли большой университет?',sub:'1 — не важно, 5 — очень важно',type:'scale',key:'bigUni',left:'Не важно',right:'Очень важно'});
    p({id:'grant',title:'Нужен грант или стипендия?',type:'single',key:'grant',options:[opt('only','Только грант'),opt('nice','Желательно'),opt('pay','Готов(а) платить')]});
    p({id:'costImportant',title:'Насколько важна стоимость обучения?',sub:'1 — не важна, 5 — критична',type:'scale',key:'costImportant',left:'Не важна',right:'Критична'});
    p({id:'relocate',title:'Готов(а) переехать в другой город или страну?',type:'single',key:'relocate',options:[opt('yes','Да, готов(а)'),opt('own','Только свой город'),opt('depends','Зависит от условий')]});
    p({id:'exchange',title:'Интересуют международные программы и обмен?',type:'single',key:'exchange',options:[opt('very','Очень интересуют'),opt('mid','Интересно'),opt('no','Не важно')]});
  }
  return a;
}

function getVal(key){ var parts=key.split('.'); if(parts.length===1) return S[key];
  if(parts.length===2){ if(key==='about.sport'||key==='about.music'||key==='about.books'||key==='about.clubs'){ if(!S.about||typeof S.about!=='object'||Array.isArray(S.about)) S.about={}; return S.about[parts[1]]; } return S[parts[0]]?S[parts[0]][parts[1]]:''; }
  return ''; }
function setVal(key,v){ var parts=key.split('.');
  if(parts.length===1) S[key]=v;
  else if(key.indexOf('about.')===0){ if(!S.about||typeof S.about!=='object'||Array.isArray(S.about)) S.about={}; S.about[parts[1]]=v; }
  else { if(!S[parts[0]]) S[parts[0]]={}; S[parts[0]][parts[1]]=v; } }
function isAnswered(q){
  var v;
  if(q.type==='subjDetail'){ var d=S.subj[q.subject]||{}; return d.grade&&d.like&&d.ease&&d.deep; }
  if(q.type==='sittest'){ var tt=S.sittest||{}; return Object.keys(tt).length>=SITTESTS.length; }
  if(q.type==='carousel'){ return q.items.every(function(it){ var v=getVal(it.key); return v!==''&&v!==undefined&&v!==null; }); }
  if(q.type==='wheel'){ return !!S.age; }
  if(q.type==='skillLevel'){ return !!S.skillLevel[q.skill]; }
  if(q.type==='langLevel'){ return !!S.langLevel[q.lang]; }
  if(!q.key) return true;
  if(q.type==='multi'){ v=getVal(q.key); return v&&v.length>0; }
  v=getVal(q.key);
  return v!==''&&v!==undefined&&v!==null;
}

