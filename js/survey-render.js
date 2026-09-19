/* ================= Рендер раздела ================= */
var stage=document.getElementById('stage'), stagewrap=document.getElementById('stagewrap'),
    pfill=document.getElementById('pfill'), secName=document.getElementById('secName'),
    stepCount=document.getElementById('stepCount'), btnNext=document.getElementById('btnNext');

function blockHTML(q){
  var req = (!q.optional && (q.req || q.type==='single' || q.type==='agree' || q.type==='scale' || q.type==='skillLevel' || q.type==='langLevel' || q.type==='subjDetail')) ? ' <span class="req">*</span>' : '';
  var h = '<div class="qb'+(q.fresh?' qb-new':'')+'" id="qb_'+q.id+'"><div class="qlabel">'+esc(q.title)+req+'</div>';
  if(q.sub) h += '<div class="qsub">'+esc(q.sub)+'</div>';
  var val = q.key?getVal(q.key):'';

  if(q.type==='wheel'){
    h += '<div class="wheel-wrap"><div class="wheel" data-g="'+q.id+'"><div class="wheel-list">';
    for(var wa=AGE_MIN;wa<=AGE_MAX;wa++) h += '<div class="wheel-item" data-i="'+(wa-AGE_MIN)+'">'+wa+'</div>';
    h += '</div></div><div class="wheel-fade top"></div><div class="wheel-fade bot"></div><div class="wheel-hi"></div></div>';
  }
  else if(q.type==='text'||q.type==='number')
    h += '<input class="field" data-f="'+q.id+'" type="'+(q.type==='number'?'number':'text')+'" inputmode="'+(q.type==='number'?'numeric':'text')+'" placeholder="'+esc(q.ph||'')+'" value="'+esc(val||'')+'">';
  else if(q.type==='textarea')
    h += '<textarea class="area" data-f="'+q.id+'" placeholder="'+esc(q.ph||'')+'">'+esc(val||'')+'</textarea>';
  else if(q.type==='single'||q.type==='agree'||q.type==='skillLevel'||q.type==='langLevel'){
    var opts = q.options || (q.type==='skillLevel'?LEVELS:(q.type==='langLevel'?LANGLEVELS:AGREE));
    var cur = q.key?val:(q.type==='skillLevel'?(S.skillLevel[q.skill]||''):(S.langLevel[q.lang]||''));
    h += '<div class="opts" data-g="'+q.id+'">' + opts.map(function(o){
      return '<button class="opt'+(cur===o.v?' sel':'')+'" data-v="'+esc(o.v)+'"><span class="radio"></span><span>'+esc(o.t)+(o.d?'<small>'+esc(o.d)+'</small>':'')+'</span></button>';
    }).join('') + '</div>';
  }
  else if(q.type==='scale'){
    h += '<div class="scale5" data-g="'+q.id+'">' + [1,2,3,4,5].map(function(n){
      return '<button data-v="'+n+'" class="'+(String(val)===String(n)?'sel':'')+'">'+n+'</button>';
    }).join('') + '</div><div class="scalelabels"><span>'+esc(q.left||'1')+'</span><span>'+esc(q.right||'5')+'</span></div>';
  }
  else if(q.type==='multi'){
    var preset=q.options||[], curArr=val||[];
    var custom=curArr.filter(function(v){ return preset.indexOf(v)===-1; });
    h += '<div class="chips" data-g="'+q.id+'">' + preset.concat(custom).map(function(v){
      return '<div class="chip'+(has(curArr,v)?' sel':'')+'" data-v="'+esc(v)+'">'+esc(v)+'</div>';
    }).join('') + '</div>';
    if(q.custom) h += '<div class="addrow"><input class="field custom-in" data-c="'+q.id+'" placeholder="Своё — напиши и нажми +"><button class="addbtn" data-add="'+q.id+'">+</button></div>';
  }
  else if(q.type==='sittest'){
    h += '<div class="sittest" data-g="'+q.id+'"></div>';
  }
  else if(q.type==='carousel'){
    h += '<div class="minicar" data-c="'+q.id+'"></div>';
  }
  else if(q.type==='subjDetail'){
    var d=S.subj[q.subject]||{};
    function pills(k,vals){ return '<div class="pills" data-g="'+q.id+'" data-k="'+k+'">'+vals.map(function(g){
      var vv=Array.isArray(g)?g[0]:g, tt=Array.isArray(g)?g[1]:g;
      return '<button data-v="'+vv+'" class="'+(String(d[k])===String(vv)?'sel':'')+'">'+tt+'</button>'; }).join('')+'</div>'; }
    h += '<div class="mini"><b>Текущая оценка</b>'+pills('grade',['2','3','4','5'])+'</div>';
    h += '<div class="mini"><b>Насколько нравится? (1–5)</b>'+pills('like',['1','2','3','4','5'])+'</div>';
    h += '<div class="mini"><b>Насколько легко даётся? (1–5)</b>'+pills('ease',['1','2','3','4','5'])+'</div>';
    h += '<div class="mini"><b>Хочешь изучать глубже?</b>'+pills('deep',[['yes','Да'],['no','Нет']])+'</div>';
  }
  return h+'</div>';
}

