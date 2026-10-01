/*
  AMIT APPEARANCE — the one shared, per-login "Appearance" (theme) mechanism
  for every Amit page. Phase 1, step 1 (2026-10-01): this file plus the
  Hub's About Me → Appearance tab. No other app page consumes the tokens
  yet — pages opt in later by replacing hardcoded colors with
  var(--amit-xxx, <classic fallback>).

  HOW TO INCLUDE
    <script src="../amit_appearance.js?v=1.00"></script>
  Synchronously, in <head>, BEFORE the page's own <style> block (path
  adjusted to the page's depth). Including it early is what lets a saved
  theme apply before first paint, with no flash of the classic look.

  WHAT IT DOES
    1. On load (synchronous, no network): reads the localStorage cache
       'amit_appearance_v1' = {user_id, template_key, overrides} and applies
       it as CSS custom properties on document.documentElement.
    2. amitAppearanceSync(db) — call once the page's own supabase client
       exists (pass that client; this file never creates one). Signed in →
       reads that login's row from public.hub_appearance, applies + caches.
       Signed out → clears the cache and removes every --amit-* property.
       Any error → keeps whatever is currently applied.
    3. amitAppearanceSave(db, templateKey, overrides) — upserts the row
       (onConflict user_id), updates the cache, applies. Returns
       {ok:true} or {ok:false, error:'...'}.
    4. amitAppearancePreview(templateKey, overrides) — apply only, no save.
       amitAppearanceResetPreview() — re-apply the cached saved state.
    5. A 'storage' listener so other open tabs re-apply after a save.

  CLASSIC IS A GUARANTEED NO-OP
    template 'classic' (the navy-and-gold look of AmitBooks\NEW.html /
    Templates\template.html) with no overrides sets NO properties at all —
    every page renders exactly as it did before this file existed.
    Any other template, or any override, sets the FULL merged token set.

  TOKEN CONTRACT — every token is the CSS variable --amit-<name>.
  Overrides are stored by bare name (e.g. {"accent":"#3fbf8a"}).
    Surfaces:   bg, surface, surface-raised, surface-hover, tooltip-bg
    Accent:     accent, accent-bright, accent-rgb (triplet, e.g. 201,168,76)
    Border/text:border, text, text-soft, text-rgb, muted, dim
    Other:      overlay-rgb, on-rgb, ok, danger, overlay
    Fonts:      font-heading, font-body, font-title, font-mono, font-scale
                (font-scale applies as page zoom, Chromium only — see
                _amitAppearanceApply — since most pages size text in fixed
                px, not rem, so a CSS variable alone can't resize it yet)
    Shape/misc: radius, tab-radius, bg-image, watermark-opacity, color-scheme
    Inputs:     input-bg, input-text, input-border, input-radius,
                focus-ring, option-bg, option-text
    Buttons:    btn-bg, btn-hover-bg, btn-border, btn-text, btn-radius
    Cards:      card-bg, card-border
    Tables:     table-head-bg, table-head-text, row-sep, row-hover
  Usage in a page: color:var(--amit-text-soft,#f0e8d0);
                   box-shadow:0 0 0 3px rgba(var(--amit-accent-rgb,201,168,76),.4);

  VALIDATION — unknown keys are dropped. Values must look like a color,
  an rgb triplet, a length, a number, or a font stack, per token. bg-image
  accepts only 'none' or a same-origin url(). Presets may name a Google
  Fonts stylesheet (fonts.googleapis.com only) for non-default fonts.

  STORAGE — public.hub_appearance (user_id PK → auth.users, template_key
  text, overrides jsonb object, updated_at). RLS: own row only, anon revoked.
*/

const AMIT_APPEARANCE_CACHE_KEY = 'amit_appearance_v1';

// token name → value kind (drives validation)
const AMIT_APPEARANCE_TOKENS = {
  'bg':'color','surface':'color','surface-raised':'color','surface-hover':'color','tooltip-bg':'color',
  'accent':'color','accent-bright':'color','accent-rgb':'rgb',
  'border':'color','text':'color','text-soft':'color','text-rgb':'rgb','muted':'color','dim':'color',
  'overlay-rgb':'rgb','on-rgb':'rgb','ok':'color','danger':'color','overlay':'color',
  'font-heading':'font','font-body':'font','font-title':'font','font-mono':'font','font-scale':'number',
  'radius':'length','tab-radius':'length','bg-image':'image','watermark-opacity':'number','color-scheme':'scheme',
  'input-bg':'color','input-text':'color','input-border':'color','input-radius':'length',
  'focus-ring':'color','option-bg':'color','option-text':'color',
  'btn-bg':'color','btn-hover-bg':'color','btn-border':'color','btn-text':'color','btn-radius':'length',
  'card-bg':'color','card-border':'color',
  'table-head-bg':'color','table-head-text':'color','row-sep':'color','row-hover':'color'
};

// Fonts offered for overrides; url is loaded only when that font is used.
const AMIT_APPEARANCE_FONTS = [
  {name:'Cinzel',             stack:"'Cinzel',serif",                     url:'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap'},
  {name:'Crimson Pro',        stack:"'Crimson Pro',Georgia,serif",        url:'https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600&display=swap'},
  {name:'Georgia',            stack:'Georgia,serif',                      url:null},
  {name:'Playfair Display',   stack:"'Playfair Display',Georgia,serif",   url:'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&display=swap'},
  {name:'Cormorant Garamond', stack:"'Cormorant Garamond',Georgia,serif", url:'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&display=swap'},
  {name:'EB Garamond',        stack:"'EB Garamond',Georgia,serif",        url:'https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;600&display=swap'},
  {name:'Lora',               stack:"'Lora',Georgia,serif",               url:'https://fonts.googleapis.com/css2?family=Lora:wght@400;600&display=swap'},
  {name:'Montserrat',         stack:"'Montserrat',system-ui,sans-serif",  url:'https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700&display=swap'},
  {name:'Inter',              stack:"'Inter',system-ui,sans-serif",       url:'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap'},
  {name:'System Sans',        stack:'system-ui,-apple-system,"Segoe UI",sans-serif', url:null}
];

