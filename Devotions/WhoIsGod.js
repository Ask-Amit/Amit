/* WHO IS GOD, inside Devotions (started 2026-10-15).
   Structure: each GROUP is one sidebar page (pages 4-10) and the who_is_god tabs sit inside it as the page's tabs. This uses the
   template's own page/tab system exactly as it is (same markup as Difficult Passages: .ch-tab-nav, .ch-tab-btn, .ch-tab-content,
   showChTab, #page=N&tab=N deep links). Nothing in the template's infrastructure is changed; Devotions.html only adds these pages.
   Content: every tab is a verbatim copy of the who_is_god tab in whoisgod/<id>.html, styled by WhoIsGod.css (scoped under .wig-content).
   Text tabs (WIG_STATIC) are filled right away. Interactive tabs (WIG_APP_TABS) need who_is_god's own scripts and data, which are
   copied unchanged into wig-app/blk*.js and loaded only when someone first opens one of those tabs.
   who_is_god.html itself is never changed by this move (apart from its #tab= link support). Edits made to the COPIED scripts, all by the generator:
     - blk8: showTab removed (WhoIsGod.js provides it, routing to the Devotions pages).
   who_is_god builds several tables when the page finishes loading (document DOMContentLoaded). In Devotions that moment has already passed, so wigLoadFiles()
   collects those registrations while the copied scripts load and wigAfterApp() runs them once the tab HTML is on the page.
     - blk3: the map checks root.offsetParent instead of an "active" class (Devotions shows tabs differently), and re-initialises if its element was replaced.
   Research eyes keep reading their notes from who_is_god.html through Devotions' own openResearch(). */
var WIG_SRC='../who_is_god/who_is_god.html';
var WIG_VER='1.38';
var WIG_GROUPS=[
  {n:4,icon:'🔍',name:'The Evidence',tabs:[['onereligion','Which Religion Is True?'],['method','Approach'],['apocrypha','Additional Texts']]},
  {n:5,icon:'⚖️',name:'Torah and the Covenants',tabs:[['covenants','The Covenants'],['arguments','The 12 Key Arguments'],['onebody','One Body']]},
  {n:6,icon:'🕯️',name:'The Churches',tabs:[['scores','Church Comparisons'],['synthesis','Seven Churches'],['lampstands','The Seven Lampstands'],['doihaveitwrong','Do I Have It Wrong?']]},
  {n:7,icon:'⏳',name:'What Is Ahead',tabs:[['millennial','Millennial Proof'],['rapture','Pre/Mid/Post']]},
  {n:8,icon:'🕊️',name:'Yeshua',tabs:[['amit-life','Yeshua'],['saved','Are You Saved?']]},
  {n:9,icon:'🔤',name:'The Language',tabs:[['language','Original Language'],['paleo-heb','Ancient Hebrew']]},
  {n:10,icon:'ℹ️',name:'About',tabs:[['transparency','Research Transparency'],['install','Use & Install']]}
];
// Text-only tabs: filled as soon as the pages are drawn.
var WIG_STATIC={method:1,arguments:1,onebody:1,apocrypha:1,doihaveitwrong:1,language:1,millennial:1,appointed:1};
// Tabs that run who_is_god's scripts: filled when one of them is first shown.
var WIG_APP_TABS={onereligion:1,covenants:1,scores:1,synthesis:1,lampstands:1,rapture:1,saved:1,transparency:1,install:1,'amit-life':1,'paleo-heb':1};
var WIG_APP_FILES=['blk1','blk2','blk4','blk6','blk7','blk8','blk9','blk3'];   // loaded in this order, same order as in who_is_god.html
var WIG_INDEX={};  // tab id -> {page,tab}
WIG_GROUPS.forEach(function(g){g.tabs.forEach(function(t,i){WIG_INDEX[t[0]]={page:g.n,tab:i+1,label:t[1]};});});
// The Appointed Times is not in a Who Is God group: it is the introduction tab of Feasts of the Lord (page 2, tab number 8, shown first).
WIG_INDEX.appointed={page:2,tab:8,label:'The Appointed Times'};
function wigIsMoved(id){return !!(WIG_STATIC[id]||WIG_APP_TABS[id]);}
var wigCache={};
var wigAppPromise=null,wigAppReady=false,wigObs=null,wigDCL=[];

