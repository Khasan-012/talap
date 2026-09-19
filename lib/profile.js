'use strict';
// Компактный профиль для промптов (зеркало compactProfileText из js/ai-tier.js).
// Принимает состояние явно, чтобы тестироваться без браузерных глобалов.
const PROFILE_BUDGETS = { tier: 4000, detail: 2500, plan: 3000, assess: 2000, contests: 2000 };

function clipText(s, max) {
  s = String(s == null ? '' : s);
  if (s.length <= max) return s;
  return s.slice(0, Math.max(0, max - 1)).trim() + '…';
}

function compactProfileTextPure(S, scoreTop3, budget) {
  S = S || {};
  budget = budget || 3000;
  const L = [];
  function r(t, v) { if (v && (v.length || typeof v === 'number')) L.push(t + ': ' + (Array.isArray(v) ? v.join(', ') : v)); }
  r('Имя', S.name); r('Возраст', S.age); r('Класс', S.grade); r('Поступление', S.admitYear);
  r('Страна учёбы', (S.studyCountry === 'kz' ? 'Казахстан' : S.studyCountry === 'abroad' ? 'заграница' : 'не решил') + (S.studyCountryWhich ? ' (' + S.studyCountryWhich + ')' : ''));
  r('Грант', S.grant); r('Переезд', S.relocate);
  r('Профессия/мечта', clipText(S.professionText || S.dreamJob || '', 120));
  if (S.considerJobs && S.considerJobs.length) L.push('Рассматривает: ' + S.considerJobs.slice(0, 5).join(', '));
  if (S.interests && S.interests.length) L.push('Интересы: ' + S.interests.slice(0, 12).join(', '));
  const tc = { tech: 0, sci: 0, biz: 0, art: 0 };
  Object.keys(S.sittest || {}).forEach(function (k) { const t = S.sittest[k]; if (tc[t] !== undefined) tc[t]++; });
  L.push('Тесты: tech ' + tc.tech + ', sci ' + tc.sci + ', biz ' + tc.biz + ', art ' + tc.art);
  if (scoreTop3 && scoreTop3.length) L.push('Скоринг: ' + scoreTop3.slice(0, 3).join(', '));
  const lvlMap = { new: 'нач', base: 'база', mid: 'сред', pro: 'прод' };
  if (S.skills && S.skills.length) L.push('Навыки: ' + S.skills.slice(0, 10).map(function (s) { return s + '(' + (lvlMap[(S.skillLevel || {})[s]] || '?') + ')'; }).join(', '));
  if (S.progLangs && S.progLangs.length) L.push('Код: ' + S.progLangs.slice(0, 7).join(', ') + (S.progExp ? ', стаж ' + S.progExp : ''));
  const subs = Object.keys(S.subj || {}).map(function (s) {
    const d = S.subj[s] || {};
    return { s: s, like: +d.like || 0, grade: String(d.grade || ''), deep: d.deep };
  }).filter(function (x) { return x.like >= 4 || x.deep === 'yes' || x.grade === '5'; })
    .map(function (x) { return x.s + '(оц' + x.grade + ',♥' + x.like + (x.deep === 'yes' ? ',глубже' : '') + ')'; });
  if (subs.length) L.push('Предметы: ' + subs.slice(0, 8).join('; '));
  if (S.langs && S.langs.length) {
    const lm = { a: 'A1-A2', b1: 'B1', b2: 'B2', c: 'C1+' };
    L.push('Языки: ' + S.langs.slice(0, 6).map(function (l) { return l + '(' + (lm[(S.langLevel || {})[l]] || '?') + ')'; }).join(', '));
  }
  const c = S.career || {};
  L.push('Карьера: KZ=' + (c.kz || '?') + ', abroad=' + (c.abroad || '?') + ', biz=' + (c.business || '?') + ', sci=' + (c.science || '?'));
  if (S.myAwards && S.myAwards.length) {
    L.push('Портфолио: ' + S.myAwards.slice(0, 3).map(function (a) {
      return '[' + (a.sphere || '?') + '] ' + clipText(a.title || '', 60) + ' — ' + clipText(a.result || '', 40);
    }).join(' | '));
  } else if (S.achievements && S.achievements.length) {
    L.push('Достижения: ' + S.achievements.slice(0, 6).join(', '));
  }
  r('Главное', clipText(S.achDetail || '', 200));
  r('О себе', clipText(S.freeText || '', 250));
  if (S.hobbies && S.hobbies.length) L.push('Хобби: ' + S.hobbies.slice(0, 6).join(', '));
  let out = L.join('\n');
  if (out.length > budget) out = out.slice(0, budget - 1).trim() + '…';
  return out;
}

module.exports = { PROFILE_BUDGETS, clipText, compactProfileTextPure };
