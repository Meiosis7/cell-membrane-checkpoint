/* Local career simulation: seeded duties, virtual credits, upgrades and achievements. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./core.js'):root.MembraneCore);if(typeof module==='object'&&module.exports)module.exports=api;root.MembraneCareer=api;})(typeof globalThis!=='undefined'?globalThis:this,function(C){
'use strict';
const STORAGE_KEY='membrane-career-v2';
const UPGRADES=[
{id:'clock',name:'延时排班系统',description:'每级为后续随机班次增加20秒，教学班次不变。',maxLevel:3,prices:[120,240,420],effect:'随机执勤时间 +20秒／级'},
{id:'shield',name:'稳态防护装置',description:'每级减少一次误判造成的2点稳态损失，不能改变正确运输机制。',maxLevel:3,prices:[120,240,420],effect:'误判稳态损失 −2／级'},
{id:'battery',name:'ATP应急储备',description:'每级额外储备1个ATP额度，保障错误拨付后的后续合法泵任务；被动运输仍不应拨付ATP。冻结额度属于本站调度规则。',maxLevel:2,prices:[160,300],effect:'备用ATP额度 +1／级 · 错误拨付保障'}
];
const ACHIEVEMENTS=[
{id:'firstinspection',name:'第一枚印章',description:'完成第一次分子裁决。',reward:30,goal:1},
{id:'combo5',name:'五连无误',description:'连续正确裁决5件申请。',reward:50,goal:5},
{id:'perfectshift',name:'零差错班次',description:'完整完成一班，且没有一次误判。',reward:60,goal:1},
{id:'tutorialfinish',name:'合格检查员',description:'通过三班基础教学。',reward:100,goal:1},
{id:'firstcareer',name:'独立上岗',description:'完成第一班随机执勤。',reward:60,goal:1},
{id:'career3',name:'边界常客',description:'累计完成3班随机执勤。',reward:100,goal:3},
{id:'expert8species',name:'分子老熟人',description:'正确处理全部8类物质或运输任务。',reward:90,goal:8},
{id:'fake3',name:'伪装终结者',description:'正确拒绝3份身份不符的申请。',reward:70,goal:3},
{id:'pump5',name:'能量记账员',description:'正确执行5次完整钠钾泵循环。',reward:70,goal:5},
{id:'passive10',name:'零耗能通行',description:'正确批准10份不直接耗ATP的被动运输。',reward:70,goal:10},
{id:'upgrades3',name:'站点建设者',description:'累计完成3次设施升级。',reward:80,goal:3},
{id:'comeback',name:'逆风结班',description:'使用应急修复后，以合格审计完成一班随机执勤。',reward:80,goal:1}
];
const STAT_KEYS=['total','correct','mistakes','bestCombo','pumps','fakes','passive','careerCleared','cleanShifts','totalShifts','upgradesBought','comebacks','tutorialWins','failedShifts','creditsEarned','creditsSpent'];
const NAMES=['氧气','二氧化碳','乙醇','水','葡萄糖','钠离子','钠钾泵循环','胰岛素'];
const ROUTE_IDS=['lipid','channel','carrier','pump'];
const PORTS={lipid:['none'],channel:['aqp','na'],carrier:['glut'],pump:['nak']};
const EVENT_IDS=['normal','osmotic','maintenance','supply','audit'];
const textField=(x,max=2000)=>typeof x==='string'&&x.length<=max;
function num(n,fallback=0,max=1e9){const x=Number(n);return Number.isFinite(x)?Math.min(max,Math.max(0,Math.floor(x))):fallback;}
function clone(o){return JSON.parse(JSON.stringify(o));}
function newProfile(legacyBest=0){const stats={types:[]};STAT_KEYS.forEach(k=>stats[k]=0);return {version:2,wallet:160,xp:0,tutorialComplete:num(legacyBest)>0,upgrades:{clock:0,shield:0,battery:0},achievements:[],stats,receipts:[],settled:[],ledger:[],activeRun:null};}
function rng(seed){let x=typeof seed==='string'?Array.from(seed).reduce((a,c)=>(Math.imul(a,31)+c.charCodeAt(0))>>>0,2166136261):Number(seed)>>>0;return function(){x=(x+0x6D2B79F5)>>>0;let t=Math.imul(x^(x>>>15),1|x);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296;};}
function cleanStrings(a,max=500){return Array.isArray(a)?[...new Set(a.filter(s=>typeof s==='string'&&s.length<=140))].slice(-max):[];}
function sanitizeRun(value){
 if(!value||typeof value!=='object'||!['training','career'].includes(value.mode)||typeof value.runId!=='string'||value.runId.length>120)return null;
 if(!['briefing','playing','feedback','shiftEnd','won','lost'].includes(value.phase))return null;
 const isCareer=value.mode==='career',day=num(value.day,0,1000000);if(!isCareer&&day>2)return null;
 let assignment=null,cases;
 if(isCareer){const a=value.assignment;if(!a||typeof a!=='object'||!textField(a.title,500)||!textField(a.subtitle,500)||!textField(a.brief)||!Array.isArray(a.rules)||a.rules.length<1||a.rules.length>12||!a.rules.every(x=>textField(x))||!a.event||!EVENT_IDS.includes(a.event.id)||!textField(a.event.name,500)||!textField(a.event.description)||!Number.isInteger(a.number)||a.number<1||a.number>1000000||!Array.isArray(a.cases)||a.cases.length<8||a.cases.length>12||!Array.isArray(a.unlocks)||!a.unlocks.every(r=>ROUTE_IDS.includes(r)))return null;
  for(const c of a.cases){if(!c||typeof c!=='object'||!NAMES.includes(c.name)||!textField(c.id,80)||typeof c.allowed!=='boolean'||!['in','out','cycle'].includes(c.direction)||!['declared','size','charge','affinity','reason','scan','gradient','formula','note','outside','inside'].every(k=>textField(c[k]))||!/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(c.color)||!Number.isFinite(c.energy)||c.energy<0||c.energy>1||c.allowed&&(!a.unlocks.includes(c.route)||!PORTS[c.route].includes(c.port))||c.queueRemaining!==undefined&&(!Number.isInteger(c.queueRemaining)||c.queueRemaining<0||c.queueRemaining>11))return null;}
  if(new Set(a.cases.map(c=>c.id)).size!==a.cases.length)return null;
  try{if(JSON.stringify(a).length>90000)return null;assignment=clone(a);}catch(e){return null;}
  assignment.duration=Math.max(30,num(a.duration,230,900));assignment.energyStock=num(a.energyStock,0,20);assignment.minAccuracy=.75;if(!assignment.rules.some(r=>r.includes('冻结')))assignment.rules[Math.min(2,assignment.rules.length-1)]+=' 错误放行且已拨付时冻结1 ATP额度（本站调度规则）。';if(!assignment.rules.some(r=>r.includes('75%')))assignment.rules[assignment.rules.length-1]+=' 结班正确率须达到75%。';if(!assignment.brief.includes('75%'))assignment.brief+=' 完成全部申请且正确率至少75%、稳态高于0方可结班。';cases=assignment.cases;
 }else cases=C.DAYS[day].cases;
 const index=num(value.index,0,1000);if(index>cases.length||['playing','feedback'].includes(value.phase)&&index>=cases.length)return null;
 const s=C.newGame();Object.assign(s,{mode:value.mode,runId:value.runId,day,index,health:num(value.health,100,100),score:num(value.score),combo:num(value.combo),correct:num(value.correct),processed:num(value.processed),energy:num(value.energy,0,20),remaining:Math.min(900,Math.max(0,Number(value.remaining)||0)),phase:value.phase,history:Array.isArray(value.history)?value.history.filter(h=>h&&typeof h.id==='string'&&typeof h.correct==='boolean').slice(-100).map(h=>({id:h.id,name:NAMES.includes(h.name)?h.name:'未知货物',correct:h.correct,approved:Boolean(h.approved),reason:typeof h.reason==='string'?h.reason.slice(0,2000):''})):[],result:null});
 if(assignment)s.assignment=assignment;s.perks={clock:num(value.perks&&value.perks.clock,0,3),shield:num(value.perks&&value.perks.shield,0,3),battery:num(value.perks&&value.perks.battery,0,2)};s.repairUsed=Boolean(value.repairUsed);
 if(value.phase==='feedback'){const r=value.result;if(!r||typeof r.correct!=='boolean'||typeof r.approved!=='boolean')return null;s.result={caseId:typeof r.caseId==='string'?r.caseId:cases[index].id,approved:r.approved,blocked:false,correct:r.correct,title:typeof r.title==='string'?r.title:'裁决已记录',reason:typeof r.reason==='string'?r.reason.slice(0,2000):cases[index].reason,healthDelta:Number.isFinite(r.healthDelta)?r.healthDelta:0,scoreDelta:num(r.scoreDelta),energyCost:num(r.energyCost,0,1),energyHeld:num(r.energyHeld,0,1)};}
 if(value.ui&&typeof value.ui==='object'){const u=value.ui;s.ui={scanned:Boolean(u.scanned),measured:Boolean(u.measured),route:ROUTE_IDS.includes(u.route)?u.route:'lipid',port:['none','aqp','na','glut','nak'].includes(u.port)?u.port:'none',allocation:num(u.allocation,0,1)};}
 if(s.result&&value.result.finances&&typeof value.result.finances==='object'){const f=value.result.finances;s.result.finances={cashDelta:Number.isFinite(f.cashDelta)?Math.max(-10000,Math.min(10000,Math.round(f.cashDelta))):0,xpDelta:num(f.xpDelta,0,10000),unlocks:Array.isArray(f.unlocks)?f.unlocks.map(a=>ACHIEVEMENTS.find(x=>x.id===(typeof a==='string'?a:a&&a.id))).filter(Boolean):[]};}
 if(value.bill&&typeof value.bill==='object'){const b=value.bill;s.bill={paid:Boolean(b.paid),base:num(b.base,0,10000),bonus:num(b.bonus,0,10000),total:num(b.total,0,20000),unlocks:Array.isArray(b.unlocks)?b.unlocks.map(a=>ACHIEVEMENTS.find(x=>x.id===(typeof a==='string'?a:a&&a.id))).filter(Boolean):[],message:textField(b.message)?b.message:''};}
 if(typeof value.lossReason==='string')s.lossReason=value.lossReason.slice(0,300);return s;
}
function sanitizeProfile(value,legacyBest=0){const p=newProfile(legacyBest);if(!value||typeof value!=='object')return p;
 p.wallet=num(value.wallet,160);p.xp=num(value.xp);p.tutorialComplete=Boolean(value.tutorialComplete)||p.tutorialComplete;
 UPGRADES.forEach(u=>p.upgrades[u.id]=num(value.upgrades&&value.upgrades[u.id],0,u.maxLevel));p.achievements=cleanStrings(value.achievements).filter(id=>ACHIEVEMENTS.some(a=>a.id===id));
 STAT_KEYS.forEach(k=>p.stats[k]=num(value.stats&&value.stats[k]));p.stats.types=cleanStrings(value.stats&&value.stats.types,8).filter(t=>NAMES.includes(t));
 p.receipts=cleanStrings(value.receipts,500);p.settled=cleanStrings(value.settled,300);
 p.ledger=Array.isArray(value.ledger)?value.ledger.filter(l=>l&&typeof l.label==='string'&&Number.isFinite(l.amount)).slice(-40).map(l=>({label:l.label.slice(0,120),amount:Math.round(Math.max(-1e9,Math.min(1e9,l.amount)))})):[];
 p.activeRun=sanitizeRun(value.activeRun);return p;
}
function load(storage,legacyBest=0){try{const raw=storage&&storage.getItem(STORAGE_KEY);if(!raw||raw.length>1000000)return newProfile(legacyBest);return sanitizeProfile(JSON.parse(raw),legacyBest);}catch(e){return newProfile(legacyBest);}}
function save(profile,storage){try{if(!storage||typeof storage.setItem!=='function')return false;storage.setItem(STORAGE_KEY,JSON.stringify(sanitizeProfile(profile)));return true;}catch(e){return false;}}
function credit(p,amount,label){const before=p.wallet;p.wallet=Math.max(0,Math.min(1e9,p.wallet+amount));const actual=p.wallet-before;if(actual){p.ledger.push({label,amount:actual});p.ledger=p.ledger.slice(-40);if(actual>0)p.stats.creditsEarned+=actual;else p.stats.creditsSpent-=actual;}return actual;}
function progress(p,id){const s=p.stats;let value=({firstinspection:s.total,combo5:s.bestCombo,perfectshift:s.cleanShifts,tutorialfinish:p.tutorialComplete?1:0,firstcareer:s.careerCleared,career3:s.careerCleared,expert8species:s.types.length,fake3:s.fakes,pump5:s.pumps,passive10:s.passive,upgrades3:s.upgradesBought,comeback:s.comebacks})[id]||0;const a=ACHIEVEMENTS.find(a=>a.id===id);return {value:a?Math.min(a.goal,value):0,goal:a?a.goal:1};}
function checkAchievements(p){const unlocked=[];for(const a of ACHIEVEMENTS){if(!p.achievements.includes(a.id)&&progress(p,a.id).value>=a.goal){p.achievements.push(a.id);credit(p,a.reward,'成就奖励 · '+a.name);unlocked.push(a);}}return unlocked;}
function buy(p,id){const u=UPGRADES.find(u=>u.id===id);if(!u)return {ok:false,message:'没有这项设施。',unlocks:[],cost:0};const level=p.upgrades[id];if(level>=u.maxLevel)return {ok:false,message:'该设施已升至最高级。',unlocks:[],cost:0};const cost=u.prices[level];if(p.wallet<cost)return {ok:false,message:'站点经费不足。',unlocks:[],cost:0};credit(p,-cost,'设施升级 · '+u.name+' Lv.'+(level+1));p.upgrades[id]++;p.stats.upgradesBought++;const unlocks=checkAchievements(p);return {ok:true,message:u.name+'已升级至 Lv.'+p.upgrades[id]+'，下一班随机执勤生效。',unlocks,cost};}
function template(name){return clone(C.DAYS.flatMap(d=>d.cases).find(c=>c.name===name&&(c.allowed||name==='胰岛素')));}
function makeAssignment(p,seed,number=p.stats.careerCleared+1){
 number=Math.max(1,num(number,1,1000000));const random=rng(String(seed)+'/'+number),pick=a=>a[Math.floor(random()*a.length)],integer=(a,b)=>a+Math.floor(random()*(b-a+1));
 const events=[{id:'normal',name:'常规执勤',description:'设施正常，核对真实货物与净运输方向。'},{id:'osmotic',name:'渗透警报',description:'水运输申请增多；两侧压力相同，请按水势判定。'},{id:'maintenance',name:'GLUT检修',description:'本班GLUT停机，葡萄糖申请需退回；其他设施正常。'},{id:'supply',name:'能量限供',description:'只安排一次完整钠钾泵任务，基础ATP恰够该循环。'},{id:'audit',name:'证件专项稽查',description:'注意申报名称与扫描出的真实货物，身份不符一律拒绝。'}];
 const event=pick(events),unlocks=event.id==='maintenance'?['lipid','channel','pump']:ROUTE_IDS.slice();const count=Math.min(12,8+Math.floor((number-1)/3));
 function generated(kind,forceValid=true){const c=template(kind),dir=random()<.5?'in':'out';c.identityMismatch=false;c.allowed=true;c.energy=kind==='钠钾泵循环'?1:0;
  if(['氧气','二氧化碳','乙醇','葡萄糖'].includes(kind)){const high=integer(kind==='葡萄糖'?6:6,kind==='葡萄糖'?18:15),low=integer(1,4),net=dir;c.direction=forceValid?net:(net==='in'?'out':'in');c.netDirection=net;c.concentrationOutside=net==='in'?high:low;c.concentrationInside=net==='in'?low:high;const units=kind==='葡萄糖'?'mmol/L':'相对单位';c.outside=c.concentrationOutside+' '+units;c.inside=c.concentrationInside+' '+units;c.gradient='净驱动力：'+(net==='in'?'膜外 → 膜内':'膜内 → 膜外')+(forceValid?'':'；申请方向与净驱动力相反');c.note=(kind==='乙醇'?'获科研许可的微量样品。':'')+'申请'+(c.direction==='in'?'入胞':'出胞')+'净运输，请核对采样值。';c.reason=kind==='葡萄糖'?'GLUT结合葡萄糖并改变构象，允许其顺自身浓度梯度向'+(net==='in'?'内':'外')+'协助扩散，不直接消耗ATP。':kind==='乙醇'?'乙醇分子小且两亲，可沿浓度梯度直接过膜；本例净运输向'+(net==='in'?'内':'外')+'。科研通行许可不代表对细胞有益。':kind+'可沿自身浓度梯度直接穿过脂质双层；本例净运输向'+(net==='in'?'内':'外')+'。';
   if(!forceValid){c.allowed=false;c.reason='申请方向逆着当前净驱动力。'+c.reason+'被动净运输不能靠盖章反向；分子仍在双向随机运动。';}
  }else if(kind==='水'){const high=integer(6,8)*50,low=integer(4,5)*50;c.direction=forceValid?dir:(dir==='in'?'out':'in');c.netDirection=dir;c.concentrationOutside=dir==='in'?low:high;c.concentrationInside=dir==='in'?high:low;c.outside='不可透溶质 '+c.concentrationOutside+' mOsm/L';c.inside='不可透溶质 '+c.concentrationInside+' mOsm/L';c.gradient='两侧压力相同；水势较高的'+(dir==='in'?'膜外 → 膜内':'膜内 → 膜外')+(forceValid?'':'；申请方向相反');c.scan='H₂O · 极性小分子 · 快速'+(c.direction==='in'?'补水':'排水')+'申请';c.note='本申请要求快速'+(c.direction==='in'?'补水':'排水')+'，请使用AQP；水也可较慢地直接跨脂质层。';c.reason='同压且不可透溶质不透膜时，水向水势较低的一侧净移动，本例向'+(dir==='in'?'内':'外')+'。AQP加快被动运输，不直接耗ATP。';if(!forceValid){c.allowed=false;c.reason='这份快速水运输申请逆着当前水势驱动力。'+c.reason;}
  }else if(kind==='钠离子'){const lab=random()<.35,net=lab?'out':'in';c.direction=forceValid?net:(net==='in'?'out':'in');c.netDirection=net;c.concentrationOutside=lab?12:145;c.concentrationInside=lab?145:12;c.outside=c.concentrationOutside+' mmol/L';c.inside=c.concentrationInside+' mmol/L';c.gradient=(lab?'电压钳实验：膜内 +40 mV':'膜内 −70 mV')+'；Na⁺电化学净驱动力：'+(lab?'向外':'向内');c.note=(lab?'电压钳实验样本；':'')+'申请Na⁺经选择性通道'+(c.direction==='in'?'入胞':'出胞')+'，请同时核对浓度与电势。';c.reason='本例浓度差与电势差都推动Na⁺向'+(lab?'外':'内')+'净移动。开放的Na⁺选择性通道允许它顺电化学梯度协助扩散，不直接耗ATP。';if(!forceValid){c.allowed=false;c.reason='所申请的通道净运输方向逆着电化学驱动力。'+c.reason;}
  }else if(kind==='钠钾泵循环'){c.note='完整货单：胞内3 Na⁺、胞外2 K⁺，申请执行一次耦联循环。';}
  else if(kind==='胰岛素'){c.allowed=false;c.note='分泌囊泡抵达本站，申请出胞；请核对设施授权范围。';}
  if(kind==='葡萄糖'&&event.id==='maintenance'){c.allowed=false;c.reason='GLUT本班检修停机，本站无法办理这项葡萄糖运输。葡萄糖高度亲水，不能改用脂质双层、AQP或Na⁺通道；须退回等待载体恢复。';}
  if(!c.allowed){c.route=null;c.port=null;c.energy=0;}return c;
 }
 function forged(){const c=generated(pick(['葡萄糖','钠离子','氧气','二氧化碳']),true),actual=c.name;const declared=pick(NAMES.filter(n=>n!==actual&&n!=='钠钾泵循环'&&n!=='胰岛素'));c.declared=declared;c.identityMismatch=true;c.allowed=false;c.route=null;c.port=null;c.energy=0;c.scan='身份不符！申报'+declared+'，实测为'+actual+'（'+c.formula+'）';c.note='封装件申请'+(c.direction==='out'?'出胞':'入胞')+'，请仔细扫描货物。';c.reason='真实货物是'+actual+'，与申报的'+declared+'不符。即使本站有适用设施，也必须拒绝错误证件并要求重新申报。';return c;}
 const cases=[generated(pick(['氧气','二氧化碳','乙醇']),true),generated('钠离子',true),generated('钠钾泵循环',true),generated('水',true),generated('葡萄糖',true),generated(pick(['氧气','二氧化碳','乙醇']),false),forged(),generated('胰岛素',false)];
 if(event.id==='osmotic')cases[4]=generated('水',true);
 for(let i=8;i<count;i++){if(event.id==='audit'&&random()<.55)cases.push(forged());else if(event.id==='osmotic')cases.push(generated('水',random()>.25));else cases.push(generated(pick(event.id==='supply'?['水','葡萄糖','二氧化碳','乙醇','钠离子']:['水','葡萄糖','二氧化碳','乙醇','钠离子','钠钾泵循环']),random()>.25));}
 // The first two remain legitimate gentle cases; the rest use a seeded shuffle.
 for(let i=cases.length-1;i>2;i--){const j=2+Math.floor(random()*(i-1));[cases[i],cases[j]]=[cases[j],cases[i]];}
 cases.forEach((c,i)=>{c.id='R'+String(number+3).padStart(3,'0')+'-'+String(i+1).padStart(2,'0');c.queueRemaining=cases.length-i-1;});
 const energyStock=cases.filter(c=>c.allowed).reduce((a,c)=>a+c.energy,0)+num(p.upgrades.battery,0,2),duration=Math.max(170,230-number*4)+num(p.upgrades.clock,0,3)*20;
 return {title:'随机执勤 · '+event.name,subtitle:'第 '+String(number+3).padStart(2,'0')+' 班 · 随机任务 '+number,brief:event.description+' 完成全部申请且正确率至少75%、稳态高于0方可结班。每份采样与顺序由本班种子生成，基础ATP足额配给。',rules:[event.id==='maintenance'?'GLUT检修停机；葡萄糖申请退回，其他运输设施正常。':'设施开放：脂质层、AQP、Na⁺通道、GLUT与钠钾泵。','先扫描身份，再按浓度／水势／电化学净驱动力核对申请方向。','钠钾泵每循环1 ATP：3 Na⁺出、2 K⁺入。错误放行且已拨付时冻结1 ATP额度（本站调度规则）。','身份不符一律拒绝；本站未授权胞吞／胞吐。结班正确率须达到75%。'],unlocks,cases,energyStock,duration,minAccuracy:.75,event,seed:String(seed),number};
}
function newRun(p,seed,number=p.stats.careerCleared+1){const assignment=makeAssignment(p,seed,number),s=C.newGame();return Object.assign(s,{mode:'career',runId:'career-'+assignment.number+'-'+String(seed),assignment,perks:clone(p.upgrades),repairUsed:false,day:assignment.number+2,energy:assignment.energyStock,remaining:assignment.duration});}
function record(p,s,c,r){if(!r||r.blocked||typeof r.correct!=='boolean')return {cashDelta:0,xpDelta:0,unlocks:[]};const key=String(s.runId||'training')+'/'+c.id;if(p.receipts.includes(key))return {cashDelta:0,xpDelta:0,unlocks:[]};p.receipts.push(key);p.receipts=p.receipts.slice(-500);p.stats.total++;if(r.correct){p.stats.correct++;p.stats.bestCombo=Math.max(p.stats.bestCombo,num(s.combo));if(!p.stats.types.includes(c.name))p.stats.types.push(c.name);if(c.identityMismatch&&!r.approved)p.stats.fakes++;if(r.approved&&c.route==='pump')p.stats.pumps++;if(r.approved&&c.energy===0)p.stats.passive++;}else p.stats.mistakes++;
 const cash=r.correct?8+Math.min(Math.max(0,num(s.combo)-1),4)*2:-12,cashDelta=credit(p,cash,r.correct?'正确裁决 · '+c.name:'误判罚款 · '+c.name),xpDelta=r.correct?20:5;p.xp=Math.min(1e9,p.xp+xpDelta);return {cashDelta,xpDelta,unlocks:checkAchievements(p)};}
function settle(p,s){const key=String(s.runId||'training')+'/shift/'+s.day;if(p.settled.includes(key))return {paid:false,base:0,bonus:0,total:0,unlocks:[],message:'本班已结算。'};
 const d=s.assignment||C.DAYS[s.day],completed=d&&s.index>=d.cases.length&&s.health>0&&['shiftEnd','won'].includes(s.phase);if(!completed&&s.phase!=='lost')return {paid:false,base:0,bonus:0,total:0,unlocks:[],message:'班次尚未结束。'};
 p.settled.push(key);p.settled=p.settled.slice(-300);if(!completed){p.stats.failedShifts++;return {paid:false,base:0,bonus:0,total:0,unlocks:[],message:'本班未完成，不发放结班薪资；已取得的逐件收入保留。'};}
 const ids=new Set(d.cases.map(c=>c.id)),history=s.history.filter(h=>ids.has(h.id)),perfect=history.length===d.cases.length&&history.every(h=>h.correct);p.stats.totalShifts++;if(perfect)p.stats.cleanShifts++;if(s.mode==='career'&&s.repairUsed)p.stats.comebacks++;if(s.mode==='career')p.stats.careerCleared++;if(s.mode!=='career'&&s.phase==='won'){p.tutorialComplete=true;p.stats.tutorialWins++;}
 const base=40,bonus=(perfect?30:0)+Math.floor(Math.max(0,s.remaining)/30)*3,total=base+bonus;credit(p,total,'结班薪资 · '+(s.mode==='career'?'随机执勤 '+d.number:'教学第 '+(s.day+1)+' 班'));return {paid:true,base,bonus,total,unlocks:checkAchievements(p),message:perfect?'零差错结班，获得全勤奖励。':'班次完成，薪资已入账。'};
}
function repair(p,s){if(s.mode!=='career'||!['briefing','playing','feedback'].includes(s.phase))return {ok:false,message:'应急修复仅供正在进行的随机班次使用。',cost:0,healed:0};if(s.repairUsed)return {ok:false,message:'本班应急修复已使用。',cost:0,healed:0};if(s.health<=0)return {ok:false,message:'稳态归零后不能修复，请重新执勤。',cost:0,healed:0};if(s.health>=100)return {ok:false,message:'当前稳态良好，无需修复。',cost:0,healed:0};if(p.wallet<60)return {ok:false,message:'站点经费不足60游戏币。',cost:0,healed:0};const healed=Math.min(25,100-s.health);credit(p,-60,'本班应急修复');s.health+=healed;s.repairUsed=true;return {ok:true,message:'稳态恢复'+healed+'，本班修复配额已使用。',cost:60,healed};}
function rank(p){const level=Math.floor(num(p.xp)/200)+1;return {level,name:level===1?'见习检查员':level<5?'正式检查员':level<9?'资深检查员':'首席检查员',nextXp:level*200,progress:(num(p.xp)%200)/200};}
return {STORAGE_KEY,UPGRADES,ACHIEVEMENTS,newProfile,load,save,sanitizeRun,sanitizeProfile,makeAssignment,newRun,record,settle,buy,repair,rank,progress,checkAchievements};
});
