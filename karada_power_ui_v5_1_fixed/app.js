const FOODS=window.FOODS||[], NUTRIENTS=window.NUTRIENTS||{};
const powers=[
{key:'head_power',label:'あたま',icon:'🧠',cls:'p-head',desc:'考（かんが）える・覚（おぼ）える。頭（あたま）や神経（しんけい）を応援（おうえん）！'},
{key:'sparkle_power',label:'キラキラ',icon:'✨',cls:'p-sparkle',desc:'肌（はだ）・髪（かみ）・爪（つめ）をつくるのを応援（おうえん）！'},
{key:'muscle_power',label:'マッチョ',icon:'💪',cls:'p-muscle',desc:'筋肉（きんにく）や体（からだ）をつくる材料（ざいりょう）を集（あつ）めよう！'},
{key:'bone_power',label:'ほね',icon:'🦴',cls:'p-bone',desc:'骨（ほね）と歯（は）をつくるのを応援（おうえん）！'},
{key:'immunity_power',label:'めんえき',icon:'🛡️',cls:'p-immunity',desc:'体（からだ）を守（まも）る仕組（しく）みを応援（おうえん）！'}];
const target=8;
let activeChild=localStorage.getItem('kp_child')||'長女', category='すべて',query='';
let batchMode=false;
let batchSelected=new Set();
const todayKey=()=> 'kp_today_'+activeChild+'_'+new Date().toISOString().slice(0,10);
const getToday=()=>{try{return JSON.parse(localStorage.getItem(todayKey())||'[]')}catch{return[]}};
const setToday=x=>localStorage.setItem(todayKey(),JSON.stringify(x));
const prefKey=()=> 'kp_prefs_'+activeChild;
const getPrefs=()=>{try{return JSON.parse(localStorage.getItem(prefKey())||'{}')}catch{return{}}};
const setPrefs=x=>localStorage.setItem(prefKey(),JSON.stringify(x));
const allergyKey=()=> 'kp_allergies_'+activeChild;
const getAllergies=()=>{try{return JSON.parse(localStorage.getItem(allergyKey())||'{}')}catch{return{}}};
const setAllergies=x=>localStorage.setItem(allergyKey(),JSON.stringify(x));
function toggleAllergy(foodId){
  let a=getAllergies();
  if(a[foodId]) delete a[foodId]; else a[foodId]=true;
  setAllergies(a); openFood(foodId);
}

const prefOptions=[
 {v:'love',e:'😍',t:'おいしい！'},
 {v:'ok',e:'🙂',t:'食べられる'},
 {v:'depends',e:'🤔',t:'料理による'},
 {v:'dislike',e:'😣',t:'苦手'},
 {v:'no',e:'🚫',t:'イヤ！'}
];
function savePref(foodId,val){
 let p=getPrefs(), old=p[foodId]||{};
 let note=old.note||'';
 if(val==='depends') note=prompt('どんな料理なら食べられた？\\n例：しらすバターいため、ハンバーグに入れた',note)||note;
 p[foodId]={value:val,note,updated:new Date().toISOString()};
 setPrefs(p); openFood(foodId);
}

