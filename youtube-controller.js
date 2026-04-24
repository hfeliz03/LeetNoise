chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
