# LeetNoise

LeetNoise is a Chrome extension that auto-plays your favorite YouTube focus audio the moment you start a LeetCode timer or stopwatch — and stops it automatically when you finish.

Save up to six YouTube videos in the popup, pick a default, and let your study sessions kick off with one click.

## Features

- **Auto-play on timer start** — clicking Start Timer / Start Stopwatch on LeetCode opens your default YouTube video in a sibling tab and starts playback.
- **Auto-stop on submission** — when your submission is Accepted, playback stops automatically.
- **Pause / resume / stop with the LeetCode controls** — pausing the LeetCode timer pauses YouTube; resuming resumes; stopping stops.
- **Up to 6 saved videos** — paste any YouTube link, pick one as default, switch between them from the popup.
- **Themes** — a handful of CSS themes available in the popup.
- **No build step, no tracking, no account** — vanilla JavaScript, Manifest V3, runs entirely in your browser.

## Install

LeetNoise is not on the Chrome Web Store. Install it as an unpacked extension:

1. **Download the code.** Either:
   - Clone the repo: `git clone https://github.com/hfeliz03/LeetNoise.git`, or
   - On GitHub, click **Code → Download ZIP** and unzip it somewhere you won't move or delete.
2. Open Chrome (or any Chromium browser — Edge, Brave, Arc) and navigate to `chrome://extensions`.
3. Toggle **Developer mode** on (top-right).
4. Click **Load unpacked** and select the `LeetNoise` folder you just downloaded.
5. LeetNoise should now appear in your extensions list. Pin it from the puzzle-piece menu so the popup is one click away.

To update later, `git pull` (or re-download the ZIP) and hit the reload icon on the LeetNoise card at `chrome://extensions`.

## Usage

1. Click the LeetNoise icon in your toolbar to open the popup.
2. Paste a YouTube URL (long-form lofi, ambient, or rain mixes work best) and click **Save**. Repeat for up to six videos.
3. Click the star next to one video to mark it as your default.
4. Make sure **Auto-play on LeetCode timer** is enabled.
5. Open any LeetCode problem and click **Start Timer** or **Start Stopwatch**. A YouTube tab opens next to the LeetCode tab and audio starts playing.
6. Submit your solution. When LeetCode shows **Accepted**, playback stops on its own.

You can also start, pause, or stop playback manually from the popup at any time.

### First-play tip

Chrome blocks audio in background tabs that the user has never interacted with. The first time LeetNoise opens a YouTube tab, briefly click into it so Chrome marks it as "user-activated", then switch back to LeetCode. After that, autoplay works for the rest of the session.

## How it works

LeetNoise is a four-piece Manifest V3 extension:

| File | Role |
| --- | --- |
| `content.js` | Runs on `leetcode.com`. Detects clicks on timer/stopwatch controls and submission results using heuristics over `aria-label`, `title`, and button text. |
| `popup.js` / `popup.html` / `popup.css` | The toolbar popup — manage saved videos, pick a default, control playback. |
| `background.js` | Service worker. Owns the single LeetNoise-controlled YouTube tab, opens / moves / closes it, and routes messages between the other scripts. |
| `youtube-controller.js` | Runs on `youtube.com`. Plays or pauses the page's `<video>` element on request. |

The owned YouTube tab is tagged with a `leetnoise=1` query parameter so the service worker can recognize it even after a Chrome restart or service-worker suspension.

For a deeper dive on the message flow, ownership model, and timer-detection heuristics, see [`CLAUDE.md`](./CLAUDE.md).

## Permissions

LeetNoise requests only what it needs:

- `storage` — save your video list and preferences (synced to your Chrome profile).
- `tabs` and `scripting` — find and control the YouTube tab it opens.
- Host access to `leetcode.com` and `youtube.com` — detect timer clicks and control playback.

No analytics, no remote servers, no account.

## Troubleshooting

- **Audio doesn't start the first time.** That's Chrome's autoplay policy — see the *First-play tip* above.
- **Nothing happens when I click Start Timer.** Reload the LeetCode tab so the content script re-injects, then try again. If you just edited the code, also click the reload icon on the LeetNoise card at `chrome://extensions`.
- **The video tab keeps reopening.** Make sure you don't have multiple LeetNoise-owned YouTube tabs open. The service worker reconciles duplicates on every action, but a stale tab from a previous Chrome session can confuse it briefly.
- **My submission was accepted but the audio didn't stop.** LeetNoise looks for the word "Accepted" alongside cues like "Testcases passed" or "Runtime beats". If LeetCode changes its result UI, detection can drift — open an issue and include a screenshot.

## Contributing

Issues and PRs welcome at <https://github.com/hfeliz03/LeetNoise>. There's no build step or test suite — just edit files, reload the extension at `chrome://extensions`, and exercise the flow on LeetCode.

## License

MIT.