function showView(name){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.view===name));document.getElementById('view-'+name).classList.add('active');if(name==='today')renderToday();if(name==='foods')renderFoods()}
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>showView(b.dataset.view));document.querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>showView(b.dataset.jump));
function renderChild(){document.querySelectorAll('.child-btn').forEach(b=>b.classList.toggle('active',b.dataset.child===activeChild));document.getElementById('today-child').textContent=activeChild}
document.querySelectorAll('.child-btn').forEach(b=>b.onclick=()=>{activeChild=b.dataset.child;localStorage.setItem('kp_child',activeChild);renderChild();renderToday()});renderChild();
function topFoods(k,n=6){return [...FOODS].filter(f=>f[k]>0).sort((a,b)=>b[k]-a[k]||a.name.localeCompare(b.name,'ja')).slice(0,n)}
function renderHome(){let g=document.getElementById('power-grid');g.innerHTML=powers.map(p=>`<button class="power-card ${p.cls}" data-power="${p.key}"><div class="power-icon">${p.icon}</div><h3>${p.label}</h3><p>${p.desc}</p><div class="power-foods">${topFoods(p.key).map(f=>`<span class="mini-food">${f.emoji} ${f.reading}</span>`).join('')}</div></button>`).join('');g.querySelectorAll('.power-card').forEach(b=>b.onclick=()=>{category='すべて';query='';document.getElementById('food-search').value='';showView('foods');renderFoods(b.dataset.power)})}renderHome();
const cats=['すべて',...new Set(FOODS.map(f=>f.category_ui))];
function renderChips(){let e=document.getElementById('category-chips');e.innerHTML=cats.map(c=>`<button class="chip ${c===category?'active':''}" data-cat="${c}">${c==='すべて'?'🌈 全部（ぜんぶ）':c}</button>`).join('');e.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{category=b.dataset.cat;renderChips();renderFoods()})}renderChips();
document.getElementById('food-search').oninput=e=>{query=e.target.value.trim();renderFoods()};
function tinyPower(f,p){return f[p.key]>0?`<span class="badge">${p.icon}${'★'.repeat(f[p.key])}</span>`:''}

function updateBatchBar(){
  const actions=document.getElementById('batch-actions');
  const modeBtn=document.getElementById('batch-mode-btn');
  const count=document.getElementById('batch-count');
  if(!actions||!modeBtn||!count) return;
  actions.classList.toggle('hidden',!batchMode);
  modeBtn.classList.toggle('hidden',batchMode);
  count.textContent=`${batchSelected.size}こ選択`;
  const add=document.getElementById('batch-add');
  if(add) add.disabled=batchSelected.size===0;
}
function startBatchMode(){
  batchMode=true; batchSelected=new Set(getToday());
  renderFoods(); updateBatchBar();
}
function stopBatchMode(){
  batchMode=false; batchSelected.clear();
  renderFoods(); updateBatchBar();
}
function toggleBatchFood(id){
  const f=FOODS.find(x=>String(x.id)===String(id));
  const realId=f?f.id:id;
  if(batchSelected.has(realId)) batchSelected.delete(realId); else batchSelected.add(realId);
  renderFoods(); updateBatchBar();
}
function commitBatchFoods(){
  setToday([...batchSelected]);
  batchMode=false; batchSelected.clear();
  renderFoods(); renderToday(); updateBatchBar();
  showView('today');
}

