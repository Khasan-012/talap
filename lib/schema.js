'use strict';
// Чистая логика версионирования хранилища (зеркало js/config.js).
// Браузерные save/load работают с localStorage, здесь — только правила,
// чтобы их можно было тестировать в Node.
const SCHEMA_VERSION = 2;
const LS = 'talapSurveyV2';
const LS_PREV = ['talapSurveyV1', 'locusSurveyV2', 'locusSurveyV1'];
const LS_TIER = 'talapTier';
const LS_TIER_OLD = ['locusTier'];

function blankState() {
  return {
    chosenUni: null, chosenUnis: [], allPlans: {}, allChecks: {},
    plan: null, planChecks: {}, myAwards: [],
    cal: null, collapsed: {}
  };
}

// Правила migrateState() из фронта, без DOM.
function migrateStatePure(state) {
  const S = state;
  if (!S.chosenUnis) S.chosenUnis = [];
  if (!S.allPlans) S.allPlans = {};
  if (!S.allChecks) S.allChecks = {};
  if (S.chosenUni && !S.chosenUnis.length) S.chosenUnis = [S.chosenUni];
  if (S.chosenUnis.length && !S.chosenUni) S.chosenUni = S.chosenUnis[0];
  if (S.plan && ((S.plan.steps || S.plan.uni) && !S.plan.unis)) { S.plan = null; S.planChecks = {}; }
  if (S.plan && S.plan.v !== 2) { S.plan = null; S.planChecks = {}; }
  if (!S.planChecks || typeof S.planChecks !== 'object') S.planChecks = {};
  if (!S.cal || typeof S.cal !== 'object') S.cal = { level: 'years', y: null, m: null };
  return S;
}

function migrateStateFromPure(state, ver) {
  migrateStatePure(state);
  if ((ver || 1) < 2) {
    if (!state.collapsed || typeof state.collapsed !== 'object') state.collapsed = {};
    if (state.plan && state.plan.monthPlans && !state.plan.dayGoals) state.plan.dayGoals = {};
    if (state.plan && state.plan.monthPlans && !state.plan.dayChecks) state.plan.dayChecks = {};
  }
  return state;
}

function detectVersion(doc) {
  if (!doc || typeof doc !== 'object') return 0;
  return doc.v || 1;
}

module.exports = {
  SCHEMA_VERSION, LS, LS_PREV, LS_TIER, LS_TIER_OLD,
  blankState, migrateStatePure, migrateStateFromPure, detectVersion
};
