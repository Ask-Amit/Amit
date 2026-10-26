const fs=require('fs'),vm=require('vm');
const h=fs.readFileSync(process.argv[2]||'AmitFix.html','utf8');
[...h.matchAll(/\n<script>\n([\s\S]*?)\n<\/script>/g)].forEach((x,i)=>{
  try{ new vm.Script(x[1],{filename:'script'+i}); console.log('script',i,'ok'); }
  catch(e){ const ln=(e.stack.match(/script\d+:(\d+)/)||[])[1]; console.log('script',i,'ERR',e.message,'line',ln); if(ln) console.log(x[1].split('\n')[ln-1].slice(0,200)); }
});