function renderFoods(sortPower=null){let list=FOODS.filter(f=>(category==='すべて'||f.category_ui===category)&&(!query||(f.name+f.reading+f.main_nutrients).includes(query)));if(sortPower)list.sort((a,b)=>b[sortPower]-a[sortPower]||a.name.localeCompare(b.name,'ja'));document.getElementById('food-grid').innerHTML=list.map(f=>`<button class="food-card ${batchMode&&batchSelected.has(f.id)?'batch-selected':''}" data-id="${f.id}"><div class="food-top"><div class="food-emoji">${f.emoji}</div><div>${batchMode?`<div class="batch-check">${batchSelected.has(f.id)?"✓":""}</div>`:""}<div class="food-name">${f.name}${f.reading!==f.name?`<span class="inline-reading">（${f.reading}）</span>`:''}</div>${getAllergies()[f.id]?'<div class="allergy-badge">⚠️ アレルギー</div>':''}<div class="food-cat">${f.category_ui}</div></div></div><div class="stars-row">${powers.map(p=>tinyPower(f,p)).join('')}</div></button>`).join('');document.querySelectorAll('.food-card').forEach(b=>b.onclick=()=>(batchMode?toggleBatchFood(b.dataset.id):openFood(b.dataset.id)))}
function kidCopy(s){
  let t=(s||'')
    .replace(/食物繊維/g,'食物繊維（しょくもつせんい）')
    .replace(/炭水化物/g,'炭水化物（たんすいかぶつ）')
    .replace(/筋肉/g,'筋肉（きんにく）')
    .replace(/材料/g,'材料（ざいりょう）')
    .replace(/栄養/g,'栄養（えいよう）')
    .replace(/酸素/g,'酸素（さんそ）')
    .replace(/必要/g,'必要（ひつよう）')
    .replace(/神経/g,'神経（しんけい）')
    .replace(/細胞/g,'細胞（さいぼう）')
    .replace(/皮ふ/g,'皮膚（ひふ）')
    .replace(/血/g,'血（ち）')
    .replace(/骨/g,'骨（ほね）')
    .replace(/歯/g,'歯（は）')
    .replace(/髪/g,'髪（かみ）')
    .replace(/体/g,'体（からだ）');
  if(t && !/[。！？!?]$/.test(t)) t+='。';
  return t;
}
function openFood(id){let f=FOODS.find(x=>x.id===id);if(!f)return;let inToday=getToday().includes(id);document.getElementById('modal-content').innerHTML=`<div class="modal-food-head"><div class="food-emoji">${f.emoji}</div><div><div class="food-cat">${f.category_ui}</div><h2>${f.name}${f.reading!==f.name?`<span class="title-reading">（${f.reading}）</span>`:''}</h2></div></div><p class="modal-copy">${kidCopy(f.kids_text)}</p><div class="power-detail">${powers.map(p=>`<div>${p.icon}<br>${p.label}<br>${f[p.key]?'★'.repeat(f[p.key]):'—'}</div>`).join('')}</div><div class="nutrients"><b>🔎 入ってる栄養</b><div class="nutrient-buttons">${f.nutrient_list.map(n=>`<button class="nutrient-btn" data-nutrient="${n}">${(NUTRIENTS[n]?.icon||'🔎')} ${n}</button>`).join('')}</div></div>
<div class="allergy-box ${getAllergies()[id]?'active':''}">
  <div><b>⚠️ アレルギー</b><div class="allergy-help">これは「苦手・イヤ」とは別だよ。</div></div>
  <button id="allergy-toggle" class="allergy-btn">${getAllergies()[id]?'⚠️ アレルギー登録中':'アレルギーに登録'}</button>
</div>
<div class="pref-box"><b>この食べもの、どうだった？</b><div class="pref-buttons">${prefOptions.map(o=>`<button class="pref-btn ${getPrefs()[id]?.value===o.v?'selected':''}" data-pref="${o.v}">${o.e}<span>${o.t}</span></button>`).join('')}</div>${getPrefs()[id]?.note?`<div class="pref-note">🍳 ${getPrefs()[id].note}</div>`:''}</div>
<div style="margin-top:16px"><button class="primary-btn" id="toggle-today">${inToday?'✓ 今日食べた（取り消す）':'＋ 今日食べた！'}</button></div>`;document.getElementById('modal').classList.remove('hidden');document.getElementById('toggle-today').onclick=()=>{let ids=getToday();ids=ids.includes(id)?ids.filter(x=>x!==id):[...ids,id];setToday(ids);closeFood();renderToday()};document.querySelectorAll('.nutrient-btn').forEach(b=>b.onclick=()=>openNutrient(b.dataset.nutrient));document.querySelectorAll('.pref-btn').forEach(b=>b.onclick=()=>savePref(id,b.dataset.pref));const ab=document.getElementById('allergy-toggle');if(ab)ab.onclick=()=>toggleAllergy(id)}
function closeFood(){document.getElementById('modal').classList.add('hidden')}
function openNutrient(n){let info=NUTRIENTS[n]||{icon:'🔎',reading:n,title:'この栄養（えいよう）について',desc:'この栄養（えいよう）の説明（せつめい）は、これから追加（ついか）していくよ。',power:null};let rel=FOODS.filter(f=>f.nutrient_list.includes(n)).slice(0,8);let power=info.power?powers.find(p=>p.key===info.power):null;document.getElementById('nutrient-content').innerHTML=`<div class="nutrient-big">${info.icon}</div><h2>${n}</h2>${info.reading!==n?`<div class="reading">${info.reading}</div>`:''}<h3>${info.title}</h3><p class="modal-copy">${info.desc}</p>${power?`<div class="hint">${power.icon} <b>${power.label}パワー</b>にも、つながるよ！</div>`:''}<h3>この栄養（えいよう）がある食（た）べもの</h3><div class="related-foods">${rel.map(f=>`<button class="related-food" data-food="${f.id}">${f.emoji} ${f.reading}</button>`).join('')}</div>`;document.getElementById('nutrient-modal').classList.remove('hidden');document.querySelectorAll('.related-food').forEach(b=>b.onclick=()=>{document.getElementById('nutrient-modal').classList.add('hidden');openFood(b.dataset.food)})}
function status(v){if(v>=target)return'いい感じ！';if(v>=target*.65)return'もう少（すこ）し！';if(v>0)return'これから！';return'まだないよ。'}
function renderToday(){renderChild();let ids=getToday(),list=ids.map(id=>FOODS.find(f=>f.id===id)).filter(Boolean),s={};powers.forEach(p=>s[p.key]=list.reduce((a,f)=>a+f[p.key],0));document.getElementById('today-bars').innerHTML=powers.map(p=>`<div class="bar-row"><div class="bar-label">${p.icon} ${p.label}</div><div class="bar-track"><div class="bar-fill" style="width:${Math.min(100,s[p.key]/target*100)}%"></div></div><div class="bar-val">${status(s[p.key])}</div></div>`).join('');document.getElementById('today-foods').innerHTML=list.length?list.map(f=>`<button class="today-tag" data-id="${f.id}">${f.emoji} ${f.reading}</button>`).join(''):'<span style="color:#8b7e76">まだないよ。ずかんからえらんでね。</span>';document.querySelectorAll('.today-tag').forEach(b=>b.onclick=()=>(batchMode?toggleBatchFood(b.dataset.id):openFood(b.dataset.id)));if(!list.length){document.getElementById('today-hint').textContent='まずは、今日食べたものを選ぼう！'}else{let min=[...powers].sort((a,b)=>s[a.key]-s[b.key])[0],prefs=getPrefs(),allergies=getAllergies(),pool=[...FOODS].filter(f=>f[min.key]>0 && !allergies[f.id] && !['no','dislike'].includes(prefs[f.id]?.value)).sort((a,b)=>{let pa=prefs[a.id]?.value==='love'?2:prefs[a.id]?.value==='ok'?1:0,pb=prefs[b.id]?.value==='love'?2:prefs[b.id]?.value==='ok'?1:0;return pb-pa||b[min.key]-a[min.key]});let opts=pool.slice(0,4);document.getElementById('today-hint').innerHTML=`${min.icon} <b>${min.label}パワー</b>を、もう少（すこ）し集（あつ）める？<div class="suggestions">${opts.map(f=>`<button class="suggestion" data-suggest="${f.id}">${f.emoji} ${f.reading}</button>`).join('')}</div>`;document.querySelectorAll('.suggestion').forEach(b=>b.onclick=()=>(batchMode?toggleBatchFood(b.dataset.suggest):openFood(b.dataset.suggest)))}}
document.getElementById('clear-today').onclick=()=>{if(confirm(activeChild+'の「今日（きょう）食（た）べた」を全部（ぜんぶ）取（と）り消（け）す？')){setToday([]);renderToday()}};
document.querySelectorAll('[data-close="food"]').forEach(x=>x.onclick=closeFood);document.querySelectorAll('[data-close="nutrient"]').forEach(x=>x.onclick=()=>document.getElementById('nutrient-modal').classList.add('hidden'));renderToday();
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(()=>{});
  });
}


const batchModeBtn=document.getElementById('batch-mode-btn');
if(batchModeBtn) batchModeBtn.onclick=startBatchMode;
const batchCancel=document.getElementById('batch-cancel');
if(batchCancel) batchCancel.onclick=stopBatchMode;
const batchAdd=document.getElementById('batch-add');
if(batchAdd) batchAdd.onclick=commitBatchFoods;
updateBatchBar();
