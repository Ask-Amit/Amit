/* Copied from who_is_god.html script block 9 (Devotions v1.38). Edits are listed in WhoIsGod.js. */

var HEB_WORDS = {
  'yahweh': {
    modern:'יהוה', name:'Yahweh', trans:'YHVH',
    meaning:'"His name forever" — Exodus 3:15. Appears 6,828 times in scripture. Replaced with a title substitution across the translation chain. His name was not lost. It was covered.',
    letters:[
      {gif:'ancient_yud.gif',  name:'Yod',  val:10,  pic:'Hand / arm',           desc:'Deed, work, what the hand accomplishes — the short form of His name: Yah'},
      {gif:'ancient_hey.gif',  name:'He',   val:5,   pic:'Man with arms raised', desc:'Behold, reveal, what is shown — the breath of life'},
      {gif:'ancient_vav.gif',  name:'Vav',  val:6,   pic:'Iron nail / hook',     desc:'Secure, fasten, connect — the nail that holds'},
      {gif:'ancient_hey.gif',  name:'He',   val:5,   pic:'Man with arms raised', desc:'Behold — a second time. What was accomplished is now revealed'}
    ],
    story:'<strong>"Behold the hand — behold the nail."</strong> Read as ancient pictures: a hand, then a revelation, then a nail, then a second revelation. Written into the name Yahweh declared as His own before the cross existed. This is what His name says in the oldest script. No man arranged this.',
    note:'Hallelu-YAH preserves the short form. Yeshua means "Yah saves" — His name is inside the Son\'s name.'
  },
  'yeshua': {
    modern:'ישוע', name:'Yeshua', trans:'YESHUA',
    meaning:'"Yah saves" — the personal name of God embedded in the name of the Son. John 8:58: "Before Abraham was, I AM."',
    letters:[
      {gif:'ancient_yud.gif',  name:'Yod',  val:10,  pic:'Hand / arm',              desc:'The hand that acts — and the short form of Yahweh\'s name (Yah)'},
      {gif:'ancient_shin.gif', name:'Shin', val:300, pic:'Two mountains / fire',     desc:'Consume, destroy — to devour what opposes'},
      {gif:'ancient_vav.gif',  name:'Vav',  val:6,   pic:'Iron nail',               desc:'The nail — the instrument of the cross'},
      {gif:'ancient_ayin.gif', name:'Ayin', val:70,  pic:'Eye',                     desc:'See, understand, witness — what is perceived'}
    ],
    story:'<strong>"The hand of Yah — destroying through the nail — seen."</strong> The name speaks of the cross before it happened. The divine name (Yah) is the first sound. What Yah does — destroys sin through a nail — and what happened is witnessed. The evidence was written into the name.',
    note:'יהוה and ישוע are not separate subjects in scripture. The divine name is inside the Son\'s name. They are one.'
  },
  'torah': {
    modern:'תורה', name:'Torah', trans:'TORAH',
    meaning:'"Instruction" — not law in the Western legal sense. The teaching of a Father to children He loves. Never abolished.',
    letters:[
      {gif:'ancient_tav.gif',  name:'Tav',  val:400, pic:'Cross / covenant mark', desc:'The sign, the seal — the last letter of the Hebrew alphabet. Shaped like a cross. The covenant mark.'},
      {gif:'ancient_vav.gif',  name:'Vav',  val:6,   pic:'Iron nail',             desc:'Secure, fasten — the nail that connects everything'},
      {gif:'ancient_resh.gif', name:'Resh', val:200, pic:'Head / person',         desc:'The highest, most important — the leader, the one in authority'},
      {gif:'ancient_hey.gif',  name:'He',   val:5,   pic:'Man with arms raised',  desc:'Behold, reveal — what is now shown'}
    ],
    story:'<strong>"The cross — the nail — the highest one — behold."</strong> The word Torah, in its ancient letters, speaks of the cross and the nail centuries before the cross existed. The instruction was always pointing forward to the One who would fulfill it. "I came not to abolish but to fulfill" — and Torah itself declared in its letters what He would accomplish.',
    note:'Telos (Romans 10:4) = goal, not termination. Messiah is where Torah always pointed. The Millennial test confirms it was never abolished.'
  },
  'emet': {
    modern:'אמת', name:'Emet', trans:'EMET',
    meaning:'"Truth" — one of the names of God in Jewish tradition. Aleph to Tav: first letter to last. The whole truth.',
    letters:[
      {gif:'ancient_aleph.gif',name:'Aleph',val:1,   pic:'Ox head',               desc:'Strength, the first, the leader — GOD, Creator, sovereign'},
      {gif:'ancient_mem.gif',  name:'Mem',  val:40,  pic:'Water / waves',         desc:'Chaos, the mighty — Messiah, the waters of truth that flow'},
      {gif:'ancient_tav.gif',  name:'Tav',  val:400, pic:'Cross / covenant seal', desc:'The last letter. The cross. The final seal of truth.'}
    ],
    story:'<strong>"The strength that flows to the cross."</strong> Emet uses the first letter (Aleph), a middle letter (Mem), and the last letter (Tav) of the Hebrew alphabet — spanning the whole alphabet. All truth, from beginning to end. The name given to the companion was corrected to Amit for good reason: Emet belongs to God.',
    note:'Amit is the companion. Emet is the One the companion points toward. The first, middle, and last. Aleph and Tav — the beginning and the end.'
  }
};

