'use strict';
// Тиры тирлиста: нормализация + валидация 5/9/6 (зеркало js/ai-tier.js + js/plan.js).
const TIER_SPEC = { total: 20, DREAM: 5, TARGET: 9, SAFETY: 6 };

function normTier(t) {
  const s = String(t || '').toUpperCase().trim();
  if (s.indexOf('DREAM') !== -1 || s.indexOf('МЕЧТ') !== -1) return 'DREAM';
  if (s.indexOf('TARGET') !== -1 || s.indexOf('ЦЕЛ') !== -1) return 'TARGET';
  if (s.indexOf('SAFETY') !== -1 || s.indexOf('СТРАХ') !== -1 || s.indexOf('ЗАПАС') !== -1) return 'SAFETY';
  if (s === 'S' || s === 'D') return 'DREAM';
  if (s === 'A' || s === 'T') return 'TARGET';
  return 'SAFETY';
}

function dedupeTierList(list) {
  const seen = {};
  const res = [];
  (list || []).forEach(function (u) {
    const k = String(u.name || '').toLowerCase();
    if (!k || k === '—' || seen[k]) return;
    seen[k] = 1;
    res.push(u);
  });
  return res;
}

function validateTierList(list) {
  const errors = [];
  const arr = Array.isArray(list) ? list : [];
  const counts = { DREAM: 0, TARGET: 0, SAFETY: 0 };
  arr.forEach(function (u, i) {
    const t = normTier(u.tier);
    if (!counts.hasOwnProperty(t)) { errors.push('row ' + i + ': bad tier'); return; }
    counts[t]++;
    if (!u.name) errors.push('row ' + i + ': empty name');
    const m = parseInt(u.match, 10);
    if (!(m >= 0 && m <= 100)) errors.push('row ' + i + ': bad match');
  });
  if (arr.length !== TIER_SPEC.total) errors.push('total must be ' + TIER_SPEC.total + ', got ' + arr.length);
  Object.keys(counts).forEach(function (k) {
    if (counts[k] !== TIER_SPEC[k]) errors.push(k + ' must be ' + TIER_SPEC[k] + ', got ' + counts[k]);
  });
  const names = arr.map(function (u) { return String(u.name || '').toLowerCase(); });
  if (new Set(names).size !== names.length) errors.push('duplicate names');
  return { ok: errors.length === 0, errors: errors, counts: counts };
}

module.exports = { TIER_SPEC, normTier, dedupeTierList, validateTierList };
