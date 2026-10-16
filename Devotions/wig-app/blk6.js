/* Copied from who_is_god.html script block 6 (Devotions v1.38). Edits are listed in WhoIsGod.js. */

// ══════════════════════════════════════════════
// ANCIENT PALEO-HEBREW PICTOGRAPH SVG SYSTEM
// Shapes based on Proto-Sinaitic / Paleo-Hebrew reference alphabet
// ══════════════════════════════════════════════
var ANCH={
'א':'<img src="../who_is_god/ancient_letters/ancient_aleph.gif" style="width:100%;height:100%;display:block;object-fit:contain;" alt="Aleph"/>',
'ב':'<img src="../who_is_god/ancient_letters/ancient_beyt.gif" style="width:100%;height:100%;display:block;object-fit:contain;" alt="Bet"/>',
'ג':'<img src="../who_is_god/ancient_letters/ancient_gimel.gif" style="width:100%;height:100%;display:block;object-fit:contain;" alt="Gimel"/>',
'ד':'<img src="../who_is_god/ancient_letters/ancient_dalet.gif" style="width:100%;height:100%;display:block;object-fit:contain;" alt="Dalet"/>',
'ה':'<img src="../who_is_god/ancient_letters/ancient_hey.gif" style="width:100%;height:100%;display:block;object-fit:contain;" alt="Hey"/>',
'ו':'<img src="../who_is_god/ancient_letters/ancient_vav.gif" style="width:100%;height:100%;display:block;object-fit:contain;" alt="Vav"/>',
'ז':'<img src="../who_is_god/ancient_letters/ancient_zayin.gif" style="width:100%;height:100%;display:block;object-fit:contain;" alt="Zayin"/>',
'ח':'<img src="../who_is_god/ancient_letters/ancient_chet.gif" style="width:100%;height:100%;display:block;object-fit:contain;" alt="Chet"/>',
'ט':'<img src="../who_is_god/ancient_letters/ancient_tet.gif" style="width:100%;height:100%;display:block;object-fit:contain;" alt="Tet"/>',
'י':'<img src="../who_is_god/ancient_letters/ancient_yud.gif" style="width:100%;height:100%;display:block;object-fit:contain;" alt="Yod"/>',
'כ':'<img src="../who_is_god/ancient_letters/ancient_kaph.gif" style="width:100%;height:100%;display:block;object-fit:contain;" alt="Kaf"/>',
'ל':'<img src="../who_is_god/ancient_letters/ancient_lamed.gif" style="width:100%;height:100%;display:block;object-fit:contain;" alt="Lamed"/>',
'מ':'<img src="../who_is_god/ancient_letters/ancient_mem.gif" style="width:100%;height:100%;display:block;object-fit:contain;" alt="Mem"/>',
'נ':'<img src="../who_is_god/ancient_letters/ancient_nun.gif" style="width:100%;height:100%;display:block;object-fit:contain;" alt="Nun"/>',
'ס':'<img src="../who_is_god/ancient_letters/ancient_samech.gif" style="width:100%;height:100%;display:block;object-fit:contain;" alt="Samech"/>',
'ע':'<img src="../who_is_god/ancient_letters/ancient_ayin.gif" style="width:100%;height:100%;display:block;object-fit:contain;" alt="Ayin"/>',
'פ':'<img src="../who_is_god/ancient_letters/ancient_pey.gif" style="width:100%;height:100%;display:block;object-fit:contain;" alt="Pey"/>',
'צ':'<img src="../who_is_god/ancient_letters/ancient_tsade.gif" style="width:100%;height:100%;display:block;object-fit:contain;" alt="Tsade"/>',
'ק':'<img src="../who_is_god/ancient_letters/ancient_quph.gif" style="width:100%;height:100%;display:block;object-fit:contain;" alt="Qof"/>',
'ר':'<img src="../who_is_god/ancient_letters/ancient_resh.gif" style="width:100%;height:100%;display:block;object-fit:contain;" alt="Resh"/>',
'ש':'<img src="../who_is_god/ancient_letters/ancient_shin.gif" style="width:100%;height:100%;display:block;object-fit:contain;" alt="Shin"/>',
'ת':'<img src="../who_is_god/ancient_letters/ancient_tav.gif" style="width:100%;height:100%;display:block;object-fit:contain;" alt="Tav"/>'
};
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('[data-anc]').forEach(function(el){
    var k=el.getAttribute('data-anc');
    if(ANCH[k]){el.innerHTML=ANCH[k];}
  });
});