// Shared building block — every preset fills every token explicitly.
function _amitAppearancePreset(name, fontsUrl, t){ return {name:name, fontsUrl:fontsUrl||null, tokens:t}; }

const AMIT_APPEARANCE_PRESETS = {
  classic: _amitAppearancePreset('Classic Navy & Gold', null, {
    'bg':'#09141f','surface':'#0f2338','surface-raised':'#132a42','surface-hover':'#1f3d60','tooltip-bg':'#1a3352',
    'accent':'#c9a84c','accent-bright':'#e8c56a','accent-rgb':'201,168,76',
    'border':'rgba(201,168,76,0.55)','text':'#ffffff','text-soft':'#f0e8d0','text-rgb':'240,232,208',
    'muted':'rgba(240,232,208,0.78)','dim':'rgba(240,232,208,0.42)',
    'overlay-rgb':'255,255,255','on-rgb':'46,160,67','ok':'#2e7d46','danger':'#c73333','overlay':'rgba(0,0,0,.6)',
    'font-heading':"'Cinzel',serif",'font-body':"'Crimson Pro',Georgia,serif",'font-title':'Georgia,serif','font-mono':'monospace','font-scale':'1',
    'radius':'12px','tab-radius':'10px','bg-image':'none','watermark-opacity':'.035','color-scheme':'dark',
    'input-bg':'#f4f1e6','input-text':'#2a2418','input-border':'rgba(201,168,76,.4)','input-radius':'6px',
    'focus-ring':'rgba(201,168,76,.5)','option-bg':'#fff','option-text':'#2a2418',
    'btn-bg':'rgba(201,168,76,.16)','btn-hover-bg':'rgba(201,168,76,.3)','btn-border':'#c9a84c','btn-text':'#e8c56a','btn-radius':'6px',
    'card-bg':'rgba(255,255,255,.03)','card-border':'rgba(201,168,76,.22)',
    'table-head-bg':'#0f2338','table-head-text':'#e8c56a','row-sep':'rgba(201,168,76,.12)','row-hover':'rgba(255,255,255,.04)'
  }),
  emerald: _amitAppearancePreset('Midnight Emerald', null, {
    'bg':'#071712','surface':'#0d2a20','surface-raised':'#12352a','surface-hover':'#184536','tooltip-bg':'#143a2e',
    'accent':'#3fbf8a','accent-bright':'#6fe0ad','accent-rgb':'63,191,138',
    'border':'rgba(63,191,138,0.5)','text':'#ffffff','text-soft':'#e2f2ea','text-rgb':'226,242,234',
    'muted':'rgba(226,242,234,0.78)','dim':'rgba(226,242,234,0.42)',
    'overlay-rgb':'255,255,255','on-rgb':'63,191,138','ok':'#2e9d62','danger':'#d0453f','overlay':'rgba(0,0,0,.62)',
    'font-heading':"'Cinzel',serif",'font-body':"'Crimson Pro',Georgia,serif",'font-title':'Georgia,serif','font-mono':'monospace','font-scale':'1',
    'radius':'12px','tab-radius':'10px','bg-image':'none','watermark-opacity':'.035','color-scheme':'dark',
    'input-bg':'#eef5f1','input-text':'#13241c','input-border':'rgba(63,191,138,.4)','input-radius':'6px',
    'focus-ring':'rgba(63,191,138,.5)','option-bg':'#fff','option-text':'#13241c',
    'btn-bg':'rgba(63,191,138,.16)','btn-hover-bg':'rgba(63,191,138,.3)','btn-border':'#3fbf8a','btn-text':'#6fe0ad','btn-radius':'6px',
    'card-bg':'rgba(255,255,255,.03)','card-border':'rgba(63,191,138,.22)',
    'table-head-bg':'#0d2a20','table-head-text':'#6fe0ad','row-sep':'rgba(63,191,138,.12)','row-hover':'rgba(255,255,255,.04)'
  }),
  burgundy: _amitAppearancePreset('Deep Burgundy',
    'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&display=swap', {
    'bg':'#1a0a0f','surface':'#2b1219','surface-raised':'#361821','surface-hover':'#44202b','tooltip-bg':'#3a1a24',
    'accent':'#d4a373','accent-bright':'#ecc49a','accent-rgb':'212,163,115',
    'border':'rgba(212,163,115,0.5)','text':'#ffffff','text-soft':'#f3e4dc','text-rgb':'243,228,220',
    'muted':'rgba(243,228,220,0.78)','dim':'rgba(243,228,220,0.42)',
    'overlay-rgb':'255,255,255','on-rgb':'63,154,92','ok':'#3f9a5c','danger':'#e0524a','overlay':'rgba(0,0,0,.62)',
    'font-heading':"'Playfair Display',Georgia,serif",'font-body':"'Crimson Pro',Georgia,serif",'font-title':"'Playfair Display',Georgia,serif",'font-mono':'monospace','font-scale':'1',
    'radius':'12px','tab-radius':'10px','bg-image':'none','watermark-opacity':'.035','color-scheme':'dark',
    'input-bg':'#f6eee8','input-text':'#2a1418','input-border':'rgba(212,163,115,.4)','input-radius':'6px',
    'focus-ring':'rgba(212,163,115,.5)','option-bg':'#fff','option-text':'#2a1418',
    'btn-bg':'rgba(212,163,115,.16)','btn-hover-bg':'rgba(212,163,115,.3)','btn-border':'#d4a373','btn-text':'#ecc49a','btn-radius':'6px',
    'card-bg':'rgba(255,255,255,.03)','card-border':'rgba(212,163,115,.22)',
    'table-head-bg':'#2b1219','table-head-text':'#ecc49a','row-sep':'rgba(212,163,115,.12)','row-hover':'rgba(255,255,255,.04)'
  }),
  charcoal: _amitAppearancePreset('Charcoal Silver',
    'https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700&family=Inter:wght@400;500;600&display=swap', {
    'bg':'#121417','surface':'#1c1f24','surface-raised':'#24282e','surface-hover':'#2e333a','tooltip-bg':'#2a2e35',
    'accent':'#b8c4d0','accent-bright':'#dfe6ee','accent-rgb':'184,196,208',
    'border':'rgba(184,196,208,0.45)','text':'#ffffff','text-soft':'#e6e9ed','text-rgb':'230,233,237',
    'muted':'rgba(230,233,237,0.78)','dim':'rgba(230,233,237,0.42)',
    'overlay-rgb':'255,255,255','on-rgb':'58,154,94','ok':'#3a9a5e','danger':'#d24b4b','overlay':'rgba(0,0,0,.6)',
    'font-heading':"'Montserrat',system-ui,sans-serif",'font-body':"'Inter',system-ui,sans-serif",'font-title':"'Montserrat',system-ui,sans-serif",'font-mono':'monospace','font-scale':'1',
    'radius':'10px','tab-radius':'8px','bg-image':'none','watermark-opacity':'.03','color-scheme':'dark',
    'input-bg':'#eceff2','input-text':'#1a1d21','input-border':'rgba(184,196,208,.4)','input-radius':'6px',
    'focus-ring':'rgba(184,196,208,.5)','option-bg':'#fff','option-text':'#1a1d21',
    'btn-bg':'rgba(184,196,208,.14)','btn-hover-bg':'rgba(184,196,208,.28)','btn-border':'#b8c4d0','btn-text':'#dfe6ee','btn-radius':'6px',
    'card-bg':'rgba(255,255,255,.03)','card-border':'rgba(184,196,208,.2)',
    'table-head-bg':'#1c1f24','table-head-text':'#dfe6ee','row-sep':'rgba(184,196,208,.12)','row-hover':'rgba(255,255,255,.04)'
  }),
  purple: _amitAppearancePreset('Royal Purple',
    'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=EB+Garamond:wght@400;600&display=swap', {
    'bg':'#120c1f','surface':'#1e1533','surface-raised':'#261b40','surface-hover':'#30224f','tooltip-bg':'#2a1e46',
    'accent':'#b79cff','accent-bright':'#d6c6ff','accent-rgb':'183,156,255',
    'border':'rgba(183,156,255,0.5)','text':'#ffffff','text-soft':'#ece6f8','text-rgb':'236,230,248',
    'muted':'rgba(236,230,248,0.78)','dim':'rgba(236,230,248,0.42)',
    'overlay-rgb':'255,255,255','on-rgb':'60,158,96','ok':'#3c9e60','danger':'#de4f5a','overlay':'rgba(0,0,0,.62)',
    'font-heading':"'Cormorant Garamond',Georgia,serif",'font-body':"'EB Garamond',Georgia,serif",'font-title':"'Cormorant Garamond',Georgia,serif",'font-mono':'monospace','font-scale':'1',
    'radius':'12px','tab-radius':'10px','bg-image':'none','watermark-opacity':'.035','color-scheme':'dark',
    'input-bg':'#f3effb','input-text':'#1f1630','input-border':'rgba(183,156,255,.4)','input-radius':'6px',
    'focus-ring':'rgba(183,156,255,.5)','option-bg':'#fff','option-text':'#1f1630',
    'btn-bg':'rgba(183,156,255,.16)','btn-hover-bg':'rgba(183,156,255,.3)','btn-border':'#b79cff','btn-text':'#d6c6ff','btn-radius':'6px',
    'card-bg':'rgba(255,255,255,.03)','card-border':'rgba(183,156,255,.22)',
    'table-head-bg':'#1e1533','table-head-text':'#d6c6ff','row-sep':'rgba(183,156,255,.12)','row-hover':'rgba(255,255,255,.04)'
  }),
  // ── LIGHT THEMES (added 2026-10-01) ──
  // Light presets need overlay-rgb flipped to black (hover tints are
  // rgba(var(--amit-overlay-rgb),a) — white-on-white would be invisible),
  // color-scheme 'light', and dark input text on a near-white input-bg
  // (the reverse of the dark presets' cream-on-dark inputs).
  parchment: _amitAppearancePreset('Parchment Gold', null, {
    'bg':'#f5f0e6','surface':'#ffffff','surface-raised':'#faf6ec','surface-hover':'#f0e9d8','tooltip-bg':'#2a2418',
    'accent':'#a8893f','accent-bright':'#8a6f2f','accent-rgb':'168,137,63',
    'border':'rgba(168,137,63,0.45)','text':'#1a1510','text-soft':'#2a2418','text-rgb':'42,36,24',
    'muted':'rgba(42,36,24,0.72)','dim':'rgba(42,36,24,0.45)',
    'overlay-rgb':'0,0,0','on-rgb':'46,160,67','ok':'#2e7d46','danger':'#b03030','overlay':'rgba(255,255,255,.7)',
    'font-heading':"'Cinzel',serif",'font-body':"'Crimson Pro',Georgia,serif",'font-title':'Georgia,serif','font-mono':'monospace','font-scale':'1',
    'radius':'12px','tab-radius':'10px','bg-image':'none','watermark-opacity':'.06','color-scheme':'light',
    'input-bg':'#ffffff','input-text':'#2a2418','input-border':'rgba(168,137,63,.5)','input-radius':'6px',
    'focus-ring':'rgba(168,137,63,.45)','option-bg':'#fff','option-text':'#2a2418',
    'btn-bg':'rgba(168,137,63,.14)','btn-hover-bg':'rgba(168,137,63,.26)','btn-border':'#a8893f','btn-text':'#6e5726','btn-radius':'6px',
    'card-bg':'rgba(0,0,0,.025)','card-border':'rgba(168,137,63,.3)',
    'table-head-bg':'#f0e9d8','table-head-text':'#6e5726','row-sep':'rgba(168,137,63,.18)','row-hover':'rgba(0,0,0,.03)'
  }),
  sage: _amitAppearancePreset('Soft Sage',
    'https://fonts.googleapis.com/css2?family=Lora:wght@400;600&display=swap', {
    'bg':'#f3f6f1','surface':'#ffffff','surface-raised':'#eef3ea','surface-hover':'#e3ebde','tooltip-bg':'#2a3326',
    'accent':'#5c8a5c','accent-bright':'#3f6b40','accent-rgb':'92,138,92',
    'border':'rgba(92,138,92,0.4)','text':'#1c231b','text-soft':'#283326','text-rgb':'40,51,38',
    'muted':'rgba(40,51,38,0.72)','dim':'rgba(40,51,38,0.45)',
    'overlay-rgb':'0,0,0','on-rgb':'46,160,67','ok':'#2e7d46','danger':'#b4403c','overlay':'rgba(255,255,255,.7)',
    'font-heading':"'Lora',Georgia,serif",'font-body':"'Lora',Georgia,serif",'font-title':"'Lora',Georgia,serif",'font-mono':'monospace','font-scale':'1',
    'radius':'12px','tab-radius':'10px','bg-image':'none','watermark-opacity':'.05','color-scheme':'light',
    'input-bg':'#ffffff','input-text':'#1c231b','input-border':'rgba(92,138,92,.45)','input-radius':'6px',
    'focus-ring':'rgba(92,138,92,.4)','option-bg':'#fff','option-text':'#1c231b',
    'btn-bg':'rgba(92,138,92,.14)','btn-hover-bg':'rgba(92,138,92,.26)','btn-border':'#5c8a5c','btn-text':'#2f4f30','btn-radius':'6px',
    'card-bg':'rgba(0,0,0,.025)','card-border':'rgba(92,138,92,.28)',
    'table-head-bg':'#e3ebde','table-head-text':'#2f4f30','row-sep':'rgba(92,138,92,.16)','row-hover':'rgba(0,0,0,.03)'
  }),
  powder: _amitAppearancePreset('Powder Blue',
    'https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700&family=Inter:wght@400;500;600&display=swap', {
    'bg':'#f1f5f9','surface':'#ffffff','surface-raised':'#e9f0f6','surface-hover':'#dde8f0','tooltip-bg':'#1c2a36',
    'accent':'#3f7ea6','accent-bright':'#2c6188','accent-rgb':'63,126,166',
    'border':'rgba(63,126,166,0.4)','text':'#16222c','text-soft':'#1f2e39','text-rgb':'31,46,57',
    'muted':'rgba(31,46,57,0.72)','dim':'rgba(31,46,57,0.45)',
    'overlay-rgb':'0,0,0','on-rgb':'46,160,67','ok':'#2e7d46','danger':'#c23b3b','overlay':'rgba(255,255,255,.7)',
    'font-heading':"'Montserrat',system-ui,sans-serif",'font-body':"'Inter',system-ui,sans-serif",'font-title':"'Montserrat',system-ui,sans-serif",'font-mono':'monospace','font-scale':'1',
    'radius':'10px','tab-radius':'8px','bg-image':'none','watermark-opacity':'.04','color-scheme':'light',
    'input-bg':'#ffffff','input-text':'#16222c','input-border':'rgba(63,126,166,.45)','input-radius':'6px',
    'focus-ring':'rgba(63,126,166,.4)','option-bg':'#fff','option-text':'#16222c',
    'btn-bg':'rgba(63,126,166,.14)','btn-hover-bg':'rgba(63,126,166,.26)','btn-border':'#3f7ea6','btn-text':'#1f506e','btn-radius':'6px',
    'card-bg':'rgba(0,0,0,.025)','card-border':'rgba(63,126,166,.26)',
    'table-head-bg':'#dde8f0','table-head-text':'#1f506e','row-sep':'rgba(63,126,166,.16)','row-hover':'rgba(0,0,0,.03)'
  }),
  rosequartz: _amitAppearancePreset('Rose Quartz',
    'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=EB+Garamond:wght@400;600&display=swap', {
    'bg':'#faf2f2','surface':'#ffffff','surface-raised':'#f6e9e9','surface-hover':'#f0dcdc','tooltip-bg':'#331f20',
    'accent':'#b5707a','accent-bright':'#935159','accent-rgb':'181,112,122',
    'border':'rgba(181,112,122,0.4)','text':'#241718','text-soft':'#2f1e1f','text-rgb':'47,30,31',
    'muted':'rgba(47,30,31,0.72)','dim':'rgba(47,30,31,0.45)',
    'overlay-rgb':'0,0,0','on-rgb':'46,160,67','ok':'#2e7d46','danger':'#b03030','overlay':'rgba(255,255,255,.7)',
    'font-heading':"'Cormorant Garamond',Georgia,serif",'font-body':"'EB Garamond',Georgia,serif",'font-title':"'Cormorant Garamond',Georgia,serif",'font-mono':'monospace','font-scale':'1',
    'radius':'12px','tab-radius':'10px','bg-image':'none','watermark-opacity':'.05','color-scheme':'light',
    'input-bg':'#ffffff','input-text':'#241718','input-border':'rgba(181,112,122,.45)','input-radius':'6px',
    'focus-ring':'rgba(181,112,122,.4)','option-bg':'#fff','option-text':'#241718',
    'btn-bg':'rgba(181,112,122,.14)','btn-hover-bg':'rgba(181,112,122,.26)','btn-border':'#b5707a','btn-text':'#733f46','btn-radius':'6px',
    'card-bg':'rgba(0,0,0,.025)','card-border':'rgba(181,112,122,.28)',
    'table-head-bg':'#f0dcdc','table-head-text':'#733f46','row-sep':'rgba(181,112,122,.16)','row-hover':'rgba(0,0,0,.03)'
  }),
  linen: _amitAppearancePreset('Warm Linen',
    'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&display=swap', {
    'bg':'#f6f2ec','surface':'#ffffff','surface-raised':'#efe8dd','surface-hover':'#e6dccc','tooltip-bg':'#2c241a',
    'accent':'#9c7a4e','accent-bright':'#7d6140','accent-rgb':'156,122,78',
    'border':'rgba(156,122,78,0.4)','text':'#211b12','text-soft':'#2c2416','text-rgb':'44,36,22',
    'muted':'rgba(44,36,22,0.72)','dim':'rgba(44,36,22,0.45)',
    'overlay-rgb':'0,0,0','on-rgb':'46,160,67','ok':'#2e7d46','danger':'#b14538','overlay':'rgba(255,255,255,.7)',
    'font-heading':"'Playfair Display',Georgia,serif",'font-body':"'Crimson Pro',Georgia,serif",'font-title':"'Playfair Display',Georgia,serif",'font-mono':'monospace','font-scale':'1',
    'radius':'12px','tab-radius':'10px','bg-image':'none','watermark-opacity':'.05','color-scheme':'light',
    'input-bg':'#ffffff','input-text':'#211b12','input-border':'rgba(156,122,78,.45)','input-radius':'6px',
    'focus-ring':'rgba(156,122,78,.4)','option-bg':'#fff','option-text':'#211b12',
    'btn-bg':'rgba(156,122,78,.14)','btn-hover-bg':'rgba(156,122,78,.26)','btn-border':'#9c7a4e','btn-text':'#5e4a2e','btn-radius':'6px',
    'card-bg':'rgba(0,0,0,.025)','card-border':'rgba(156,122,78,.28)',
    'table-head-bg':'#e6dccc','table-head-text':'#5e4a2e','row-sep':'rgba(156,122,78,.16)','row-hover':'rgba(0,0,0,.03)'
  }),
  // ── MEDIUM THEMES (added 2026-10-01) ── between the near-black dark
  // presets and the near-white light ones. Backgrounds sit around 18-20%
  // lightness — dark enough that white text still reads comfortably, light
  // enough to look clearly different from the dark set side by side.
  teal: _amitAppearancePreset('Teal Mist',
    'https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700&family=Inter:wght@400;500;600&display=swap', {
    'bg':'#2b3a38','surface':'#324542','surface-raised':'#3c514d','surface-hover':'#46605b','tooltip-bg':'#1e2b29',
    'accent':'#4fb3a9','accent-bright':'#7bd4ca','accent-rgb':'79,179,169',
    'border':'rgba(79,179,169,0.45)','text':'#ffffff','text-soft':'#e4f3f0','text-rgb':'228,243,240',
    'muted':'rgba(228,243,240,0.75)','dim':'rgba(228,243,240,0.42)',
    'overlay-rgb':'255,255,255','on-rgb':'46,160,67','ok':'#2e9d62','danger':'#d0534a','overlay':'rgba(0,0,0,.55)',
    'font-heading':"'Montserrat',system-ui,sans-serif",'font-body':"'Inter',system-ui,sans-serif",'font-title':"'Montserrat',system-ui,sans-serif",'font-mono':'monospace','font-scale':'1',
    'radius':'10px','tab-radius':'8px','bg-image':'none','watermark-opacity':'.04','color-scheme':'dark',
    'input-bg':'#f1f5f4','input-text':'#1a2524','input-border':'rgba(79,179,169,.4)','input-radius':'6px',
    'focus-ring':'rgba(79,179,169,.5)','option-bg':'#fff','option-text':'#1a2524',
    'btn-bg':'rgba(79,179,169,.18)','btn-hover-bg':'rgba(79,179,169,.32)','btn-border':'#4fb3a9','btn-text':'#7bd4ca','btn-radius':'6px',
    'card-bg':'rgba(255,255,255,.04)','card-border':'rgba(79,179,169,.25)',
    'table-head-bg':'#324542','table-head-text':'#7bd4ca','row-sep':'rgba(79,179,169,.14)','row-hover':'rgba(255,255,255,.05)'
  }),
  terracotta: _amitAppearancePreset('Terracotta',
    'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&display=swap', {
    'bg':'#3a2e28','surface':'#45362e','surface-raised':'#513f35','surface-hover':'#5e483c','tooltip-bg':'#2a201b',
    'accent':'#c97a4e','accent-bright':'#e2976b','accent-rgb':'201,122,78',
    'border':'rgba(201,122,78,0.45)','text':'#ffffff','text-soft':'#f3e4da','text-rgb':'243,228,218',
    'muted':'rgba(243,228,218,0.75)','dim':'rgba(243,228,218,0.42)',
    'overlay-rgb':'255,255,255','on-rgb':'46,160,67','ok':'#2e9d62','danger':'#d0534a','overlay':'rgba(0,0,0,.55)',
    'font-heading':"'Playfair Display',Georgia,serif",'font-body':"'Crimson Pro',Georgia,serif",'font-title':"'Playfair Display',Georgia,serif",'font-mono':'monospace','font-scale':'1',
    'radius':'12px','tab-radius':'10px','bg-image':'none','watermark-opacity':'.04','color-scheme':'dark',
    'input-bg':'#f6eee6','input-text':'#2a1c14','input-border':'rgba(201,122,78,.4)','input-radius':'6px',
    'focus-ring':'rgba(201,122,78,.5)','option-bg':'#fff','option-text':'#2a1c14',
    'btn-bg':'rgba(201,122,78,.18)','btn-hover-bg':'rgba(201,122,78,.32)','btn-border':'#c97a4e','btn-text':'#e2976b','btn-radius':'6px',
    'card-bg':'rgba(255,255,255,.04)','card-border':'rgba(201,122,78,.25)',
    'table-head-bg':'#45362e','table-head-text':'#e2976b','row-sep':'rgba(201,122,78,.14)','row-hover':'rgba(255,255,255,.05)'
  }),
  slate: _amitAppearancePreset('Slate Blue', null, {
    'bg':'#2c313d','surface':'#353c4a','surface-raised':'#3f4757','surface-hover':'#495166','tooltip-bg':'#1f232c',
    'accent':'#6b85b5','accent-bright':'#92a8d1','accent-rgb':'107,133,181',
    'border':'rgba(107,133,181,0.45)','text':'#ffffff','text-soft':'#e7ebf4','text-rgb':'231,235,244',
    'muted':'rgba(231,235,244,0.75)','dim':'rgba(231,235,244,0.42)',
    'overlay-rgb':'255,255,255','on-rgb':'46,160,67','ok':'#2e9d62','danger':'#d0534a','overlay':'rgba(0,0,0,.55)',
    'font-heading':"'Cinzel',serif",'font-body':"'Crimson Pro',Georgia,serif",'font-title':'Georgia,serif','font-mono':'monospace','font-scale':'1',
    'radius':'12px','tab-radius':'10px','bg-image':'none','watermark-opacity':'.04','color-scheme':'dark',
    'input-bg':'#eef1f6','input-text':'#1c2027','input-border':'rgba(107,133,181,.4)','input-radius':'6px',
    'focus-ring':'rgba(107,133,181,.5)','option-bg':'#fff','option-text':'#1c2027',
    'btn-bg':'rgba(107,133,181,.18)','btn-hover-bg':'rgba(107,133,181,.32)','btn-border':'#6b85b5','btn-text':'#92a8d1','btn-radius':'6px',
    'card-bg':'rgba(255,255,255,.04)','card-border':'rgba(107,133,181,.25)',
    'table-head-bg':'#353c4a','table-head-text':'#92a8d1','row-sep':'rgba(107,133,181,.14)','row-hover':'rgba(255,255,255,.05)'
  }),
  mauve: _amitAppearancePreset('Mauve',
    'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=EB+Garamond:wght@400;600&display=swap', {
    'bg':'#352830','surface':'#40303a','surface-raised':'#4c3945','surface-hover':'#574250','tooltip-bg':'#281e24',
    'accent':'#a9728e','accent-bright':'#c796ad','accent-rgb':'169,114,142',
    'border':'rgba(169,114,142,0.45)','text':'#ffffff','text-soft':'#f1e4ea','text-rgb':'241,228,234',
    'muted':'rgba(241,228,234,0.75)','dim':'rgba(241,228,234,0.42)',
    'overlay-rgb':'255,255,255','on-rgb':'46,160,67','ok':'#2e9d62','danger':'#d0534a','overlay':'rgba(0,0,0,.55)',
    'font-heading':"'Cormorant Garamond',Georgia,serif",'font-body':"'EB Garamond',Georgia,serif",'font-title':"'Cormorant Garamond',Georgia,serif",'font-mono':'monospace','font-scale':'1',
    'radius':'12px','tab-radius':'10px','bg-image':'none','watermark-opacity':'.04','color-scheme':'dark',
    'input-bg':'#f6eef2','input-text':'#2a1e24','input-border':'rgba(169,114,142,.4)','input-radius':'6px',
    'focus-ring':'rgba(169,114,142,.5)','option-bg':'#fff','option-text':'#2a1e24',
    'btn-bg':'rgba(169,114,142,.18)','btn-hover-bg':'rgba(169,114,142,.32)','btn-border':'#a9728e','btn-text':'#c796ad','btn-radius':'6px',
    'card-bg':'rgba(255,255,255,.04)','card-border':'rgba(169,114,142,.25)',
    'table-head-bg':'#40303a','table-head-text':'#c796ad','row-sep':'rgba(169,114,142,.14)','row-hover':'rgba(255,255,255,.05)'
  }),
  olive: _amitAppearancePreset('Olive Grove',
    'https://fonts.googleapis.com/css2?family=Lora:wght@400;600&display=swap', {
    'bg':'#2f3326','surface':'#393f2d','surface-raised':'#454c36','surface-hover':'#505840','tooltip-bg':'#23271c',
    'accent':'#8a9a4e','accent-bright':'#aebd73','accent-rgb':'138,154,78',
    'border':'rgba(138,154,78,0.45)','text':'#ffffff','text-soft':'#ecefe0','text-rgb':'236,239,224',
    'muted':'rgba(236,239,224,0.75)','dim':'rgba(236,239,224,0.42)',
    'overlay-rgb':'255,255,255','on-rgb':'46,160,67','ok':'#2e9d62','danger':'#d0534a','overlay':'rgba(0,0,0,.55)',
    'font-heading':"'Lora',Georgia,serif",'font-body':"'Lora',Georgia,serif",'font-title':"'Lora',Georgia,serif",'font-mono':'monospace','font-scale':'1',
    'radius':'10px','tab-radius':'8px','bg-image':'none','watermark-opacity':'.04','color-scheme':'dark',
    'input-bg':'#f3f4ec','input-text':'#242819','input-border':'rgba(138,154,78,.4)','input-radius':'6px',
    'focus-ring':'rgba(138,154,78,.5)','option-bg':'#fff','option-text':'#242819',
    'btn-bg':'rgba(138,154,78,.18)','btn-hover-bg':'rgba(138,154,78,.32)','btn-border':'#8a9a4e','btn-text':'#aebd73','btn-radius':'6px',
    'card-bg':'rgba(255,255,255,.04)','card-border':'rgba(138,154,78,.25)',
    'table-head-bg':'#393f2d','table-head-text':'#aebd73','row-sep':'rgba(138,154,78,.14)','row-hover':'rgba(255,255,255,.05)'
  })
};
  newsroom: _amitAppearancePreset('Newsroom Navy',
    'https://fonts.googleapis.com/css2?family=Archivo:wght@500;700;800&family=Source+Sans+3:wght@400;600&display=swap', {
    'bg':'#eef1f4','surface':'#ffffff','surface-raised':'#0a2342','surface-hover':'#123058','tooltip-bg':'#0a2342',
    'accent':'#cc1b1b','accent-bright':'#e5332f','accent-rgb':'204,27,27',
    'border':'rgba(10,35,66,0.18)','text':'#13151a','text-soft':'#13151a','text-rgb':'19,21,26',
    'muted':'rgba(19,21,26,0.68)','dim':'rgba(19,21,26,0.42)',
    'overlay-rgb':'10,35,66','on-rgb':'46,160,67','ok':'#2e7d46','danger':'#cc1b1b','overlay':'rgba(10,35,66,.08)',
    'font-heading':"'Archivo',system-ui,sans-serif",'font-body':"'Source Sans 3',system-ui,sans-serif",'font-title':"'Archivo',system-ui,sans-serif",'font-mono':'monospace','font-scale':'1',
    'radius':'4px','tab-radius':'4px','bg-image':'none','watermark-opacity':'.03','color-scheme':'light',
    'input-bg':'#ffffff','input-text':'#13151a','input-border':'rgba(10,35,66,.3)','input-radius':'4px',
    'focus-ring':'rgba(204,27,27,.45)','option-bg':'#fff','option-text':'#13151a',
    'btn-bg':'#cc1b1b','btn-hover-bg':'#e5332f','btn-border':'#cc1b1b','btn-text':'#ffffff','btn-radius':'3px',
    'card-bg':'#ffffff','card-border':'rgba(10,35,66,.14)',
    'table-head-bg':'#0a2342','table-head-text':'#ffffff','row-sep':'rgba(10,35,66,.1)','row-hover':'rgba(10,35,66,.04)'
  }),
  // 'custom' — the Custom Import slot, added after the object above exists
