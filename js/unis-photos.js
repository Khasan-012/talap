/* ================= Фото университетов =================
   ИИ сам подбирает ЛЮБЫЕ вузы, поэтому фото нельзя ограничивать
   хардкодом: curated-список — лишь быстрый путь, дальше фото
   догружается через Wikipedia API, а пока грузится — инициалы
   вуза на градиенте вместо пустого плейсхолдера. */
var UNI_FALLBACK = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a9/Colorful_chairs_in_Harvard_Yard.JPG/960px-Colorful_chairs_in_Harvard_Yard.JPG';
var UNI_PHOTOS = [
  {k:['harvard','гарвард'],u:'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a9/Colorful_chairs_in_Harvard_Yard.JPG/960px-Colorful_chairs_in_Harvard_Yard.JPG'},
  {k:['mit','массачусетс'],u:'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bc/Great_dome_of_MIT%2C_Feb_2021.jpg/960px-Great_dome_of_MIT%2C_Feb_2021.jpg'},
  {k:['stanford','стенфорд'],u:'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bc/Stanford_Memorial_Church_October_2019_HDR.jpg/960px-Stanford_Memorial_Church_October_2019_HDR.jpg'},
  {k:['oxford','оксфорд'],u:'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b2/Radcliffe_Camera_Oxford_2018_03.jpg/960px-Radcliffe_Camera_Oxford_2018_03.jpg'},
  {k:['cambridge','кембридж'],u:'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c3/20130215_Kings_College_Chapel_Hi-res_01.jpg/960px-20130215_Kings_College_Chapel_Hi-res_01.jpg'},
  {k:['yale','йель','ейл'],u:'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ee/Sterling_Memorial_Library_seen_from_the_front%2C_Yale_University%2C_New_Haven%2C_Connecticut.jpg/960px-Sterling_Memorial_Library_seen_from_the_front%2C_Yale_University%2C_New_Haven%2C_Connecticut.jpg'},
  {k:['princeton','принстон'],u:'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/04/Nassau_Hall_Princeton.JPG/960px-Nassau_Hall_Princeton.JPG'},
  {k:['columbia','колумби'],u:'https://thumb.wikimedia.org/wikipedia/commons/thumb/0/07/Low_Memorial_Library_Columbia_University_NYC_retouched.jpg/960px-Low_Memorial_Library_Columbia_University_NYC_retouched.jpg'},
  {k:['nazarbayev','назарбаев'],u:'https://thumb.wikimedia.org/wikipedia/en/thumb/c/ca/NU_Building.jpg/960px-NU_Building.jpg'},
  {k:['kbtu','кбту','british technical','британ'],u:'https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b8/Kazakh-British_Technical_University%2C_Almaty_%28P1180218%29.jpg/960px-Kazakh-British_Technical_University%2C_Almaty_%28P1180218%29.jpg'},
  {k:['iitu','муит','information technology university','информационных технологий'],u:'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/65/International_Information_Technology_University_in_Almaty.jpg/960px-International_Information_Technology_University_in_Almaty.jpg'},
  {k:['sdu','сду','demirel','демирель','сулейман'],u:'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9a/SDU_Station_02.jpg/960px-SDU_Station_02.jpg'},
  {k:['kaznu','казну','al-farabi','аль-фараби'],u:'https://upload.wikimedia.org/wikipedia/commons/c/c9/Main_building_of_KazNU.jpg'},
  {k:['satbayev','satpaev','сатбаев','сатпаев'],u:'https://upload.wikimedia.org/wikipedia/commons/6/6d/Satbayev_University.jpg'}
];
var UNI_PHOTO_CACHE_KEY = 'talapUniPhotosV1';
var UNI_PHOTO_CACHE_MAX = 200;
function uniPhotoCurated(name){
  var n=String(name||'').toLowerCase();
  for(var i=0;i<UNI_PHOTOS.length;i++){ var e=UNI_PHOTOS[i];
    for(var j=0;j<e.k.length;j++) if(n.indexOf(e.k[j])!==-1) return e.u; }
  return '';
}
function uniPhoto(name){
  var hit = uniPhotoCurated(name);
  if(hit) return hit;
  try{
    var cache = JSON.parse(localStorage.getItem(UNI_PHOTO_CACHE_KEY) || '{}');
    var url = cache[String(name || '').toLowerCase()];
    if(url) return url;
  }catch(e){}
  return '';
}
function initialsFor(name){
  var words = String(name || '').replace(/[«»"']/g, '').split(/[\s\-–—]+/).filter(Boolean);
  var t = words.slice(0, 2).map(function(w){ return w.charAt(0); }).join('').toUpperCase();
  return t || '🎓';
}
function hueFor(name){
  var s = String(name || ''), h = 0;
  for(var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}
function uniNoImgHTML(name){
  var ini = initialsFor(name), hue = hueFor(name);
  return '<div class="uni-noimg uni-initials" style="background:linear-gradient(135deg,hsl(' + hue + ',55%,32%),hsl(' + ((hue + 60) % 360) + ',60%,22%))"><span>' + esc(ini) + '</span></div>';
}
function wikiTitlesFor(name){
  var base = String(name || '').trim();
  if(!base) return [];
  var out = [base], seen = {};
  seen[base.toLowerCase()] = 1;
  [[' University', ''], [' university', '']].forEach(function(){});
  if(/университет/i.test(base) || /university/i.test(base) || /institute/i.test(base) || /enu|kimep|aitu|kbtu|iitu|kaznu|сду|sdu|ну\b/i.test(base)){
    if(!seen[(base).toLowerCase()]){ out.push(base); seen[base.toLowerCase()] = 1; }
  } else {
    var v = base + ' University';
    if(!seen[v.toLowerCase()]) out.push(v);
  }
  return out.slice(0, 2);
}
function wikiApiURL(title){
  return 'https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=pageimages&piprop=thumbnail&pithumbsize=960&formatversion=2&titles=' + encodeURIComponent(title);
}
function wikiPhotoForTitle(title){
  return fetch(wikiApiURL(title)).then(function(r){
    if(!r.ok) throw new Error('wiki http ' + r.status);
    return r.json();
  }).then(function(j){
    var pages = (j && j.query && j.query.pages) || [];
    for(var i = 0; i < pages.length; i++){
      var th = pages[i] && pages[i].thumbnail && pages[i].thumbnail.source;
      if(th) return th;
    }
    throw new Error('no image');
  });
}
function rememberUniPhoto(name, url){
  try{
    var key = String(name || '').toLowerCase();
    if(!key || !url) return;
    var cache = {};
    try{ cache = JSON.parse(localStorage.getItem(UNI_PHOTO_CACHE_KEY) || '{}'); }catch(e){ cache = {}; }
    if(cache[key] === url) return;
    cache[key] = url;
    var keys = Object.keys(cache);
    if(keys.length > UNI_PHOTO_CACHE_MAX){
      var drop = keys.slice(0, keys.length - UNI_PHOTO_CACHE_MAX);
      drop.forEach(function(k){ delete cache[k]; });
    }
    localStorage.setItem(UNI_PHOTO_CACHE_KEY, JSON.stringify(cache));
  }catch(e){}
}
var UNI_PHOTO_INFLIGHT = {};
function resolveUniPhoto(name){
  var known = uniPhoto(name);
  if(known) return Promise.resolve(known);
  var key = String(name || '').toLowerCase();
  if(!key) return Promise.reject(new Error('empty'));
  if(UNI_PHOTO_INFLIGHT[key]) return UNI_PHOTO_INFLIGHT[key];
  var titles = wikiTitlesFor(name);
  var p = titles.reduce(function(acc, t){
    return acc.catch(function(){ return wikiPhotoForTitle(t); });
  }, Promise.reject(new Error('start'))).then(function(url){
    rememberUniPhoto(name, url);
    return url;
  });
  UNI_PHOTO_INFLIGHT[key] = p;
  p.then(function(){ delete UNI_PHOTO_INFLIGHT[key]; }, function(){ delete UNI_PHOTO_INFLIGHT[key]; });
  return p;
}
function paintImgInto(box, url, alt){
  if(!box || !url) return;
  var img = box.querySelector('img[data-wiki]');
  if(img){
    img.src = url;
    img.removeAttribute('data-wiki');
    return;
  }
  var tmp = document.createElement('img');
  tmp.src = url; tmp.alt = alt || ''; tmp.loading = 'lazy';
  tmp.onerror = function(){ tmp.remove(); };
  var behind = box.querySelector('.uni-noimg');
  if(behind && behind.parentNode === box) box.insertBefore(tmp, behind.nextSibling);
  else box.appendChild(tmp);
}
function upgradeUniPhotos(root){
  var scope = root || document;
  var imgs = scope.querySelectorAll ? scope.querySelectorAll('img[data-wiki]') : [];
  Array.prototype.forEach.call(imgs, function(img){
    var name = img.getAttribute('data-wiki');
    if(!name) return;
    resolveUniPhoto(name).then(function(url){
      if(!document.body.contains(img)) return;
      img.src = url;
      img.removeAttribute('data-wiki');
    }).catch(function(){});
  });
}
function uniCardPhotoHTML(name){
  var url = uniPhoto(name);
  if(url) return '<div class="uniphoto">' + uniNoImgHTML(name) + '<img src="' + url + '" alt="' + esc(name) + '" loading="lazy" onerror="this.remove()"></div>';
  return '<div class="uniphoto">' + uniNoImgHTML(name) + '<img data-wiki="' + esc(name) + '" alt="' + esc(name) + '" loading="lazy" style="display:none" onload="this.style.display=\'\'" onerror="this.remove()"></div>';
}
function uniTopPhotoHTML(name){
  var url = uniPhoto(name);
  if(url) return '<div class="uphoto">' + uniNoImgHTML(name) + '<img src="' + url + '" alt="" onerror="this.remove()"><button class="uclose" id="uclose">✕</button></div>';
  return '<div class="uphoto">' + uniNoImgHTML(name) + '<img data-wiki="' + esc(name) + '" alt="" style="display:none" onload="this.style.display=\'\'" onerror="this.remove()"><button class="uclose" id="uclose">✕</button></div>';
}
