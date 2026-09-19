/* ================= Экраны ================= */
var vs=document.getElementById('view-survey'), vr=document.getElementById('view-result'), vl=document.getElementById('view-loading');
var vm2=document.getElementById('view-main'), vc2=document.getElementById('view-cal'), vsoon=document.getElementById('view-awards');
var tabbar=document.getElementById('tabbar');
function show(el){ [vs,vr,vl,vm2,vc2,vsoon].forEach(function(x){ x.hidden=(x!==el); }); tabbar.style.display=(el===vm2||el===vc2||el===vsoon)?'':'none'; }
function showTab(t){
  document.querySelectorAll('.tab').forEach(function(b){ b.classList.toggle('active',b.getAttribute('data-tab')===t); });
  if(t==='main'){ renderMain(); renderCal(); show(vm2); }
  else if(t==='cal'){ renderCal(); show(vc2); }
  else if(t==='awards'||t==='soon'){ renderAwards(); show(vsoon); }
  else if(t==='survey'){ show(vs); renderSection(0); }
}
document.querySelectorAll('.tab').forEach(function(b){
  b.addEventListener('click',function(){ showTab(b.getAttribute('data-tab')); });
});

/* ================= Loading screen ================= */
var EMBLEMS=[
  {t:'H',bg:'#A41034',c:'#ffffff'},
  {t:'MIT',bg:'#1a1a1a',c:'#ffffff',fs:10},
  {t:'S',bg:'#8C1515',c:'#ffffff'},
  {t:'O',bg:'#002147',c:'#ffffff'},
  {t:'C',bg:'#A3C1AD',c:'#0b3d2e'},
  {t:'Y',bg:'#00356B',c:'#ffffff'},
  {t:'P',bg:'#FF8F00',c:'#ffffff'},
  {t:'C',bg:'#B9D9EB',c:'#00356B'}
];
var RSTOPS=[['#FF9A44',0],['#FF5E8A',0.35],['#8B5CF6',0.7],['#00C2FF',1]];
function hx(h){ return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]; }
function ringColor(t){
  for(var i=0;i<RSTOPS.length-1;i++){
    var a=RSTOPS[i], b=RSTOPS[i+1];
    if(t>=a[1]&&t<=b[1]){ var k=(t-a[1])/((b[1]-a[1])||1), ca=hx(a[0]), cb=hx(b[0]);
      return 'rgb('+Math.round(ca[0]+(cb[0]-ca[0])*k)+','+Math.round(ca[1]+(cb[1]-ca[1])*k)+','+Math.round(ca[2]+(cb[2]-ca[2])*k)+')'; }
  }
  return RSTOPS[RSTOPS.length-1][0];
}
function buildRing(){
  var ring=document.getElementById('ring');
  ring.querySelectorAll('.dot,.emb').forEach(function(e){ e.remove(); });
  var N=60, DUR=2.6, ei=0;
  var embAt={}; EMBLEMS.forEach(function(u,k){ embAt[Math.round(k*N/EMBLEMS.length)]=u; });
  for(var i=0;i<N;i++){
    var a=i/N*Math.PI*2-Math.PI/2;
    var x=50+44*Math.cos(a), y=50+44*Math.sin(a);
    var delay=(i/N*DUR).toFixed(2)+'s';
    if(embAt[i]!==undefined){
      var u=embAt[i], d=document.createElement('div');
      d.className='emb'; d.textContent=u.t;
      d.style.left=x+'%'; d.style.top=y+'%';
      d.style.background=u.bg; d.style.color=u.c;
      if(u.fs) d.style.fontSize=u.fs+'px';
      d.style.animationDelay=delay;
      ring.appendChild(d);
    } else {
      var s=document.createElement('div');
      s.className='dot'; s.style.left=x+'%'; s.style.top=y+'%';
      s.style.background=ringColor((Math.sin(a)+1)/2);
      s.style.animationDelay=delay;
      ring.appendChild(s);
    }
  }
}
var loadTimer=null, loadSubTimer=null;
function showLoading(){
  show(vl);
  buildRing();
  var subs=['Читаем твои ответы…','Спрашиваем ИИ…','Считаем совпадения…','Подбираем университеты…'], si=0;
  var subEl=document.getElementById('loadSub'); subEl.textContent=subs[0];
  clearInterval(loadSubTimer);
  loadSubTimer=setInterval(function(){ si=(si+1)%subs.length; subEl.textContent=subs[si]; },1100);
  clearTimeout(loadTimer);
  AI_UNIS=null; AI_ERR=null;
  var t0=Date.now(), settled=false;
  function done(){
    if(settled) return; settled=true;
    clearInterval(loadSubTimer);
    var wait=Math.max(0,3200-(Date.now()-t0));
    loadTimer=setTimeout(finish,wait);
  }
  try{
    var timeoutP=new Promise(function(_,rej){ setTimeout(function(){ rej(new Error('timeout')); },30000); });
    Promise.race([fetchTierList(),timeoutP]).then(function(list){
      AI_UNIS=list;
      try{ localStorage.setItem((typeof LS_TIER !== 'undefined' ? LS_TIER : 'talapTier'),JSON.stringify(list)); }catch(e){}
      done();
    }).catch(function(e){ AI_ERR=String(e&&e.message||e); done(); });
  }catch(e){ AI_ERR=String(e); done(); }
}

