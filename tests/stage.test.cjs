const assert=require('node:assert/strict');
const S=require('../stage.js');
const C=require('../core.js');
let n=0;function test(name,fn){fn();console.log('PASS',name);n++}
const all=C.DAYS.flatMap(d=>d.cases);
test('all cargos have species-specific performance identities',()=>{for(const c of all)assert(S.identify(c));assert.equal(new Set(all.map(S.identify)).size,8)});
test('transport plans follow actual route and direction',()=>{for(const c of all.filter(c=>c.allowed)){const p=S.plan(c,true,{correct:true});assert.equal(p.outcome,'transport');assert.equal(p.mechanism,c.route);assert.equal(p.direction,c.direction);assert(p.steps.length>=3);assert(p.duration>=2000&&p.duration<=6500)}});
test('water glucose and sodium have distinct mechanisms',()=>{const ids=['水','葡萄糖','钠离子'];const p=ids.map(name=>S.plan(all.find(c=>c.name===name&&c.allowed),true,{correct:true}));assert.equal(new Set(p.map(x=>x.id)).size,3);assert(p[0].steps.some(x=>x.includes('单列')));assert(p[1].steps.some(x=>x.includes('构象')));assert(p[2].steps.some(x=>x.includes('筛选')))});
test('pump preserves 3Na outward 2K inward and one ATP',()=>{const p=S.plan(all.find(c=>c.route==='pump'),true,{correct:true});assert.deepEqual(p.exchange,[{ion:'Na⁺',count:3,direction:'out'},{ion:'K⁺',count:2,direction:'in'}]);assert.equal(p.atp,1)});
test('forged or impossible approval does not animate physical success',()=>{for(const c of all.filter(c=>!c.allowed)){const p=S.plan(c,true,{correct:false});assert.equal(p.outcome,'blocked');assert.equal(p.crosses,false)}});
test('denied cargo retreats instead of passing the membrane',()=>{for(const c of all){const p=S.plan(c,false,{correct:!c.allowed});assert.equal(p.outcome,'return');assert.equal(p.crosses,false)}});
console.log(n+' scene-plan tests passed');
