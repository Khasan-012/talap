'use strict';
/* ================= Данные ================= */
var SUBJECTS = ['Математика','Физика','Информатика','Химия','Биология','География','История','Английский язык','Казахский язык','Русский язык','Литература'];
var INTERESTS = ['💻 Компьютеры и технологии','🤖 Искусственный интеллект и роботы','🔬 Наука и исследования','➗ Математика','⚙️ Техника и инженерия','🧬 Биология','🧪 Химия','🩺 Медицина и здоровье','🌍 Природа и окружающая среда','🏗️ Строительство и архитектура','💰 Бизнес и предпринимательство','📈 Экономика и финансы','⚖️ Право','🌎 Другие страны и международные отношения','🗣️ Языки','📚 История и общество','🧠 Психология и люди','🎨 Дизайн и рисование','🎬 Кино, видео и контент','🎵 Музыка','✍️ Литература и писательство','📰 Журналистика и медиа','🏃 Спорт','✈️ Путешествия и туризм','🍳 Еда и кулинария','👨‍🏫 Образование и преподавание','🚗 Машины и транспорт','🌱 Сельское хозяйство и растения','🛡️ Безопасность','🎮 Игры','🚀 Космос','🧑‍💼 Работа с людьми и управление','❤️ Помощь людям'];
var SKILLS = ['Программирование','Создание сайтов','Создание приложений','Дизайн','Монтаж видео','Работа с AI','Анализ данных','Публичные выступления','Лидерство','Командная работа','Написание текстов','Исследовательская работа','Предпринимательство','Продажи','Спорт','Музыка','Иностранные языки'];
var HOBBIES = ['Спорт','Музыка','Чтение книг','Видеоигры','Рисование','Видео и блог','Фотография','Танцы','Кулинария','Волонтёрство','Клубы','Программирование','Настольные игры','Путешествия'];
var ACHS = ['Олимпиады','Конкурсы','Хакатоны','Спортивные достижения','Научные проекты','Школьные проекты','Сертификаты','Языковые экзамены','Волонтёрство','Лидерские позиции','Собственные проекты'];
var JOBS = ['Разработчик','AI / Data-специалист','Врач','Инженер','Предприниматель','Дизайнер','Архитектор','Юрист','Финансист','Маркетолог','Журналист / Медиа','Учёный','Учитель','Психолог','Дипломат'];
var LANGS = ['Казахский','Русский','Английский','Турецкий','Корейский','Китайский','Немецкий','Французский','Испанский'];
var AGREE = [{v:'yes',t:'Да'},{v:'rather_yes',t:'Скорее да'},{v:'rather_no',t:'Скорее нет'},{v:'no',t:'Нет'}];
var LEVELS = [{v:'new',t:'Начинающий',d:'Только начал(а)'},{v:'base',t:'Базовый',d:'Основы знаю'},{v:'mid',t:'Средний',d:'Уверенно пользуюсь'},{v:'pro',t:'Продвинутый',d:'Могу учить других'}];
var LANGLEVELS = [{v:'a',t:'Начальный',d:'A1–A2'},{v:'b1',t:'Средний',d:'B1'},{v:'b2',t:'Уверенный',d:'B2'},{v:'c',t:'Свободный',d:'C1 и выше'}];
var AGE_MIN = 10, AGE_MAX = 20;
var SITTESTS = [
  {q:'Тебе дали свободную неделю для проекта. Что выберешь?',o:[['Создать приложение или игру','tech'],['Провести эксперимент и узнать что-то новое','sci'],['Придумать бизнес и попробовать его запустить','biz'],['Создать дизайн, видео или другой творческий проект','art']]},
  {q:'Какой школьный проект тебе было бы интереснее выполнить?',o:[['Сделать робота или техническое устройство','tech'],['Исследовать человека, животных или природу','sci'],['Разработать идею полезного бизнеса','biz'],['Снять фильм, создать дизайн или оформить проект','art']]},
  {q:'Какая задача тебе кажется наиболее интересной?',o:[['Разобраться, как что-то работает','tech'],['Найти причину какого-то явления','sci'],['Придумать, как решить проблему людей','biz'],['Создать что-то красивое и необычное','art']]},
  {q:'Если бы ты работал в команде, какую роль выбрал бы?',o:[['Программист / технический специалист','tech'],['Исследователь','sci'],['Руководитель / организатор','biz'],['Дизайнер / создатель контента','art']]},
  {q:'Какой кружок ты бы выбрал?',o:[['Программирование или робототехника','tech'],['Научная лаборатория','sci'],['Бизнес и предпринимательство','biz'],['Дизайн, медиа или творчество','art']]},
  {q:'Что приносит тебе больше удовлетворения?',o:[['Когда сложная задача наконец решена','tech'],['Когда я узнаю или доказываю что-то новое','sci'],['Когда моя идея заинтересовала других','biz'],['Когда у меня получился красивый результат','art']]},
  {q:'Какую проблему тебе было бы интереснее решить?',o:[['Сделать технологию, которая упростит жизнь','tech'],['Решить научную или экологическую проблему','sci'],['Создать полезный продукт или бизнес','biz'],['Сделать продукт удобнее и красивее','art']]},
  {q:'Что тебе было бы интереснее изучать?',o:[['Компьютеры, технологии и искусственный интеллект','tech'],['Человека, природу и науку','sci'],['Деньги, бизнес и экономику','biz'],['Искусство, дизайн, медиа и культуру','art']]},
  {q:'Какой конкурс ты бы выбрал?',o:[['Хакатон или соревнование по технологиям','tech'],['Научная олимпиада или исследовательский конкурс','sci'],['Конкурс бизнес-идей','biz'],['Творческий конкурс','art']]},
  {q:'Представь: через 5 лет ты уже хорошо умеешь что-то делать. Что бы это было?',o:[['Создавать технологии и приложения','tech'],['Проводить исследования и делать открытия','sci'],['Создавать и развивать собственные проекты','biz'],['Создавать профессиональные творческие работы','art']]}
];
var SECTIONS = [
  {name:'Основная информация',desc:'Кто ты и где учишься'},
  {name:'Учёба',desc:'Опиши каждый урок — так мы лучше узнаем, что тебе нравится'},
  {name:'Интересы',desc:'Что тебя увлекает и кем себя видишь'},
  {name:'Навыки и достижения',desc:'Что уже умеешь, твой уровень, победы и опыт'},
  {name:'Хобби и свободное время',desc:'Чем занимаешься после школы'},
  {name:'Предпочтения в работе',desc:'Какой формат деятельности твой'},
  {name:'Карьерные интересы',desc:'Планы на будущее'},
  {name:'Языки',desc:'Какими языками владеешь'},
  {name:'Поступление',desc:'Куда хочешь поступать'}
];