function qById(id){ for(var i=0;i<curQs.length;i++) if(curQs[i].id===id) return curQs[i]; return null; }

function renderSection(dir){
  dir=dir||0;
  curQs = buildQuestions(secIdx);
  var sec = SECTIONS[secIdx];
  secName.textContent = sec.name;
  stepCount.textContent = 'Раздел '+(secIdx+1)+' из 9 • вопросов: '+curQs.length;
  pfill.style.width = Math.round(secIdx/9*100)+'%';
  document.getElementById('ticks').innerHTML = SECTIONS.map(function(s,ix){
    return '<i class="'+(ix<secIdx?'done':ix===secIdx?'cur':'')+'"></i>';
  }).join('');
  btnNext.textContent = (secIdx===8)?'Завершить ✨':'Далее →';
  var h = '<div class="sechead"><div class="n">Раздел '+(secIdx+1)+' / 9</div><h2>'+esc(sec.name)+'</h2><p>'+esc(sec.desc)+'</p></div>';
  curQs.forEach(function(q){ h += blockHTML(q); });
  h += '<div style="height:8px"></div>';
  var st = stagewrap.scrollTop;
  stage.innerHTML = h;
  stagewrap.scrollTop = 0;
  if(dir!==0){ stage.classList.remove('in-r','in-l'); void stage.offsetWidth; stage.classList.add(dir>0?'in-r':'in-l'); }
  bindAll();
}

function bindAll(){
  /* карусель мини-тестов */
  stage.querySelectorAll('.sittest').forEach(function(box){
    var q=qById(box.getAttribute('data-g')); if(!q) return;
    if(!S.sittest) S.sittest={};
    sitPos=firstUnansweredSit();
    paintSit(box,q,0);
  });
  /* универсальные мини-карусели */
  stage.querySelectorAll('.minicar').forEach(function(box){
    var q=qById(box.getAttribute('data-c')); if(!q) return;
    box._pos=firstUnansweredCar(q);
    paintCar(box,q,0);
  });
  /* крутилка возраста */
  stage.querySelectorAll('.wheel').forEach(function(g){
    var q=qById(g.getAttribute('data-g')); if(!q) return;
    var ITEM=44, list=g.querySelector('.wheel-list');
    var items=list.querySelectorAll('.wheel-item');
    function select(i){
      i=Math.max(0,Math.min(items.length-1,i));
      items.forEach(function(el,k){ el.classList.toggle('sel',k===i); });
      var nv=String(AGE_MIN+i), ageChanged=(S.age!==nv), hadGrade=!!S.grade;
      S.age=nv; save();
      var box=document.getElementById('qb_'+q.id); if(box) box.classList.remove('err');
      if(ageChanged && autoByAge(hadGrade)){ var st=stagewrap.scrollTop; renderSection(0); stagewrap.scrollTop=st; }
    }
    var cur=S.age?(parseInt(S.age,10)-AGE_MIN):(16-AGE_MIN);
    if(isNaN(cur)) cur=16-AGE_MIN;
    try{ g.scrollTop=cur*ITEM; }catch(e){}
    select(cur);
    var t=null;
    g.addEventListener('scroll',function(){
      clearTimeout(t);
      t=setTimeout(function(){ select(Math.round(g.scrollTop/ITEM)); },90);
    });
    items.forEach(function(el){
      el.addEventListener('click',function(){
        var i=parseInt(el.getAttribute('data-i'),10);
        select(i);
        try{ if(g.scrollTo) g.scrollTo({top:i*ITEM,behavior:'smooth'}); else g.scrollTop=i*ITEM; }catch(e){ try{ g.scrollTop=i*ITEM; }catch(_){} }
      });
    });
  });
  /* текстовые поля */
  stage.querySelectorAll('[data-f]').forEach(function(el){
    el.addEventListener('input',function(){
      var q=qById(el.getAttribute('data-f')); if(!q) return;
      setVal(q.key, el.value); save();
      document.getElementById('qb_'+q.id).classList.remove('err');
    });
  });
  /* одиночный выбор */
  stage.querySelectorAll('.opts, .scale5').forEach(function(g){
    var q=qById(g.getAttribute('data-g')); if(!q) return;
    g.querySelectorAll('[data-v]').forEach(function(b){
      b.addEventListener('click',function(){
        g.querySelectorAll('[data-v]').forEach(function(x){ x.classList.remove('sel'); });
        b.classList.add('sel');
        var v=b.getAttribute('data-v');
        if(q.type==='scale') v=parseInt(v,10);
        if(q.type==='skillLevel') S.skillLevel[q.skill]=v;
        else if(q.type==='langLevel') S.langLevel[q.lang]=v;
        else setVal(q.key,v);
        save();
        document.getElementById('qb_'+q.id).classList.remove('err');
        if(q.restruct){ var st=stagewrap.scrollTop; renderSection(0); stagewrap.scrollTop=st; }
      });
    });
  });
  /* множественный выбор */
  stage.querySelectorAll('.chips').forEach(function(g){
    var q=qById(g.getAttribute('data-g')); if(!q) return;
    g.querySelectorAll('.chip').forEach(function(c){
      c.addEventListener('click',function(){
        var v=c.getAttribute('data-v'), arr=getVal(q.key)||[];
        if(has(arr,v)){ arr=arr.filter(function(x){ return x!==v; }); }
        else arr.push(v);
        setVal(q.key,arr); save();
        c.classList.toggle('sel');
        document.getElementById('qb_'+q.id).classList.remove('err');
        if(q.restruct){ var st=stagewrap.scrollTop; renderSection(0); stagewrap.scrollTop=st; }
      });
    });
  });
  /* своё значение */
  stage.querySelectorAll('[data-add]').forEach(function(btn){
    btn.addEventListener('click',function(){
      var q=qById(btn.getAttribute('data-add')); if(!q) return;
      var inp=stage.querySelector('[data-c="'+q.id+'"]'), v=inp.value.trim();
      if(!v) return;
      var arr=getVal(q.key)||[];
      if(!has(arr,v)){ arr.push(v); setVal(q.key,arr); save(); }
      renderSection(0);
    });
  });
  /* детали предмета */
  stage.querySelectorAll('.pills').forEach(function(g){
    var q=qById(g.getAttribute('data-g')); if(!q||!q.subject) return;
    var k=g.getAttribute('data-k');
    g.querySelectorAll('button').forEach(function(b){
      b.addEventListener('click',function(){
        g.querySelectorAll('button').forEach(function(x){ x.classList.remove('sel'); });
        b.classList.add('sel');
        if(!S.subj[q.subject]) S.subj[q.subject]={};
        var v=b.getAttribute('data-v');
        S.subj[q.subject][k]=(k==='like'||k==='ease')?parseInt(v,10):v;
        save();
        document.getElementById('qb_'+q.id).classList.remove('err');
      });
    });
  });
}

