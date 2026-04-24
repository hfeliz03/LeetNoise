const OWNERSHIP_KEY = "leetnoiseOwnedPlayer";

captureOwnershipMarker();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "GET_LEETNOISE_OWNERSHIP") {
    sendResponse({ owned: sessionStorage.getItem(OWNERSHIP_KEY) === "1" });
    return false;
  }

  if (message?.type !== "CONTROL_YOUTUBE_PLAYBACK") {
    return false;
  }

  const video = document.querySelector("video");
  if (!(video instanceof HTMLVideoElement)) {
    sendResponse({ ok: false, error: "No YouTube video element found." });
    return false;
  }

  if (message.command === "pause") {
    video.pause();
    sendResponse({ ok: true });
    return false;
  }

  if (message.command === "play") {
    void video.play().then(() => {
      sendResponse({ ok: true });
    }).catch(() => {
      sendResponse({ ok: false, error: "Playback was blocked." });
    });
    return true;
  }

  sendResponse({ ok: false, error: "Unknown playback command." });
  return false;
});

function captureOwnershipMarker() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get("leetnoise") === "1") {
      sessionStorage.setItem(OWNERSHIP_KEY, "1");
    }
  } catch (error) {
    console.debug("LeetNoise could not read ownership marker", error);
  }
}
