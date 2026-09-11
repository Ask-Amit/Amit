// ══════════════════════════════════════════════════════════════════════
// AMIT SPEAK ENGINE — the real, tested "Speak to Me" mechanism, extracted
// 2026-09-11 (Ryan's direct instruction) so it can be imported into any
// page — the Devotions tabs first, SpeakToMe.html itself second — instead
// of being copy-pasted and drifting into two different implementations.
//
// This is the SAME code that was proven correct in SpeakToMe.html
// (persistent always-visible controls, live-editable text that rebuilds
// on next Play rather than quietly continuing to read stale words, the
// Voice Control popup with real accent/region grouping ported exactly
// from the Hub's Amit's Voice panel, save-back to the same Supabase
// owner-contact row the Hub reads from) — not a rewrite, a relocation.
//
// USAGE — from any page:
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//   <script src="[path]/amit_owner_contact.js"></script>
//   <script src="[path]/Amit_Speak_Engine.js"></script>
//   <div id="mySpeakMount"></div>
//   <script>AmitSpeak.mount('mySpeakMount');</script>
//
// AmitSpeak.mount(containerId) injects its own scoped CSS (once, under
// .amit-speak-widget so nothing here can collide with a host page's own
// class names), builds its markup inside the given container, and wires
// everything up — same as opening SpeakToMe.html itself, just embedded.
//
// AmitSpeak.readText(text) — hands the engine a specific string and starts
// reading it immediately (the mechanism behind SpeakToMe's old prefill
// handoff, now built in directly rather than routed through localStorage
// and a page navigation) — this is what a devotion tab calls to read its
// own study text aloud.
//
// SINGLE INSTANCE — one engine per page, matching how it's actually used
// today (SpeakToMe.html standalone, or one active tab at a time in a
// Devotions-style tabbed page). Calling mount() again moves the same
// engine into a new container rather than creating a second one — real
// multi-instance-on-screen-simultaneously support is future work, not
// needed for anything built so far.
// ══════════════════════════════════════════════════════════════════════
const AmitSpeak = (function(){

const CSS_TEXT = `
.amit-speak-widget{font-family:'Crimson Pro',Georgia,serif;color:var(--text2,#f0e8d0);display:flex;flex-direction:column;min-height:0}
/* Textarea (editable) and word-box (playing view) occupy the SAME slot —
   only one shows at a time, toggled explicitly in JS (see showTextarea/
   showWordBox below), not stacked on top of each other. Both flex to fill
   whatever height the host page gives the widget, so "press Play" grows
   into the reading view instead of adding a second box underneath.
   Real bug fixed 2026-09-11: they used to both always be visible at once,
   plus a host page (Devotions) was ALSO rendering its own static copy of
   the same text above this — three copies of the same content on screen. */
.amit-speak-widget textarea{width:100%;flex:1;min-height:55vh;background:var(--card-head,#0f2338);border:1px solid var(--border,rgba(201,168,76,.55));border-radius:8px;color:var(--text2,#f0e8d0);padding:14px;font-family:'Crimson Pro',Georgia,serif;font-size:15px;line-height:1.6;resize:vertical;box-sizing:border-box}
.amit-speak-widget .as-btn{background:var(--card-head,#0f2338);border:1px solid rgba(201,168,76,.4);color:var(--text2,#f0e8d0);padding:8px 16px;border-radius:6px;cursor:pointer;font-family:'Crimson Pro',Georgia,serif;font-size:13px}
.amit-speak-widget .as-btn:hover{background:rgba(201,168,76,.15)}
.amit-speak-widget .as-btn.primary{background:rgba(201,168,76,.22);border-color:var(--gold,#c9a84c);font-weight:600;color:var(--gold2,#e8c56a)}
.amit-speak-widget select{background:var(--card-head,#0f2338);color:var(--text2,#f0e8d0);border:1px solid var(--border,rgba(201,168,76,.55));border-radius:4px;padding:4px 6px;font-size:12px;font-family:'Crimson Pro',Georgia,serif}
.amit-speak-widget #as-wordBox{display:none;flex:1;min-height:55vh;overflow-y:auto;font-family:'Crimson Pro',Georgia,serif;font-size:17px;line-height:2;background:var(--card-head,#0f2338);border:1px solid rgba(201,168,76,.2);border-radius:8px;padding:16px}
.amit-speak-widget #as-wordBox.showing{display:block}
.amit-speak-widget .as-word{cursor:pointer;border-radius:3px;padding:0 1px}
.amit-speak-widget .as-word.active{background:rgba(201,168,76,.4);color:#1a1100}
.amit-speak-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:9999;align-items:center;justify-content:center;padding:16px}
.amit-speak-overlay .as-popup{background:var(--card-head,#0f2338);border:2px solid var(--border,rgba(201,168,76,.55));border-radius:14px;padding:26px 28px;width:460px;max-width:100%;max-height:88vh;overflow-y:auto;box-shadow:0 8px 40px rgba(0,0,0,.7);font-family:'Crimson Pro',Georgia,serif}
.amit-speak-overlay label{display:block;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted,rgba(240,232,208,.78));margin-bottom:5px}
.amit-speak-overlay select{width:100%;margin-bottom:12px;background:var(--bg,#09141f);color:var(--text2,#f0e8d0);border:1px solid var(--border,rgba(201,168,76,.55));border-radius:6px;padding:8px;font-family:'Crimson Pro',Georgia,serif;box-sizing:border-box}
.amit-speak-overlay input[type=range]{width:100%;accent-color:var(--gold,#c9a84c);margin-bottom:16px}
`;

const HTML_TEMPLATE = `
<div class="amit-speak-widget">
  <p style="display:none" id="as-voiceStatus"></p>
  <textarea id="as-inputText" placeholder="Paste your text here…"></textarea>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:14px 0">
    <div style="display:flex;flex-direction:column;gap:8px">
      <div style="display:flex;gap:8px">
        <button class="as-btn" style="flex:1" data-as-skip="-15" title="Back a phrase (Left arrow)">⏮</button>
        <button class="as-btn primary" style="flex:1" id="as-playPauseBtn" title="Play/Pause (Spacebar)">▶ Play</button>
        <button class="as-btn" style="flex:1" data-as-skip="15" title="Forward a phrase (Right arrow)">⏭</button>
      </div>
      <button class="as-btn" style="width:100%" id="as-restartBtn" title="Restart THIS text from the beginning">⟲ Restart</button>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px">
      <button class="as-btn" style="width:100%;height:100%" id="as-voiceControlBtn">🎚 Voice Control</button>
      <button class="as-btn" style="width:100%" id="as-startOverBtn" title="Clear this text and paste something new">⟲ Start Over</button>
    </div>
  </div>
  <div style="border:1px solid var(--border,rgba(201,168,76,.55));border-radius:8px;padding:12px 14px;margin-bottom:14px;display:flex;align-items:center;gap:10px;flex-wrap:wrap">
    <span>🌙 Sleep after</span>
    <select id="as-sleepSelect">
      <option value="0">Off</option>
      <option value="15">15 min</option>
      <option value="30">30 min</option>
      <option value="45">45 min</option>
      <option value="60">60 min</option>
    </select>
    <span style="font-size:13px;font-style:italic;color:var(--dim,rgba(240,232,208,.42))">Click any word to jump there · Spacebar to pause/resume · arrow keys to skip</span>
    <span id="as-progress" style="margin-left:auto;color:var(--muted,rgba(240,232,208,.78));font-size:12px;white-space:nowrap"></span>
  </div>
  <div id="as-wordBox"></div>
</div>

<div class="amit-speak-overlay" id="as-voiceControlOverlay">
  <div class="as-popup">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
      <div style="font-family:'Cinzel',serif;font-size:11px;letter-spacing:.14em;color:var(--gold,#c9a84c);text-transform:uppercase">Amit's Voice</div>
      <button class="as-btn" id="as-vcCloseBtn" style="padding:4px 10px">✕</button>
    </div>
    <div style="color:var(--dim,rgba(240,232,208,.42));font-size:12px;line-height:1.6;margin-bottom:16px" id="as-vcSyncNote">Choose how Amit sounds for this devotion.</div>

    <label>Accent / Region</label>
    <select id="as-vcAccentSelect"></select>

    <label>Voice</label>
    <select id="as-voiceSelect"></select>

    <label>Speed — <span id="as-speedLabel">0.85x</span></label>
    <input type="range" id="as-speedSlider" min="0.5" max="2" step="0.05" value="0.85">

    <label>Tone (Pitch) — <span id="as-pitchLabel">1.00</span></label>
    <input type="range" id="as-pitchSlider" min="0.5" max="1.7" step="0.05" value="1.0">

    <label>Volume — <span id="as-volumeLabel">100%</span></label>
    <input type="range" id="as-volumeSlider" min="0" max="1" step="0.05" value="1">

    <label>Pacing (pause between sentences) — <span id="as-pacingLabel">Normal</span></label>
    <input type="range" id="as-pacingSlider" min="0.4" max="2.5" step="0.1" value="1.0" style="margin-bottom:6px">
    <div style="color:var(--dim,rgba(240,232,208,.42));font-size:11px;margin-bottom:16px">Saved to your Amit voice profile. Note: this reader plays continuously, word by word, so sentence pacing itself doesn't change what you hear here — it still carries over to how the Hub and Amit Mobile speak.</div>

    <button class="as-btn primary" id="as-hearItBtn" style="width:100%">🔊 Let Me Hear It</button>
  </div>
</div>
`;

const VC_ACCENT_LABELS={
  'en-US':'English (United States)','en-GB':'English (United Kingdom)',
  'en-AU':'English (Australia)','en-CA':'English (Canada)',
  'en-IE':'English (Ireland)','en-IN':'English (India)',
  'en-ZA':'English (South Africa)','en-NZ':'English (New Zealand)',
  'es-ES':'Spanish (Spain)','es-US':'Spanish (United States)',
  'es-MX':'Spanish (Mexico)','fr-FR':'French (France)',
  'fr-CA':'French (Canada)','de-DE':'German (Germany)',
  'it-IT':'Italian (Italy)','pt-BR':'Portuguese (Brazil)',
  'pt-PT':'Portuguese (Portugal)','ja-JP':'Japanese (Japan)',
  'zh-CN':'Chinese (Mainland)','ko-KR':'Korean (Korea)'
};
const VC_ALL='__ALL__', VC_OTHER='__OTHER__', VC_SMALL_THRESHOLD=5;

const SB_URL='https://hleqtjqojksurvkyqixt.supabase.co';
const SB_KEY='sb_publishable_0pptfPselXI0V9JmnhXgbA_dAGurCiF';

let db=null, _mounted=false, _cssInjected=false;
let _vcSmallLangs=new Set();
let lastSaveIndex=-1;
let SAVE_KEY='amit_speak_engine_save';
const state={words:[],index:0,rate:0.85,pitch:1.0,volume:1.0,pacing:1.0,voiceURI:null,started:false,textDirty:false,voices:[],sleepTimer:null,ownerContact:null};

function $(id){ return document.getElementById(id); }

function injectCss(){
  if(_cssInjected)return;
  const tag=document.createElement('style');
  tag.textContent=CSS_TEXT;
  document.head.appendChild(tag);
  _cssInjected=true;
}

// mount(containerId, opts) — opts.saveKey lets a page give its instance
// its own localStorage resume-key, so e.g. a Trumpets tab's reading
// position doesn't collide with a different tab's, if both ever get used
// on the same origin. Defaults to one shared key, matching today's usage.
function mount(containerId, opts){
  opts=opts||{};
  if(opts.saveKey) SAVE_KEY=opts.saveKey;
  injectCss();
  const container=typeof containerId==='string'?document.getElementById(containerId):containerId;
  if(!container)return;
  container.innerHTML=HTML_TEMPLATE;
  wireEvents();
  db=(typeof supabase!=='undefined')?supabase.createClient(SB_URL,SB_KEY):null;
  (async()=>{
    await populateVoiceList();
    await loadRealVoiceSettings();
    restoreSavedSession();
  })();
  _mounted=true;
}

// readText(text) — hand the engine a specific string and start reading it
// now. This is what a devotion tab calls with its own study content.
function readText(text){
  if(!_mounted)return;
  $('as-inputText').value=text;
  beginReading();
}

function wireEvents(){
  $('as-inputText').addEventListener('input', textEdited);
  $('as-playPauseBtn').addEventListener('click', togglePlayPause);
  $('as-restartBtn').addEventListener('click', ()=>readFrom(0));
  $('as-startOverBtn').addEventListener('click', newText);
  $('as-voiceControlBtn').addEventListener('click', openVoiceControl);
  $('as-vcCloseBtn').addEventListener('click', closeVoiceControl);
  $('as-hearItBtn').addEventListener('click', vcHearIt);
  $('as-sleepSelect').addEventListener('change', (e)=>sleepChanged(e.target.value));
  $('as-vcAccentSelect').addEventListener('change', (e)=>vcAccentChanged(e.target.value));
  $('as-voiceSelect').addEventListener('change', (e)=>voiceChanged(e.target.value));
  $('as-speedSlider').addEventListener('input', (e)=>speedChanged(e.target.value));
  $('as-pitchSlider').addEventListener('input', (e)=>pitchChanged(e.target.value));
  $('as-volumeSlider').addEventListener('input', (e)=>volumeChanged(e.target.value));
  $('as-pacingSlider').addEventListener('input', (e)=>pacingChanged(e.target.value));
  $('as-wordBox').addEventListener('click', wordClicked);
  $('as-voiceControlOverlay').addEventListener('click', (e)=>{ if(e.target.id==='as-voiceControlOverlay')closeVoiceControl(); });
  document.querySelectorAll('[data-as-skip]').forEach(btn=>{
    btn.addEventListener('click', ()=>skip(Number(btn.dataset.asSkip)));
  });
  document.addEventListener('keydown',(e)=>{
    if(!_mounted)return;
    if(e.target&&e.target.tagName==='TEXTAREA')return;
    if(!state.started)return;
    if(e.code==='Space'){ e.preventDefault(); togglePlayPause(); }
    else if(e.code==='ArrowLeft'){ e.preventDefault(); skip(-15); }
    else if(e.code==='ArrowRight'){ e.preventDefault(); skip(15); }
  });
}

async function loadRealVoiceSettings(){
  const statusEl=$('as-voiceStatus');
  if(!db)return;
  try{
    const { data:{ session } } = await db.auth.getSession();
    if(!session||!session.user)return;
    const contact=await getOrCreateOwnerContact(db,session.user.id,session.user.user_metadata?.full_name||'',session.user.email);
    if(!contact)return;
    state.ownerContact=contact;
    state.rate=contact.voice_rate?Number(contact.voice_rate):0.85;
    state.pitch=contact.voice_pitch?Number(contact.voice_pitch):1.0;
    state.volume=(contact.voice_volume!=null)?Number(contact.voice_volume):1.0;
    state.pacing=contact.voice_pause_scale?Number(contact.voice_pause_scale):1.0;
    if(contact.voice_name){
      const match=state.voices.find(v=>v.name===contact.voice_name);
      if(match)state.voiceURI=match.voiceURI;
    }
    syncVoiceControlUI();
    $('as-vcSyncNote').textContent='Signed in as '+session.user.email+' — changes here save to your Amit voice profile and apply in the Hub too.';
  }catch(e){}
}

function getVoicesReady(){
  return new Promise(resolve=>{
    let v=speechSynthesis.getVoices();
    if(v.length){resolve(v);return;}
    speechSynthesis.onvoiceschanged=()=>resolve(speechSynthesis.getVoices());
    setTimeout(()=>resolve(speechSynthesis.getVoices()),1500);
  });
}

function vcAccentLabel(lang){ return VC_ACCENT_LABELS[lang]||lang; }

async function populateVoiceList(){
  state.voices=await getVoicesReady();
  buildAccentDropdown();
  const preferred=state.voices.findIndex(v=>/natural|online/i.test(v.name)&&/en/i.test(v.lang));
  const defaultIdx=preferred>=0?preferred:0;
  if(state.voices.length){
    state.voiceURI=state.voices[defaultIdx].voiceURI;
    const lang=state.voices[defaultIdx].lang;
    const accentSel=$('as-vcAccentSelect');
    if(accentSel) accentSel.value=_vcSmallLangs.has(lang)?VC_OTHER:lang;
    buildVoiceDropdownForAccent(accentSel?accentSel.value:lang);
  }
}
function buildAccentDropdown(){
  const accentSel=$('as-vcAccentSelect');
  if(!accentSel)return;
  const countByLang={};
  state.voices.forEach(v=>{countByLang[v.lang]=(countByLang[v.lang]||0)+1;});
  _vcSmallLangs=new Set(Object.keys(countByLang).filter(l=>countByLang[l]<VC_SMALL_THRESHOLD));
  const bigLangs=Object.keys(countByLang).filter(l=>!_vcSmallLangs.has(l)).sort((a,b)=>vcAccentLabel(a).localeCompare(vcAccentLabel(b)));
  accentSel.innerHTML=`<option value="${VC_ALL}">All Accents — ${state.voices.length} voice(s)</option>`
    +bigLangs.map(l=>`<option value="${l}">${vcAccentLabel(l)} — ${countByLang[l]} voice(s)</option>`).join('');
  if(_vcSmallLangs.size){
    const otherCount=[..._vcSmallLangs].reduce((s,l)=>s+countByLang[l],0);
    accentSel.innerHTML+=`<option value="${VC_OTHER}">Other (${_vcSmallLangs.size} languages) — ${otherCount} voice(s)</option>`;
  }
}
function buildVoiceDropdownForAccent(lang){
  const sel=$('as-voiceSelect');
  if(!sel)return;
  const showCode=(lang===VC_ALL||lang===VC_OTHER);
  const matching=state.voices.filter(v=>{
    if(lang===VC_ALL)return true;
    if(lang===VC_OTHER)return _vcSmallLangs.has(v.lang);
    return v.lang===lang;
  });
  sel.innerHTML=matching.map(v=>{
    const realIdx=state.voices.indexOf(v);
    return `<option value="${realIdx}">${showCode?(v.name+' ('+v.lang+')'):v.name}</option>`;
  }).join('');
  const currentIdx=state.voices.findIndex(v=>v.voiceURI===state.voiceURI);
  if(currentIdx>=0&&matching.includes(state.voices[currentIdx])) sel.value=currentIdx;
  else if(matching.length){ sel.value=state.voices.indexOf(matching[0]); state.voiceURI=matching[0].voiceURI; }
}
function vcAccentChanged(lang){
  buildVoiceDropdownForAccent(lang);
  voiceChanged($('as-voiceSelect').value);
}
function voiceChanged(idx){
  const v=state.voices[Number(idx)];
  if(v){ state.voiceURI=v.voiceURI; if(state.started)readFrom(state.index); saveVoiceControlChange(); }
}

function syncVoiceControlUI(){
  const speedS=$('as-speedSlider'),speedL=$('as-speedLabel');
  const volS=$('as-volumeSlider'),volL=$('as-volumeLabel');
  const pitchS=$('as-pitchSlider'),pitchL=$('as-pitchLabel');
  const pacingS=$('as-pacingSlider'),pacingL=$('as-pacingLabel');
  if(speedS){speedS.value=state.rate;speedL.textContent=state.rate.toFixed(2)+'x';}
  if(volS){volS.value=state.volume;volL.textContent=Math.round(state.volume*100)+'%';}
  if(pitchS){pitchS.value=state.pitch;pitchL.textContent=state.pitch.toFixed(2);}
  if(pacingS){pacingS.value=state.pacing;pacingL.textContent=pacingLabelFor(state.pacing);}
  const v=state.voices.find(x=>x.voiceURI===state.voiceURI);
  if(v){
    const accentSel=$('as-vcAccentSelect');
    if(accentSel){
      const groupVal=_vcSmallLangs.has(v.lang)?VC_OTHER:v.lang;
      accentSel.value=groupVal;
      buildVoiceDropdownForAccent(groupVal);
    }
  }
}
function pacingLabelFor(scale){
  if(scale<=0.7)return'Quick';
  if(scale<1.0)return'A little quicker';
  if(scale===1.0)return'Normal';
  if(scale<1.6)return'More room to think';
  return'Much slower';
}
function pitchChanged(val){
  state.pitch=Number(val);
  $('as-pitchLabel').textContent=state.pitch.toFixed(2);
  if(state.started)readFrom(state.index);
  saveVoiceControlChange();
}
function pacingChanged(val){
  state.pacing=Number(val);
  $('as-pacingLabel').textContent=pacingLabelFor(state.pacing);
  saveVoiceControlChange();
}
function openVoiceControl(){
  syncVoiceControlUI();
  $('as-voiceControlOverlay').style.display='flex';
}
function closeVoiceControl(){
  $('as-voiceControlOverlay').style.display='none';
}
function vcHearIt(){
  const v=state.voices.find(x=>x.voiceURI===state.voiceURI);
  const u=new SpeechSynthesisUtterance('This is how Amit sounds with these settings.');
  if(v)u.voice=v;
  u.rate=state.rate; u.pitch=state.pitch; u.volume=state.volume;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}
let _vcSaveTimer=null;
function saveVoiceControlChange(){
  if(!state.ownerContact||!db)return;
  clearTimeout(_vcSaveTimer);
  _vcSaveTimer=setTimeout(async()=>{
    const v=state.voices.find(x=>x.voiceURI===state.voiceURI);
    try{
      await saveOwnerContactFields(db,state.ownerContact.id,{
        voice_rate:state.rate, voice_pitch:state.pitch, voice_volume:state.volume,
        voice_pause_scale:state.pacing, voice_name:v?v.name:state.ownerContact.voice_name
      });
    }catch(e){}
  },500);
}

function saveProgress(){
  if(state.index===lastSaveIndex)return;
  lastSaveIndex=state.index;
  try{
    localStorage.setItem(SAVE_KEY,JSON.stringify({words:state.words,index:state.index,rate:state.rate,volume:state.volume,voiceURI:state.voiceURI}));
  }catch(e){}
}
function clearSaved(){ try{localStorage.removeItem(SAVE_KEY);}catch(e){} }
function restoreSavedSession(){
  let saved=null;
  try{ saved=JSON.parse(localStorage.getItem(SAVE_KEY)||'null'); }catch(e){}
  if(saved&&saved.words&&saved.words.length&&saved.index<saved.words.length){
    state.words=saved.words;
    state.rate=saved.rate||0.85;
    state.volume=(saved.volume!==undefined)?saved.volume:1.0;
    if(saved.voiceURI)state.voiceURI=saved.voiceURI;
    syncVoiceControlUI();
    renderWords();
    state.started=true;
    lastSaveIndex=saved.index;
    readFrom(saved.index);
  }
}

// The textarea and the word-box share one slot — exactly one of them is
// visible at a time, swapped explicitly rather than left to both render
// simultaneously (the real bug this whole section fixes).
function showWordBox(){
  $('as-inputText').style.display='none';
  $('as-wordBox').classList.add('showing');
}
function showTextarea(){
  $('as-wordBox').classList.remove('showing');
  $('as-inputText').style.display='';
}

function renderWords(){
  $('as-wordBox').innerHTML=state.words.map((w,i)=>
    `<span class="as-word" data-i="${i}">${w.replace(/</g,'&lt;')}</span>`
  ).join('');
  showWordBox();
}
function beginReading(){
  const raw=$('as-inputText').value;
  if(!raw||!raw.trim())return;
  state.words=raw.match(/\S+\s*/g)||[raw];
  lastSaveIndex=-1;
  renderWords();
  state.started=true;
  state.textDirty=false;
  readFrom(0);
}
function textEdited(){ state.textDirty=true; }
function newText(){
  speechSynthesis.cancel();
  clearSleepTimer();
  clearSaved();
  $('as-inputText').value='';
  $('as-wordBox').innerHTML='';
  $('as-progress').textContent='';
  state.started=false;
  state.textDirty=false;
  $('as-playPauseBtn').textContent='▶ Play';
  showTextarea();
}
function highlight(i){
  const prev=document.querySelector('.as-word.active');
  if(prev)prev.classList.remove('active');
  const el=document.querySelector(`.as-word[data-i="${i}"]`);
  if(el){ el.classList.add('active'); el.scrollIntoView({block:'center',behavior:'smooth'}); }
}
function updateProgress(){
  if(!state.words.length)return;
  const pct=Math.round((state.index/state.words.length)*100);
  $('as-progress').textContent=`Word ${state.index+1} of ${state.words.length} (${pct}%)`;
}
function readFrom(startIndex){
  speechSynthesis.cancel();
  const prev=document.querySelector('.as-word.active');
  if(prev)prev.classList.remove('active');
  if(startIndex>=state.words.length)return;
  state.index=startIndex;
  const remaining=state.words.slice(startIndex);
  const text=remaining.join('');
  const u=new SpeechSynthesisUtterance(text);
  const voice=state.voices.find(v=>v.voiceURI===state.voiceURI);
  if(voice)u.voice=voice;
  u.rate=state.rate;
  u.volume=state.volume;
  u.pitch=state.pitch;
  u.onboundary=(e)=>{
    if(e.name&&e.name!=='word')return;
    let acc=0;
    for(let k=0;k<remaining.length;k++){
      acc+=remaining[k].length;
      if(e.charIndex<acc){ highlight(startIndex+k); state.index=startIndex+k; updateProgress(); saveProgress(); break; }
    }
  };
  u.onend=()=>{
    const el=document.querySelector('.as-word.active');
    if(el)el.classList.remove('active');
    if(state.index>=state.words.length-1)clearSaved();
  };
  $('as-playPauseBtn').textContent='⏸ Pause';
  speechSynthesis.speak(u);
  updateProgress();
}
function togglePlayPause(){
  const btn=$('as-playPauseBtn');
  if(!state.started||state.textDirty){
    beginReading();
  } else if(speechSynthesis.speaking&&!speechSynthesis.paused){
    speechSynthesis.pause(); btn.textContent='▶ Resume'; saveProgress();
  } else if(speechSynthesis.paused){
    speechSynthesis.resume(); btn.textContent='⏸ Pause';
  } else { readFrom(state.index); }
}
function skip(delta){
  if(!state.started)return;
  let t=state.index+delta;
  if(t<0)t=0; if(t>=state.words.length)t=state.words.length-1;
  readFrom(t);
}
function speedChanged(val){
  state.rate=Number(val);
  $('as-speedLabel').textContent=state.rate.toFixed(2)+'x';
  if(state.started)readFrom(state.index);
  saveVoiceControlChange();
}
function volumeChanged(val){
  state.volume=Number(val);
  $('as-volumeLabel').textContent=Math.round(state.volume*100)+'%';
  if(state.started)readFrom(state.index);
  saveVoiceControlChange();
}
function wordClicked(e){
  if(!state.started)return;
  const el=e.target.closest('.as-word');
  if(!el)return;
  const i=Number(el.dataset.i);
  if(!isNaN(i)&&i!==state.index)readFrom(i);
}
function clearSleepTimer(){ if(state.sleepTimer){clearTimeout(state.sleepTimer);state.sleepTimer=null;} }
function sleepChanged(minutes){
  clearSleepTimer();
  const mins=Number(minutes);
  if(!mins)return;
  state.sleepTimer=setTimeout(()=>{
    speechSynthesis.cancel();
    saveProgress();
    $('as-playPauseBtn').textContent='▶ Resume';
  },mins*60000);
}

return { mount, readText };
})();