function freshState(){ return {
  name:'',instagram:'',age:'',grade:'',country:'',studyLang:'',schoolType:'',admitYear:'',knowCountry:'',knowCountryWhich:'',hasProfession:'',professionText:'',
  subjects:[],subj:{},interests:[],situation:'',
  progLangs:[],progExp:'',progProjects:'',medInterest:'',medLong:'',designTools:[],designPortfolio:'',
  skills:[],skillLevel:{},freeText:'',
  hobbies:[],hobbyHours:'',about:[],circles:'',
  achievements:[],achDetail:'',
  work:{},dreamJob:'',considerJobs:[],notJobs:[],career:{},
  langs:[],langLevel:{},readyEnglish:'',newLang:'',newLangWhich:'',sittest:{},
  sportAch:'',musicDone:'',clubsWhich:'',
  chosenUni:null,chosenUnis:[],allPlans:{},allChecks:{},plan:null,planChecks:{},myAwards:[],
  studyCountry:'',studyCountryWhich:'',cities:'',bigUni:'',dorm:'',grant:'',costImportant:'',relocate:'',englishMedium:'',exchange:'',
  done:false }; }
var S = freshState();
var secIdx = 0, curQs = [], sitPos = 0;
/* Версионированное хранилище: v2 — текущая схема.
   v1: talapSurveyV1 / locusSurvey* без поля v.
   Миграции идемпотентны и чистят устаревшие ключи. */
var SCHEMA_VERSION = 2;
var LS = 'talapSurveyV2';
var LS_PREV = ['talapSurveyV1','locusSurveyV2','locusSurveyV1'];
var LS_TIER = 'talapTier';
var LS_TIER_OLD = ['locusTier'];

