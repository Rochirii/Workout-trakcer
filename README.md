# Daily System Fitness

An iPhone-ready workout quest app inspired by daily leveling systems.

## Run It

Open `index.html` directly to try the app.

For installable PWA behavior, run this in PowerShell from this folder:

```powershell
.\Start-DailySystem.cmd
```

Then open `http://localhost:8787/`.

To open it from your iPhone, keep the server running, make sure the iPhone is on the same Wi-Fi as your PC, then open:

```text
http://YOUR-PC-IP:8787/
```

Find your PC IP by running `ipconfig` in PowerShell or Command Prompt and looking for the `IPv4 Address` on your Wi-Fi adapter.

## What It Does

- Generates a daily bodyweight workout quest.
- Lets you check off exercises and claim rewards.
- Saves level, EXP, streak, stats, settings, and recent clears in local storage.
- Supports focus modes: balanced, strength, core, stamina, and mobility.
- Includes a manifest, icon, and service worker for Home Screen install support when served over HTTP/HTTPS.