function firstUnansweredSit(){
  if(!S.sittest) S.sittest={};
  for(var i=0;i<SITTESTS.length;i++){ if(!S.sittest[i]) return i; }
  return SITTESTS.length-1;
}
function paintSit(box,q,dir){
  var t=SITTESTS[sitPos], ans=(S.sittest||{})[sitPos], i;
  var h='<div class="sit-top"><button class="sit-arrow" data-sa="-1">←</button><div class="sit-count">Тест '+(sitPos+1)+' из '+SITTESTS.length+'</div><button class="sit-arrow" data-sa="1">→</button></div>';
  h+='<div class="sit-q">'+esc(t.q)+'</div><div class="opts">'+t.o.map(function(o){
    return '<button class="opt'+(ans===o[1]?' sel':'')+'" data-v="'+o[1]+'"><span class="radio"></span><span>'+esc(o[0])+'</span></button>';
  }).join('')+'</div><div class="sit-dots">';
  for(i=0;i<SITTESTS.length;i++){ var a=(S.sittest||{})[i]; h+='<i class="'+(a?'done':i===sitPos?'cur':'')+'"></i>'; }
  h+='</div>';
  box.innerHTML=h;
  if(dir){ box.classList.remove('sit-r','sit-l'); void box.offsetWidth; box.classList.add(dir>0?'sit-r':'sit-l'); }
  box.querySelectorAll('[data-sa]').forEach(function(b){
    b.addEventListener('click',function(){
      var d=parseInt(b.getAttribute('data-sa'),10);
      sitPos=(sitPos+d+SITTESTS.length)%SITTESTS.length;
      paintSit(box,q,d);
    });
  });
  box.querySelectorAll('.opt').forEach(function(b){
    b.addEventListener('click',function(){
      if(!S.sittest) S.sittest={};
      S.sittest[sitPos]=b.getAttribute('data-v'); save();
      var qb=document.getElementById('qb_'+q.id); if(qb) qb.classList.remove('err');
      if(sitPos<SITTESTS.length-1){ sitPos++; paintSit(box,q,1); }
      else paintSit(box,q,0);
    });
  });
}

