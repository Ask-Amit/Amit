const fs=require('fs');
let t=fs.readFileSync('../Templates/template.html','utf8');
const css=fs.readFileSync('fix_css.txt','utf8'), js=fs.readFileSync('fix_js.txt','utf8');
function rep(a,b){ if(t.split(a).length!==2) throw new Error('anchor not unique/missing: '+a.slice(0,60)); t=t.replace(a,()=>b); }
t=t.replace('\n<title>Template</title>','\n<title>AmitFix</title>');
rep('id="pageTitle" style="font-size:19px">Template</div>','id="pageTitle" style="font-size:19px">AmitFix</div>');
rep('id="pageVersion">v1.01</div>','id="pageVersion">v1.05</div>');
rep("let builderMode=localStorage.getItem(BUILDER_MODE_KEY)!=='off';","let builderMode=false; // AmitFix is a finished, fixed set of pages: Add Page is never shown");
rep("onclick=\"askAmitLive('TEMPLATE_NOT_CONFIGURED')\"","onclick=\"askAmitLive('amitfix')\"");
rep('<script src="../amit_appearance.js?v=1.06"></script>','<script src="../amit_appearance.js?v=1.06"></script>\n<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"></script>');
rep('.ch-tab-content.active{display:block}\n</style>', '.ch-tab-content.active{display:block}\n'+css+'</style>');
const a=t.indexOf('function renderAllPages(){'), b=t.indexOf('function finalizeBuilderMode(){');
if(a<0||b<0||b<a) throw new Error('renderAllPages bounds');
t=t.slice(0,a)+js+t.slice(b);
rep('customPages=await loadCustomPages();\n  renderAllPages();','customPages=[];\n  renderAllPages();\n  { const pr=fxParams.get(\'problem\'); if(pr&&FX_SYMPTOMS[pr]) fxPick(pr); const pg=parseInt(fxParams.get(\'page\')||\'0\',10); if(pg>=1&&pg<=6) openPage(pg); }');
fs.writeFileSync('AmitFix.html',t);
console.log('ok',t.length);
// (appended) cache-bust so the new Ask Amit context is fetched
{ let h=fs.readFileSync('AmitFix.html','utf8'); const a='<script src="../Amit_Ask_Live.js?v=6.17"></script>'; if(h.split(a).length!==2) throw new Error('ask tag'); fs.writeFileSync('AmitFix.html',h.replace(a,'<script src="../Amit_Ask_Live.js?v=6.18"></script>')); }
