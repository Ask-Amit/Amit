/* Copied from who_is_god.html script block 4 (Devotions v1.38). Edits are listed in WhoIsGod.js. */

  var RAPTURE_DENOMS = [
    {name:"Messianic (Torah-observant)",view:"Post-Trib / Pre-Wrath",conf:"High",color:"var(--gold)",note:"Most Messianic communities expect to endure tribulation, drawing on the biblical pattern of preservation-through. Philadelphia promise (Rev 3:10) held as protection, not removal."},
    {name:"Hebrew Roots (balanced)",view:"Post-Trib / Pre-Wrath",conf:"High",color:"var(--gold)",note:"Same pattern as Messianic. Endurance emphasis (Rev 14:12) is central to identity."},
    {name:"Nazarene Israel / Netzarim",view:"Post-Trib",conf:"High",color:"var(--gold)",note:"Strongly post-trib; pre-trib seen as a false comfort inconsistent with the Smyrna/Philadelphia pattern."},
    {name:"Conservative Anabaptist",view:"Post-Trib",conf:"High",color:"var(--gold)",note:"Historic Anabaptist theology expected suffering and endurance. No expectation of escape. Martyrdom willingness is a core identity marker."},
    {name:"Seventh-Day Adventist",view:"Post-Trib",conf:"High",color:"var(--gold)",note:"SDA formally teaches a single visible second coming with no secret rapture. The dead sleep until the second coming resurrection."},
    {name:"Eastern Orthodox",view:"Post-Trib / Amillennial",conf:"High",color:"#4a8c5c",note:"Orthodox eschatology is non-dispensational. No secret rapture. Expects endurance through tribulation. Some amillennial tendencies on the Millennium."},
    {name:"Reformed / Calvinist",view:"Amillennial / Post-Trib",conf:"High",color:"#4a8c5c",note:"Dominant Reformed position is amillennial (Calvin, Berkhof, Hoekema). No dispensational rapture. Post-trib is the secondary position in Reformed circles."},
    {name:"Lutheran (Confessional)",view:"Amillennial",conf:"High",color:"#4a8c5c",note:"Lutheran confessional tradition follows Luther's amillennialism. No rapture theology. Second coming is singular and public."},
    {name:"Roman Catholic",view:"Amillennial",conf:"High",color:"#4a8c5c",note:"Catholic eschatology is officially amillennial. No rapture doctrine. Augustine's influence on the symbolic reading of Rev 20 remains dominant."},
    {name:"Anglican / Episcopalian",view:"Amillennial / Post-Trib",conf:"Medium",color:"#b8860b",note:"Anglican formularies do not specify rapture timing. Historic Anglican theology tends amillennial but individual variation is wide."},
    {name:"Methodist / Wesleyan",view:"Post-Trib / Amillennial",conf:"Medium",color:"#b8860b",note:"Wesley was amillennial. Methodist tradition has no strong rapture position. Individual congregations vary widely."},
    {name:"Southern Baptist (Conservative)",view:"Pre-Trib",conf:"High",color:"var(--deep-red)",note:"Pre-trib dispensationalism became dominant in conservative Baptist circles through Scofield Reference Bible influence. Widely assumed as default."},
    {name:"Non-Denom Evangelical",view:"Pre-Trib",conf:"High",color:"var(--deep-red)",note:"Pre-trib is the default assumption in most American non-denom evangelical culture. Left Behind series (LaHaye/Jenkins) cemented popular pre-trib expectation."},
    {name:"Pentecostal / Charismatic",view:"Pre-Trib",conf:"High",color:"var(--deep-red)",note:"Pre-trib rapture is near-universal in Pentecostal/charismatic tradition. Imminent return is a key motivator of evangelistic urgency in this tradition."},
    {name:"Church of God (7th Day)",view:"Post-Trib",conf:"High",color:"var(--gold)",note:"Post-trib expectation consistent with their Torah-adjacent eschatology and endurance emphasis."},
    {name:"WCG (Original HWA Era)",view:"Post-Trib",conf:"High",color:"var(--gold)",note:"Armstrong explicitly taught post-trib and place of safety (not rapture). Endurance and preparation were emphasized."},
    {name:"Jehovah's Witnesses",view:"No Rapture (unique)",conf:"High",color:"#6b3a8a",note:"JW eschatology is unique — 144,000 heavenly class + earthly survivors. No traditional rapture. Armageddon followed by paradise earth. Does not fit standard rapture categories."},
    {name:"LDS (Mormon)",view:"No Rapture (unique)",conf:"High",color:"#6b3a8a",note:"LDS eschatology centers on gathering to Zion, not rapture. The Missouri gathering and return of Christ are central. Pre-trib rapture is not LDS doctrine."},
    {name:"Prosperity Gospel",view:"Pre-Trib",conf:"High",color:"var(--deep-red)",note:"Pre-trib is assumed in most prosperity gospel contexts — consistent with the broader non-denom charismatic default and the comfort-over-cost theological tendency."},
    {name:"Unitarian Universalist",view:"None / Symbolic",conf:"High",color:"#5a5a5a",note:"UU does not hold to biblical eschatology. End-times views are entirely individual and typically non-literal."}
  ];

  var RFT_DESCS = {
    all:'All traditions shown — sorted by position.',
    post:'Traditions holding Post-Tribulation or Pre-Wrath positions — endurance through tribulation, preservation-through rather than removal-before.',
    pre:'Traditions holding Pre-Tribulation positions — secret rapture before the tribulation period begins.',
    amill:'Traditions holding Amillennial positions — no literal Millennium; tribulation interpreted symbolically or already past.',
    prewrath:'Traditions specifically holding Pre-Wrath — the Church is removed before the wrath of God but after the tribulation of Antichrist.',
    mid:'Traditions holding Mid-Tribulation positions — rapture occurs at the midpoint of the seven-year period.',
    unique:'Traditions with eschatological systems that do not fit standard rapture categories.'
  };
  var RFT_FILTERS = {
    all:function(v){return true;},
    post:function(v){return v.indexOf('Post-Trib')!==-1||v.indexOf('Pre-Wrath')!==-1;},
    pre:function(v){return v==='Pre-Trib';},
    amill:function(v){return v.indexOf('Amillennial')!==-1;},
    prewrath:function(v){return v.indexOf('Pre-Wrath')!==-1;},
    mid:function(v){return v.indexOf('Mid-Trib')!==-1;},
    unique:function(v){return v.indexOf('No Rapture')!==-1||v.indexOf('None')!==-1||v.indexOf('Symbolic')!==-1||v.indexOf('Pan-Trib')!==-1;}
  };

  function filterRaptureTable(key, btn) {
    var filter = RFT_FILTERS[key]||RFT_FILTERS.all;
    var rows = document.querySelectorAll('#rapture-denom-tbody tr');
    var shown = 0;
    rows.forEach(function(row){
      var view = row.getAttribute('data-view')||'';
      if(filter(view)){ row.style.display=''; shown++; } else { row.style.display='none'; }
    });
    document.querySelectorAll('.rft-btn').forEach(function(b){ b.classList.remove('rft-active'); });
    if(btn) btn.classList.add('rft-active');
    var desc = document.getElementById('rapture-filter-desc');
    if(desc) desc.textContent = (RFT_DESCS[key]||'')+' ('+shown+' tradition'+(shown!==1?'s':'')+' shown)';
  }

  function showRaptureDefense(idx) {
    var d = RAPTURE_DENOMS[idx];
    if(!d) return;
    var modal = document.getElementById('church-pct-modal');
    var title = document.getElementById('church-pct-title');
    var body = document.getElementById('church-pct-body');
    title.textContent = d.name + ' — ' + d.view;
    var confColor = d.conf==='High'?'#2e5e2e':d.conf==='Medium'?'#7a5c00':'#5a5a5a';
    body.innerHTML =
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">' +
      '<span style="font-family:Cinzel,serif;font-size:1em;font-weight:700;color:'+d.color+';">'+d.view+'</span>' +
      '<span style="background:'+confColor+';color:#fff;border-radius:3px;padding:2px 8px;font-size:.8em;font-family:Cinzel,serif;">'+d.conf+' Confidence</span>' +
      '</div>' +
      '<div style="background:rgba(27,42,74,.06);border-left:3px solid var(--gold);padding:12px 16px;border-radius:0 6px 6px 0;margin-bottom:16px;">' +
      '<div style="font-family:Cinzel,serif;font-size:.78em;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:6px;">Amit\'s Defense — Why This Placement</div>' +
      '<div style="font-size:.95em;line-height:1.78;color:var(--ink);">'+d.note+'</div></div>' +
      '<div style="font-size:.84em;color:#888;font-style:italic;margin-top:10px;">This placement reflects the dominant teaching tradition of the movement, not every congregation or individual. Confidence reflects consistency of position across the tradition\'s scholarship and official statements.</div>' +
      '<div style="margin-top:14px;"><button onclick="document.getElementById(\'church-pct-modal\').style.display=\'none\'" style="background:var(--navy);color:var(--parchment);border:none;border-radius:4px;padding:7px 14px;font-family:Cinzel,serif;font-size:.78em;letter-spacing:.08em;cursor:pointer;">Close</button></div>';
    modal.style.display = 'flex';
  }

  function buildRaptureTable() {
    var tbody = document.getElementById('rapture-denom-tbody');
    if(!tbody) return;
    var html = '';
    RAPTURE_DENOMS.forEach(function(d, i) {
      var bg = i%2===0 ? 'var(--parchment)' : 'var(--scroll-bg)';
      html += '<tr data-view="'+d.view+'" style="background:'+bg+';border-bottom:1px solid var(--border);cursor:pointer;transition:background .15s;" ondblclick="showRaptureDefense('+i+')" onmouseover="this.style.background=\'rgba(201,168,76,.1)\'" onmouseout="this.style.background=\''+bg+'\'" title="Double-click for Amit\'s defense of this placement">';
      html += '<td style="padding:9px 10px;font-weight:600;">'+d.name+'<span style="font-size:.7em;color:var(--gold-dim);margin-left:6px;">double-click →</span></td>';
      html += '<td style="padding:9px 10px;text-align:center;font-weight:700;color:'+d.color+';">'+d.view+'</td>';
      html += '<td style="padding:9px 10px;text-align:center;"><span style="padding:2px 8px;border-radius:3px;font-size:.82em;background:'+(d.conf==='High'?'#2e5e2e':d.conf==='Medium'?'#7a5c00':'#5a5a5a')+';color:#fff;">'+d.conf+'</span></td>';
      html += '<td style="padding:9px 10px;font-size:0.88em;line-height:1.6;">'+d.note+'</td>';
      html += '</tr>';
    });
    tbody.innerHTML = html;
    filterRaptureTable('all', document.querySelector('.rft-btn.rft-active'));
  }

  function showView(id) {
    document.querySelectorAll('.view-panel').forEach(function(p){ p.style.display='none'; });
    document.querySelectorAll('.view-btn').forEach(function(b){
      b.style.background='var(--navy)'; b.style.color='var(--parchment)'; b.style.fontWeight='';
    });
    var panel = document.getElementById('view-'+id);
    if(panel) panel.style.display='block';
    var btn = document.getElementById('vbtn-'+id);
    if(btn){ btn.style.background='var(--gold)'; btn.style.color='var(--navy)'; btn.style.fontWeight='700'; }
  }

  document.addEventListener('DOMContentLoaded', function(){ showView('posttrib'); buildRaptureTable(); });
  