// (a preset can't reference AMIT_APPEARANCE_PRESETS from inside its own
// literal). Starts as a plain copy of classic; the Hub's import tools
// (paste hex codes, or sample colors from an uploaded image) set overrides
// on top of it. It must exist here so the generic card/pick/render logic
// treats it like any other preset.
AMIT_APPEARANCE_PRESETS.custom = _amitAppearancePreset('Custom Import', null,
  Object.assign({}, AMIT_APPEARANCE_PRESETS.classic.tokens)
);

// Display order for the theme-card grid: light → medium → dark → custom
// last. The object above has no reliable order of its own once more
// presets are added over time, so the UI should read this array, not
// Object.keys(AMIT_APPEARANCE_PRESETS).
const AMIT_APPEARANCE_ORDER = [
  'parchment','sage','powder','rosequartz','linen',
  'teal','terracotta','slate','mauve','olive',
  'classic','emerald','burgundy','charcoal','purple',
  'newsroom',
  'custom'
];

// ── Validation ───────────────────────────────────────────────
const _AMIT_APP_RE = {
  color:  /^(#[0-9a-f]{3,4}|#[0-9a-f]{6}|#[0-9a-f]{8}|(rgb|rgba|hsl|hsla)\([0-9.,%\s\/deg]+\)|[a-z]{3,20})$/i,
  rgb:    /^\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*$/,
  length: /^(0|\d*\.?\d+(px|rem|em|%))$/,
  number: /^\d*\.?\d+$/,
  font:   /^[A-Za-z0-9 ,'"\-]{1,200}$/,
  scheme: /^(dark|light|normal|light dark|dark light)$/
};

function _amitAppearanceValid(kind, v){
  if(typeof v!=='string') return false;
  v=v.trim();
  if(!v || v.length>300) return false;
  if(kind==='rgb') return _AMIT_APP_RE.rgb.test(v) && v.split(',').every(n=>Number(n)<=255);
  if(kind==='image'){
    if(v==='none') return true;
    const m=v.match(/^url\(\s*(['"]?)([^'"()\s]+)\1\s*\)$/);
    if(!m) return false;
    try{ return new URL(m[2], location.href).origin===location.origin; }catch(e){ return false; }
  }
  const re=_AMIT_APP_RE[kind];
  return !!(re && re.test(v));
}

// Returns a clean overrides object: whitelisted bare token names, valid values only.
function amitAppearanceSanitize(overrides){
  const out={};
  if(!overrides || typeof overrides!=='object' || Array.isArray(overrides)) return out;
  Object.keys(overrides).forEach(k=>{
    const name=String(k).replace(/^--amit-/,'');
    const kind=AMIT_APPEARANCE_TOKENS[name];
    if(kind && _amitAppearanceValid(kind, overrides[k])) out[name]=String(overrides[k]).trim();
  });
  return out;
}

function _amitAppearanceHexToRgb(hex){
  const m=String(hex).trim().match(/^#([0-9a-f]{6})$/i) || String(hex).trim().match(/^#([0-9a-f]{3})$/i);
  if(!m) return null;
  let h=m[1]; if(h.length===3) h=h.split('').map(c=>c+c).join('');
  return [0,2,4].map(i=>parseInt(h.substr(i,2),16)).join(',');
}

// ── Apply ────────────────────────────────────────────────────
function _amitAppearanceClear(){
  const root=document.documentElement;
  Object.keys(AMIT_APPEARANCE_TOKENS).forEach(k=>root.style.removeProperty('--amit-'+k));
  root.style.removeProperty('color-scheme');
  try{ document.querySelectorAll('link[data-amit-appearance-font]').forEach(l=>l.remove()); }catch(e){}
}

function _amitAppearanceSetFonts(urls){
  const want=new Set(urls.filter(u=>typeof u==='string' && u.indexOf('https://fonts.googleapis.com/')===0));
  const head=document.head || document.getElementsByTagName('head')[0];
  if(!head) return;
  document.querySelectorAll('link[data-amit-appearance-font]').forEach(l=>{
    if(want.has(l.href)) want.delete(l.href); else l.remove();
  });
  want.forEach(u=>{
    const l=document.createElement('link');
    l.rel='stylesheet'; l.href=u; l.setAttribute('data-amit-appearance-font','1');
    head.appendChild(l);
  });
}

// Core: apply a template + overrides. Classic with no overrides = remove everything (no-op).
function _amitAppearanceApply(templateKey, overrides){
  try{
    const key=AMIT_APPEARANCE_PRESETS[templateKey] ? templateKey : 'classic';
    const ov=amitAppearanceSanitize(overrides);
    _amitAppearanceClear();
    if(key==='classic' && Object.keys(ov).length===0) return;   // guaranteed no-op
    const preset=AMIT_APPEARANCE_PRESETS[key];
    const tokens=Object.assign({}, preset.tokens, ov);
    // keep accent-rgb in step with a hex accent override unless it was overridden too
    if(ov['accent'] && !ov['accent-rgb']){
      const rgb=_amitAppearanceHexToRgb(ov['accent']);
      if(rgb) tokens['accent-rgb']=rgb;
    }
    const root=document.documentElement;
    Object.keys(tokens).forEach(k=>root.style.setProperty('--amit-'+k, tokens[k]));
    root.style.setProperty('color-scheme', tokens['color-scheme']||'dark');
    const urls=[preset.fontsUrl];
    ['font-heading','font-body','font-title'].forEach(k=>{
      const f=AMIT_APPEARANCE_FONTS.find(x=>x.stack===tokens[k]);
      if(f && f.url) urls.push(f.url);
    });
    _amitAppearanceSetFonts(urls);
    // font-scale: most pages still size text in fixed px, not rem, so a
    // CSS variable alone wouldn't resize existing text. Page zoom is the
    // one mechanism that actually scales everything today, globally, with
    // no per-page rework — text, buttons, spacing, all of it, the same way
    // a browser's own Ctrl+/- zoom does. Chromium only (Edge/Chrome); on
    // other browsers this token is stored and synced but has no visible
    // effect yet.
    const scale=parseFloat(tokens['font-scale']);
    try{ document.documentElement.style.zoom=(scale && scale!==1) ? String(scale) : ''; }catch(e){}
  }catch(e){ /* never break the page over appearance */ }
}

// ── Cache ────────────────────────────────────────────────────
function amitAppearanceReadCache(){
  try{
    const raw=localStorage.getItem(AMIT_APPEARANCE_CACHE_KEY);
    if(!raw) return null;
    const c=JSON.parse(raw);
    if(!c || typeof c!=='object') return null;
    return {user_id:c.user_id||null, template_key:c.template_key||'classic', overrides:amitAppearanceSanitize(c.overrides)};
  }catch(e){ return null; }
}
function _amitAppearanceWriteCache(userId, templateKey, overrides){
  try{ localStorage.setItem(AMIT_APPEARANCE_CACHE_KEY, JSON.stringify({user_id:userId, template_key:templateKey, overrides:overrides})); }catch(e){}
}
function _amitAppearanceClearCache(){
  try{ localStorage.removeItem(AMIT_APPEARANCE_CACHE_KEY); }catch(e){}
}
function _amitAppearanceApplyFromCache(){
  const c=amitAppearanceReadCache();
  if(c) _amitAppearanceApply(c.template_key, c.overrides);
  else _amitAppearanceClear();
}

// ── Public API ───────────────────────────────────────────────
async function amitAppearanceSync(db){
  if(!db || !db.auth) return;
  try{
    const {data, error}=await db.auth.getSession();
    if(error) return;
    const session=data && data.session;
    if(!session){
      _amitAppearanceClearCache();
      _amitAppearanceClear();
      return;
    }
    const uid=session.user.id;
    const res=await db.from('hub_appearance').select('template_key,overrides').eq('user_id', uid).maybeSingle();
    if(res.error) return;
    const row=res.data;
    const key=(row && AMIT_APPEARANCE_PRESETS[row.template_key]) ? row.template_key : 'classic';
    const ov=amitAppearanceSanitize(row ? row.overrides : {});
    _amitAppearanceWriteCache(uid, key, ov);
    _amitAppearanceApply(key, ov);
  }catch(e){ /* keep current state */ }
}

async function amitAppearanceSave(db, templateKey, overrides){
  try{
    if(!db || !db.auth) return {ok:false, error:'No database connection.'};
    if(!AMIT_APPEARANCE_PRESETS[templateKey]) return {ok:false, error:'Unknown template.'};
    const {data}=await db.auth.getSession();
    const session=data && data.session;
    if(!session) return {ok:false, error:'Sign in to save your appearance.'};
    const ov=amitAppearanceSanitize(overrides);
    const {error}=await db.from('hub_appearance').upsert({
      user_id:session.user.id, template_key:templateKey, overrides:ov, updated_at:new Date().toISOString()
    }, {onConflict:'user_id'});
    if(error) return {ok:false, error:error.message||'Save failed.'};
    _amitAppearanceWriteCache(session.user.id, templateKey, ov);
    _amitAppearanceApply(templateKey, ov);
    return {ok:true};
  }catch(e){ return {ok:false, error:(e && e.message)||'Save failed.'}; }
}

function amitAppearancePreview(templateKey, overrides){ _amitAppearanceApply(templateKey, overrides); }
function amitAppearanceResetPreview(){ _amitAppearanceApplyFromCache(); }

// Other open tabs re-apply after a save / sign-out in this one.
try{
  window.addEventListener('storage', e=>{
    if(e.key===AMIT_APPEARANCE_CACHE_KEY || e.key===null) _amitAppearanceApplyFromCache();
  });
}catch(e){}

// Instant apply on load — synchronous, no network.
_amitAppearanceApplyFromCache();