function wigNavHtml(){
  return WIG_GROUPS.map(function(g){
    return '<div class="page-nav" id="page-'+g.n+'" onclick="openPage('+g.n+')" data-tip="'+g.name+' (Who Is God)">'+
      '<div class="page-icon">'+g.icon+'</div>'+
      '<div class="page-info"><div class="page-name">'+g.name+'</div><div class="page-sub">Who Is God</div></div></div>';
  }).join('');
}
function wigTabsHtml(g){
  var nav='',body='';
  g.tabs.forEach(function(t,i){
    var n=i+1;
    nav+='<button class="ch-tab-btn'+(n===1?' active':'')+'" data-tabnum="'+n+'" onclick="showChTab('+g.n+','+n+')">'+t[1].replace(/&/g,'&amp;')+'</button>';
    body+='<div class="ch-tab-content'+(n===1?' active':'')+'" id="ch-tab-'+g.n+'-'+n+'"><div class="wig-content" data-wig-tab="'+t[0]+'"><div class="wig-loading">Loading&hellip;</div></div></div>';
  });
  return '<div class="ch-tab-nav" id="ch-tab-nav-'+g.n+'" style="padding-top:16px">'+nav+'</div><div class="ch-tab-main">'+body+'</div>';
}
function wigDetailHtml(){
  return WIG_GROUPS.map(function(g){
    return '<div class="detail" id="detail-'+g.n+'" style="flex-direction:column">'+
      '<div class="detail-head"><span class="detail-heading" id="detail-heading-'+g.n+'" data-base="'+g.name+'">'+g.name+' — '+g.tabs[0][1].replace(/&/g,'&amp;')+'</span></div>'+
      wigTabsHtml(g)+'</div>';
  }).join('');
}
function wigPlaceholder(id){
  var t=WIG_INDEX[id];
  return '<div class="wig-pending"><h2 class="section-heading" style="margin-top:0">'+(t?t.label:id)+'</h2>'+
    '<p>This tab could not be loaded here. You can still read it in the original Who Is God page.</p>'+
    '<p><a class="wig-open" href="'+WIG_SRC+'#tab='+id+'" target="_blank" rel="noopener">Open this tab in Who Is God &rarr;</a></p></div>';
}
function wigFill(el,html){el.innerHTML=html;}
function wigFetchTab(id){
  if(wigCache[id])return Promise.resolve(wigCache[id]);
  return fetch('whoisgod/'+id+'.html?v='+WIG_VER).then(function(r){if(!r.ok)throw new Error(r.status);return r.text();}).then(function(t){wigCache[id]=t;return t;});
}
// Called at the end of every renderAllPages() (it can run more than once, e.g. when sign-in settles).
function wigHydrate(){
  document.querySelectorAll('.wig-content[data-wig-tab]').forEach(function(el){
    var id=el.getAttribute('data-wig-tab');
    if(WIG_STATIC[id]){
      wigFetchTab(id).then(function(t){document.querySelectorAll('.wig-content[data-wig-tab="'+id+'"]').forEach(function(e){wigFill(e,t);});})
        .catch(function(){document.querySelectorAll('.wig-content[data-wig-tab="'+id+'"]').forEach(function(e){wigFill(e,wigPlaceholder(id));});});
      return;
    }
    if(!WIG_APP_TABS[id]){wigFill(el,wigPlaceholder(id));return;}
    if(wigAppReady&&wigCache[id]){wigFill(el,wigCache[id]);return;}   // pages were redrawn after the scripts loaded
    wigWatch(el);
  });
  if(wigAppReady)wigAfterApp();
}
// Interactive tabs wait until one of them is actually on screen.
function wigWatch(el){
  if(!('IntersectionObserver' in window)){wigActivate();return;}
  if(!wigObs)wigObs=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){wigActivate();}});});
  wigObs.observe(el);
}
function wigLoadScript(src){
  return new Promise(function(res,rej){var s=document.createElement('script');s.src=src;s.onload=res;s.onerror=function(){rej(new Error('could not load '+src));};document.head.appendChild(s);});
}
function wigLoadFiles(){
  var orig=document.addEventListener;
  document.addEventListener=function(t,f,o){if(t==='DOMContentLoaded'&&typeof f==='function'){wigDCL.push(f);return;}return orig.call(document,t,f,o);};
  var done=function(){document.addEventListener=orig;};
  return WIG_APP_FILES.reduce(function(p,f){return p.then(function(){return wigLoadScript('wig-app/'+f+'.js?v='+WIG_VER);});},Promise.resolve()).then(done,function(e){done();throw e;});
}
function wigActivate(){
  if(wigAppPromise)return wigAppPromise;
  var ids=Object.keys(WIG_APP_TABS).concat(Object.keys(WIG_STATIC));
  wigAppPromise=Promise.all(ids.map(wigFetchTab)).then(function(){
    // every tab's HTML must be on the page before the scripts run: some of them build their tables the moment they load
    document.querySelectorAll('.wig-content[data-wig-tab]').forEach(function(el){
      var id=el.getAttribute('data-wig-tab');
      if(wigCache[id]&&el.querySelector('.wig-loading'))wigFill(el,wigCache[id]);
    });
    return wigLoadFiles();
  }).then(function(){
    wigAppReady=true;wigAfterApp();
  }).catch(function(e){
    console.error('Who Is God scripts failed:',e);wigAppPromise=null;
    document.querySelectorAll('.wig-content[data-wig-tab]').forEach(function(el){if(WIG_APP_TABS[el.getAttribute('data-wig-tab')]&&el.querySelector('.wig-loading'))wigFill(el,wigPlaceholder(el.getAttribute('data-wig-tab')));});
  });
  return wigAppPromise;
}
// The Hebrew word popup lives outside the tabs in who_is_god, so it is added once to the page here.
function wigHebModal(){
  if(document.getElementById('heb-word-modal'))return;
  var d=document.createElement('div');d.className='wig-content wig-host';
  d.innerHTML='<div id="heb-word-modal" onclick="closeHebModal()" style="display:none;position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.6);align-items:center;justify-content:center;padding:20px;">'+
    '<div onclick="event.stopPropagation()" style="background:var(--parchment);border:2px solid var(--gold);border-radius:12px;padding:28px 30px;max-width:560px;width:100%;max-height:88vh;overflow-y:auto;position:relative;box-shadow:0 8px 40px rgba(0,0,0,.4);">'+
    '<button onclick="closeHebModal()" style="position:absolute;top:14px;right:16px;background:none;border:none;cursor:pointer;font-size:1.4em;color:var(--muted);">&times;</button>'+
    '<div id="heb-modal-content"></div></div></div>';
  document.body.appendChild(d);
}
// Runs once the scripts have loaded, and again after any later redraw of the pages.
var wigLampObs=null;
function wigAfterApp(){
  wigHebModal();
  wigDCL.forEach(function(f){try{f();}catch(e){console.error('Who Is God init failed:',e);}});
  var l=document.querySelector('.wig-content[data-wig-tab="lampstands"]');
  if(l&&typeof lampstandsStart==='function'&&'IntersectionObserver' in window){
    if(wigLampObs)wigLampObs.disconnect();
    // the map animates only while its tab is on screen, so (re)start it each time the tab is shown
    wigLampObs=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){try{lampstandsStart();}catch(x){console.error(x);}}});});
    wigLampObs.observe(l);
  }
}
// Links inside the moved text call showTab('<who_is_god tab id>'): send them to the new page and tab.
window.showTab=function(id){
  var t=WIG_INDEX[id];
  if(t&&wigIsMoved(id)){
    openPage(t.page);
    var b=document.querySelector('#ch-tab-nav-'+t.page+' [data-tabnum="'+t.tab+'"]');
    if(b)b.click();
    return;
  }
  window.open(WIG_SRC+'#tab='+encodeURIComponent(id),'_blank');
};
// "Use & Install" has a button that calls openAmit(); it was never defined in who_is_god. Here it opens the Ask Amit panel.
window.openAmit=function(){if(typeof askAmitLive==='function')askAmitLive('whoisgod');};
// Research eyes inside the moved text: <sup class="rn-mark" data-rn="R10,R9"> opens Devotions' own research popup.
document.addEventListener('click',function(e){
  var t=e.target&&e.target.closest?e.target.closest('.wig-content [data-rn]'):null;
  if(!t)return;
  e.preventDefault();e.stopPropagation();
  if(typeof openResearch==='function')openResearch(t.getAttribute('data-rn'),e);
},true);
