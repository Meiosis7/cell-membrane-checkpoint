const assert=require('node:assert/strict'),C=require('../core.js');
const a={title:'动态测试班',cases:Array.from({length:9},(_,i)=>({...C.DAYS[0].cases[0],id:'R001-'+String(i+1).padStart(2,'0')})),unlocks:['lipid'],duration:247,energyStock:4};
let s={...C.newGame(),day:3,assignment:a,mode:'career',perks:{shield:2}};
assert.equal(C.dayInfo(s).title,'动态测试班');C.startDay(s);assert.equal(s.remaining,247);assert.equal(s.energy,4);assert(C.currentCase(s));
for(let i=0;i<9;i++){const c=C.currentCase(s);assert(c);C.decide(s,{approve:true,route:'lipid',port:'none',energy:0,scanned:true,measured:true});C.next(s)}
assert.equal(s.phase,'shiftEnd');assert.equal(s.processed,9);
s={...C.newGame(),day:3,assignment:a,mode:'career',perks:{shield:2}};C.startDay(s);let r=C.decide(s,{approve:false,scanned:true,measured:true});assert.equal(r.healthDelta,-18);assert.equal(s.health,82);
let t=C.newGame();C.startDay(t);t.perks={shield:3};assert.equal(C.decide(t,{approve:false,scanned:true,measured:true}).healthDelta,-22);
console.log('PASS dynamic assignment duration, energy, queue, completion and career-only shield');
let weak={...C.newGame(),mode:'career',day:3,assignment:{...a,minAccuracy:.75},perks:{shield:3}};C.startDay(weak);for(let i=0;i<9;i++){C.decide(weak,{approve:i<5,route:'lipid',port:'none',energy:0,scanned:true,measured:true});C.next(weak)}assert(weak.health>0);assert.equal(weak.phase,'lost');assert(weak.lossReason.includes('75%'));console.log('PASS surviving career with low accuracy still fails audit');
let budget={...C.newGame(),mode:'career',day:3,assignment:a};C.startDay(budget);let waste=C.decide(budget,{approve:true,route:'lipid',port:'none',energy:1,scanned:true,measured:true});assert.equal(waste.energyHeld,1);assert.equal(budget.energy,3);assert.equal(waste.energyCost,0);console.log('PASS career incorrect ATP assignment freezes one quota without claiming chemical consumption');
