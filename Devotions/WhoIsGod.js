/* WHO IS GOD, inside Devotions (started 2026-10-15).
   Structure: ONE sidebar page (page 4) holding all 18 who_is_god tabs on the template's MULTI-ROW TAB VIEW layout (a verbatim copy of it sits at the top
   of Devotions.html's script: mrtCreate / mrtSelect / .mrt-* CSS). Tabs fill a row, the next row stacks behind it, and the row you click comes to the front.
   Deep links #page=4&tab=N still work (each tab button carries data-tabnum). Nothing in the template's infrastructure is changed; Devotions.html only adds this page.
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
var WIG_VER='1.40';
var WIG_GROUPS=[
  // ONE sidebar page. The tabs sit on the Multi-Row Tab View (stacked rows like Word's Options dialog); the row you click comes to the front.
  {n:4,icon:'📖',name:'Who Is God',tabs:[
    ['onereligion','Which Religion Is True?'],['method','Approach'],['covenants','The Covenants'],['arguments','The 12 Key Arguments'],
    ['language','Original Language'],['onebody','One Body'],['millennial','Millennial Proof'],['apocrypha','Additional Texts'],
    ['scores','Church Comparisons'],['synthesis','Seven Churches'],['lampstands','The Seven Lampstands'],['doihaveitwrong','Do I Have It Wrong?'],
    ['rapture','Pre/Mid/Post'],['saved','Are You Saved?'],['transparency','Research Transparency'],['install','Use & Install'],
    ['amit-life','Yeshua'],['paleo-heb','Ancient Hebrew']
  ]}
];
// Links made in the first version of this move (seven sidebar pages, 4-10) still land on the right tab.
var WIG_OLD_PAGES={4:['onereligion','method','apocrypha'],5:['covenants','arguments','onebody'],6:['scores','synthesis','lampstands','doihaveitwrong'],7:['millennial','rapture'],8:['amit-life','saved'],9:['language','paleo-heb'],10:['transparency','install']};
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
    return '<div class="page-nav" id="page-'+g.n+'" onclick="openPage('+g.n+')" data-tip="'+g.name+'">'+
      '<div class="page-icon">'+g.icon+'</div>'+
      '<div class="page-info"><div class="page-name">'+g.name+'</div><div class="page-sub">The investigation</div></div></div>';
  }).join('');
}
function wigDetailHtml(){
  return WIG_GROUPS.map(function(g){
    return '<div class="detail" id="detail-'+g.n+'" style="flex-direction:column">'+
      '<div class="detail-head"><span class="detail-heading" id="detail-heading-'+g.n+'" data-base="'+g.name+'">'+g.name+' — '+g.tabs[0][1].replace(/&/g,'&amp;')+'</span></div>'+
      '<div id="wig-mrt"></div></div>';
  }).join('');
}
// Builds the Multi-Row Tab View for the page. Every tab's panel is put on the page right away (not on first click), because who_is_god's own
// scripts build their tables and maps across all the tabs when they load. Called at the end of every renderAllPages().
var wigLastTab=null;
function wigMount(){
  var g=WIG_GROUPS[0],el=document.getElementById('wig-mrt');if(!el||typeof mrtCreate!=='function')return;
  var tabs=g.tabs.map(function(t){return {id:t[0],label:t[1]};});
  var inst=mrtCreate('wig-mrt',tabs,{initial:wigLastTab||tabs[0].id,onSelect:function(id){
    wigLastTab=id;
    var n=WIG_INDEX[id].tab,lab=WIG_INDEX[id].label;
    if(history.replaceState)history.replaceState(null,'','#page='+g.n+'&tab='+n);
    var h=document.getElementById('detail-heading-'+g.n);if(h)h.textContent=h.dataset.base+' — '+lab;
    if(typeof updateHeaderContext==='function')updateHeaderContext(g.n);
  }});
  if(!inst)return;
  var nav=el.querySelector('.mrt-nav');nav.id='ch-tab-nav-'+g.n;                     // so the #page=4&tab=N link finds its button
  tabs.forEach(function(t,i){
    var b=el.querySelector('.mrt-btn[data-mrt-id="'+t.id+'"]');if(b)b.setAttribute('data-tabnum',i+1);
    var pane=el.querySelector('.mrt-content[data-mrt-pane="'+t.id+'"]');
    if(pane){pane.innerHTML='<div class="wig-content" data-wig-tab="'+t.id+'"><div class="wig-loading">Loading&hellip;</div></div>';inst.mounted[t.id]=true;}
  });
  var h=document.getElementById('detail-heading-'+g.n);
  var cur=WIG_INDEX[inst.activeId];if(h&&cur)h.textContent=h.dataset.base+' — '+cur.label;
}
// The header's CONTEXT line reads the open tab from a .ch-tab-btn; this page's tabs are .mrt-btn, so that line is completed here.
(function(){
  var t=setInterval(function(){
    if(typeof updateHeaderContext!=='function')return;
    clearInterval(t);
    var o=updateHeaderContext;
    window.updateHeaderContext=function(n){
      o(n);
      if(n===4){var b=document.querySelector('#wig-mrt .mrt-btn.active'),s=document.getElementById('pageContextSub');if(b&&s)s.textContent=b.textContent;}
    };
  },30);
})();
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
  wigMount();
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
// An old link like #page=6&tab=3 (first version, seven pages) is rewritten to the single page before Devotions reads the address.
(function(){
  var m=location.hash.match(/#page=(\d+)(?:&tab=(\d+))?/);
  if(!m)return;var p=+m[1];
  if(WIG_OLD_PAGES[p]&&p!==4||(p===4&&m[2]&&WIG_OLD_PAGES[4])){
    var id=WIG_OLD_PAGES[p][(+m[2]||1)-1];
    if(id&&WIG_INDEX[id]){history.replaceState(null,'','#page=4&tab='+WIG_INDEX[id].tab);}
  }
})();
// Links inside the moved text call showTab('<who_is_god tab id>'): send them to the new page and tab.
window.showTab=function(id){
  var t=WIG_INDEX[id];
  if(t&&wigIsMoved(id)){
    openPage(t.page);
    if(t.page===4&&typeof mrtSelect==='function'){mrtSelect('wig-mrt',id);return;}
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
