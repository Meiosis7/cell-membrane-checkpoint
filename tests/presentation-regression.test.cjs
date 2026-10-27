const assert=require('node:assert/strict'),C=require('../core.js'),S=require('../stage.js');
global.MembraneCareer=require('../career.js');require('../office.js');
const co2={...C.DAYS[0].cases[1],identityMismatch:true,declared:'水'};
assert(S.inspectionNarrative(co2).includes('二氧化碳'));assert(!S.inspectionNarrative(co2).includes('钠离子'));
const p=MembraneCareer.newProfile(),s=MembraneCareer.newRun(p,1);s.phase='lost';s.lossReason='本班时间耗尽。';s.history=[];
const html=MembraneOffice.debrief(s,p,{total:0});assert(!html.includes('全检无误 · 班次封存'));assert(html.includes('班次未完成'));
console.log('PASS fake identity narration uses actual cargo and failed incomplete duty has no clean-shift badge');
