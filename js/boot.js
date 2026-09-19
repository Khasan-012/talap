/* ================= Старт: главная ================= */
secIdx = load();
try{ var _tierKey=(typeof LS_TIER!=='undefined'?LS_TIER:'talapTier'); var savedTier=JSON.parse(localStorage.getItem(_tierKey)||localStorage.getItem('locusTier')); if(savedTier&&savedTier.length>=10){ AI_UNIS=savedTier; try{ localStorage.setItem(_tierKey,JSON.stringify(savedTier)); localStorage.removeItem('locusTier'); }catch(e){} } }catch(e){}
var hadData = !!(S.name||S.age||(S.interests&&S.interests.length)||secIdx>0||S.done);
if(hadData){ showTab('main'); setTimeout(function(){ toast('Прогресс восстановлен ✓'); },600); }
else { showTab('survey'); }

