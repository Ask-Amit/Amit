/* WHO IS GOD, inside Devotions (started 2026-10-15).
   Structure: each GROUP is one sidebar page (pages 4-10) and the who_is_god tabs sit inside it as the page's tabs. This uses the
   template's own page/tab system exactly as it is (same markup as Difficult Passages: .ch-tab-nav, .ch-tab-btn, .ch-tab-content,
   showChTab, #page=N&tab=N deep links). Nothing in the template's infrastructure is changed; Devotions.html only adds these pages.
   Content: text tabs are verbatim copies of the who_is_god tabs in whoisgod/<id>.html, styled by WhoIsGod.css (scoped under .wig-content).
   Tabs whose scripts and data have not moved yet (WIG_PORTED false) show a card that opens the original tab in who_is_god.html.
   Research eyes keep reading their notes from who_is_god.html through Devotions' own openResearch(). */
var WIG_SRC='../who_is_god/who_is_god.html';
var WIG_GROUPS=[
  {n:4,icon:'🔍',name:'The Evidence',tabs:[['onereligion','Which Religion Is True?'],['method','Approach'],['apocrypha','Additional Texts']]},
  {n:5,icon:'⚖️',name:'Torah and the Covenants',tabs:[['covenants','The Covenants'],['arguments','The 12 Key Arguments'],['onebody','One Body'],['appointed','The Appointed Times']]},
  {n:6,icon:'🕯️',name:'The Churches',tabs:[['scores','Church Comparisons'],['synthesis','Seven Churches'],['lampstands','The Seven Lampstands'],['doihaveitwrong','Do I Have It Wrong?']]},
  {n:7,icon:'⏳',name:'What Is Ahead',tabs:[['millennial','Millennial Proof'],['rapture','Pre/Mid/Post']]},
  {n:8,icon:'🕊️',name:'Yeshua',tabs:[['amit-life','Yeshua'],['saved','Are You Saved?']]},
  {n:9,icon:'🔤',name:'The Language',tabs:[['language','Original Language'],['paleo-heb','Ancient Hebrew']]},
  {n:10,icon:'ℹ️',name:'About',tabs:[['transparency','Research Transparency'],['install','Use & Install']]}
];
// Tabs already moved (their text lives in whoisgod/<id>.html). Add an id here when its fragment, scripts and data are in place.
var WIG_PORTED={method:1,arguments:1,onebody:1,apocrypha:1,doihaveitwrong:1,language:1,millennial:1,appointed:1};
var WIG_INDEX={};  // tab id -> {page,tab}
WIG_GROUPS.forEach(function(g){g.tabs.forEach(function(t,i){WIG_INDEX[t[0]]={page:g.n,tab:i+1,label:t[1]};});});
var wigCache={};

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
    '<p>This tab is still being moved into Devotions. Its interactive parts need their scripts and data brought over first, so for now it opens in the original Who Is God page.</p>'+
    '<p><a class="wig-open" href="'+WIG_SRC+'#tab='+id+'" target="_blank" rel="noopener">Open this tab in Who Is God &rarr;</a></p></div>';
}
function wigFill(el,html){el.innerHTML=html;}
function wigHydrate(){
  document.querySelectorAll('.wig-content[data-wig-tab]').forEach(function(el){
    var id=el.getAttribute('data-wig-tab');
    if(!WIG_PORTED[id]){wigFill(el,wigPlaceholder(id));return;}
    if(wigCache[id]){wigFill(el,wigCache[id]);return;}
    fetch('whoisgod/'+id+'.html').then(function(r){if(!r.ok)throw new Error(r.status);return r.text();}).then(function(t){
      wigCache[id]=t;
      document.querySelectorAll('.wig-content[data-wig-tab="'+id+'"]').forEach(function(e){wigFill(e,t);});
    }).catch(function(){
      document.querySelectorAll('.wig-content[data-wig-tab="'+id+'"]').forEach(function(e){wigFill(e,wigPlaceholder(id));});
    });
  });
}
// Links inside the moved text call showTab('<who_is_god tab id>'). Send them to the new page/tab when it has moved, otherwise to the original.
window.showTab=function(id){
  var t=WIG_INDEX[id];
  if(t&&WIG_PORTED[id]){
    openPage(t.page);
    var b=document.querySelector('#ch-tab-nav-'+t.page+' [data-tabnum="'+t.tab+'"]');
    if(b)b.click();
    return;
  }
  window.open(WIG_SRC+'#tab='+encodeURIComponent(id),'_blank');
};
// Research eyes inside the moved text: <sup class="rn-mark" data-rn="R10,R9"> opens Devotions' own research popup.
document.addEventListener('click',function(e){
  var t=e.target&&e.target.closest?e.target.closest('.wig-content [data-rn]'):null;
  if(!t)return;
  e.preventDefault();e.stopPropagation();
  if(typeof openResearch==='function')openResearch(t.getAttribute('data-rn'),e);
},true);
