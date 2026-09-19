/* ================= Подбор направлений ================= */
function like(s){ var d=S.subj[s]; return d?(d.like||0):0; }
function agreeYes(v){ return v==='yes'||v==='rather_yes'; }
function scoreDirs(){
  var D=[];
  function dir(name,desc){ var o={name:name,desc:desc,score:0,reasons:[]}; D.push(o); return o; }
  var it=dir('IT и программирование','Разработка, приложения, сайты и стартапы в tech.');
  var ai=dir('AI и данные','Искусственный интеллект, анализ данных, ML.');
  var med=dir('Медицина','Врач, стоматология, фармация, биотех.');
  var eng=dir('Инженерия','Механика, электроника, строительство, энергетика.');
  var biz=dir('Бизнес и предпринимательство','Свой бизнес, стартапы, менеджмент.');
  var fin=dir('Финансы и экономика','Банки, инвестиции, аналитика, учёт.');
  var des=dir('Дизайн','UI/UX, графика, моушн, продукт.');
  var arch=dir('Архитектура','Проектирование зданий и пространств.');
  var law=dir('Право и международные отношения','Юрист, дипломат, госслужба.');
  var media=dir('Медиа и маркетинг','Журналистика, SMM, реклама, контент.');
  var sci=dir('Наука','Исследования, лаборатории, академия.');
  var psy=dir('Психология и образование','Помощь людям, преподавание.');
  var spo=dir('Спорт','Профессиональный спорт, тренерство.');
  function add(o,pts,why){ o.score+=pts; if(why&&o.reasons.length<3) o.reasons.push(why); }
  var I=S.interests||[], K=S.skills||[];
  function aboutYes(k){ return S.about&&S.about[k]==='yes'; }
  if(hasI('Компьютеры')) add(it,3,'интерес к компьютерам и технологиям');
  if(hasI('Искусственный интеллект')){ add(ai,3,'интерес к ИИ'); add(it,1); }
  if(hasI('Игры')) add(it,1,'интерес к играм');
  if(hasI('Безопасность')) add(it,1,'интерес к безопасности');
  if(has(K,'Программирование')) add(it,3,'умеешь программировать');
  if(has(K,'Создание сайтов')) add(it,2,'умеешь делать сайты');
  if(has(K,'Создание приложений')) add(it,2,'умеешь делать приложения');
  if(has(K,'Работа с AI')) add(ai,2,'работаешь с AI');
  if(has(K,'Анализ данных')) add(ai,3,'умеешь анализировать данные');
  if(like('Информатика')>=4) add(it,2,'нравится информатика');
  if(like('Математика')>=4){ add(ai,2,'нравится математика'); add(fin,1,'нравится математика'); add(eng,1,'нравится математика'); }
  var tc={tech:0,sci:0,biz:0,art:0};
  Object.keys(S.sittest||{}).forEach(function(k){ var tt=S.sittest[k]; if(tc[tt]!==undefined) tc[tt]++; });
  if(tc.tech) add(it,tc.tech,tc.tech+' из 10 тестов — за технологии');
  if(tc.sci) add(sci,tc.sci,tc.sci+' из 10 тестов — за науку');
  if(tc.biz) add(biz,tc.biz,tc.biz+' из 10 тестов — за бизнес');
  if(tc.art) add(des,tc.art,tc.art+' из 10 тестов — за творчество');
  if(S.work.people==='pc') add(it,1,'комфортнее с компьютером');
  if(S.work.practice==='prac'){ add(eng,1,'ближе практика'); add(it,1,'ближе практика'); }
  if(agreeYes(S.work.solve)){ add(it,1,'любишь сложные задачи'); add(eng,1,'любишь сложные задачи'); }
  if(S.progProjects==='yes') add(it,1,'уже есть свои проекты');
  if(hasI('Медицина')) add(med,3,'интерес к медицине');
  if(hasI('Биология')) add(med,2,'интерес к биологии');
  if(hasI('Химия')) add(med,1,'интерес к химии');
  if(hasI('Помощь людям')){ add(med,1,'желание помогать людям'); add(psy,1,'желание помогать людям'); }
  if(like('Биология')>=4) add(med,2,'нравится биология');
  if(like('Химия')>=4) add(med,2,'нравится химия');
  if(agreeYes(S.work.help)) add(med,2,'нравится помогать людям');
  if(S.medInterest>=4) add(med,2,'высокий интерес к медицине');
  if(hasI('инженерия')) add(eng,3,'интерес к инженерии');
  if(hasI('Машины')) add(eng,1,'интерес к машинам');
  if(like('Физика')>=4) add(eng,2,'нравится физика');
  if(agreeYes(S.work.create)){ add(eng,1,'нравится создавать новое'); add(des,1,'нравится создавать новое'); }
  if(hasI('Бизнес')) add(biz,3,'интерес к бизнесу и предпринимательству');
  if(hasI('управление')) add(biz,1,'интерес к управлению');
  if(has(K,'Предпринимательство')) add(biz,2,'есть опыт предпринимательства');
  if(has(K,'Продажи')) add(biz,1,'умеешь продавать');
  if(has(K,'Лидерство')) add(biz,1,'лидерские навыки');
  if(agreeYes(S.work.lead)) add(biz,2,'нравится руководить');
  if(agreeYes(S.career.business)) add(biz,2,'хочешь свой бизнес');
  if(hasI('Экономика')) add(fin,3,'интерес к экономике и финансам');
  if(hasI('Математика')){ add(fin,1,'интерес к математике'); add(ai,1,'интерес к математике'); }
  if(agreeYes(S.work.numbers)) add(fin,2,'нравится работать с цифрами');
  if(agreeYes(S.work.analyze)){ add(fin,1,'нравится анализировать'); add(ai,1,'нравится анализировать'); }
  if(hasI('Дизайн')) add(des,3,'интерес к дизайну');
  if(has(K,'Дизайн')) add(des,2,'умеешь дизайнить');
  if(has(K,'Монтаж видео')){ add(des,1,'умеешь монтировать'); add(media,1,'умеешь монтировать'); }
  if((S.designTools||[]).length) add(des,1,'владеешь инструментами дизайна');
  if(hasI('архитектура')) add(arch,3,'интерес к архитектуре');
  if(hasI('Право')) add(law,3,'интерес к праву');
  if(hasI('международные отношения')) add(law,2,'интерес к международным отношениям');
  if(hasI('Журналистика')){ add(media,2,'интерес к журналистике'); add(law,1,'интерес к журналистике'); }
  if(hasI('История')) add(law,1,'интерес к истории и обществу');
  if(hasI('Литература')) add(media,1,'любовь к писательству');
  if(agreeYes(S.work.texts)){ add(law,1,'нравится работать с текстами'); add(media,1,'нравится работать с текстами'); }
  if(has(K,'Написание текстов')){ add(media,1,'умеешь писать тексты'); add(law,1,'умеешь писать тексты'); }
  if(hasI('Кино, видео')) add(media,2,'интерес к кино и контенту');
  if(agreeYes(S.work.speak)){ add(media,1,'нравится выступать'); add(law,1,'нравится выступать'); }
  if(agreeYes(S.work.variety)) add(media,1,'любишь разнообразие задач');
  if(hasI('Наука')) add(sci,3,'интерес к науке');
  if(hasI('Космос')){ add(sci,2,'интерес к космосу'); add(eng,1,'интерес к космосу'); }
  if(hasI('Природа')) add(sci,1,'интерес к природе');
  if(hasI('Сельское хозяйство')) add(sci,1,'интерес к сельскому хозяйству');
  if(agreeYes(S.work.research)) add(sci,2,'нравится исследовать');
  if(S.work.practice==='theor') add(sci,1,'ближе теория');
  if(has(K,'Исследовательская работа')) add(sci,2,'есть опыт исследований');
  if(agreeYes(S.career.science)) add(sci,1,'хочешь в науку');
  if(hasI('Психология')) add(psy,2,'интерес к психологии');
  if(hasI('Образование')) add(psy,2,'интерес к образованию');
  if(S.work.people==='people') add(psy,1,'комфортнее с людьми');
  if(hasI('Спорт') && !hasI('Транспорт')) add(spo,2,'интерес к спорту');
  if(has(S.hobbies,'Спорт')) add(spo,2,'спорт — хобби');
  if(aboutYes('sport')) add(spo,1,'занимаешься спортом');
  if(has(S.achievements,'Спортивные достижения')) add(spo,2,'спортивные достижения');
  D.sort(function(x,y){ return y.score-x.score; });
  var top=D[0].score||1;
  D.forEach(function(d){ d.pct=Math.round(100*d.score/top); });
  return D;
}

