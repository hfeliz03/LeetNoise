# LeetNoise Privacy Policy

_Last updated: June 8, 2026_

LeetNoise is a Chrome extension that plays YouTube focus audio when you start a
LeetCode timer. This policy explains exactly what data the extension touches.

## Short version

LeetNoise does **not** collect, sell, or transmit your personal data to us or to
any third party. There are no analytics, no trackers, no accounts, and no remote
servers operated by LeetNoise.

## What LeetNoise stores

The extension saves the following on your own device, using Chrome's built-in
`storage.sync` API (which Chrome may sync across browsers where you're signed
into the same Google account):

- The list of YouTube videos you add (name + URL), up to six.
- Which saved video you marked as the default.
- Your preferences: the auto-play toggle, selected theme, and celebration sound.

This data never leaves Google's storage sync mechanism. LeetNoise has no backend
and cannot read your synced data — it stays within your Chrome profile.

## What LeetNoise accesses while running

To do its job, LeetNoise reads page content only on the sites where it operates:

- **leetcode.com** — it watches for clicks on the timer/stopwatch controls and
  for an "Accepted" submission result, so it can start and stop playback. It does
  not read your code, account, or submissions content beyond detecting these UI
  signals.
- **youtube.com** — it plays or pauses the `<video>` element on a tab it opened,
  so your focus audio starts and stops automatically.

It does not read, store, or transmit the contents of these pages anywhere.

## Permissions and why they're used

| Permission | Why |
| --- | --- |
| `storage` | Save your video list and preferences (described above). |
| `tabs` | Find, open, move, and close the single YouTube tab LeetNoise controls. |
| `scripting` | Control playback in that YouTube tab. |
| Host access to `leetcode.com` | Detect timer clicks and submission results. |
| Host access to `youtube.com` | Start and stop the focus-audio video. |

## Feedback form (optional)

The popup includes a "Send feedback" link to a Google Form. Using it is entirely
optional and only happens if you click it and choose to submit. Anything you type
there is governed by Google's privacy policy. The form does not require login, and
providing an email address for a reply is optional.

## Changes

If this policy changes, the "Last updated" date above will change and the new
version will be published in this repository.

## Contact

Questions? Open an issue at https://github.com/hfeliz03/LeetNoise/issues or use
the feedback form linked in the extension popup.
