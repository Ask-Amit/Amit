# My Morning — design (Ryan, 2026-10-30)

Part of Amit Live. The first time each day a person opens Ask Amit from the ring (hold the trigger button, let go over the Amit icon), the window greets them gently instead of dropping them into the chat. What it offers is set up once, in the Hub, and follows their login.

## Ryan's words, meaning kept
- People will hold the right button and let go every day. Amit "comes alive" before anything else happens in the background.
- Pace it. Do not give them everything at once: "get an agenda, get a cup of coffee, let me get you some good tunes going, let's relax."
- The person sets it up themselves (what they want to hear, the genre) and can change it any time; when they arrive it already knows what to do.
- For someone following the Torah the day runs sunset to sunset; for someone who is not, it is the next day. Distinguish the two.
- Music: ask what they like and connect to it, or produce that genre.

## What it does
1. **When it shows.** Once per "day" in the person's own sense (below). Never twice in one day, on any computer (the last day shown is stored with their settings; the browser also remembers it, so it still works before the table exists).
2. **What it shows** (pace gentle): a greeting by first name (good morning / afternoon / evening, by the clock), "Let us start slowly. What would you like first?", then buttons: **Chat with Amit** (always first), **Play some music**, **Today's Word**, **My agenda**, and a small "Set up my morning" link. Pace short: the greeting and **Chat with Amit** only. A person with the visit turned off goes straight to the chat.
3. **Shabbat.** For a person whose day turns at sunset, the visit on Shabbat (Friday sunset to Saturday sunset) says "Shabbat shalom", "Today is a day of rest. Nothing here has to be done.", and does not offer the agenda.
4. **Music.** Devotions: Ryan's own songs (Blow the Shofar, When I See the Blood), played in the window after one tap (a browser will not play sound by itself). Link: an https playlist link the person pastes, opened in their own music account in a new tab; Amit does not play it and does not read their listening history. None: no music button. A free-text wish ("soft acoustic worship") is kept private with their settings; it is how Ryan sees what to make next.
5. **Agenda.** Only when asked: the person's own pursuits (kind pursuit, not done) due today or earlier, up to 8.
6. **Never forced.** Chat is one tap away and always first; the whole visit can be turned off.

## When a "day" begins (settings.day_turn)
- `morning`: 4 a.m. local time.
- `sunset`: at sunset, computed on the person's computer from the lat/lon saved with the ZIP in About Me (NOAA equations, no outside service). No location: 18:00 is used.
- `auto` (default): sunset if the person turned the Gregorian calendar off in the Hub's calendar (`amit_calPrefs.greg === false`), otherwise `morning`.

## Where it lives
- **Setup:** Hub, Communications > **My Morning** tab (Hub v8.56). One home for it; the window only reads it. A "Set up my morning" link in the window opens `amit-hub.html?mm=1`.
- **Table:** `mor_settings` (prefix Mor_), one row per person, own row only, grants in the same file: `Database\migration_2026-10-30_032_my_morning.sql`. Columns: enabled, day_turn, pace, music_choice, playlist_url, music_wish, show_word, show_agenda, last_visit_day.
- **Logic:** `ComputerHealth\amit_morning.js` (pure functions, tested by `ComputerHealth\tests\amit_morning_test.js`: 24 checks, four timezones). **Window:** `ComputerHealth\AmitLive.html`.

## Honest limits
- Needs the helper installed (the ring) and an internet connection; the offline page does not show the visit.
- Genres: only Ryan's own songs exist today; a link brings the person's own music.
- "Today's Word" opens the Hub; the Word is not yet shown inside the window.
- The wish text is private to the person; if Ryan ever wants to read the wishes in aggregate, that needs its own, openly stated policy and a separate read path. Not built.
- Sunset without a saved ZIP is a guess (18:00); the page does not yet tell the person so.

## Not built (ideas Ryan and Amit named)
Spoken greeting (needs a tap), a morning thread from yesterday's conversation, Amit-made songs on request (no public interface to the music generator Ryan uses by hand, and a per-song cost), reading a person's listening history (needs their permission and each service's sign-in).
