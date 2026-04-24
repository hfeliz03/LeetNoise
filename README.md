# LeetNoise

LeetNoise is a Chrome extension MVP that lets you save up to six YouTube focus-audio videos and auto-play your default selection when you click a timer-like control on LeetCode.

## MVP features

- Save up to 6 YouTube links from the extension popup
- Mark one saved video as the default
- Auto-play the default video when a timer-related control is clicked on `leetcode.com`
- Open playback in a small extension-managed popup window
- Stop playback from the extension popup

## Local development

1. Open Chrome and go to `chrome://extensions`
2. Enable `Developer mode`
3. Click `Load unpacked`
4. Select `/Users/vilma/Desktop/LeetNoise`

## Notes

- This MVP uses heuristic timer detection on LeetCode by looking for clicks on controls labeled with terms like `timer`, `time`, or `chronometer`.
- Chrome autoplay rules may still depend on prior user interaction with the extension.
- Users can paste any YouTube link, but long-form ambient videos with no talking are best for focus sessions.
