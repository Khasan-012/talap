/* ================= Приветствие: только первый вход ================= */
var LS_SEEN = 'talapSeenIntroV1';
function seenIntro(){ try { return !!localStorage.getItem(LS_SEEN); } catch(e){ return false; } }
function markSeen(){ try { localStorage.setItem(LS_SEEN, '1'); } catch(e){} }
document.getElementById('btnStart').addEventListener('click', function(){
  markSeen();
  stopGlobe();
  secIdx = 0; save();
  showTab('survey');
});

/* Земля из точек с материками: сфера Фибоначчи + маска суши, вращение вокруг оси */
var _globeRAF = null;

/* Упрощённые полигоны материков в [lon, lat] */
var LAND_POLYS = [
  /* Северная Америка */
  [[-168,66],[-158,71],[-140,70],[-125,72],[-110,73],[-95,72],[-85,70],[-75,72],[-65,62],[-60,55],[-55,47],[-65,45],[-70,44],[-74,40],[-76,35],[-80,32],[-81,26],[-84,30],[-90,29],[-97,28],[-97,22],[-94,18],[-87,15],[-83,10],[-90,15],[-97,16],[-105,20],[-110,24],[-115,30],[-125,40],[-130,48],[-140,60],[-150,60],[-160,58]],
  /* Южная Америка */
  [[-78,7],[-70,10],[-60,8],[-50,0],[-40,-3],[-35,-8],[-40,-15],[-45,-25],[-50,-35],[-55,-45],[-60,-52],[-65,-55],[-70,-50],[-73,-40],[-73,-30],[-75,-20],[-79,-10],[-81,-2]],
  /* Гренландия */
  [[-55,60],[-45,60],[-35,65],[-30,70],[-35,75],[-50,78],[-60,76],[-58,68]],
  /* Евразия */
  [[-9,36],[-9,43],[-2,48],[0,50],[5,53],[8,57],[18,60],[25,68],[35,68],[50,68],[70,70],[90,72],[110,73],[130,71],[150,70],[170,67],[178,65],[170,60],[162,58],[158,52],[142,45],[135,35],[128,34],[122,30],[120,22],[110,15],[105,8],[100,8],[95,15],[90,22],[85,20],[80,8],[75,12],[70,22],[60,25],[55,27],[50,30],[45,35],[35,36],[28,38],[20,38],[12,38],[0,35]],
  /* Африка */
  [[-17,15],[-10,30],[-5,35],[10,35],[20,32],[32,31],[40,28],[43,12],[50,10],[48,0],[42,-10],[38,-20],[35,-28],[28,-33],[20,-35],[15,-28],[12,-18],[10,-5],[5,5],[-5,5],[-12,10]],
  /* Австралия */
  [[113,-22],[115,-15],[122,-14],[132,-12],[137,-12],[142,-11],[146,-15],[150,-22],[153,-27],[150,-32],[145,-38],[138,-35],[132,-32],[124,-33],[115,-33],[112,-26]]
];
/* Острова как круги [lon, lat, радиус] */
var LAND_ISLANDS = [
  [-3,54,4],[-8,53,2],[138,37,4],[140,-5,4],[114,0,4],[102,0,3],
  [47,-19,3],[172,-42,3],[-20,64,2],[20,70,2],[45,43,2]
];

