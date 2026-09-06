# Getting Amit to Reply on Your Phone — Setup Guide

This guide is for the ONE computer that will "listen" for Amit Mobile and send back real replies. You only need to do this once per computer. If you don't do this, the phone app still works (you can talk, take photos, and everything gets saved) — Amit just won't reply until this is running.

## 1. What is this, in plain terms?

Amit Mobile (the phone app) never talks to your computer directly. Both your phone and your computer only ever talk to a shared online database (Supabase). Your phone drops off a question there. Your computer picks it up, thinks about it (using your own Claude account), and drops the answer back off in the same place. Your phone then picks up the answer.

That means your computer needs to be the one running a small helper program — called the **Amit Bridge** — that sits there watching for new questions and answering them. Think of it like an answering machine that has to be turned on and plugged in for messages to actually get picked up. If it's off, or the computer is asleep, your phone's questions just sit there waiting patiently — nothing is lost, but nothing gets answered either until the bridge is running again.

## 2. Before you start — two things you need

1. **Node.js is NOT required for this.** The Amit Bridge is a PowerShell program (built into every Windows computer already) — nothing extra to install for that part.
2. **You need your own Claude Code login already set up on this computer**, and it needs to be YOUR OWN Claude subscription — not someone else's, not a shared one. This is important: Amit's replies are powered by your own Claude account on this machine, the same way a subscription works for one person. If you don't have Claude Code installed and signed in yet, ask whoever set up your computer for help getting that done first — this guide assumes it's already working (you can test this yourself by opening a Command Prompt or PowerShell window and typing `claude --version` — if it shows a version number, you're set).

## 3. The two security warnings you'll probably see — this is normal

Amit doesn't yet have a paid certificate that tells your browser and Windows "this program is verified" (a real cost that gets added once Amit has enough people using it) — until then, expect two separate warnings, both safe to click past:

1. **Right after downloading `install-Amit.exe`**, your browser (Chrome/Edge) may say something like *"install-Amit.exe isn't commonly downloaded"* or flag it as untrusted. Click the small **∨** or **...** next to the downloaded file, then choose **Keep** (it may ask you to confirm "Keep anyway" a second time — choose Keep again).
2. **When you actually run the installer**, Windows itself may say *"Windows protected your PC."* Click **More info**, then click **Run anyway**.

Neither of these means anything is actually wrong — they show up for any small, newer program that hasn't yet been downloaded by enough people for Windows/your browser to "recognize" it as common. If you're ever unsure, download it only from the real Hub (`https://ask-amit.github.io/Amit/Hub/amit-hub.html`) via the Connect Amit button, never from anywhere else.

## 4. Getting the Amit Bridge running

The Amit Bridge is the same program used for "Amit Computer Health" — if that's already installed and running on this computer, **you don't need to do anything else**. Amit Mobile automatically starts listening the moment the Amit Bridge itself starts. There is nothing separate to install or run for Amit Mobile specifically.

If the Amit Bridge is NOT already running on this computer:

1. Find the folder named `Watchers` inside the Amit Computer Health program.
2. Inside it, find the file named `amit_bridge_server.ps1`.
3. Right-click it and choose **Run with PowerShell** (or open a PowerShell window, navigate to that folder, and type `.\amit_bridge_server.ps1`).
4. A black window will open and stay open. That window IS the bridge running — closing it stops everything.

**How to know it's working:** the window should print lines that look like this:

```
Amit Computer Health bridge server running at http://localhost:8710/
Amit Mobile listener started (see amit_mobile_watcher.ps1) — replies to phone captures will be answered automatically.
```

That second line is the important one — it means Amit is now listening for your phone's questions. Leave this window open.

## 5. Keep the computer from falling asleep

This is the step people forget, and it's the #1 reason "Amit isn't answering" — the computer went to sleep and stopped listening. If your computer sleeps or turns its screen off, the bridge effectively pauses (it can't check for new questions while the machine is asleep), and your phone will wait until it wakes back up.

**On Windows:**
1. Click the **Start** button, then click the gear icon for **Settings**.
2. Click **System**.
3. Click **Power & sleep** (or "Power" on some versions of Windows).
4. Under **Screen**, change both dropdowns (on battery / plugged in) to **Never**.
5. Under **Sleep**, change both dropdowns to **Never**.

This means the screen may look "off" but the computer is still fully awake and working underneath — that's exactly what you want while you're using Amit Mobile away from your desk. You can always put these settings back to normal later; they only need to be set to Never while you want Amit listening.

## 6. What happens if you close the window or turn off the computer

Nothing is lost. Every question and photo you send from your phone is saved the instant you send it — the "answering machine" analogy again: your message is recorded even if nobody's there to answer yet. When you turn the bridge back on (open the window again, or turn the computer back on), it automatically checks for anything that came in while it was off and answers those first, then keeps going from there.

The only real cost of the bridge being off is time — Amit's replies just wait. This is expected, not a bug: it's the tradeoff of this being a free way to run Amit, without needing to pay for a separate always-on server somewhere. If you want Amit to answer while you're out and about, the computer running this bridge needs to be left on (screen can be off/locked, per step 5 above — it just can't be fully asleep or shut down).

## 7. If something seems stuck

- Check that the black PowerShell window is still open and hasn't shown any red error text.
- Check that your computer's screen/sleep settings are still set to Never (Windows sometimes resets these after an update).
- If your phone shows "Amit's desktop isn't listening right now" after about a minute and a half of waiting, that's Amit being honest with you — it means the bridge isn't reachable, not that something silently failed. Follow steps 3–4 above and try asking again.
