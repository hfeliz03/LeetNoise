# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

LeetNoise is an unbundled, vanilla-JS Chrome Extension (Manifest V3) that auto-plays a saved YouTube focus-audio video when the user starts a LeetCode timer/stopwatch. No build step, no package manager, no tests — all source files at the repo root are loaded directly by Chrome.

## Local development

Load the extension manually each time files change:

1. `chrome://extensions` → enable **Developer mode**
2. Click **Load unpacked** and select this directory
3. After edits, click the reload icon on the LeetNoise card on the extensions page (and hard-refresh any LeetCode/YouTube tabs so the content scripts re-inject)

There is no lint, build, or test command. Validate behavior by exercising the popup, then triggering a LeetCode timer with the extension active.

## Architecture

The extension is a four-actor MV3 system communicating via `chrome.runtime.sendMessage`. Understanding the message flow is the key to working in this codebase:

```
content.js  (on leetcode.com)        popup.js  (extension popup)
       │                                   │
       │  START_DEFAULT_VIDEO,             │  PLAY_VIDEO_BY_ID,
       │  PAUSE/RESUME/STOP_PLAYBACK       │  STOP_PLAYBACK,
       ▼                                   ▼  GET_STATUS
                    background.js  (service worker, owns player tab state)
                            │
                            │  CONTROL_YOUTUBE_PLAYBACK { play | pause },
                            │  GET_LEETNOISE_OWNERSHIP
                            ▼
              youtube-controller.js  (content script on youtube.com)
```

### Player-tab ownership model (`background.js`)

The service worker holds a single "owned" YouTube tab. Critical invariants:

- The owned tab is identified by a `leetnoise=1` query param injected into the watch URL (`buildWatchUrl`). `youtube-controller.js` reads that param on load and sets `sessionStorage.leetnoiseOwnedPlayer = "1"`.
- `playerTabId` / `playerVideoId` are mirrored to `chrome.storage.session` so the worker can recover after suspension. **Before any tab operation, call `reconcileOwnedTabs()`** — it re-scans all YouTube tabs, pings each via `GET_LEETNOISE_OWNERSHIP`, picks the canonical one, and closes duplicates.
- When starting playback, the existing owned tab is moved next to the sender tab (same window, `index + 1`) rather than reopened, to preserve the autoplay-unlock state of a tab the user has already visited.
- If the current video already matches the requested one, `startPlayback` sends `CONTROL_YOUTUBE_PLAYBACK { play }` instead of navigating — this is what makes resume work without restarting.

### LeetCode timer detection (`content.js`)

There is **no LeetCode API** — detection is heuristic and intentionally conservative:

- `ACTION_DEFINITIONS` is the canonical list of labels matched against `aria-label`, `title`, `data-e2e-locator`, and `textContent` of clicked `<button>` / `[role=button]` elements, normalized via `normalizeText` (trim + lowercase + collapse whitespace).
- `requiresTimerContext` actions additionally walk up to 5 ancestors looking for `timer`, `stopwatch`, an `HH:MM:SS` pattern, or `hr`/`min` — this filters out unrelated buttons that share words like "stop".
- A 1.5 s same-action debounce (`lastActionKey` / `lastActionAt`) prevents double-fires from `click` + keyboard handlers.
- Action → message mapping lives in `mapActionToMessage`. `reset` is intentionally mapped to `null` (no-op).

### Accepted-submission auto-stop (`content.js`)

Separate from timer detection: when a "Submit" button is clicked (`findSubmitIntent` sets `submitPending`), a `MutationObserver` plus SPA route patches (`installRouteObservers`, which monkey-patches `history.pushState`/`replaceState`) watch for an "Accepted" submission result. On match, `STOP_PLAYBACK` fires. `isAcceptedSubmissionText` requires `accepted` **plus** one of `testcases passed` / `submitted at` / `runtime beats` / `memory beats` to avoid false positives. A 3 s cooldown (`lastAcceptedSignalAt`) guards against MutationObserver storms.

### YouTube control (`youtube-controller.js`)

Runs on every `youtube.com` page (not just owned ones) so any tab can answer `GET_LEETNOISE_OWNERSHIP`. Playback control just grabs the page's `<video>` element and calls `play()` / `pause()` directly — no YouTube IFrame API.

### Popup (`popup.js` + `popup.html` + `popup.css`)

State is mirrored between an in-memory `state` object and `chrome.storage.sync` (keys: `videos`, `defaultVideoId`, `autoPlayOnTimer`, `themeId`). `persistState` writes the diff and re-renders. Max 6 videos enforced in the save handler. Themes are CSS-variable swaps driven by `document.body.dataset.theme`.

### Legacy player (`player.html` / `player.js` / `player.css`)

Listed in `web_accessible_resources` but **not currently used by the running flow** — playback opens a normal `youtube.com/watch` tab instead (per README, to avoid embed Error 153). Treat these files as dead code unless intentionally reviving the embed flow.

## Gotchas

- Chrome may block autoplay in a freshly-opened background YouTube tab until the user has activated it once. This is browser policy, not a bug — see the popup's "First play tip" copy.
- `chrome.storage.sync` is shared across the user's Chrome profile and has per-key size limits; the `videos` array is small but don't bloat individual records.
- The extension is MV3 — the service worker can be terminated at any time. Never rely on in-memory globals without also writing to `chrome.storage.session` (see `updatePlayerSession`).
- Content scripts only re-inject on page reload. After editing `content.js` or `youtube-controller.js`, reload both the extension *and* the target page.