function save(){ try { localStorage.setItem(LS, JSON.stringify({v:SCHEMA_VERSION, state:S, sec:secIdx})); } catch(e){} }
function load(){ try {
  var raw = localStorage.getItem(LS), fromPrev = false;
  if(!raw){ for(var oi=0;oi<LS_PREV.length;oi++){ raw = localStorage.getItem(LS_PREV[oi]); if(raw){ fromPrev = true; break; } } }
  if(!raw) return 0;
  var d = JSON.parse(raw);
  if(d && d.state){
    var ver = d.v || 1;
    S = Object.assign(freshState(), d.state);
    migrateStateFrom(ver);
    save();
    if(fromPrev){ try{ for(var oj=0;oj<LS_PREV.length;oj++) localStorage.removeItem(LS_PREV[oj]); }catch(e){} }
    return d.sec||0;
  }
} catch(e){} return 0; }
function migrateStateFrom(ver){
  migrateState();
  if(ver < 2){
    if(!S.collapsed || typeof S.collapsed !== 'object') S.collapsed = {};
    if(S.plan && S.plan.monthPlans && !S.plan.dayGoals) S.plan.dayGoals = {};
    if(S.plan && S.plan.monthPlans && !S.plan.dayChecks) S.plan.dayChecks = {};
  }
}
function migrateState(){
  if(!S.chosenUnis) S.chosenUnis=[];
  if(!S.allPlans) S.allPlans={};
  if(!S.allChecks) S.allChecks={};
  if(S.chosenUni && !S.chosenUnis.length) S.chosenUnis=[S.chosenUni];
  if(S.chosenUnis.length && !S.chosenUni) S.chosenUni=S.chosenUnis[0];
  if(S.plan&&((S.plan.steps||S.plan.uni)&&!S.plan.unis)){ S.plan=null; S.planChecks={}; }
  if(S.plan&&S.plan.v!==2){ S.plan=null; S.planChecks={}; }
  if(!S.planChecks||typeof S.planChecks!=='object') S.planChecks={};
  if(!S.cal||typeof S.cal!=='object') S.cal={level:'years',y:null,m:null};
}
function store(){ try { localStorage.removeItem(LS); for(var i=0;i<LS_PREV.length;i++) localStorage.removeItem(LS_PREV[i]); localStorage.removeItem(LS_TIER); for(var k=0;k<LS_TIER_OLD.length;k++) localStorage.removeItem(LS_TIER_OLD[k]); } catch(e){} }
function toast(msg){ var t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(t._h); t._h=setTimeout(function(){ t.classList.remove('show'); },2200); }
function has(arr,v){ return arr && arr.indexOf(v) !== -1; }
function hasI(key){ return (S.interests||[]).some(function(v){ return v.indexOf(key)!==-1; }); }
function opt(v,t,d){ return {v:v,t:t,d:d}; }
function strOpts(list){ return list.map(function(v){ return {v:v,t:v}; }); }
function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function needProg(){ return hasI('Компьютеры') || has(S.skills,'Программирование'); }
function needMed(){ return hasI('Медицина'); }
function needDesign(){ return hasI('Дизайн'); }

/* возраст -> класс и год поступления */
var GRADE_BY_AGE = {10:'6 класс',11:'6 класс',12:'7 класс',13:'8 класс',14:'9 класс',15:'10 класс',16:'11 класс',17:'11 класс',18:'12 класс (НИШ)',19:'12 класс (НИШ)',20:'12 класс (НИШ)'};
function yearByGrade(g){
  if(g==='11 класс'||g==='12 класс (НИШ)') return '2027';
  if(g==='10 класс') return '2028';
  return '2029 или позже';
}
function autoByAge(loud){
  var g = GRADE_BY_AGE[parseInt(S.age,10)];
  if(!g) return false;
  var changed = false;
  if(S.grade!==g){ S.grade=g; changed=true; }
  var y = yearByGrade(g);
  if(S.admitYear!==y){ S.admitYear=y; changed=true; }
  if(changed){ save(); if(loud) toast('Класс и год поступления подставлены по возрасту — можно поменять'); }
  return changed;
}