function _inPoly(lon, lat, poly){
  var inside = false, j = poly.length - 1;
  for(var i = 0; i < poly.length; i++){
    var xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if(((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) inside = !inside;
    j = i;
  }
  return inside;
}
function _isLandRaw(lat, lon){
  var i, dLon, dLat, d;
  for(i = 0; i < LAND_ISLANDS.length; i++){
    dLon = lon - LAND_ISLANDS[i][0]; dLat = lat - LAND_ISLANDS[i][1];
    d = Math.sqrt(dLon * dLon + dLat * dLat);
    if(d <= LAND_ISLANDS[i][2]) return true;
  }
  for(i = 0; i < LAND_POLYS.length; i++){
    if(_inPoly(lon, lat, LAND_POLYS[i])) return true;
  }
  return false;
}
/* Предрасчёт маски 360x180 (1 градус), чтобы не гонять полигоны каждый кадр */
var _landMask = null;
function _buildLandMask(){
  if(_landMask) return _landMask;
  _landMask = new Uint8Array(360 * 180);
  for(var la = -90; la < 90; la++){
    for(var lo = -180; lo < 180; lo++){
      var idx = (la + 90) * 360 + (lo + 180);
      _landMask[idx] = _isLandRaw(la + 0.5, lo + 0.5) ? 1 : 0;
    }
  }
  return _landMask;
}
function _isLandFast(latDeg, lonDeg){
  var la = Math.max(-90, Math.min(89, Math.floor(latDeg)));
  var lo = Math.floor(lonDeg);
  if(lo < -180) lo += 360; if(lo >= 180) lo -= 360;
  return _landMask[(la + 90) * 360 + (lo + 180)] === 1;
}

function startGlobe(){
  var cv = document.getElementById('globe');
  if(!cv || _globeRAF) return;
  var ctx = cv.getContext('2d');
  _buildLandMask();
  var N = 4200, pts = [], GA = Math.PI * (3 - Math.sqrt(5));
  for(var i = 0; i < N; i++){
    var y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = GA * i;
    pts.push([Math.cos(th) * r, y, Math.sin(th) * r]);
  }
  var tilt = 0.41, rot = 0;
  function size(){
    var w = cv.clientWidth || 300, h = cv.clientHeight || 300, dpr = 1;
    try { dpr = Math.min(2, window.devicePixelRatio || 1); } catch(e){}
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    return { w: w, h: h, dpr: dpr };
  }
  var g = size();
  var RAD = 180 / Math.PI;
  function frame(){
    var vw = document.getElementById('view-welcome');
    if(!vw || vw.hidden){ _globeRAF = null; return; }
    if(cv.clientWidth !== g.w || cv.clientHeight !== g.h) g = size();
    ctx.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
    ctx.clearRect(0, 0, g.w, g.h);
    var cx = g.w / 2, cy = g.h / 2, R = Math.min(g.w, g.h) * 0.46;
    var cosT = Math.cos(tilt), sinT = Math.sin(tilt);
    var cosR = Math.cos(rot), sinR = Math.sin(rot);
    /* линии: параллели */
    ctx.strokeStyle = 'rgba(255,255,255,.10)'; ctx.lineWidth = 1;
    [-0.6, -0.3, 0, 0.3, 0.6].forEach(function(k){
      var rr = Math.sqrt(Math.max(0, 1 - k * k));
      ctx.beginPath();
      ctx.ellipse(cx, cy + k * R * cosT, R * rr, R * rr * sinT, 0, 0, Math.PI * 2);
      ctx.stroke();
    });
    /* линии: меридианы (крутятся вместе с точками) */
    for(var m = 0; m < 6; m++){
      var a = rot + m * Math.PI / 6, rx = R * Math.abs(Math.cos(a));
      if(rx < 1.5) continue;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, R, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    /* точки: суша — ярко, океан — едва видно */
    for(var j = 0; j < pts.length; j++){
      var p = pts[j];
      var x1 = p[0] * cosR + p[2] * sinR;
      var z1 = -p[0] * sinR + p[2] * cosR;
      var yy = p[1];
      var lat = Math.asin(Math.max(-1, Math.min(1, yy))) * RAD;
      var lon = Math.atan2(z1, x1) * RAD;
      var land = _isLandFast(lat, lon);
      var y1 = yy * cosT - z1 * sinT;
      var z2 = yy * sinT + z1 * cosT;
      if(z2 < -0.15) continue;
      var depth = (z2 + 0.15) / 1.15;
      var sx = cx + x1 * R, sy = cy - y1 * R;
      if(land){
        ctx.fillStyle = 'rgba(255,255,255,' + (0.25 + depth * 0.75).toFixed(2) + ')';
        var s = 0.8 + depth * 1.8;
        ctx.fillRect(sx, sy, s, s);
      } else {
        ctx.fillStyle = 'rgba(120,180,255,' + (0.03 + depth * 0.06).toFixed(2) + ')';
        ctx.fillRect(sx, sy, 1, 1);
      }
    }
    rot += 0.004;
    _globeRAF = requestAnimationFrame(frame);
  }
  _globeRAF = requestAnimationFrame(frame);
}
function stopGlobe(){
  if(_globeRAF){ try { cancelAnimationFrame(_globeRAF); } catch(e){} _globeRAF = null; }
}
try { startGlobe(); } catch(e){}
window.addEventListener('resize', function(){ _globeRAF = null; startGlobe(); });
