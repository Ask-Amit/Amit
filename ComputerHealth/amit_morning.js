/* AMIT MORNING v1.00 (2026-10-30, Ryan's design): the logic behind the first visit of the day in the Amit Live window.
   Pure functions, no network, no page: ComputerHealth\AmitLive.html uses them; tests run them in Node (ComputerHealth\tests\amit_morning_test.js).

   AmitMorning.dayInfo(now, settings, ctx)  -> { label:'YYYY-MM-DD', mode:'morning'|'sunset', shabbat:boolean, sunsetUsed:boolean }
     The "day" a visit belongs to, in THIS person's sense:
       mode 'morning': the day starts at 4 a.m. local time (the next morning).
       mode 'sunset' : the day starts at sunset (sunset to sunset): at or after sunset it already counts as the NEXT calendar date.
       settings.day_turn 'auto' picks sunset only when ctx.greg === false (the person turned the Gregorian calendar off in the Hub), else morning.
       ctx = { lat, lon, greg }. Without lat/lon, sunset falls back to 18:00 local (sunsetUsed false tells the page it was a guess).
     shabbat is true only in sunset mode, for the day labelled Saturday (that is, from Friday sunset to Saturday sunset).
   AmitMorning.sunset(year, month1to12, day, lat, lon) -> Date | null   NOAA solar equations; null at polar extremes.
   AmitMorning.greeting(now, name, shabbat) -> a short hello. */
(function (root) {
  var rad = function (d) { return d * Math.PI / 180; }, deg = function (r) { return r * 180 / Math.PI; };
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  // Sunset instant for the civil date y-m-d at (lat, lon east-positive). NOAA general solar position equations.
  function sunset(y, m, d, lat, lon) {
    if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) return null;
    var jd0 = Date.UTC(y, m - 1, d) / 86400000 + 2440587.5;          // Julian day at 0h UTC of that date
    var jc = (jd0 + 0.5 - lon / 360 - 2451545) / 36525;               // near local solar noon
    var L0 = (280.46646 + jc * (36000.76983 + jc * 0.0003032)) % 360;
    var M = 357.52911 + jc * (35999.05029 - 0.0001537 * jc);
    var e = 0.016708634 - jc * (0.000042037 + 0.0000001267 * jc);
    var C = Math.sin(rad(M)) * (1.914602 - jc * (0.004817 + 0.000014 * jc)) + Math.sin(rad(2 * M)) * (0.019993 - 0.000101 * jc) + Math.sin(rad(3 * M)) * 0.000289;
    var trueLong = L0 + C;
    var appLong = trueLong - 0.00569 - 0.00478 * Math.sin(rad(125.04 - 1934.136 * jc));
    var obliqMean = 23 + (26 + (21.448 - jc * (46.815 + jc * (0.00059 - jc * 0.001813))) / 60) / 60;
    var obliq = obliqMean + 0.00256 * Math.cos(rad(125.04 - 1934.136 * jc));
    var decl = deg(Math.asin(Math.sin(rad(obliq)) * Math.sin(rad(appLong))));
    var yy = Math.tan(rad(obliq / 2)); yy = yy * yy;
    var eqTime = 4 * deg(yy * Math.sin(2 * rad(L0)) - 2 * e * Math.sin(rad(M)) + 4 * e * yy * Math.sin(rad(M)) * Math.cos(2 * rad(L0)) - 0.5 * yy * yy * Math.sin(4 * rad(L0)) - 1.25 * e * e * Math.sin(2 * rad(M)));
    var cosHa = Math.cos(rad(90.833)) / (Math.cos(rad(lat)) * Math.cos(rad(decl))) - Math.tan(rad(lat)) * Math.tan(rad(decl));
    if (cosHa > 1 || cosHa < -1) return null;                         // sun never sets / never rises that day
    var ha = deg(Math.acos(cosHa));
    var noonMin = 720 - 4 * lon - eqTime;                             // minutes after 0h UTC
    return new Date(Date.UTC(y, m - 1, d) + (noonMin + 4 * ha) * 60000);
  }

  function dayInfo(now, settings, ctx) {
    settings = settings || {}; ctx = ctx || {};
    var mode = settings.day_turn || 'auto';
    if (mode === 'auto') mode = (ctx.greg === false) ? 'sunset' : 'morning';
    var label, sunsetUsed = false;
    if (mode === 'sunset') {
      var ss = sunset(now.getFullYear(), now.getMonth() + 1, now.getDate(), ctx.lat, ctx.lon);
      if (ss) sunsetUsed = true; else { ss = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0); }
      var base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (now.getTime() >= ss.getTime()) base.setDate(base.getDate() + 1);
      label = ymd(base);
    } else {
      label = ymd(new Date(now.getTime() - 4 * 3600000));
    }
    var p = label.split('-'), wd = new Date(+p[0], +p[1] - 1, +p[2]).getDay();     // 6 = Saturday
    return { label: label, mode: mode, shabbat: mode === 'sunset' && wd === 6, sunsetUsed: sunsetUsed };
  }

  function greeting(now, name, shabbat) {
    var n = name ? ', ' + name : '';
    if (shabbat) return 'Shabbat shalom' + n + '.';
    var h = now.getHours();
    return (h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening') + n + '.';
  }

  var api = { sunset: sunset, dayInfo: dayInfo, greeting: greeting, ymd: ymd };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.AmitMorning = api;
})(typeof window !== 'undefined' ? window : this);
