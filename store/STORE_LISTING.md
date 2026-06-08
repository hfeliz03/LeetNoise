# Chrome Web Store listing copy

Paste these into the matching fields of the Web Store developer dashboard.

---

## Name (max 75 chars)

```
LeetNoise – Focus audio for LeetCode
```

## Summary / short description (max 132 chars)

```
Auto-play your favorite YouTube focus audio the moment you start a LeetCode timer — and stop it when your solution is Accepted.
```

## Category

`Productivity` (alternate: `Workflow & Planning`)

## Detailed description (max 16,000 chars)

```
LeetNoise plays your favorite YouTube focus audio the moment you start a LeetCode timer or stopwatch — and stops it automatically when your submission is Accepted. Set it once and let every study session start with one click.

FEATURES
• Auto-play on timer start — clicking Start Timer or Start Stopwatch on LeetCode opens your default YouTube video in a sibling tab and starts playback.
• Auto-stop on Accepted — when your submission passes, playback stops on its own so you get a clean break.
• Pause / resume / stop with the LeetCode controls — pausing the LeetCode timer pauses YouTube; resuming resumes; stopping stops.
• Save up to 6 videos — paste any YouTube link (lofi, brown noise, rain, ambient), pick a default, and switch between them from the popup.
• Celebration sound — a short sound plays when your submission is accepted. Pick your favorite.
• Themes — a handful of LeetCode-matching color themes.
• Private by design — vanilla JavaScript, Manifest V3, no analytics, no accounts, no remote servers.

HOW TO USE
1. Click the LeetNoise icon and paste a YouTube URL (long-form lofi/ambient/rain mixes work best). Save up to six.
2. Mark one as your default with the star.
3. Make sure "Auto-play on timer start" is on.
4. Open a LeetCode problem and click Start Timer or Start Stopwatch — a YouTube tab opens next to it and audio starts.
5. Submit. When LeetCode shows Accepted, playback stops automatically.

You can also start, pause, or stop playback manually from the popup any time.

FIRST-PLAY TIP
Chrome blocks audio in a background tab you've never interacted with. The first time LeetNoise opens a YouTube tab, quickly click into it once so Chrome marks it "user-activated," then switch back to LeetCode. After that, autoplay works for the rest of the session.

PERMISSIONS
LeetNoise requests only what it needs: storage (to save your video list and preferences), tabs and scripting (to find and control the YouTube tab it opens), and host access to leetcode.com and youtube.com (to detect timer clicks and control playback). No analytics, no remote servers, no account. See the privacy policy for details.

Feedback and bug reports are welcome via the links in the popup.
```

---

## Single-purpose description (for the dashboard's "single purpose" field)

```
LeetNoise plays a user-chosen YouTube focus-audio video when a LeetCode practice timer starts and stops it when the LeetCode submission is Accepted.
```

## Permission justifications (dashboard asks per permission)

- **storage** — Saves the user's list of saved YouTube videos and their preferences (default video, auto-play toggle, theme, celebration sound) on the user's device.
- **tabs** — Needed to open, locate, move next to the LeetCode tab, and close the single YouTube playback tab the extension controls.
- **scripting** — Needed to play/pause the video element in the controlled YouTube tab.
- **host_permission leetcode.com** — Detects clicks on the timer/stopwatch controls and the "Accepted" submission result to trigger play/stop.
- **host_permission youtube.com** — Plays and pauses the focus-audio video in the tab the extension opens.

## Data usage disclosures (Privacy practices tab)

Check these answers to match the privacy policy:
- Does NOT collect or use data for purposes unrelated to the single purpose.
- Does NOT sell or transfer user data to third parties.
- Does NOT use or transfer data for creditworthiness / lending.
- "What user data do you plan to collect?" → **None** transmitted to the developer. (Video URLs/preferences are stored only via Chrome storage on the user's device; nothing is sent to a developer server.)
- Privacy policy URL → https://github.com/hfeliz03/LeetNoise/blob/main/PRIVACY.md

---

## Assets you must upload

| Asset | Requirement | Status |
| --- | --- | --- |
| Store icon | 128×128 PNG | ✅ `assets/wordmark128.png` (auto-pulled from manifest `icons.128`) |
| Screenshot(s) | At least 1; 1280×800 or 640×400 PNG/JPEG | ⬜ TODO — capture the popup + a LeetCode session |
| Small promo tile (optional) | 440×280 | ⬜ Optional |
| Marquee promo tile (optional) | 1400×560 | ⬜ Optional |

Screenshots are the one asset that requires manual capture. Suggested shots:
1. The LeetNoise popup open, with a couple of saved videos and the theme picker.
2. A LeetCode problem page with the timer running and the YouTube tab beside it.
