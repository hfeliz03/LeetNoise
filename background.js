const PLAYER_WIDTH = 420;
const PLAYER_HEIGHT = 320;

let playerTabId = null;
let playerWindowId = null;

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.sync.get(["videos", "defaultVideoId", "autoPlayOnTimer"]);
  const updates = {};

  if (!Array.isArray(stored.videos)) {
    updates.videos = [];
  }

  if (typeof stored.autoPlayOnTimer !== "boolean") {
    updates.autoPlayOnTimer = true;
  }

  if (Object.keys(updates).length > 0) {
    await chrome.storage.sync.set(updates);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) {
    return false;
  }

  if (message.type === "PLAY_DEFAULT_VIDEO") {
    void handlePlayDefaultVideo(sendResponse);
    return true;
  }

  if (message.type === "PLAY_VIDEO_BY_ID") {
    void openOrUpdatePlayer(message.videoId).then(() => {
      sendResponse({ ok: true });
    }).catch((error) => {
      sendResponse({ ok: false, error: error.message });
    });
    return true;
  }

  if (message.type === "GET_STATUS") {
    void getStatus().then(sendResponse);
    return true;
  }

  if (message.type === "STOP_PLAYBACK") {
    void stopPlayback().then(() => sendResponse({ ok: true }));
    return true;
  }

  return false;
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === playerTabId) {
    playerTabId = null;
    playerWindowId = null;
  }
});

chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === playerWindowId) {
    playerTabId = null;
    playerWindowId = null;
  }
});

async function handlePlayDefaultVideo(sendResponse) {
  try {
    const { videos, defaultVideoId, autoPlayOnTimer } = await chrome.storage.sync.get([
      "videos",
      "defaultVideoId",
      "autoPlayOnTimer"
    ]);
    const savedVideos = Array.isArray(videos) ? videos : [];

    if (autoPlayOnTimer === false) {
      sendResponse({ ok: true, skipped: true });
      return;
    }

    const selectedVideo = savedVideos.find((video) => video.id === defaultVideoId) || savedVideos[0];
    const selectedVideoId = selectedVideo?.videoId;

    if (!selectedVideoId) {
      sendResponse({ ok: false, error: "No saved videos available." });
      return;
    }

    await openOrUpdatePlayer(selectedVideoId);
    sendResponse({ ok: true, videoId: selectedVideoId });
  } catch (error) {
    sendResponse({ ok: false, error: error.message });
  }
}

async function openOrUpdatePlayer(videoId) {
  const url = buildWatchUrl(videoId);

  if (playerTabId !== null) {
    try {
      await chrome.tabs.update(playerTabId, { url, active: false });
      if (playerWindowId !== null) {
        await chrome.windows.update(playerWindowId, { focused: true });
      }
      return;
    } catch (error) {
      playerTabId = null;
      playerWindowId = null;
    }
  }

  const createdWindow = await chrome.windows.create({
    url,
    type: "popup",
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    focused: true
  });

  playerWindowId = createdWindow.id ?? null;
  playerTabId = createdWindow.tabs?.[0]?.id ?? null;
}

function buildWatchUrl(videoId) {
  const params = new URLSearchParams({
    v: videoId,
    autoplay: "1"
  });

  return `https://www.youtube.com/watch?${params.toString()}`;
}

async function getStatus() {
  const { videos, defaultVideoId, autoPlayOnTimer } = await chrome.storage.sync.get([
    "videos",
    "defaultVideoId",
    "autoPlayOnTimer"
  ]);

  return {
    hasVideos: Array.isArray(videos) && videos.length > 0,
    defaultVideoId: defaultVideoId || null,
    autoPlayOnTimer: autoPlayOnTimer !== false,
    playerOpen: playerTabId !== null
  };
}

async function stopPlayback() {
  if (playerTabId === null) {
    return;
  }

  try {
    await chrome.tabs.remove(playerTabId);
  } finally {
    playerTabId = null;
    playerWindowId = null;
  }
}