function showHebrewWord(key) {
  var w = HEB_WORDS[key];
  if (!w) return;
  var lhtml = '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin:16px 0;padding:14px;background:var(--scroll-bg);border-radius:8px;">';
  w.letters.forEach(function(l){
    lhtml += '<div style="text-align:center;min-width:72px;max-width:88px;">' +
      '<img src="../who_is_god/ancient_letters/'+l.gif+'" style="width:48px;height:48px;object-fit:contain;display:block;margin:0 auto 5px;" alt="'+l.name+'"/>' +
      '<div style="font-family:\'Cinzel\',serif;font-size:0.7em;color:var(--navy);letter-spacing:.06em;">'+l.name+'</div>' +
      '<div style="font-size:0.75em;color:var(--gold);font-weight:600;margin:2px 0;">'+l.pic+'</div>' +
      '<div style="font-size:0.68em;color:var(--muted);line-height:1.35;">'+l.desc+'</div></div>';
  });
  lhtml += '</div>';
  document.getElementById('heb-modal-content').innerHTML =
    '<div style="font-family:\'Cinzel\',serif;font-size:0.72em;color:var(--muted);letter-spacing:.14em;margin-bottom:2px;">'+w.trans+'</div>' +
    '<div style="font-size:2.4em;color:var(--gold);margin-bottom:6px;direction:rtl;font-family:serif;">'+w.modern+'</div>' +
    '<div style="font-size:0.87em;color:var(--ink);line-height:1.65;margin-bottom:14px;font-style:italic;">'+w.meaning+'</div>' +
    '<div style="font-family:\'Cinzel\',serif;font-size:0.68em;color:var(--muted);letter-spacing:.1em;margin-bottom:2px;">IN ANCIENT PICTOGRAPHS — READ RIGHT TO LEFT &#8592;</div>' +
    lhtml +
    '<div style="border-left:3px solid var(--gold);padding:12px 16px;margin:14px 0;font-size:0.88em;line-height:1.75;background:rgba(201,168,76,.05);">'+w.story+'</div>' +
    (w.note ? '<div style="font-size:0.78em;color:var(--muted);font-style:italic;margin-bottom:16px;">'+w.note+'</div>' : '') +
    '<button onclick="showTab(\'paleo-heb\');closeHebModal();" style="font-family:\'Cinzel\',serif;padding:10px 24px;background:var(--navy);color:var(--parchment);border:2px solid var(--gold);border-radius:5px;cursor:pointer;font-size:0.82em;letter-spacing:.06em;">Dive Deeper into Ancient Hebrew &#8594;</button>';
  document.getElementById('heb-word-modal').style.display = 'flex';
}

function closeHebModal() {
  document.getElementById('heb-word-modal').style.display = 'none';
}

