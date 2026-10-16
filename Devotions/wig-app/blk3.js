/* Copied from who_is_god.html script block 3 (Devotions v1.38). Edits are listed in WhoIsGod.js. */

/* ===== THE SEVEN LAMPSTANDS: 3D map of every church on the scorecard (added v1.13) =====
   Reads the live DENOM_DATA, CHURCH_DENOM_DATA and DENOM_ABOUT, so it always matches the scorecard and the Seven Churches mapping.
   Distance from the center = how far the scorecard total is from 170. Direction = which letters the church leans toward. */
(function(){
  var root=null,cv,ctx,tip,W=0,H=0,DPR=1,inited=false,running=false;
  var yaw=0.55,pitch=0.32,zoom=1,auto=true,showAll=false,sel=null,selLetter=null,hov=null,filter=null;
  var tween=null,lastT=0,hits=[],dragging=false,lx=0,ly=0,moved=0,ptrs={},pinch0=0,zoom0=1,DEN=[],FLOORS={};
  var CAMD=3.4;
  var SHORT={0:'Messianic',1:'Hebrew Roots',2:'Nazarene Israel',3:'CoG 7th Day',4:'WCG (HWA era)',5:'Adventist',6:'Conserv. Anabaptist',7:'Eastern Orthodox',8:'Reformed',9:'Southern Baptist',10:'Lutheran (conf.)',11:'Non-denom',12:'Methodist',13:'Pentecostal',14:'Anglican/Episc.',15:'Catholic',16:"Jehovah's Wit.",17:'LDS',18:'Prosperity',19:'Unitarian Univ.',20:'Amish',21:'Mennonite',22:'Churches of Christ',23:'Disciples',24:'UCC',25:'PC(USA)',26:'ELCA',27:'Natl Baptist',28:'Amer. Baptist',29:'AME',30:'Nazarene/Holiness',31:'ACNA',32:'COGIC',33:'Assemblies of God',34:'Oneness Pent.',35:'NAR / Megachurch',36:'Calvary Chapel',37:'Real Life',38:'Christian Science',39:'Unity',40:'Iglesia ni Cristo',41:'Comm. of Christ',42:'Oriental Orthodox',43:'Quaker',44:'Armstrongite',45:'Sacred Name',46:'Black Hebrew Isr.',47:'Scientology'};
  var LET={
    philadelphia:{name:'Philadelphia',ref:'Rev 3:7-13',color:'#3ddc84',lat:90,lon:0,call:'Hold fast what you have, so that no one may seize your crown. (Rev 3:11)'},
    smyrna:{name:'Smyrna',ref:'Rev 2:8-11',color:'#b574e0',lat:52,lon:25,call:'Do not fear what you are about to suffer. Be faithful unto death. (Rev 2:10)'},
    ephesus:{name:'Ephesus',ref:'Rev 2:1-7',color:'#ff6b5b',lat:20,lon:115,call:'Remember from where you have fallen; repent, and do the first works. (Rev 2:5)'},
    thyatira:{name:'Thyatira',ref:'Rev 2:18-29',color:'#5aa9ff',lat:20,lon:-115,call:'Hold fast what you have until I come, and test the teaching. (Rev 2:24-25)'},
    pergamum:{name:'Pergamum',ref:'Rev 2:12-17',color:'#ff9a4a',lat:-18,lon:-55,call:'Repent. (Rev 2:16)'},
    sardis:{name:'Sardis',ref:'Rev 3:1-6',color:'#aab4b8',lat:-38,lon:75,call:'Wake up, and strengthen what remains. (Rev 3:2)'},
    laodicea:{name:'Laodicea',ref:'Rev 3:14-22',color:'#e6c84a',lat:-90,lon:0,call:'Be zealous and repent. Behold, I stand at the door and knock. (Rev 3:19-20)'}
  };
  var ORDER=['philadelphia','smyrna','ephesus','sardis','laodicea','pergamum','thyatira'];
  var CATS=['God','Messiah','Canon','Sabbath','Feasts','Torah','Diet','Grace','Purity','Justice','Moral','Doctrine','Endure','Prophecy','Love','Spirit','Humility'];
  function GRADEC(d){return pctColor(Math.round(d.total/170*100));}
  function RF(x){return Math.pow(x,0.72);}
  var RINGS=[{r:RF(.10),l:'90%'},{r:RF(.20),l:'80%'},{r:RF(.30),l:'70%'},{r:RF(.40),l:'60%'}];
  function vec(lat,lon){var a=lat*Math.PI/180,o=lon*Math.PI/180;return [Math.cos(a)*Math.sin(o),Math.sin(a),Math.cos(a)*Math.cos(o)];}
  Object.keys(LET).forEach(function(k){LET[k].v=vec(LET[k].lat,LET[k].lon);});
  function $(id){return document.getElementById(id);}
  function rgba(hex,a){var n=parseInt(hex.slice(1),16);return 'rgba('+(n>>16&255)+','+(n>>8&255)+','+(n&255)+','+a+')';}

  function buildData(){
    var keys=Object.keys(LET);
    keys.forEach(function(k){var min=100;CHURCH_DENOM_DATA[k].denoms.forEach(function(d){if(d.pct<min)min=d.pct;});FLOORS[k]=Math.max(5,min-10);});
    DEN=DENOM_DATA.map(function(src){
      var tend={};
      keys.forEach(function(k){CHURCH_DENOM_DATA[k].denoms.forEach(function(e){if(e.di===src.di)tend[k]=e.pct;});});
      var d={di:src.di,name:src.name,short:SHORT[src.di]||src.name,scores:src.scores,total:src.total,tier:src.tier,about:(typeof DENOM_ABOUT!=='undefined'&&DENOM_ABOUT[src.di])||'',tend:tend};
      var sx=0,sy=0,sz=0,best=null,bv=-1;
      keys.forEach(function(k){var p=(tend[k]!=null)?tend[k]:FLOORS[k],w=Math.pow(p/100,1.4);sx+=w*LET[k].v[0];sy+=w*LET[k].v[1];sz+=w*LET[k].v[2];if(tend[k]!=null&&tend[k]>bv){bv=tend[k];best=k;}});
      var len=Math.sqrt(sx*sx+sy*sy+sz*sz)||1;d.dir=[sx/len,sy/len,sz/len];
      d.miss=1-d.total/170;d.r=RF(d.miss);
      var j=((d.di*37)%11-5)*0.004;d.pos=[d.dir[0]*d.r+j,d.dir[1]*d.r-j,d.dir[2]*d.r+j];
      d.top=best||'sardis';d.color=LET[d.top].color;
      d.ranked=keys.map(function(k){return {k:k,p:(tend[k]!=null?tend[k]:FLOORS[k]),listed:tend[k]!=null};}).sort(function(a,b){return b.p-a.p;});
      return d;
    });
  }
  function resize(){if(!cv)return;var r=cv.getBoundingClientRect();if(!r.width)return;DPR=window.devicePixelRatio||1;W=r.width;H=r.height;cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);ctx.setTransform(DPR,0,0,DPR,0,0);}
  function proj(p){
    var cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
    var x1=p[0]*cy+p[2]*sy,z1=-p[0]*sy+p[2]*cy,y2=p[1]*cp-z1*sp,z2=p[1]*sp+z1*cp;
    var S=Math.min(W,H)*0.40*zoom,k=CAMD/(CAMD-z2);
    return {x:W/2+x1*S*k,y:H/2-y2*S*k,z:z2,k:k,S:S};
  }
  function drawWire(){
    ctx.lineWidth=1;
    function ring(fn,n){var prev=null;for(var t=0;t<=n;t++){var q=proj(fn(t/n));if(prev){var a=0.05+0.14*((q.z+prev.z)/2+1)/2;ctx.strokeStyle='rgba(150,180,230,'+a+')';ctx.beginPath();ctx.moveTo(prev.x,prev.y);ctx.lineTo(q.x,q.y);ctx.stroke();}prev=q;}}
    [-60,-30,0,30,60].forEach(function(la){ring(function(t){return vec(la,t*360);},36);});
    for(var lo=0;lo<180;lo+=30){(function(lo){ring(function(t){var a=t*2*Math.PI;return [Math.cos(a)*Math.sin(lo*Math.PI/180),Math.sin(a),Math.cos(a)*Math.cos(lo*Math.PI/180)];},36);})(lo);}
  }
  function drawTarget(){
    var c=proj([0,0,0]);
    RINGS.forEach(function(g){
      var R=g.r*c.S*CAMD/Math.sqrt(CAMD*CAMD-g.r*g.r);
      ctx.beginPath();ctx.arc(c.x,c.y,R,0,Math.PI*2);ctx.strokeStyle=rgba('#c9a84c',0.55);ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle=rgba('#e9d38a',0.9);ctx.font='700 11px Cinzel,Georgia,serif';ctx.textAlign='left';ctx.fillText(g.l,c.x+Math.cos(-0.78)*R+4,c.y+Math.sin(-0.78)*R-2);
    });
    var R1=c.S*CAMD/Math.sqrt(CAMD*CAMD-1);
    ctx.beginPath();ctx.arc(c.x,c.y,R1,0,Math.PI*2);ctx.strokeStyle='rgba(150,180,230,.35)';ctx.lineWidth=1.2;ctx.stroke();
    ctx.fillStyle='rgba(233,211,138,.8)';ctx.font='700 11px Cinzel,Georgia,serif';ctx.textAlign='left';ctx.fillText('F  (below 60%)',c.x+Math.cos(-0.78)*R1+6,c.y+Math.sin(-0.78)*R1+12);
    var g=ctx.createRadialGradient(c.x,c.y,0,c.x,c.y,c.S*0.16);g.addColorStop(0,'rgba(255,236,160,.95)');g.addColorStop(.35,'rgba(233,200,100,.45)');g.addColorStop(1,'rgba(201,168,76,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(c.x,c.y,c.S*0.16,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(c.x,c.y,4.5,0,Math.PI*2);ctx.fillStyle='#fff7d6';ctx.fill();
    ctx.fillStyle='rgba(7,15,32,.72)';ctx.fillRect(c.x-62,c.y+c.S*0.215-12,124,32);
    ctx.fillStyle='rgba(245,240,225,.95)';ctx.textAlign='center';ctx.font='700 11px Cinzel,Georgia,serif';ctx.fillText('THE STANDARD',c.x,c.y+c.S*0.215);
    ctx.font='11px Crimson Pro,Georgia,serif';ctx.fillStyle='rgba(245,240,225,.75)';ctx.fillText('Yeshua · 170 of 170',c.x,c.y+c.S*0.215+14);
  }
  function drawAnchors(){
    var items=Object.keys(LET).map(function(k){return {k:k,q:proj(LET[k].v)};}).sort(function(a,b){return a.q.z-b.q.z;});
    var c=proj([0,0,0]);
    items.forEach(function(it){
      var L=LET[it.k],q=it.q,front=q.z>=-0.05,al=front?1:0.5,dim=filter&&filter!==it.k?0.35:1;
      hits.push({k:it.k,x:q.x,y:q.y-2,r:17,z:q.z});
      if(selLetter===it.k){var lp=1+0.2*Math.sin(performance.now()/220);ctx.beginPath();ctx.arc(q.x,q.y,19*lp,0,Math.PI*2);ctx.strokeStyle=rgba(L.color,.9);ctx.lineWidth=1.6;ctx.stroke();}
      var g=ctx.createRadialGradient(q.x,q.y,0,q.x,q.y,22);g.addColorStop(0,rgba(L.color,0.55*al*dim));g.addColorStop(1,rgba(L.color,0));
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(q.x,q.y,22,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=rgba(L.color,al*dim);ctx.beginPath();ctx.moveTo(q.x,q.y-11);ctx.quadraticCurveTo(q.x+7,q.y,q.x,q.y+6);ctx.quadraticCurveTo(q.x-7,q.y,q.x,q.y-11);ctx.fill();
      ctx.strokeStyle=rgba(L.color,.8*al*dim);ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(q.x-8,q.y+9);ctx.lineTo(q.x+8,q.y+9);ctx.moveTo(q.x,q.y+6);ctx.lineTo(q.x,q.y+9);ctx.stroke();
      var dx=q.x-c.x,dy=q.y-c.y,m=Math.sqrt(dx*dx+dy*dy)||1,tx=q.x+dx/m*34,ty=q.y+dy/m*26;
      ctx.textAlign=dx>6?'left':dx<-6?'right':'center';ctx.fillStyle=rgba(L.color,al*dim);ctx.font='700 13px Cinzel,Georgia,serif';ctx.fillText(L.name,tx,ty);
      ctx.font='11px Crimson Pro,Georgia,serif';ctx.fillStyle='rgba(245,240,225,'+(0.7*al*dim)+')';ctx.fillText(L.ref,tx,ty+13);
    });
  }
  function drawPulls(d){
    var c=proj([0,0,0]),p=proj(d.pos);
    ctx.setLineDash([6,5]);ctx.strokeStyle='rgba(233,211,138,.9)';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(c.x,c.y);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='rgba(233,211,138,.95)';ctx.font='700 11px Cinzel,Georgia,serif';ctx.textAlign='center';ctx.fillText((d.custom?distText(d):Math.round(d.miss*100)+'% from the mark'),(p.x+c.x)/2,(p.y+c.y)/2-6);
    d.ranked.filter(function(e){return e.listed;}).slice(0,3).forEach(function(e){var a=proj(LET[e.k].v);ctx.strokeStyle=rgba(LET[e.k].color,.75);ctx.lineWidth=1+e.p/14;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(a.x,a.y);ctx.stroke();});
  }
  function frame(t){
    var dt=Math.min(50,t-lastT);lastT=t;
    if(tween){var u=Math.min(1,(t-tween.t0)/tween.dur),e=u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;yaw=tween.y0+(tween.y1-tween.y0)*e;pitch=tween.p0+(tween.p1-tween.p0)*e;zoom=tween.z0+(tween.z1-tween.z0)*e;if(u>=1)tween=null;}
    else if(auto&&!dragging){yaw+=dt*0.00018;}
    if(!W)resize();
    ctx.clearRect(0,0,W,H);
    hits=[];
    drawWire();drawTarget();if(sel)drawPulls(sel);drawAnchors();
    var pts=DEN.map(function(d){return {d:d,q:proj(d.pos)};}).sort(function(a,b){return a.q.z-b.q.z;});
    pts.forEach(function(it){
      var d=it.d,q=it.q,front=q.z>=-0.1,dim=filter?(d.top===filter?1:0.14):1,al=(front?1:0.55)*dim;
      var rad=(d===sel?7.5:d===hov?6.5:4.6)*Math.min(1.5,Math.max(.75,q.k*.8+.25));
      if(d===sel){var pu=1+0.25*Math.sin(t/220);ctx.beginPath();ctx.arc(q.x,q.y,rad+7*pu,0,Math.PI*2);ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=1.4;ctx.stroke();}
      var g=ctx.createRadialGradient(q.x,q.y,0,q.x,q.y,rad*3);g.addColorStop(0,rgba(d.color,0.45*al));g.addColorStop(1,rgba(d.color,0));
      ctx.fillStyle=g;ctx.beginPath();ctx.arc(q.x,q.y,rad*3,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(q.x,q.y,rad,0,Math.PI*2);ctx.fillStyle=rgba(d.color,al);ctx.fill();
      ctx.lineWidth=1.3;ctx.strokeStyle=front?'rgba(255,255,255,'+(0.85*dim)+')':'rgba(255,255,255,'+(0.3*dim)+')';ctx.stroke();
      if(d.custom){ctx.save();ctx.translate(q.x,q.y);ctx.rotate(Math.PI/4);ctx.strokeStyle='rgba(255,255,255,'+(0.95*dim)+')';ctx.lineWidth=1.8;var cs=rad+5;ctx.strokeRect(-cs,-cs,2*cs,2*cs);ctx.restore();}
      if(dim>0.5)hits.push({d:d,x:q.x,y:q.y,r:Math.max(11,rad+6),z:q.z});
    });
    var boxes=[];
    pts.slice().reverse().forEach(function(it){
      var d=it.d,q=it.q,front=q.z>=-0.1,dim=filter?(d.top===filter?1:0.14):1,force=(d===sel||d===hov||d.custom);
      if(!(force||(showAll&&front&&dim>0.5)))return;
      var rad=force?7.5:4.6;ctx.font=(force?'700 12px':'11px')+' Crimson Pro,Georgia,serif';ctx.textAlign='left';
      var w=ctx.measureText(d.short).width+6,x0=q.x+rad+3,y0=q.y-9,hit=false;
      for(var i=0;i<boxes.length;i++){var o=boxes[i];if(x0<o.x+o.w&&x0+w>o.x&&y0<o.y+15&&y0+15>o.y){hit=true;break;}}
      if(hit&&!force)return;
      boxes.push({x:x0,y:y0,w:w});
      ctx.fillStyle='rgba(7,15,32,.82)';ctx.fillRect(x0,y0,w,15);ctx.fillStyle='rgba(245,240,225,'+(front?1:.7)+')';ctx.fillText(d.short,x0+3,q.y+2);
    });
  }
  function loop(t){if(!root||root.offsetParent===null){running=false;return;}frame(t);requestAnimationFrame(loop);}

  function pick(mx,my){var best=null,bd=1e9;for(var i=0;i<hits.length;i++){var h=hits[i],dd=Math.hypot(h.x-mx,h.y-my);if(dd<h.r&&(dd-h.z*2)<bd){bd=dd-h.z*2;best=h;}}return best;}
  function hover(mx,my){var h=pick(mx,my);hov=(h&&h.d)?h.d:null;if(h){tip.style.display='block';tip.style.left=Math.min(mx+14,Math.max(0,W-250))+'px';tip.style.top=(my+12)+'px';tip.innerHTML=h.k?'<b>'+LET[h.k].name+'</b> · '+LET[h.k].ref+'<br>Click the candle to read the letter and how it lines up with Scripture':h.d.custom?'<b>'+esc(h.d.name)+'</b><br>'+distText(h.d)+' (your answers)':'<b>'+h.d.name+'</b><br>'+h.d.total+' of 170 · '+Math.round(h.d.total/170*100)+'% match · '+Math.round(h.d.miss*100)+'% from the mark';cv.style.cursor='pointer';}else{tip.style.display='none';cv.style.cursor=dragging?'grabbing':'grab';}}
  function focusOn(d){
    var p=d.pos,rho=Math.sqrt(p[0]*p[0]+p[2]*p[2]),ty=Math.atan2(-p[0],p[2]),tp=Math.max(-1.2,Math.min(1.2,Math.atan2(p[1],rho)));
    var dy=((ty-yaw+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;
    tween={t0:performance.now(),dur:850,y0:yaw,y1:yaw+dy,p0:pitch,p1:tp,z0:zoom,z1:Math.max(zoom,1.25)};
  }
  function setAuto(v){auto=v;$('ls-bAuto').classList.toggle('on',auto);}
  function select(d){
    sel=d;selLetter=null;setAuto(false);focusOn(d);renderInfo(d);
    Array.prototype.forEach.call(document.querySelectorAll('#ls-list .ls-item,#ls-mylist .ls-item'),function(el){el.classList.toggle('sel',+el.getAttribute('data-di')===d.di);});
    var it=document.querySelector('#ls-list .ls-item.sel,#ls-mylist .ls-item.sel');if(it&&it.scrollIntoView)it.scrollIntoView({block:'nearest'});
  }
  function renderInfo(d){
    if(d.custom){renderCustom(d);return;}
    var gc=GRADEC(d),idx=d.scores.map(function(s,i){return {s:s,i:i};});
    var gaps=idx.slice().sort(function(a,b){return a.s-b.s||a.i-b.i;}).slice(0,3),strong=idx.slice().sort(function(a,b){return b.s-a.s||a.i-b.i;}).slice(0,3);
    var listed=d.ranked.filter(function(e){return e.listed;}),top=d.ranked[0];
    var leans=listed.slice(0,3).map(function(e){var L=LET[e.k];return '<div class="ls-row"><span style="color:'+L.color+'">'+L.name+'</span><b>'+e.p+'%</b></div><div class="ls-bar"><b style="width:'+e.p+'%;background:'+L.color+'"></b></div>';}).join('');
    var h='<h3 style="font-size:1.12em;margin-bottom:6px">'+d.name+'</h3>';
    h+='<div class="ls-row" style="align-items:center;margin-bottom:6px"><span><span class="ls-pill" style="background:'+gc+'">'+Math.round(d.total/170*100)+'%</span> &nbsp;'+d.total+' of 170</span><span class="ls-cin">'+Math.round(d.miss*100)+'% from the mark</span></div>';
    h+='<div class="ls-small">'+d.about+'</div>';
    h+='<div class="ls-lab">Leans toward</div>'+leans;
    h+='<div class="ls-lab">Fingerprint (all seven letters)</div><canvas id="ls-radar" width="330" height="250" style="width:100%;max-width:330px;display:block;margin:2px auto 0"></canvas>';
    h+='<div class="ls-lab">Furthest from the mark</div><div class="ls-small">'+gaps.map(function(g){return '<b style="color:#ffb3a8">'+CATS[g.i]+'</b> '+g.s+'/10';}).join(' &nbsp;·&nbsp; ')+'</div>';
    h+='<div class="ls-lab">Closest to the mark</div><div class="ls-small">'+strong.map(function(g){return '<b style="color:#9be6b8">'+CATS[g.i]+'</b> '+g.s+'/10';}).join(' &nbsp;·&nbsp; ')+'</div>';
    h+='<div class="ls-lab">The letter\'s call to this tendency</div><div class="ls-small" style="color:#f5f0e1"><b style="color:'+LET[top.k].color+'">'+LET[top.k].name+':</b> '+LET[top.k].call+'</div>';
    h+='<div style="margin-top:14px"><button class="ls-btn" onclick="lsOpenReview('+d.di+')">See the full score review &rarr;</button></div>';
    $('ls-info').innerHTML=h;drawRadar(d);
  }
  /* The seven letters (Rev 2-3): KJV text and cross-references. Text pulled from bible-api.com (KJV) and checked against the notes; see research note R19. */
  var LD={"ephesus":{"stands":"The doctrinally correct but loveless church","sum":[["He commends","Works, labour and patience; cannot bear evil; tested those who said they were apostles and found them liars; has borne and not fainted; hates the deeds of the Nicolaitans.","2:2-3, 6"],["He rebukes","\"Thou hast left thy first love.\"","2:4"],["He calls","Remember from where you fell, repent, and do the first works, or the lampstand is removed.","2:5"],["Promise to the overcomer","To eat of the tree of life in the midst of the paradise of God.","2:7"]],"text":[[1,"Unto the angel of the church of Ephesus write; These things saith he that holdeth the seven stars in his right hand, who walketh in the midst of the seven golden candlesticks;"],[2,"I know thy works, and thy labour, and thy patience, and how thou canst not bear them which are evil: and thou hast tried them which say they are apostles, and are not, and hast found them liars:"],[3,"And hast borne, and hast patience, and for my name’s sake hast laboured, and hast not fainted."],[4,"Nevertheless I have somewhat against thee, because thou hast left thy first love."],[5,"Remember therefore from whence thou art fallen, and repent, and do the first works; or else I will come unto thee quickly, and will remove thy candlestick out of his place, except thou repent."],[6,"But this thou hast, that thou hatest the deeds of the Nicolaitanes, which I also hate."],[7,"He that hath an ear, let him hear what the Spirit saith unto the churches; To him that overcometh will I give to eat of the tree of life, which is in the midst of the paradise of God."]],"refs":[{"ref":"Jeremiah 2:2","note":"Yahweh remembers the love of Israel's early devotion, \"the love of thine espousals.\" Ephesus carries the same charge: a love that began warm and cooled.","v":[[2,"Go and cry in the ears of Jerusalem, saying, Thus saith the LORD; I remember thee, the kindness of thy youth, the love of thine espousals, when thou wentest after me in the wilderness, in a land that was not sown."]]},{"ref":"Deuteronomy 6:5","note":"The command that sits underneath the rebuke: love Yahweh with all the heart, soul and might.","v":[[5,"And thou shalt love the LORD thy God with all thine heart, and with all thy soul, and with all thy might."]]},{"ref":"Matthew 22:37-38","note":"Yeshua names that same command the first and great one.","v":[[37,"Jesus said unto him, Thou shalt love the Lord thy God with all thy heart, and with all thy soul, and with all thy mind."],[38,"This is the first and great commandment."]]},{"ref":"Deuteronomy 13:1-5","note":"The Torah's own test for a claimed messenger: not signs, but whether he turns people from Yahweh's commandments. This is how a church could \"try them which say they are apostles\" and be right.","v":[[1,"If there arise among you a prophet, or a dreamer of dreams, and giveth thee a sign or a wonder,"],[2,"And the sign or the wonder come to pass, whereof he spake unto thee, saying, Let us go after other gods, which thou hast not known, and let us serve them;"],[3,"Thou shalt not hearken unto the words of that prophet, or that dreamer of dreams: for the LORD your God proveth you, to know whether ye love the LORD your God with all your heart and with all your soul."],[4,"Ye shall walk after the LORD your God, and fear him, and keep his commandments, and obey his voice, and ye shall serve him, and cleave unto him."],[5,"And that prophet, or that dreamer of dreams, shall be put to death; because he hath spoken to turn you away from the LORD your God, which brought you out of the land of Egypt, and redeemed you out of the house of bondage, to thrust thee out of the way which the LORD thy God commanded thee to walk in. So shalt thou put the evil away from the midst of thee."]]},{"ref":"1 John 4:1","note":"Try the spirits. Ephesus did this well; the letter praises it.","v":[[1,"Beloved, believe not every spirit, but try the spirits whether they are of God: because many false prophets are gone out into the world."]]},{"ref":"Genesis 2:9","note":"The tree of life stands in the garden, the first place it appears.","v":[[9,"And out of the ground made the LORD God to grow every tree that is pleasant to the sight, and good for food; the tree of life also in the midst of the garden, and the tree of knowledge of good and evil."]]},{"ref":"Proverbs 3:18","note":"Wisdom is called \"a tree of life to them that lay hold upon her.\"","v":[[18,"She is a tree of life to them that lay hold upon her: and happy is every one that retaineth her."]]},{"ref":"Revelation 22:2","note":"The tree of life stands again in the city, the promise carried through to the end of the book.","v":[[2,"In the midst of the street of it, and on either side of the river, was there the tree of life, which bare twelve manner of fruits, and yielded her fruit every month: and the leaves of the tree were for the healing of the nations."]]}]},"smyrna":{"stands":"The suffering church","sum":[["He commends","Knows her works, tribulation and poverty, \"but thou art rich.\" No fault is named.","2:9"],["He rebukes","Nothing. The letter contains no word of rebuke.","2:8-11"],["He calls","Fear none of the things you are about to suffer. Be faithful unto death.","2:10"],["Promise to the overcomer","The crown of life, and no hurt from the second death.","2:10-11"]],"text":[[8,"And unto the angel of the church in Smyrna write; These things saith the first and the last, which was dead, and is alive;"],[9,"I know thy works, and tribulation, and poverty, (but thou art rich) and I know the blasphemy of them which say they are Jews, and are not, but are the synagogue of Satan."],[10,"Fear none of those things which thou shalt suffer: behold, the devil shall cast some of you into prison, that ye may be tried; and ye shall have tribulation ten days: be thou faithful unto death, and I will give thee a crown of life."],[11,"He that hath an ear, let him hear what the Spirit saith unto the churches; He that overcometh shall not be hurt of the second death."]],"refs":[{"ref":"Isaiah 41:10","note":"Yahweh's own \"fear not\" to His people, the voice Smyrna hears again.","v":[[10,"Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness."]]},{"ref":"Isaiah 43:1-2","note":"Through the waters and the fire, \"I am with thee.\"","v":[[1,"But now thus saith the LORD that created thee, O Jacob, and he that formed thee, O Israel, Fear not: for I have redeemed thee, I have called thee by thy name; thou art mine."],[2,"When thou passest through the waters, I will be with thee; and through the rivers, they shall not overflow thee: when thou walkest through the fire, thou shalt not be burned; neither shall the flame kindle upon thee."]]},{"ref":"Matthew 5:10-12","note":"Yeshua calls those persecuted for righteousness blessed, and says the prophets were treated the same.","v":[[10,"Blessed are they which are persecuted for righteousness sake: for theirs is the kingdom of heaven."],[11,"Blessed are ye, when men shall revile you, and persecute you, and shall say all manner of evil against you falsely, for my sake."],[12,"Rejoice, and be exceeding glad: for great is your reward in heaven: for so persecuted they the prophets which were before you."]]},{"ref":"James 2:5","note":"God chose the poor of this world to be rich in faith, the same reversal as \"poor, but thou art rich.\"","v":[[5,"Hearken, my beloved brethren, Hath not God chosen the poor of this world rich in faith, and heirs of the kingdom which he hath promised to them that love him?"]]},{"ref":"2 Corinthians 6:10","note":"\"As poor, yet making many rich.\"","v":[[10,"As sorrowful, yet alway rejoicing; as poor, yet making many rich; as having nothing, and yet possessing all things."]]},{"ref":"Romans 2:28-29","note":"The letter says some \"say they are Jews, and are not.\" Paul draws the same line between the outward name and the inward reality.","v":[[28,"For he is not a Jew, which is one outwardly; neither is that circumcision, which is outward in the flesh:"],[29,"But he is a Jew, which is one inwardly; and circumcision is that of the heart, in the spirit, and not in the letter; whose praise is not of men, but of God."]]},{"ref":"James 1:12","note":"The crown of life promised to the one who endures temptation.","v":[[12,"Blessed is the man that endureth temptation: for when he is tried, he shall receive the crown of life, which the Lord hath promised to them that love him."]]},{"ref":"Revelation 20:6","note":"The second death has no power over those who share in the first resurrection.","v":[[6,"Blessed and holy is he that hath part in the first resurrection: on such the second death hath no power, but they shall be priests of God and of Christ, and shall reign with him a thousand years."]]}]},"pergamum":{"stands":"The compromising church","sum":[["He commends","Holds fast His name and did not deny His faith, even where Satan dwells, even when Antipas, His faithful witness, was killed.","2:13"],["He rebukes","Some hold the doctrine of Balaam (food sacrificed to idols and fornication) and the doctrine of the Nicolaitans.","2:14-15"],["He calls","Repent, or He will come quickly and fight with the sword of His mouth.","2:16"],["Promise to the overcomer","The hidden manna, and a white stone with a new name written on it.","2:17"]],"text":[[12,"And to the angel of the church in Pergamos write; These things saith he which hath the sharp sword with two edges;"],[13,"I know thy works, and where thou dwellest, even where Satan’s seat is: and thou holdest fast my name, and hast not denied my faith, even in those days wherein Antipas was my faithful martyr, who was slain among you, where Satan dwelleth."],[14,"But I have a few things against thee, because thou hast there them that hold the doctrine of Balaam, who taught Balac to cast a stumblingblock before the children of Israel, to eat things sacrificed unto idols, and to commit fornication."],[15,"So hast thou also them that hold the doctrine of the Nicolaitanes, which thing I hate."],[16,"Repent; or else I will come unto thee quickly, and will fight against them with the sword of my mouth."],[17,"He that hath an ear, let him hear what the Spirit saith unto the churches; To him that overcometh will I give to eat of the hidden manna, and will give him a white stone, and in the stone a new name written, which no man knoweth saving he that receiveth it."]],"refs":[{"ref":"Numbers 25:1-3","note":"Israel joined themselves to Baal of Peor: they ate the sacrifices of the gods and committed whoredom. This is the event \"the doctrine of Balaam\" points to.","v":[[1,"And Israel abode in Shittim, and the people began to commit whoredom with the daughters of Moab."],[2,"And they called the people unto the sacrifices of their gods: and the people did eat, and bowed down to their gods."],[3,"And Israel joined himself unto Baal-peor: and the anger of the LORD was kindled against Israel."]]},{"ref":"Numbers 31:16","note":"Balaam's counsel is named as the cause of that trespass.","v":[[16,"Behold, these caused the children of Israel, through the counsel of Balaam, to commit trespass against the LORD in the matter of Peor, and there was a plague among the congregation of the LORD."]]},{"ref":"2 Peter 2:15","note":"Peter calls it \"the way of Balaam,\" a second witness that the name stands for profit and compromise.","v":[[15,"Which have forsaken the right way, and are gone astray, following the way of Balaam the son of Bosor, who loved the wages of unrighteousness;"]]},{"ref":"Exodus 34:15","note":"The Torah's warning in advance: do not make covenant with the people of the land and eat of their sacrifices.","v":[[15,"Lest thou make a covenant with the inhabitants of the land, and they go a whoring after their gods, and do sacrifice unto their gods, and one call thee, and thou eat of his sacrifice;"]]},{"ref":"Acts 15:29","note":"The apostles' own list for the nations still names meat offered to idols and fornication.","v":[[29,"That ye abstain from meats offered to idols, and from blood, and from things strangled, and from fornication: from which if ye keep yourselves, ye shall do well. Fare ye well."]]},{"ref":"Isaiah 11:4","note":"The Messiah \"shall smite the earth with the rod of his mouth.\" The sword of His mouth is His word.","v":[[4,"But with righteousness shall he judge the poor, and reprove with equity for the meek of the earth: and he shall smite the earth with the rod of his mouth, and with the breath of his lips shall he slay the wicked."]]},{"ref":"Hebrews 4:12","note":"The word of God is sharper than any two-edged sword.","v":[[12,"For the word of God is quick, and powerful, and sharper than any twoedged sword, piercing even to the dividing asunder of soul and spirit, and of the joints and marrow, and is a discerner of the thoughts and intents of the heart."]]},{"ref":"Exodus 16:32","note":"A portion of the manna was kept for generations. \"Hidden manna\" is that sustenance kept in the presence of God.","v":[[32,"And Moses said, This is the thing which the LORD commandeth, Fill an omer of it to be kept for your generations; that they may see the bread wherewith I have fed you in the wilderness, when I brought you forth from the land of Egypt."]]},{"ref":"Isaiah 62:2","note":"Yahweh's people are given a new name that His mouth names.","v":[[2,"And the Gentiles shall see thy righteousness, and all kings thy glory: and thou shalt be called by a new name, which the mouth of the LORD shall name."]]}]},"thyatira":{"stands":"The tolerant church","sum":[["He commends","Works, charity, service, faith and patience, and \"the last to be more than the first.\"","2:19"],["He rebukes","They allow the woman Jezebel, who calls herself a prophetess, to teach and mislead His servants into fornication and food offered to idols.","2:20"],["He calls","Repent, and hold fast what you have until He comes. Keep His works to the end.","2:21-26"],["Promise to the overcomer","Power over the nations with a rod of iron, and the morning star.","2:26-28"]],"text":[[18,"And unto the angel of the church in Thyatira write; These things saith the Son of God, who hath his eyes like unto a flame of fire, and his feet are like fine brass;"],[19,"I know thy works, and charity, and service, and faith, and thy patience, and thy works; and the last to be more than the first."],[20,"Notwithstanding I have a few things against thee, because thou sufferest that woman Jezebel, which calleth herself a prophetess, to teach and to seduce my servants to commit fornication, and to eat things sacrificed unto idols."],[21,"And I gave her space to repent of her fornication; and she repented not."],[22,"Behold, I will cast her into a bed, and them that commit adultery with her into great tribulation, except they repent of their deeds."],[23,"And I will kill her children with death; and all the churches shall know that I am he which searcheth the reins and hearts: and I will give unto every one of you according to your works."],[24,"But unto you I say, and unto the rest in Thyatira, as many as have not this doctrine, and which have not known the depths of Satan, as they speak; I will put upon you none other burden."],[25,"But that which ye have already hold fast till I come."],[26,"And he that overcometh, and keepeth my works unto the end, to him will I give power over the nations:"],[27,"And he shall rule them with a rod of iron; as the vessels of a potter shall they be broken to shivers: even as I received of my Father."],[28,"And I will give him the morning star."],[29,"He that hath an ear, let him hear what the Spirit saith unto the churches."]],"refs":[{"ref":"1 Kings 16:31","note":"Ahab marries Jezebel and serves Baal. The name in the letter points back to her.","v":[[31,"And it came to pass, as if it had been a light thing for him to walk in the sins of Jeroboam the son of Nebat, that he took to wife Jezebel the daughter of Ethbaal king of the Zidonians, and went and served Baal, and worshipped him."]]},{"ref":"1 Kings 21:25","note":"Ahab \"sold himself to work wickedness\" while Jezebel \"stirred him up\": a leader who tolerates and a voice that leads astray.","v":[[25,"But there was none like unto Ahab, which did sell himself to work wickedness in the sight of the LORD, whom Jezebel his wife stirred up."]]},{"ref":"2 Kings 9:22","note":"Her \"whoredoms and witchcrafts\" are named, the same two charges in Thyatira (fornication and idols).","v":[[22,"And it came to pass, when Joram saw Jehu, that he said, Is it peace, Jehu? And he answered, What peace, so long as the whoredoms of thy mother Jezebel and her witchcrafts are so many?"]]},{"ref":"Daniel 10:6","note":"The man whose eyes are lamps of fire and arms and feet like polished brass is the figure the letter opens with.","v":[[6,"His body also was like the beryl, and his face as the appearance of lightning, and his eyes as lamps of fire, and his arms and his feet like in colour to polished brass, and the voice of his words like the voice of a multitude."]]},{"ref":"Jeremiah 17:10","note":"\"I the LORD search the heart, I try the reins.\" The letter says He is the one who \"searcheth the reins and hearts.\"","v":[[10,"I the LORD search the heart, I try the reins, even to give every man according to his ways, and according to the fruit of his doings."]]},{"ref":"1 Thessalonians 5:21","note":"Prove all things; hold fast that which is good. The discernment Thyatira lacked.","v":[[21,"Prove all things; hold fast that which is good."]]},{"ref":"Psalm 2:8-9","note":"The Son is given the nations and a rod of iron. The promise to the overcomer shares that rule.","v":[[8,"Ask of me, and I shall give thee the heathen for thine inheritance, and the uttermost parts of the earth for thy possession."],[9,"Thou shalt break them with a rod of iron; thou shalt dash them in pieces like a potter’s vessel."]]},{"ref":"Numbers 24:17","note":"\"There shall come a Star out of Jacob.\"","v":[[17,"I shall see him, but not now: I shall behold him, but not nigh: there shall come a Star out of Jacob, and a Sceptre shall rise out of Israel, and shall smite the corners of Moab, and destroy all the children of Sheth."]]},{"ref":"Revelation 22:16","note":"Yeshua calls Himself \"the bright and morning star,\" so the promise is Himself.","v":[[16,"I Jesus have sent mine angel to testify unto you these things in the churches. I am the root and the offspring of David, and the bright and morning star."]]}]},"sardis":{"stands":"The dead church with a living remnant","sum":[["He commends","\"A few names even in Sardis which have not defiled their garments.\" They shall walk with Him in white.","3:4"],["He rebukes","\"Thou hast a name that thou livest, and art dead.\" His works found \"not perfect before God.\"","3:1-2"],["He calls","Be watchful, strengthen what remains, remember what you received and heard, hold fast and repent.","3:2-3"],["Promise to the overcomer","White clothing, a name not blotted out of the book of life, and confession before the Father and His angels.","3:5"]],"text":[[1,"And unto the angel of the church in Sardis write; These things saith he that hath the seven Spirits of God, and the seven stars; I know thy works, that thou hast a name that thou livest, and art dead."],[2,"Be watchful, and strengthen the things which remain, that are ready to die: for I have not found thy works perfect before God."],[3,"Remember therefore how thou hast received and heard, and hold fast, and repent. If therefore thou shalt not watch, I will come on thee as a thief, and thou shalt not know what hour I will come upon thee."],[4,"Thou hast a few names even in Sardis which have not defiled their garments; and they shall walk with me in white: for they are worthy."],[5,"He that overcometh, the same shall be clothed in white raiment; and I will not blot out his name out of the book of life, but I will confess his name before my Father, and before his angels."],[6,"He that hath an ear, let him hear what the Spirit saith unto the churches."]],"refs":[{"ref":"Isaiah 29:13","note":"A people who draw near with the mouth and honour with the lips while the heart is far away: a name of life without the life.","v":[[13,"Wherefore the Lord said, Forasmuch as this people draw near me with their mouth, and with their lips do honour me, but have removed their heart far from me, and their fear toward me is taught by the precept of men:"]]},{"ref":"Ephesians 5:14","note":"\"Awake thou that sleepest, and arise from the dead, and Christ shall give thee light.\"","v":[[14,"Wherefore he saith, Awake thou that sleepest, and arise from the dead, and Christ shall give thee light."]]},{"ref":"1 Kings 19:18","note":"Seven thousand in Israel who had not bowed to Baal: the same shape as \"a few names\" kept in a dead place.","v":[[18,"Yet I have left me seven thousand in Israel, all the knees which have not bowed unto Baal, and every mouth which hath not kissed him."]]},{"ref":"Matthew 24:43","note":"Yeshua's own picture of coming like a thief to a house that was not watching.","v":[[43,"But know this, that if the goodman of the house had known in what watch the thief would come, he would have watched, and would not have suffered his house to be broken up."]]},{"ref":"Zechariah 3:3-5","note":"Joshua in filthy garments is clothed with a change of raiment: white clothing given by Yahweh.","v":[[3,"Now Joshua was clothed with filthy garments, and stood before the angel."],[4,"And he answered and spake unto those that stood before him, saying, Take away the filthy garments from him. And unto him he said, Behold, I have caused thine iniquity to pass from thee, and I will clothe thee with change of raiment."],[5,"And I said, Let them set a fair mitre upon his head. So they set a fair mitre upon his head, and clothed him with garments. And the angel of the LORD stood by."]]},{"ref":"Exodus 32:32-33","note":"Moses asks to be blotted out of the book, and Yahweh answers that He blots out of it whoever has sinned against Him.","v":[[32,"Yet now, if thou wilt forgive their sin—; and if not, blot me, I pray thee, out of thy book which thou hast written."],[33,"And the LORD said unto Moses, Whosoever hath sinned against me, him will I blot out of my book."]]},{"ref":"Matthew 10:32","note":"Whoever confesses Him before men, He confesses before His Father.","v":[[32,"Whosoever therefore shall confess me before men, him will I confess also before my Father which is in heaven."]]}]},"philadelphia":{"stands":"The faithful church","sum":[["He commends","A little strength, yet has kept His word and not denied His name, and has kept the word of His patience.","3:8, 10"],["He rebukes","Nothing. The letter contains no word of rebuke.","3:7-13"],["He calls","Hold fast what you have, so that no man takes your crown.","3:11"],["Promise to the overcomer","Kept from the hour of trial that comes on the whole world. A pillar in the temple of God, with the name of God, the name of His city, and His new name written on him.","3:10, 12"]],"text":[[7,"And to the angel of the church in Philadelphia write; These things saith he that is holy, he that is true, he that hath the key of David, he that openeth, and no man shutteth; and shutteth, and no man openeth;"],[8,"I know thy works: behold, I have set before thee an open door, and no man can shut it: for thou hast a little strength, and hast kept my word, and hast not denied my name."],[9,"Behold, I will make them of the synagogue of Satan, which say they are Jews, and are not, but do lie; behold, I will make them to come and worship before thy feet, and to know that I have loved thee."],[10,"Because thou hast kept the word of my patience, I also will keep thee from the hour of temptation, which shall come upon all the world, to try them that dwell upon the earth."],[11,"Behold, I come quickly: hold that fast which thou hast, that no man take thy crown."],[12,"Him that overcometh will I make a pillar in the temple of my God, and he shall go no more out: and I will write upon him the name of my God, and the name of the city of my God, which is new Jerusalem, which cometh down out of heaven from my God: and I will write upon him my new name."],[13,"He that hath an ear, let him hear what the Spirit saith unto the churches."]],"refs":[{"ref":"Isaiah 22:22","note":"\"The key of the house of David... he shall open, and none shall shut.\" The letter's opening title and the open door both come from here.","v":[[22,"And the key of the house of David will I lay upon his shoulder; so he shall open, and none shall shut; and he shall shut, and none shall open."]]},{"ref":"Isaiah 60:14","note":"Those who afflicted Israel bow at the soles of her feet, \"The city of the LORD.\" The letter says some will come and worship before their feet and know He loved them.","v":[[14,"The sons also of them that afflicted thee shall come bending unto thee; and all they that despised thee shall bow themselves down at the soles of thy feet; and they shall call thee, The city of the LORD, The Zion of the Holy One of Israel."]]},{"ref":"Revelation 14:12","note":"\"Here are they that keep the commandments of God, and the faith of Jesus.\" Keeping the word and keeping the faith together.","v":[[12,"Here is the patience of the saints: here are they that keep the commandments of God, and the faith of Jesus."]]},{"ref":"Daniel 12:1","note":"A time of trouble such as never was, and the people delivered whose names are written in the book.","v":[[1,"And at that time shall Michael stand up, the great prince which standeth for the children of thy people: and there shall be a time of trouble, such as never was since there was a nation even to that same time: and at that time thy people shall be delivered, every one that shall be found written in the book."]]},{"ref":"Luke 21:36","note":"Yeshua: watch and pray always, that you may be counted worthy to escape what is coming.","v":[[36,"Watch ye therefore, and pray always, that ye may be accounted worthy to escape all these things that shall come to pass, and to stand before the Son of man."]]},{"ref":"Exodus 28:36-38","note":"The name set on the forehead of the high priest, \"Holiness to the LORD.\" The name written on the overcomer follows that pattern.","v":[[36,"And thou shalt make a plate of pure gold, and grave upon it, like the engravings of a signet, HOLINESS TO THE LORD."],[37,"And thou shalt put it on a blue lace, that it may be upon the mitre; upon the forefront of the mitre it shall be."],[38,"And it shall be upon Aaron’s forehead, that Aaron may bear the iniquity of the holy things, which the children of Israel shall hallow in all their holy gifts; and it shall be always upon his forehead, that they may be accepted before the LORD."]]},{"ref":"Ezekiel 48:35","note":"The city's name is \"The LORD is there.\" This is the \"name of the city of my God.\"","v":[[35,"It was round about eighteen thousand measures: and the name of the city from that day shall be, The LORD is there."]]},{"ref":"Revelation 22:4","note":"His name is on their foreheads at the end of the book.","v":[[4,"And they shall see his face; and his name shall be in their foreheads."]]}]},"laodicea":{"stands":"The lukewarm church","sum":[["He commends","Nothing. No word of commendation is given.","3:14-22"],["He rebukes","Neither cold nor hot, so He will spew her out. She says \"I am rich... and have need of nothing\" and does not know she is wretched, miserable, poor, blind and naked.","3:15-17"],["He calls","Buy of Him gold tried in the fire, white raiment and eyesalve. Be zealous and repent. \"As many as I love, I rebuke and chasten.\"","3:18-19"],["Promise to the overcomer","He stands at the door and knocks, and will come in and eat with whoever opens. The overcomer sits with Him in His throne.","3:20-21"]],"text":[[14,"And unto the angel of the church of the Laodiceans write; These things saith the Amen, the faithful and true witness, the beginning of the creation of God;"],[15,"I know thy works, that thou art neither cold nor hot: I would thou wert cold or hot."],[16,"So then because thou art lukewarm, and neither cold nor hot, I will spue thee out of my mouth."],[17,"Because thou sayest, I am rich, and increased with goods, and have need of nothing; and knowest not that thou art wretched, and miserable, and poor, and blind, and naked:"],[18,"I counsel thee to buy of me gold tried in the fire, that thou mayest be rich; and white raiment, that thou mayest be clothed, and that the shame of thy nakedness do not appear; and anoint thine eyes with eyesalve, that thou mayest see."],[19,"As many as I love, I rebuke and chasten: be zealous therefore, and repent."],[20,"Behold, I stand at the door, and knock: if any man hear my voice, and open the door, I will come in to him, and will sup with him, and he with me."],[21,"To him that overcometh will I grant to sit with me in my throne, even as I also overcame, and am set down with my Father in his throne."],[22,"He that hath an ear, let him hear what the Spirit saith unto the churches."]],"refs":[{"ref":"Hosea 12:8","note":"Ephraim says, \"I am become rich, I have found me out substance.\" The same self-sufficient voice.","v":[[8,"And Ephraim said, Yet I am become rich, I have found me out substance: in all my labours they shall find none iniquity in me that were sin."]]},{"ref":"Isaiah 65:16","note":"The Hebrew behind \"the God of truth\" here is Elohei Amen. Yeshua opens this letter as \"the Amen, the faithful and true witness.\"","v":[[16,"That he who blesseth himself in the earth shall bless himself in the God of truth; and he that sweareth in the earth shall swear by the God of truth; because the former troubles are forgotten, and because they are hid from mine eyes."]]},{"ref":"Zechariah 13:9","note":"Yahweh refines His people as silver is refined and tries them as gold is tried. The \"gold tried in the fire.\"","v":[[9,"And I will bring the third part through the fire, and will refine them as silver is refined, and will try them as gold is tried: they shall call on my name, and I will hear them: I will say, It is my people: and they shall say, The LORD is my God."]]},{"ref":"Isaiah 55:1","note":"Come, buy without money. The counsel to \"buy of me\" comes from this invitation.","v":[[1,"Ho, every one that thirsteth, come ye to the waters, and he that hath no money; come ye, buy, and eat; yea, come, buy wine and milk without money and without price."]]},{"ref":"Proverbs 3:11-12","note":"Whom Yahweh loves He corrects. Yeshua says the same about this rebuke.","v":[[11,"My son, despise not the chastening of the LORD; neither be weary of his correction:"],[12,"For whom the LORD loveth he correcteth; even as a father the son in whom he delighteth."]]},{"ref":"Hebrews 12:5-6","note":"The same words repeated for believers: do not despise the Lord's chastening.","v":[[5,"And ye have forgotten the exhortation which speaketh unto you as unto children, My son, despise not thou the chastening of the Lord, nor faint when thou art rebuked of him:"],[6,"For whom the Lord loveth he chasteneth, and scourgeth every son whom he receiveth."]]},{"ref":"Song of Solomon 5:2","note":"The voice of the beloved who knocks and asks to be let in.","v":[[2,"I sleep, but my heart waketh: it is the voice of my beloved that knocketh, saying, Open to me, my sister, my love, my dove, my undefiled: for my head is filled with dew, and my locks with the drops of the night."]]},{"ref":"2 Timothy 2:12","note":"\"If we suffer, we shall also reign with him.\" The throne is promised to the one who endures.","v":[[12,"If we suffer, we shall also reign with him: if we deny him, he also will deny us:"]]}]}};
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function verseHtml(arr){return arr.map(function(v){return '<sup>'+v[0]+'</sup>'+esc(v[1]);}).join(' ');}
  function selectLetter(k){
    selLetter=k;sel=null;setAuto(false);focusOn({pos:LET[k].v});
    Array.prototype.forEach.call(document.querySelectorAll('#ls-list .ls-item'),function(el){el.classList.remove('sel');});
    renderLetter(k);
  }
  function renderLetter(k){
    var L=LET[k],D=LD[k];if(!D)return;
    var h='<h3 style="font-size:1.12em;margin-bottom:4px"><span class="ls-pill" style="background:'+L.color+'">'+L.name+'</span> <span class="ls-cin">'+L.ref+'</span></h3>';
    h+='<div class="ls-small" style="color:#f5f0e1;font-size:.95em"><b>'+D.stands+'.</b> The lampstand is the church itself (Rev 1:20).</div>';
    D.sum.forEach(function(s){h+='<div class="ls-sum" style="border-left-color:'+L.color+'"><b class="h">'+s[0]+' <span class="v">'+s[2]+'</span></b>'+esc(s[1])+'</div>';});
    h+='<div class="ls-lab">The letter, '+L.ref+' (KJV)</div><div class="ls-scrip">'+verseHtml(D.text)+'</div>';
    h+='<div class="ls-lab">How it lines up with the rest of Scripture <sup class="rn-mark" data-rn="R19" title="Research" style="cursor:pointer">&#128065;&#65039;</sup></div><div class="ls-small" style="margin-bottom:4px">Each image in the letter points back to a place in the Word. Tap a reference to read it.</div>';
    D.refs.forEach(function(r){h+='<div class="ls-x"><details><summary>'+esc(r.ref)+'</summary><div class="ls-xtext">'+(r.v.length?verseHtml(r.v):'<i>Text could not be loaded.</i>')+'</div></details><div class="n">'+esc(r.note)+'</div></div>';});
    var lean=DEN.filter(function(d){return !d.custom&&d.tend[k]!=null;}).sort(function(a,b){return b.tend[k]-a.tend[k];}).slice(0,5);
    h+='<div class="ls-lab">Churches on the map that lean most toward '+L.name+'</div>';
    lean.forEach(function(d){h+='<div class="ls-lean" onclick="lsSelectDi('+d.di+')"><span><i style="display:inline-block;width:9px;height:9px;border-radius:50%;background:'+d.color+';margin-right:6px"></i>'+esc(d.short)+'</span><b>'+d.tend[k]+'%</b></div>';});
    h+='<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><button class="ls-btn" onclick="lsFilterLetter(\''+k+'\')">Highlight these on the map</button><button class="ls-btn" onclick="showTab(\'synthesis\');showChurch(\''+k+'\')">Full write-up &rarr;</button></div>';
    var el=$('ls-info');el.innerHTML=h;el.scrollTop=0;
  }
  /* ===== ADD MY FELLOWSHIP (v1.22): 24 questions, no score shown until the last answer.
     Answers are stored as option indexes, not scores, so the rubric can be re-versioned and every church recalculated (AC_RUBRIC).
     Saved in this browser for now; the shared tables and sign-in come next. Research note R20. ===== */
  var AC_KEY='wig_my_churches_v1',AC_DRAFT='wig_my_church_draft_v1',AC_RUBRIC=1;
  var AC_Q=[{"k":"love","cat":"Love and foundation","q":"What drives obedience and teaching in your fellowship?","refs":"Deut 6:5 · Matt 22:37-40 · Hos 6:6","rn":"R20","opts":[["Love of God and neighbor, and the leaders model it",9],["Love is taught, but being right about doctrine comes first",6],["Fear of God or of the leaders, or the need to perform",2],["Love has cooled, and the energy goes into arguing over doctrine",4]]},{"k":"mono","cat":"God","q":"How does your fellowship speak of God?","refs":"Deut 6:4 · Isa 45:5 · Ex 3:15","rn":"R20","opts":[["One God, and His personal name, Yahweh, is taught and used",10],["One God, but only titles such as \"Lord\" or \"God\" are used and the Name is not taught",8],["God is a force, many gods, or people can become gods",2],["One God, but the teaching blurs who He is",5]]},{"k":"messiah","cat":"Messiah","q":"Who does your fellowship teach that Yeshua (Jesus) is?","refs":"John 1:1, 14 · Isa 53 · Phil 2:6-11","rn":"R20","opts":[["A great teacher or prophet, or a created being",3],["Divine Messiah, atoning sacrifice and risen Lord",9],["One way among many",1],["Divine Messiah, atoning sacrifice, risen Lord, and the Word made flesh, Torah included",10]]},{"k":"grace","cat":"Grace and obedience","q":"How does your fellowship hold grace and obedience together?","refs":"Eph 2:8-9 · James 2:17 · Rev 14:12","rn":"R20","opts":[["Works earn salvation, or there is no standard at all",2],["Both are taught, but one clearly outweighs the other",7],["One only, and the other is set aside",4],["Both together: saved by grace through faith, with obedience as the fruit",9]]},{"k":"humility","cat":"Humility","q":"What is the spirit of your fellowship?","refs":"Isa 66:2 · Matt 5:3-12 · James 4:6","rn":"R20","opts":[["Pride in being right, or in status or a platform",3],["Humble, contrite, trembling at His word",9],["Prosperity or spiritual elitism",1],["Mixed: some humility, some pride in being right",6]]},{"k":"justice","cat":"Justice and mercy","q":"Do the poor, the widow, the orphan and the stranger have a real place in your fellowship?","refs":"Mic 6:8 · Isa 1:17 · Matt 25:31-46","rn":"R20","opts":[["Mostly inward-looking",4],["Yes, it is a regular part of the life of the fellowship",9],["Little or none",2],["Some outreach",6]]},{"k":"spirit","cat":"The Spirit","q":"How does your fellowship understand the Holy Spirit?","refs":"Ezek 36:26-27 · Gal 5:22-23 · Rom 8:4","rn":"R20","opts":[["Welcomed, but experience is stressed over fruit",6],["Denied, or reduced to a force or a feeling",2],["Known by His fruit (love, joy, peace) and empowering obedience",9],["Rarely taught",4]]},{"k":"moral","cat":"Moral holiness","q":"How does your fellowship handle personal conduct and holiness?","refs":"Lev 18-20 · 1 Cor 6:9-11 · Matt 5:27-28","rn":"R20","opts":[["Adjusted to the culture",3],["A clear standard is taught and held, with correction in love",9],["Taught, but rarely applied",6],["No standard",1]]},{"k":"canon","cat":"Final authority","q":"What has the last word in your fellowship?","refs":"Deut 4:2 · Matt 15:3-9 · 2 Tim 3:16","rn":"R20","opts":[["Scripture first, with a tradition or leadership that interprets it",6],["Another book or leader above Scripture",1],["Scripture alone, and traditions are tested by it",9],["Scripture plus later teaching of equal weight",3]]},{"k":"doctrine","cat":"Testing teaching","q":"Can teaching in your fellowship be tested against Scripture?","refs":"Deut 13:1-5 · 1 John 4:1 · Acts 17:11","rn":"R20","opts":[["Questioning is treated as rebellion",1],["Anyone can openly test teaching against Scripture",9],["Allowed in principle, rarely done in practice",7],["The leaders' word is final",3],["Allowed, but discouraged",5]]},{"k":"endure","cat":"Endurance","q":"What does your fellowship teach about hardship and cost?","refs":"Matt 24:13 · Rev 2:10 · Heb 10:36","rn":"R20","opts":[["Faith is presented as making life easier",3],["Believers are taught to follow even when it costs them",8],["Prosperity or comfort is promised",1],["Some teaching on suffering",6]]},{"k":"purity","cat":"Worship origins","q":"Does your fellowship ask where its practices came from, and test them against Scripture?","refs":"Deut 12:29-32 · Jer 10:2 · 2 Cor 6:14-17","rn":"R20","opts":[["Sometimes, but it rarely changes anything",5],["Rarely asked",3],["Yes, regularly, and it changes what it finds lacking",9],["It is discouraged",1]]},{"k":"sabbath","cat":"The Sabbath","q":"Which day does your fellowship keep as the Sabbath?","refs":"Gen 2:2-3 · Ex 31:16-17 · Isa 66:23","rn":"R20,R10","opts":[["Sunday is kept as the Sabbath, a day of rest",3],["The seventh day (Friday sunset to Saturday sunset) is kept",10],["No Sabbath is kept",1],["The seventh day is recognized and kept in part",6],["Sunday worship, but no day of rest",2]]},{"k":"feasts","cat":"Appointed times","q":"Does your fellowship keep the appointed times of Leviticus 23?","refs":"Lev 23 · Zech 14:16-19","rn":"R20,R6","opts":[["Only the Christian calendar (Christmas, Easter)",2],["Yes, they are kept",10],["None",1],["Some are kept or taught, such as Passover or Sukkot",6]]},{"k":"torah","cat":"Torah","q":"How does your fellowship treat the Torah (the first five books and its instruction)?","refs":"Matt 5:17-19 · Jer 31:33 · Rom 3:31","rn":"R20,R5","opts":[["Taught as ended",2],["Taught as living instruction for believers, kept out of love",10],["Only the moral part is kept, the rest taught as ended",3],["Discouraged or denied",1],["Good guidance for believers, kept in part",6]]},{"k":"diet","cat":"Clean and unclean foods","q":"Does your fellowship keep the clean and unclean foods of Leviticus 11?","refs":"Lev 11 · Acts 10:14, 28","rn":"R20,R7","opts":[["No restriction, taught as ended",2],["Yes, Leviticus 11 is kept",10],["Never addressed",1],["Mostly kept (for example, no pork or shellfish), with exceptions",8],["Partly, mostly for health",5]]},{"k":"prophrev","cat":"Prophetic alignment","q":"If Messiah returned and set up what the prophets describe (the Sabbath for all flesh, the feasts, Torah going out from Zion), how much would your fellowship need to change?","refs":"Isa 66:23 · Zech 14:16-19 · Isa 2:3","rn":"R20","opts":[["A great deal",3],["Very little",10],["Wholesale reform",1],["Some",6]]}];
  var AC_L=[["ephesus","Ephesus","Very careful about doctrine, testing teachers and refusing false teaching, but the first love has cooled.","Rev 2:2-4"],["smyrna","Smyrna","Poor, slandered or suffering for the faith.","Rev 2:9-10"],["pergamum","Pergamum","Holds fast the Name, yet is mixed with the surrounding culture and its practices.","Rev 2:13-15"],["thyatira","Thyatira","Loving and active, growing in good works, yet tolerating teaching it should test.","Rev 2:19-20"],["sardis","Sardis","Has a name for being alive, but little real life.","Rev 3:1-2"],["philadelphia","Philadelphia","Small, with little strength, yet keeping His word and not denying His name.","Rev 3:8"],["laodicea","Laodicea","Comfortable and self-sufficient, with little sense of need.","Rev 3:17"]];
  var AC_LOPT=[['Not really',5],['A little',30],['Quite a lot',60],['Very much',85]];
  var AC_GROUPS=[{n:'Who God and Messiah are',k:['mono','messiah','canon']},{n:'How He told us to live',k:['sabbath','feasts','torah','diet','purity','moral']},{n:'The heart',k:['grace','justice','love','spirit','humility']},{n:'Faithfulness',k:['doctrine','endure','prophrev']}];
  var AC_ALL=AC_Q.concat(AC_L.map(function(l){return {k:'L_'+l[0],letter:l[0],cat:l[1],q:'How much does your congregation look like this? '+l[2],refs:l[3],rn:'R19',opts:AC_LOPT};}));
  var AC_EMPTY='Click a dot, or choose a church or fellowship from the list, to see how close it is to the mark, which letters it leans toward, and where it is weakest. Click one of the seven candles to read that church\'s letter and how it lines up with Scripture.';
  var acState=null,customList=[];
  function acLoad(){try{return JSON.parse(localStorage.getItem(AC_KEY)||'[]')||[];}catch(e){return [];}}
  function acSave(){try{localStorage.setItem(AC_KEY,JSON.stringify(customList.map(function(d){return d.rec;})));}catch(e){}}
  function acDraftGet(){try{return JSON.parse(localStorage.getItem(AC_DRAFT)||'null');}catch(e){return null;}}
  function acDraftPut(){if(acState&&acState.editId)return;try{localStorage.setItem(AC_DRAFT,JSON.stringify(acState));}catch(e){}}
  function acDraftClear(){try{localStorage.removeItem(AC_DRAFT);}catch(e){}}
  function round5(x){return Math.round(x/5)*5;}
  function distText(d){var p=round5(d.miss*100);return p<5?'less than 5% from the mark':'about '+p+'% from the mark';}
  function acQ(k){for(var i=0;i<AC_Q.length;i++)if(AC_Q[i].k===k)return AC_Q[i];return null;}

  function acScore(ans){
    var scores=[],unk=[],tend={};
    CAT_KEYS.forEach(function(k){var q=acQ(k),a=ans[k];if(a==null||a<0||!q.opts[a]){scores.push(5);unk.push(k);}else scores.push(q.opts[a][1]);});
    AC_L.forEach(function(l){var a=ans['L_'+l[0]];tend[l[0]]=(a==null||a<0||!AC_LOPT[a])?30:AC_LOPT[a][1];});
    return {scores:scores,unk:unk,tend:tend,total:scores.reduce(function(s,v){return s+v;},0)};
  }
  /* places a custom church on the sphere by the same rule as the 48: distance from total, direction from letter leanings */
  function makeCustom(rec){
    var r=acScore(rec.ans),keys=Object.keys(LET);
    var d={di:rec.id,custom:true,rec:rec,name:rec.name,short:rec.name,scores:r.scores,total:r.total,tier:'',about:'',tend:r.tend,unk:r.unk};
    var sx=0,sy=0,sz=0,best=null,bv=-1;
    keys.forEach(function(k){var p=r.tend[k],w=Math.pow(p/100,1.4);sx+=w*LET[k].v[0];sy+=w*LET[k].v[1];sz+=w*LET[k].v[2];if(p>bv){bv=p;best=k;}});
    var len=Math.sqrt(sx*sx+sy*sy+sz*sz)||1;d.dir=[sx/len,sy/len,sz/len];
    d.miss=1-d.total/170;d.r=RF(d.miss);d.pos=[d.dir[0]*d.r,d.dir[1]*d.r,d.dir[2]*d.r];
    d.top=best||'sardis';d.color=LET[d.top].color;
    d.ranked=keys.map(function(k){return {k:k,p:r.tend[k],listed:true};}).sort(function(a,b){return b.p-a.p;});
    return d;
  }
  function acAdd(rec){
    DEN=DEN.filter(function(x){return !(x.custom&&x.rec.id===rec.id);});
    customList=customList.filter(function(x){return x.rec.id!==rec.id;});
    var d=makeCustom(rec);DEN.push(d);customList.push(d);return d;
  }
  function acRenderMy(){
    var box=$('ls-my'),list=$('ls-mylist');if(!box)return;
    box.style.display=customList.length?'block':'none';list.innerHTML='';
    customList.forEach(function(d){var el=document.createElement('div');el.className='ls-item';el.setAttribute('data-di',d.di);el.innerHTML='<i style="background:'+d.color+'"></i>'+esc(d.short)+'<span class="t">'+esc(distText(d).replace(' from the mark',''))+'</span>';el.onclick=function(){select(d);};list.appendChild(el);});
  }

  /* ---- the question window ---- */
  function acModal(html){var m=$('ls-acm');m.innerHTML='<div class="ls-mbox"><button class="ls-xc" onclick="lsAcClose()" aria-label="Close">&times;</button>'+html+'</div>';m.style.display='flex';var b=m.firstChild;if(b)b.scrollTop=0;}
  function acClose(){var m=$('ls-acm');if(m)m.style.display='none';}
  function acCount(){return AC_ALL.filter(function(q){return acState.ans[q.k]!=null;}).length;}
  function acOpen(rec){
    var dr=rec?null:acDraftGet();
    if(dr&&dr.ans)acState=dr;
    else acState={name:rec?rec.name:'',city:rec?(rec.city||''):'',ans:rec?JSON.parse(JSON.stringify(rec.ans)):{},i:0,editId:rec?rec.id:null};
    acIntro();
  }
  function acIntro(){
    var n=acCount(),h='<div class="ls-lab" style="margin-top:0">Add my fellowship</div><h3 style="font-size:1.2em">Where does your fellowship stand with Scripture?</h3>';
    h+='<p class="ls-small" style="font-size:.95em;color:#f5f0e1">There are '+AC_ALL.length+' questions, about 5 minutes. Answer for your fellowship as it actually is, not as it says it is. If you can\'t tell, choose "I don\'t know."</p>';
    h+='<p class="ls-small" style="font-size:.95em;color:#f5f0e1">Nothing is scored on screen until you answer the last question. Then you will see where your fellowship stands, by Amit\'s reading of Scripture, with the verses. It is a pattern, not a verdict, and a reason to look at the Word again.</p>';
    h+='<p class="ls-small">For now your fellowship is saved in this browser only.</p>';
    h+='<label class="ls-fl">Name of your fellowship<input id="ls-acname" type="text" maxlength="60" value="'+esc(acState.name)+'"></label>';
    h+='<label class="ls-fl">City and state (so fellowships with the same name are not mixed up)<input id="ls-accity" type="text" maxlength="60" value="'+esc(acState.city||'')+'"></label>';
    h+='<div id="ls-acerr" class="ls-small" style="color:#ffb3a8;min-height:1.3em"></div>';
    h+='<button class="ls-btn" onclick="lsAcStart()">'+(acState.editId?'Review and change my answers':n?'Continue ('+n+' of '+AC_ALL.length+' answered)':'Start')+' &rarr;</button>';
    if(n)h+=' <button class="ls-btn" onclick="lsAcRestart()">Start over</button>';
    acModal(h);
  }
  function acQuestion(){
    var q=AC_ALL[acState.i],cur=acState.ans[q.k],last=acState.i===AC_ALL.length-1;
    var h='<div class="ls-lab" style="margin-top:0">Question '+(acState.i+1)+' of '+AC_ALL.length+'</div>';
    h+='<div class="ls-pbar"><b style="width:'+Math.round(acState.i/AC_ALL.length*100)+'%"></b></div>';
    h+='<h3 style="font-size:1.1em">'+esc(q.cat)+'</h3><div class="ls-aq">'+esc(q.q)+'</div>';
    q.opts.forEach(function(o,idx){h+='<div class="ls-opt'+(cur===idx?' on':'')+'" onclick="lsAcPick('+idx+')">'+esc(o[0])+'</div>';});
    if(!q.letter)h+='<div class="ls-opt'+(cur===-1?' on':'')+'" onclick="lsAcPick(-1)">I don\'t know</div>';
    h+='<div class="ls-small" style="margin-top:8px">'+esc(q.refs)+' <sup class="rn-mark" data-rn="'+q.rn+'" title="Research" style="cursor:pointer">&#128065;&#65039;</sup></div>';
    h+='<div style="margin-top:12px;display:flex;gap:8px"><button class="ls-btn" onclick="lsAcBack()">&larr; Back</button><button class="ls-btn" onclick="lsAcNext()"'+(cur==null?' disabled style="opacity:.4;cursor:default"':'')+'>'+(last?'See where it stands':'Next')+' &rarr;</button></div>';
    acModal(h);
  }
  window.lsAcClose=acClose;
  window.lsAcStart=function(){
    var nm=($('ls-acname').value||'').trim(),ct=($('ls-accity').value||'').trim();
    if(!nm){$('ls-acerr').textContent='Please give your fellowship a name.';return;}
    acState.name=nm;acState.city=ct;
    var first=0;for(var i=0;i<AC_ALL.length;i++){if(acState.ans[AC_ALL[i].k]==null){first=i;break;}}
    acState.i=first;acDraftPut();acQuestion();
  };
  window.lsAcRestart=function(){acState.ans={};acState.i=0;acDraftPut();acIntro();};
  window.lsAcPick=function(idx){acState.ans[AC_ALL[acState.i].k]=idx;acDraftPut();acQuestion();};
  window.lsAcBack=function(){if(acState.i>0){acState.i--;acQuestion();}else acIntro();};
  window.lsAcNext=function(){
    if(acState.ans[AC_ALL[acState.i].k]==null)return;
    if(acState.i<AC_ALL.length-1){acState.i++;acDraftPut();acQuestion();return;}
    acFinish();
  };
  function acFinish(){
    for(var i=0;i<AC_ALL.length;i++){if(acState.ans[AC_ALL[i].k]==null){acState.i=i;acQuestion();return;}}
    var id=acState.editId||Date.now(),old=null;
    customList.forEach(function(x){if(x.rec.id===id)old=x.rec;});
    var rec={id:id,name:acState.name,city:acState.city,ans:acState.ans,rubric:AC_RUBRIC,date:new Date().toISOString(),history:old?(old.history||[]).concat([{ans:old.ans,date:old.date,rubric:old.rubric}]):[]};
    var d=acAdd(rec);acSave();acDraftClear();acState=null;acClose();acRenderMy();
    filter=null;Array.prototype.forEach.call($('ls-legend').children,function(e){e.classList.remove('on');});
    select(d);
    var p=$('ls-info');if(p&&p.scrollIntoView)p.scrollIntoView({behavior:'smooth',block:'start'});
  }
  window.lsAcRetake=function(id){var d=customList.filter(function(x){return x.rec.id===id;})[0];if(d){acState=null;acOpen(d.rec);}};
  window.lsAcRename=function(id){
    var d=customList.filter(function(x){return x.rec.id===id;})[0];if(!d)return;
    var nm=prompt('Name of your fellowship',d.rec.name);if(nm==null)return;nm=nm.trim();if(!nm)return;
    var ct=prompt('City and state',d.rec.city||'');if(ct==null)ct=d.rec.city||'';
    d.rec.name=nm;d.rec.city=ct.trim();var nd=acAdd(d.rec);acSave();acRenderMy();select(nd);
  };
  window.lsAcDelete=function(id){
    if(!confirm('Remove this fellowship from this browser? This cannot be undone.'))return;
    DEN=DEN.filter(function(x){return !(x.custom&&x.rec.id===id);});
    customList=customList.filter(function(x){return x.rec.id!==id;});
    if(sel&&sel.custom&&sel.rec.id===id){sel=null;$('ls-info').innerHTML='<div class="ls-empty">'+AC_EMPTY+'</div>';}
    acSave();acRenderMy();
  };
  window.lsReadLetter=function(k){selectLetter(k);};

  /* ---- the result: no letter grade, no tier. Distance is rounded to the nearest 5 and always sits over the four area bars. ---- */
  function barColor(p){return p>=75?'#3ddc84':p>=50?'#e6c84a':'#ff9a4a';}
  function renderCustom(d){
    var rec=d.rec,ans=rec.ans,h='';
    var unkSet={};d.unk.forEach(function(k){unkSet[k]=1;});
    h+='<h3 style="font-size:1.15em;margin-bottom:2px">'+esc(rec.name)+'</h3>';
    if(rec.city)h+='<div class="ls-small" style="margin-bottom:6px">'+esc(rec.city)+'</div>';
    h+='<div class="ls-big">'+distText(d)+'<small>from your answers &middot; by Amit\'s reading of Scripture &middot; a pattern, not a verdict</small></div>';
    if(d.unk.length>=5)h+='<div class="ls-small" style="color:#e9d38a">'+d.unk.length+' answers were "I don\'t know," so treat this as a rough picture.</div>';
    h+='<div class="ls-lab">Where it stands, by area</div>';
    AC_GROUPS.forEach(function(g){
      var s=0;g.k.forEach(function(k){s+=d.scores[CAT_KEYS.indexOf(k)];});var p=Math.round(s/(g.k.length*10)*100);
      h+='<div class="ls-row"><span>'+g.n+'</span><b>'+p+'%</b></div><div class="ls-bar"><b style="width:'+p+'%;background:'+barColor(p)+'"></b></div>';
    });
    h+='<div class="ls-small">Each bar shows how near the mark that area is.</div>';
    var rows=CAT_KEYS.map(function(k,i){return {k:k,i:i,s:d.scores[i]};}).filter(function(r){return !unkSet[r.k];});
    var agree=rows.filter(function(r){return r.s>=8;}).sort(function(a,b){return b.s-a.s||a.i-b.i;}).slice(0,5);
    var gaps=rows.filter(function(r){return r.s<=7;}).sort(function(a,b){return a.s-b.s||a.i-b.i;}).slice(0,5);
    h+='<div class="ls-lab">Where it stands with Scripture <sup class="rn-mark" data-rn="R20" title="Research" style="cursor:pointer">&#128065;&#65039;</sup></div>';
    if(agree.length)agree.forEach(function(r){var q=acQ(r.k);h+='<div class="ls-dep ok"><b>'+esc(q.cat)+'</b> <span class="v">'+esc(q.refs)+'</span></div>';});
    else h+='<div class="ls-small">No area scored high enough to list.</div>';
    h+='<div class="ls-lab">Where it departs, by Amit\'s reading <sup class="rn-mark" data-rn="R20" title="Research" style="cursor:pointer">&#128065;&#65039;</sup></div>';
    if(gaps.length)gaps.forEach(function(r){var q=acQ(r.k),a=ans[r.k],t=(a!=null&&a>=0&&q.opts[a])?q.opts[a][0]:'';h+='<div class="ls-dep"><b>'+esc(q.cat)+'</b> <span class="v">'+esc(q.refs)+'</span>'+(t?'<br>You answered: '+esc(t):'')+'</div>';});
    else h+='<div class="ls-small">No major departures in these answers.</div>';
    var top=d.ranked[0],L=LET[top.k];
    h+='<div class="ls-lab">The letter it leans toward</div><div class="ls-row"><span style="color:'+L.color+'">'+L.name+'</span><b>'+top.p+'%</b></div><div class="ls-bar"><b style="width:'+top.p+'%;background:'+L.color+'"></b></div>';
    h+='<div class="ls-small" style="color:#f5f0e1"><b style="color:'+L.color+'">'+L.name+' ('+L.ref+'):</b> '+L.call+'</div>';
    h+='<div style="margin-top:8px"><button class="ls-btn" onclick="lsReadLetter(\''+top.k+'\')">Read the whole letter &rarr;</button></div>';
    var near=DEN.filter(function(x){return !x.custom;}).sort(function(a,b){return Math.abs(a.total-d.total)-Math.abs(b.total-d.total);}).slice(0,3);
    h+='<div class="ls-lab">Churches on the map at a similar distance</div>';
    near.forEach(function(x){h+='<span class="ls-pillchip" onclick="lsSelectDi('+x.di+')">'+esc(x.short)+'</span>';});
    h+='<div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap"><button class="ls-btn" onclick="lsAcRetake('+rec.id+')">Retake</button><button class="ls-btn" onclick="lsAcRename('+rec.id+')">Edit name</button><button class="ls-btn" onclick="lsAcDelete('+rec.id+')">Remove</button></div>';
    h+='<div class="ls-small" style="margin-top:8px">Answered '+new Date(rec.date).toLocaleDateString()+'. Saved in this browser only.</div>';
    var el=$('ls-info');el.innerHTML=h;el.scrollTop=0;
  }
  function acInit(){
    var b=$('ls-bAdd');if(b)b.onclick=function(){acOpen(null);};
    var m=$('ls-acm');if(m)m.addEventListener('click',function(e){if(e.target===m)acClose();});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'){var mm=$('ls-acm');if(mm&&mm.style.display!=='none')acClose();}});
    acLoad().forEach(function(rec){if(rec&&rec.ans&&rec.id)acAdd(rec);});
    acRenderMy();
  }
  function drawRadar(d){
    var c=$('ls-radar');if(!c)return;var x=c.getContext('2d'),w=c.width,h=c.height,cx=w/2,cy=h/2+6,R=76,n=ORDER.length;
    function pt(i,v){var a=-Math.PI/2+i*2*Math.PI/n;return [cx+Math.cos(a)*R*v,cy+Math.sin(a)*R*v];}
    x.clearRect(0,0,w,h);
    [.25,.5,.75,1].forEach(function(lv){x.beginPath();for(var i=0;i<n;i++){var p=pt(i,lv);i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]);}x.closePath();x.strokeStyle='rgba(150,180,230,.25)';x.lineWidth=1;x.stroke();});
    for(var i=0;i<n;i++){var p=pt(i,1);x.beginPath();x.moveTo(cx,cy);x.lineTo(p[0],p[1]);x.strokeStyle='rgba(150,180,230,.2)';x.stroke();}
    function val(k){return Math.min(1,((d.tend[k]!=null?d.tend[k]:FLOORS[k]))/100);}
    x.beginPath();ORDER.forEach(function(k,i){var p=pt(i,val(k));i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]);});x.closePath();
    x.fillStyle=rgba(d.color,.30);x.fill();x.strokeStyle=rgba(d.color,.95);x.lineWidth=2;x.stroke();
    ORDER.forEach(function(k,i){var p=pt(i,val(k));x.beginPath();x.arc(p[0],p[1],3.2,0,Math.PI*2);x.fillStyle=LET[k].color;x.fill();
      var q=pt(i,1.24);x.fillStyle=LET[k].color;x.font='11px Cinzel,Georgia,serif';x.textAlign=Math.abs(q[0]-cx)<6?'center':q[0]>cx?'left':'right';x.fillText(LET[k].name,q[0]+(q[0]>cx+6?-2:q[0]<cx-6?2:0),q[1]+4);});
  }
  function init(){
    root=$('lampstands');cv=$('ls-cv');ctx=cv.getContext('2d');tip=$('ls-tip');
    buildData();
    var legend=$('ls-legend');
    Object.keys(LET).forEach(function(k){var c=document.createElement('div');c.className='ls-chip';c.setAttribute('data-k',k);c.innerHTML='<i style="background:'+LET[k].color+'"></i>'+LET[k].name;c.onclick=function(){filter=(filter===k?null:k);Array.prototype.forEach.call(legend.children,function(e){e.classList.toggle('on',e.getAttribute('data-k')===filter);});};legend.appendChild(c);});
    var list=$('ls-list');
    DEN.slice().sort(function(a,b){return b.total-a.total;}).forEach(function(d){var el=document.createElement('div');el.className='ls-item';el.setAttribute('data-di',d.di);el.innerHTML='<i style="background:'+d.color+'"></i>'+d.short+'<span class="t">'+d.total+' · '+Math.round(d.total/170*100)+'%</span>';el.onclick=function(){select(d);};list.appendChild(el);});
    $('ls-bAuto').onclick=function(){setAuto(!auto);};
    $('ls-bLab').onclick=function(){showAll=!showAll;this.classList.toggle('on',showAll);};
    $('ls-bReset').onclick=function(){tween={t0:performance.now(),dur:700,y0:yaw,y1:0.55,p0:pitch,p1:0.32,z0:zoom,z1:1};};
    $('ls-bUp').onclick=function(){pitch=Math.min(1.45,pitch+0.18);setAuto(false);};
    $('ls-bDown').onclick=function(){pitch=Math.max(-1.45,pitch-0.18);setAuto(false);};
    $('ls-bClear').onclick=function(){sel=null;selLetter=null;$('ls-info').innerHTML='<div class="ls-empty">Click a dot, or choose a church or fellowship from the list, to see how close it is to the mark, which letters it leans toward, and where it is weakest. Click one of the seven candles to read that church\'s letter and how it lines up with Scripture.</div>';Array.prototype.forEach.call(document.querySelectorAll('#ls-list .ls-item'),function(el){el.classList.remove('sel');});};
    cv.addEventListener('pointerdown',function(e){cv.setPointerCapture(e.pointerId);ptrs[e.pointerId]={x:e.clientX,y:e.clientY};var ks=Object.keys(ptrs);if(ks.length===1){dragging=true;lx=e.clientX;ly=e.clientY;moved=0;cv.classList.add('drag');tween=null;}if(ks.length===2){var a=ptrs[ks[0]],b=ptrs[ks[1]];pinch0=Math.hypot(a.x-b.x,a.y-b.y);zoom0=zoom;}});
    cv.addEventListener('pointermove',function(e){
      var r=cv.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;
      if(ptrs[e.pointerId])ptrs[e.pointerId]={x:e.clientX,y:e.clientY};
      var ks=Object.keys(ptrs);
      if(ks.length===2){var a=ptrs[ks[0]],b=ptrs[ks[1]];zoom=Math.max(.6,Math.min(2.6,zoom0*Math.hypot(a.x-b.x,a.y-b.y)/pinch0));return;}
      if(dragging){var dx=e.clientX-lx,dy=e.clientY-ly;lx=e.clientX;ly=e.clientY;moved+=Math.abs(dx)+Math.abs(dy);yaw+=dx*0.0075;if(e.pointerType!=='touch')pitch=Math.max(-1.45,Math.min(1.45,pitch+dy*0.0075));}
      else hover(mx,my);
    });
    function endPtr(e){delete ptrs[e.pointerId];if(!Object.keys(ptrs).length){dragging=false;cv.classList.remove('drag');}}
    cv.addEventListener('pointerup',function(e){var r=cv.getBoundingClientRect(),was=moved<5;endPtr(e);if(was){var h=pick(e.clientX-r.left,e.clientY-r.top);if(h){if(h.k)selectLetter(h.k);else select(h.d);}}});
    cv.addEventListener('pointercancel',endPtr);
    cv.addEventListener('pointerleave',function(){hov=null;tip.style.display='none';});
    cv.addEventListener('wheel',function(e){e.preventDefault();zoom=Math.max(.6,Math.min(2.6,zoom*(e.deltaY<0?1.08:.93)));},{passive:false});
    window.addEventListener('resize',function(){if(root.offsetParent!==null)resize();});
    acInit();
    inited=true;
  }
  window.lampstandsStart=function(){
    if(!inited||root!==$('lampstands'))init();
    resize();
    if(!running){running=true;lastT=performance.now();requestAnimationFrame(loop);}
  };
  window.lsOpenReview=function(di){showTab('scores');showDenomTotal(di);};
  window.lsFilterLetter=function(k){filter=(filter===k?null:k);Array.prototype.forEach.call($('ls-legend').children,function(e){e.classList.toggle('on',e.getAttribute('data-k')===filter);});};
  window.lsSelectDi=function(di){if(!inited)init();var d=DEN.filter(function(x){return x.di===di;})[0];if(d)select(d);};
})();

