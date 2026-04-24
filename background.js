let playerTabId = null;

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
    void handlePlayDefaultVideo(sendResponse, sender);
    return true;
  }

  if (message.type === "PLAY_VIDEO_BY_ID") {
    void openOrUpdatePlayer(message.videoId, sender).then(() => {
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
  }
});

async function handlePlayDefaultVideo(sendResponse, sender) {
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

    await openOrUpdatePlayer(selectedVideoId, sender);
    sendResponse({ ok: true, videoId: selectedVideoId });
  } catch (error) {
    sendResponse({ ok: false, error: error.message });
  }
}

async function openOrUpdatePlayer(videoId, sender) {
  const url = buildWatchUrl(videoId);
  const sourceTabId = sender?.tab?.id ?? null;
  const sourceWindowId = sender?.tab?.windowId ?? null;
  const sourceIndex = sender?.tab?.index ?? null;

  if (playerTabId !== null) {
    try {
      const existingTab = await chrome.tabs.get(playerTabId);
      const targetWindowId = sourceWindowId ?? existingTab.windowId;
      const moveProperties = { windowId: targetWindowId };

      if (typeof sourceIndex === "number") {
        moveProperties.index = sourceIndex + 1;
      }

      await chrome.tabs.move(playerTabId, moveProperties);
      await chrome.tabs.update(playerTabId, { url, active: false });
      return;
    } catch (error) {
      playerTabId = null;
    }
  }

  const createdTab = await chrome.tabs.create({
    url,
    active: false,
    windowId: sourceWindowId ?? undefined,
    index: typeof sourceIndex === "number" ? sourceIndex + 1 : undefined
  });

  playerTabId = createdTab.id ?? null;
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
  }
}