function finish(){
  S.done=true; save();
  pfill.style.width='100%';
  var name=S.name||'Друг';
  document.getElementById('resTitle').innerHTML = esc(name)+', твой профиль <span>готов</span> 🎉';
  var bits=[];
  if(S.grade) bits.push(S.grade);
  if(S.dreamJob) bits.push('мечта — '+S.dreamJob);
  if(S.studyCountry==='kz') bits.push('учёба в Казахстане');
  if(S.studyCountry==='abroad') bits.push('учёба за границей'+(S.studyCountryWhich?' ('+S.studyCountryWhich+')':''));
  document.getElementById('resHello').textContent = bits.length?('Коротко о тебе: '+bits.join(' • ')+'. Вот направления, которые подходят тебе больше всего:'):'Вот направления, которые подходят тебе больше всего:';
  var D=scoreDirs().slice(0,3), box=document.getElementById('dirs');
  box.innerHTML = D.map(function(d,ix){
    return '<div class="dir'+(ix===0?' top':'')+'"><div class="rank">'+(ix===0?'★ Лучшее совпадение':'Вариант '+(ix+1))+'</div><h3>'+esc(d.name)+'</h3><p>'+esc(d.desc)+'</p><div class="bar"><i data-w="'+d.pct+'"></i></div><div class="pct">'+d.pct+'% совпадение</div>'+(d.reasons.length?'<p style="margin-top:6px">Почему: '+esc(d.reasons.join(', '))+'</p>':'')+'</div>';
  }).join('');
  setTimeout(function(){ box.querySelectorAll('.bar i').forEach(function(b){ b.style.width=b.getAttribute('data-w')+'%'; }); },80);
  var rows=[];
  function row(t,v){ if(v&&(v.length||typeof v==='number')) rows.push('<div class="kv"><b>'+t+':</b> '+esc(Array.isArray(v)?v.join(', '):v)+'</div>'); }
  row('Имя',S.name); row('Instagram',S.instagram?('@'+S.instagram):''); row('Возраст',S.age); row('Класс',S.grade); row('Страна',S.country);
  row('Хочет учиться',S.knowCountryWhich); row('Спорт (звания)',S.sportAch); row('Музыка (что закончил)',S.musicDone); row('Клубы',S.clubsWhich); row('Интересы',S.interests); row('Навыки',S.skills); row('Хобби',S.hobbies);
  row('Достижения',S.achievements); row('Языки',S.langs); row('Рассматривает',S.considerJobs);
  document.getElementById('profList').innerHTML = rows.join('')||'<div class="kv">Пока пусто</div>';
  renderTier();
  show(vr);
}

document.getElementById('btnMain').addEventListener('click',function(){
  showTab('main');
});
document.getElementById('btnDownload').addEventListener('click',function(){
  var blob=new Blob([JSON.stringify(S,null,2)],{type:'application/json'});
  var aEl=document.createElement('a'); aEl.href=URL.createObjectURL(blob);
  aEl.download='talap-profile.json'; aEl.click(); setTimeout(function(){ URL.revokeObjectURL(aEl.href); },2000);
});
document.getElementById('btnReset').addEventListener('click',function(){
  store(); S=freshState(); secIdx=0; save(); show(vs); renderSection(1);
});

