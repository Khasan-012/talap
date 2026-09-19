'use strict';
// Фото вузов: инициалы + Wikipedia-резолвер (зеркало js/unis-photos.js без DOM).
const PHOTO_CACHE_KEY = 'talapUniPhotosV1';
const PHOTO_CACHE_MAX = 200;

function initialsFor(name) {
  const words = String(name || '').replace(/[«»"']/g, '').split(/[\s\-–—]+/).filter(Boolean);
  const t = words.slice(0, 2).map(function (w) { return w.charAt(0); }).join('').toUpperCase();
  return t || '🎓';
}

function hueFor(name) {
  const s = String(name || '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

function wikiTitlesFor(name) {
  const base = String(name || '').trim();
  if (!base) return [];
  const out = [base];
  const seen = {};
  seen[base.toLowerCase()] = 1;
  if (!/университет/i.test(base) && !/university/i.test(base) && !/institute/i.test(base)) {
    const v = base + ' University';
    if (!seen[v.toLowerCase()]) out.push(v);
  }
  return out.slice(0, 2);
}

function wikiApiURL(title) {
  return 'https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=pageimages&piprop=thumbnail&pithumbsize=960&formatversion=2&titles=' + encodeURIComponent(title);
}

function curatedMatch(name, entries) {
  const n = String(name || '').toLowerCase();
  for (const e of entries || []) {
    for (const k of e.k || []) {
      if (k && n.indexOf(String(k).toLowerCase()) !== -1) return e.u;
    }
  }
  return '';
}

module.exports = {
  PHOTO_CACHE_KEY, PHOTO_CACHE_MAX,
  initialsFor, hueFor, wikiTitlesFor, wikiApiURL, curatedMatch
};