function firstUnansweredCar(q){
  for(var i=0;i<q.items.length;i++){ var v=getVal(q.items[i].key); if(v===''||v===undefined||v===null) return i; }
  return q.items.length-1;
}
function paintCar(box,q,dir){
  var pos=box._pos||0, it=q.items[pos], ans=getVal(it.key);
  var h='<div class="sit-top"><button class="sit-arrow" data-sa="-1">←</button><div class="sit-count">Вопрос '+(pos+1)+' из '+q.items.length+'</div><button class="sit-arrow" data-sa="1">→</button></div>';
  h+='<div class="sit-q">'+esc(it.title)+'</div>';
  if(it.type==='text'){
    h+='<input class="field" data-car-in value="'+esc(ans||'')+'" placeholder="'+esc(it.ph||'')+'">';
  } else {
    h+='<div class="opts">'+it.options.map(function(o){
      return '<button class="opt'+(ans===o.v?' sel':'')+'" data-v="'+esc(o.v)+'"><span class="radio"></span><span>'+esc(o.t)+'</span></button>';
    }).join('')+'</div>';
  }
  h+='<div class="sit-dots">';
  for(var i=0;i<q.items.length;i++){ var a=getVal(q.items[i].key); h+='<i class="'+((a!==''&&a!==undefined&&a!==null)?'done':i===pos?'cur':'')+'"></i>'; }
  h+='</div>';
  box.innerHTML=h;
  if(dir){ box.classList.remove('sit-r','sit-l'); void box.offsetWidth; box.classList.add(dir>0?'sit-r':'sit-l'); }
  box.querySelectorAll('[data-sa]').forEach(function(b){
    b.addEventListener('click',function(){
      var d=parseInt(b.getAttribute('data-sa'),10);
      box._pos=(pos+d+q.items.length)%q.items.length;
      paintCar(box,q,d);
    });
  });
  var inp=box.querySelector('[data-car-in]');
  if(inp) inp.addEventListener('input',function(){
    setVal(it.key,inp.value); save();
    var qb=document.getElementById('qb_'+q.id); if(qb) qb.classList.remove('err');
    paintDots(box,q);
  });
  box.querySelectorAll('.opt').forEach(function(b){
    b.addEventListener('click',function(){
      setVal(it.key,b.getAttribute('data-v')); save();
      var qb=document.getElementById('qb_'+q.id); if(qb) qb.classList.remove('err');
      if(it.trig){
        if(!(S.about.sport==='yes'||S.about.sport==='sometimes')) S.sportAch='';
        if(!(S.about.music==='yes'||S.about.music==='was')) S.musicDone='';
        if(S.about.clubs!=='yes') S.clubsWhich='';
        save();
        var st=stagewrap.scrollTop; renderSection(0); stagewrap.scrollTop=st; return;
      }
      if(pos<q.items.length-1){ box._pos=pos+1; paintCar(box,q,1); }
      else paintCar(box,q,0);
    });
  });
}
function paintDots(box,q){
  var dots=box.querySelector('.sit-dots'); if(!dots) return;
  var pos=box._pos||0, h='';
  for(var i=0;i<q.items.length;i++){ var a=getVal(q.items[i].key); h+='<i class="'+((a!==''&&a!==undefined&&a!==null)?'done':i===pos?'cur':'')+'"></i>'; }
  dots.innerHTML=h;
}

/* ================= Навигация ================= */
function animate(dir){ stage.classList.remove('in-r','in-l'); void stage.offsetWidth; stage.classList.add(dir>0?'in-r':'in-l'); }
function goNext(){
  var missing=[];
  curQs.forEach(function(q){ if(!q.optional && !isAnswered(q)) missing.push(q); });
  if(missing.length){
    var first=document.getElementById('qb_'+missing[0].id);
    curQs.forEach(function(q){ var el=document.getElementById('qb_'+q.id); if(el) el.classList.remove('err'); });
    missing.forEach(function(q){ var el=document.getElementById('qb_'+q.id); if(el) el.classList.add('err'); });
    if(first){ if(first.scrollIntoView) first.scrollIntoView({behavior:'smooth',block:'center'}); first.classList.remove('shake'); void first.offsetWidth; first.classList.add('shake'); }
    toast('Осталось ответить: '+missing.length);
    return;
  }
  if(secIdx>=8){ showLoading(); return; }
  secIdx++; save(); renderSection(1);
}
function goBack(){
  if(secIdx<=0){ showTab('main'); return; }
  secIdx--; save(); renderSection(-1);
}
document.getElementById('btnNext').addEventListener('click',goNext);
document.getElementById('btnBack').addEventListener('click',goBack);
document.getElementById('btnBack2').addEventListener('click',goBack);

