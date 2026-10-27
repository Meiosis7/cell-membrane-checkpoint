/* Original educational transport simulation. No remote dependencies. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.MembraneCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const ROUTES=[
{id:'lipid',name:'脂质双层',short:'自由通行',description:'简单扩散 · 顺浓度梯度 · 不直接耗 ATP',portOptions:[{id:'none',name:'无蛋白 · 直接跨膜'}]},
{id:'channel',name:'通道蛋白',short:'选择性孔道',description:'协助扩散 · 顺电化学／水势梯度 · 不直接耗 ATP',portOptions:[{id:'aqp',name:'AQP 水通道'},{id:'na',name:'Na⁺ 选择性通道'}]},
{id:'carrier',name:'载体蛋白',short:'结合后转运',description:'本台为 GLUT · 协助扩散 · 顺葡萄糖浓度梯度',portOptions:[{id:'glut',name:'GLUT 葡萄糖载体'}]},
{id:'pump',name:'钠钾泵',short:'主动运输',description:'1 ATP／完整循环 · 3 Na⁺ 出、2 K⁺ 入',portOptions:[{id:'nak',name:'Na⁺/K⁺-ATP 酶'}]}
];
const base={size:'小分子',charge:'不带电',affinity:'低',direction:'in',outside:'—',inside:'—',gradient:'—',scan:'身份与证件相符',note:'按本班许可证办理净运输。',allowed:true,route:'lipid',port:'none',energy:0,identityMismatch:false};
function cargo(id,props){return Object.assign({},base,{id},props)}
const o2=(id,props)=>cargo(id,Object.assign({declared:'氧气',name:'氧气',formula:'O₂',color:'#c89b6c',size:'32 Da',affinity:'非极性 · 易跨脂质',outside:'8 相对单位',inside:'2 相对单位',gradient:'净驱动力：膜外 → 膜内',scan:'O₂ · 非极性气体 · 无夹带',reason:'氧气是不带电的小型非极性分子，可沿自身浓度梯度直接穿过脂质双层。'},props));
const glucose=(id,props)=>cargo(id,Object.assign({declared:'葡萄糖',name:'葡萄糖',formula:'C₆H₁₂O₆',color:'#d3b762',size:'180 Da',affinity:'亲水 · 多羟基',outside:'8 mmol/L',inside:'2 mmol/L',gradient:'净驱动力：膜外 → 膜内',scan:'葡萄糖 · 无电荷但高度亲水',route:'carrier',port:'glut',reason:'葡萄糖借助 GLUT 结合并转运，沿葡萄糖浓度梯度协助扩散，不直接消耗 ATP。'},props));
const sodium=(id,props)=>cargo(id,Object.assign({declared:'钠离子',name:'钠离子',formula:'Na⁺',color:'#d49e64',size:'23 Da（离子）',charge:'+1',affinity:'带电 · 排斥脂质核心',outside:'145 mmol/L',inside:'12 mmol/L',gradient:'膜内 −70 mV；Na⁺ 电化学净驱动力：向内',scan:'Na⁺ · 水合阳离子 · 无夹带',route:'channel',port:'na',reason:'此处 Na⁺ 的浓度差与电势差均推动其入胞；开放的 Na⁺ 选择性通道允许它协助扩散，不直接耗 ATP。'},props));
const water=(id,props)=>cargo(id,Object.assign({declared:'水',name:'水',formula:'H₂O',color:'#9ec7c0',size:'18 Da',affinity:'极性',outside:'不可透溶质 250 mOsm/L',inside:'不可透溶质 300 mOsm/L',gradient:'两侧压力相同；水势较高的膜外 → 膜内',scan:'H₂O · 极性小分子 · 急速补水申请',note:'本申请要求快速运输：须启用 AQP。水也能较慢地直接穿过脂质双层。',route:'channel',port:'aqp',reason:'同压下水向水势较低的一侧净移动。AQP 水通道加快水的被动运输；水也能较慢地直接过膜，本急件要求 AQP。'},props));
const pump=(id,props)=>cargo(id,Object.assign({declared:'钠钾泵循环',name:'钠钾泵循环',formula:'3Na⁺ / 2K⁺',color:'#b9bd79',size:'3 个 Na⁺ ＋ 2 个 K⁺',charge:'离子配对任务',affinity:'均带电 · 需专用泵',direction:'cycle',outside:'Na⁺ 145 / K⁺ 4 mmol/L',inside:'Na⁺ 12 / K⁺ 140 mmol/L',gradient:'膜内 −70 mV；任务：3 Na⁺ 出胞＋2 K⁺ 入胞',scan:'循环货单齐全：胞内 3 Na⁺；胞外 2 K⁺',note:'必须办理完整泵循环，并拨付 1 ATP。',route:'pump',port:'nak',energy:1,reason:'Na⁺/K⁺-ATP 酶每水解 1 ATP，完成 3 Na⁺ 向外、2 K⁺ 向内的耦联循环，维持离子梯度。'},props));
const DAYS=[
{title:'脂质边界',subtitle:'第 01 班 · 建立通行秩序',brief:'边检站刚刚启用，今天仅开放脂质双层。先看真实货物，再测两侧梯度；能跨膜不等于任何方向都有净运输。',unlocks:['lipid'],rules:[
'本班仅开放脂质双层。蛋白运输设施将在后续班次启用。',
'小型非极性分子可简单扩散；净运输须顺该分子的浓度梯度。',
'离子的电荷、葡萄糖的亲水性会阻碍其直接穿过脂质核心。',
'先扫描、再测量，最后配置路线并盖章。被动运输不拨 ATP。'],cases:[
o2('01-01'),
cargo('01-02',{declared:'二氧化碳',name:'二氧化碳',formula:'CO₂',color:'#b8c2b4',size:'44 Da',affinity:'小型非极性气体',direction:'out',outside:'1 相对单位',inside:'7 相对单位',gradient:'净驱动力：膜内 → 膜外',scan:'CO₂ · 无电荷 · 代谢废物',reason:'二氧化碳可直接跨脂质双层；此处胞内浓度较高，净扩散方向向外。'}),
o2('01-03',{direction:'out',outside:'9 相对单位',inside:'2 相对单位',allowed:false,route:null,port:null,note:'申请把氧气从膜内净运向膜外。',reason:'氧气虽能直接过膜，但这里外侧浓度更高，净扩散方向向内。不能凭盖章把被动净运输反向。分子仍会双向随机运动。'}),
glucose('01-04',{allowed:false,route:null,port:null,note:'GLUT 设施尚未启用。',reason:'葡萄糖无电荷却高度亲水，不能以足够速率直接通过脂质核心；本班没有开放 GLUT，因此该申请须暂拒。'}),
sodium('01-05',{allowed:false,route:null,port:null,note:'Na⁺ 通道尚未启用。',reason:'Na⁺ 虽小，却带电且水合，不能直接穿过脂质核心。本班没有开放合适的蛋白设施。'}),
cargo('01-06',{declared:'乙醇',name:'乙醇',formula:'C₂H₅OH',color:'#c6ad88',size:'46 Da',affinity:'小型两亲性分子',outside:'4 相对单位',inside:'1 相对单位',gradient:'净驱动力：膜外 → 膜内',scan:'乙醇 · 身份属实 · 通透性演示用微量样品',note:'本样品获科研许可；可透过不代表对细胞有益。',reason:'乙醇虽有极性羟基，但分子小且有亲脂部分，可沿梯度直接过膜。此处是通透性演示，绝不代表乙醇对细胞有益。'})]},
{title:'蛋白通行证',subtitle:'第 02 班 · 通道与载体',brief:'AQP、Na⁺ 通道和 GLUT 正式启用。孔道和载体各有选择性；没有一种蛋白能替所有货物开门。',unlocks:['lipid','channel','carrier'],rules:[
'AQP 水通道供快速水运输；Na⁺ 通道供钠离子，二者不可互换。',
'GLUT 先结合葡萄糖再改变构象，允许顺浓度梯度的双向净运输。',
'协助扩散不直接消耗 ATP，不能靠附加 ATP 强行逆梯度。',
'离子看电化学梯度；水看水势。本班水样两侧压力相同。'],cases:[
glucose('02-01'),
water('02-02'),
sodium('02-03'),
glucose('02-04',{direction:'out',outside:'2 mmol/L',inside:'9 mmol/L',gradient:'净驱动力：膜内 → 膜外',note:'申请将葡萄糖净运出细胞。',reason:'GLUT 不是单向入口：当胞内葡萄糖更高时，可通过载体向外协助扩散，不直接耗 ATP。'}),
water('02-05',{direction:'out',outside:'不可透溶质 350 mOsm/L',inside:'不可透溶质 300 mOsm/L',gradient:'两侧压力相同；水势较高的膜内 → 膜外',note:'急速排水申请：须启用 AQP；水也能较慢地直接过膜。'}),
glucose('02-06',{outside:'2 mmol/L',inside:'9 mmol/L',gradient:'净驱动力：膜内 → 膜外；申请却要求向内',allowed:false,route:null,port:null,note:'申请书要求：从低浓度膜外净运向高浓度膜内。',reason:'本台 GLUT 只能让葡萄糖顺自身浓度梯度净运输；附加 ATP 也不会把 GLUT 变成泵。本台未开放 Na⁺-葡萄糖共转运系统。'})]},
{title:'能量与伪装',subtitle:'第 03 班 · 稳态保卫战',brief:'钠钾泵上线，仓库只拨来 2 ATP，恰够两次完整循环。注意伪装货物；别让不匹配的证件混进细胞。',unlocks:['lipid','channel','carrier','pump'],rules:[
'本班 2 ATP 仅够两次钠钾泵循环：每次 3 Na⁺ 出、2 K⁺ 入。',
'Na⁺ 通道只能顺电化学梯度通行；它不能替代逆向运输的泵。',
'真实货物与申报不符，一律拒绝，要求重新申报。',
'大分泌蛋白需囊泡运输；本台未授权胞吞／胞吐设施。'],cases:[
pump('03-01'),
sodium('03-02',{declared:'葡萄糖',identityMismatch:true,allowed:false,route:null,port:null,scan:'身份不符！申报 C₆H₁₂O₆，实测货物为 Na⁺',note:'证件申报葡萄糖，封装标签有擦改痕迹。',reason:'扫描发现真实货物是 Na⁺，与葡萄糖申报不符。即使本台有可供 Na⁺ 使用的通道，这份错误证件也必须拒绝并重报。'}),
cargo('03-03',{declared:'胰岛素',name:'胰岛素',formula:'蛋白质',color:'#ba9fbb',size:'约 5.8 kDa',affinity:'多肽 · 大分子',direction:'out',outside:'低',inside:'分泌囊泡内高',gradient:'分泌任务；不属于小溶质被动净扩散',scan:'胰岛素蛋白 · 已在分泌囊泡内',note:'申请使用当前小溶质通道直接出胞；囊泡设施未授权。',allowed:false,route:null,port:null,reason:'分泌胰岛素通常通过囊泡与膜融合的胞吐完成。本台仅办理小溶质路线，没有胞吐授权；不能塞进 AQP、Na⁺ 通道或 GLUT。'}),
sodium('03-04',{direction:'out',allowed:false,route:null,port:null,note:'货单仅有 1 个 Na⁺，要求使用 Na⁺ 通道向外净运；未提交完整泵循环货单。',reason:'此处 Na⁺ 电化学净驱动力向内，Na⁺ 通道不能把它向外净运。钠钾泵也不是单离子直通车：须重新提交 3 Na⁺ 出、2 K⁺ 入的完整循环申请。'}),
pump('03-05'),
o2('03-06',{outside:'10 相对单位',inside:'3 相对单位',note:'最后一件：别把不需要能量的简单运输复杂化。'})]}
];
function newGame(){return {day:0,index:0,health:100,score:0,combo:0,correct:0,processed:0,energy:0,remaining:180,phase:'briefing',history:[],result:null};}
function dayInfo(s){return s.assignment||DAYS[s.day]||DAYS[0];}
function currentCase(s){return dayInfo(s).cases[s.index]||null;}
function startDay(s){if(s.phase==='briefing'){s.phase='playing';s.remaining=dayInfo(s).duration||180;s.energy=dayInfo(s).energyStock??(s.day===2?2:0);}return s;}
function evaluate(c,d,s){
if(!d.scanned||!d.measured)return {blocked:true,correct:false,title:'尚未完成核验',reason:'请先扫描货物并测量梯度，再盖章。',healthDelta:0,scoreDelta:0,energyCost:0};
let good=true,why=c.reason;
if(d.approve!==c.allowed){good=false;why=c.allowed?'这份申请应放行。'+c.reason:'这份申请应拒绝。'+c.reason;}
else if(d.approve){
const accepted=c.accepted||[{route:c.route,port:c.port}];
if(!dayInfo(s).unlocks.includes(d.route)){good=false;why='所选运输路线本班尚未开放。'+c.reason;}
else if(!accepted.some(a=>a.route===d.route&&a.port===d.port)){good=false;const sameRoute=accepted.filter(a=>a.route===d.route),chosen=ROUTES.find(r=>r.id===d.route);if(sameRoute.length&&chosen){const selected=chosen.portOptions.find(p=>p.id===d.port),required=sameRoute.map(a=>chosen.portOptions.find(p=>p.id===a.port)).filter(Boolean).map(p=>'“'+p.name+'”').join('或');why=chosen.name+'路线选对了，但具体蛋白不匹配：当前选的是“'+(selected?selected.name:'未指定蛋白')+'”，本申请需要'+required+'。'+c.reason;}else{why='运输路线不匹配。'+c.reason;}}
else if(Number(d.energy||0)!==c.energy){good=false;why=c.energy?'钠钾泵完整循环必须拨付 1 ATP。'+c.reason:'这项被动运输不需要拨付 ATP；多拨能量不会改变运输机制。'+c.reason;}
else if(c.energy>s.energy){good=false;why='ATP 仓库不足，无法执行本次泵循环。'}
}
const combo=good?(s.combo||0)+1:0;
const energyHeld=s.mode==='career'&&!good&&d.approve&&Number(d.energy)>0&&s.energy>0?1:0;if(energyHeld)why+=' 所拨付的1 ATP额度已被调度冻结，本班无法再用；这不是该错误运输实际水解了ATP。';
return {blocked:false,correct:good,title:good?'核验正确':'边检失误',reason:why,healthDelta:good?3:-(22-(s.mode==='career'?Math.min(3,Math.max(0,Number(s.perks&&s.perks.shield)||0))*2:0)),scoreDelta:good?100+Math.min(combo-1,5)*20:0,energyCost:good&&d.approve?c.energy:0,energyHeld};
}
function decide(s,d){if(s.phase!=='playing')return {blocked:true,reason:'当前不能盖章。'};const c=currentCase(s);const r=evaluate(c,d,s);if(r.blocked)return r;s.health=Math.max(0,Math.min(100,s.health+r.healthDelta));s.score+=r.scoreDelta;s.combo=r.correct?s.combo+1:0;s.correct+=r.correct?1:0;s.processed++;s.energy=Math.max(0,s.energy-r.energyCost-(r.energyHeld||0));s.result=Object.assign({caseId:c.id,approved:d.approve},r);s.history.push({id:c.id,name:c.name,correct:r.correct,approved:d.approve,reason:r.reason});s.phase='feedback';return s.result;}
function next(s){if(s.phase!=='feedback')return s;if(s.health<=0){s.phase='lost';return s;}s.index++;s.result=null;if(s.index>=dayInfo(s).cases.length){if(s.assignment){const count=dayInfo(s).cases.length,needed=dayInfo(s).minAccuracy??.75;s.phase=s.correct/count>=needed?'shiftEnd':'lost';if(s.phase==='lost')s.lossReason='本班审计正确率不足'+Math.round(needed*100)+'%，虽仍有稳态，仍须退回复训。';}else s.phase=s.day===DAYS.length-1?'won':'shiftEnd';}else s.phase='playing';return s;}
function continueDay(s){if(s.phase!=='shiftEnd')return s;s.day++;s.index=0;s.remaining=180;s.energy=s.day===2?2:0;s.phase='briefing';return s;}
function tick(s,delta){if(s.phase!=='playing')return s;s.remaining=Math.max(0,s.remaining-Math.max(0,Number(delta)||0));if(s.remaining<=0){s.phase='lost';s.lossReason='本班时间耗尽。未完成的申请已移交下一班。';}return s;}
return {DAYS,ROUTES,dayInfo,newGame,currentCase,startDay,evaluate,decide,next,continueDay,tick};
});
