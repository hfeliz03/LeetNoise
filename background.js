let playerTabId = null;
let playerVideoId = null;
const LEETNOISE_MARKER_KEY = "leetnoise";
const LEETNOISE_MARKER_VALUE = "1";
const SESSION_KEYS = {
  playerTabId: "playerTabId",
  playerVideoId: "playerVideoId"
};

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

  if (message.type === "START_DEFAULT_VIDEO") {
    void handleStartDefaultVideo(sendResponse, sender);
    return true;
  }

  if (message.type === "PLAY_VIDEO_BY_ID") {
    void startPlayback(message.videoId, sender).then(() => {
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

  if (message.type === "PAUSE_PLAYBACK") {
    void controlPlayback("pause").then((result) => {
      sendResponse({ ok: true, controlled: result.controlled, reason: result.reason });
    }).catch((error) => {
      sendResponse({ ok: false, controlled: false, error: error.message });
    });
    return true;
  }

  if (message.type === "RESUME_PLAYBACK") {
    void controlPlayback("play").then((result) => {
      sendResponse({ ok: true, controlled: result.controlled, reason: result.reason });
    }).catch((error) => {
      sendResponse({ ok: false, controlled: false, error: error.message });
    });
    return true;
  }

  return false;
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === playerTabId) {
    void clearPlayerSession();
  }
});

async function handleStartDefaultVideo(sendResponse, sender) {
  try {
    await reconcileOwnedTabs();
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

    await startPlayback(selectedVideoId, sender);
    sendResponse({ ok: true, videoId: selectedVideoId });
  } catch (error) {
    sendResponse({ ok: false, error: error.message });
  }
}

async function startPlayback(videoId, sender) {
  await reconcileOwnedTabs();
  const url = buildWatchUrl(videoId);
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

      if (playerVideoId === videoId) {
        await controlPlayback("play");
        return;
      }

      await chrome.tabs.update(playerTabId, { url, active: false });
      await updatePlayerSession(playerTabId, videoId);
      return;
    } catch (error) {
      await clearPlayerSession();
    }
  }

  const createdTab = await chrome.tabs.create({
    url,
    active: false,
    windowId: sourceWindowId ?? undefined,
    index: typeof sourceIndex === "number" ? sourceIndex + 1 : undefined
  });

  await updatePlayerSession(createdTab.id ?? null, videoId);
}

function buildWatchUrl(videoId) {
  const params = new URLSearchParams({
    v: videoId,
    autoplay: "1",
    [LEETNOISE_MARKER_KEY]: LEETNOISE_MARKER_VALUE
  });

  return `https://www.youtube.com/watch?${params.toString()}`;
}

async function getStatus() {
  await reconcileOwnedTabs();
  const { videos, defaultVideoId, autoPlayOnTimer } = await chrome.storage.sync.get([
    "videos",
    "defaultVideoId",
    "autoPlayOnTimer"
  ]);

  return {
    hasVideos: Array.isArray(videos) && videos.length > 0,
    defaultVideoId: defaultVideoId || null,
    autoPlayOnTimer: autoPlayOnTimer !== false,
    playerOpen: playerTabId !== null,
    playerVideoId
  };
}

async function controlPlayback(command) {
  await reconcileOwnedTabs();
  if (playerTabId === null) {
    return { controlled: false, reason: "no-player-tab" };
  }

  try {
    await waitForTabReady(playerTabId);
    const response = await sendToYouTubeTab(playerTabId, {
      type: "CONTROL_YOUTUBE_PLAYBACK",
      command
    });
    return { controlled: response?.ok === true, reason: response?.ok ? "ok" : "controller-reported-failure" };
  } catch (error) {
    throw new Error("Unable to control the YouTube tab.");
  }
}

async function sendToYouTubeTab(tabId, message) {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch (initialError) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["youtube-controller.js"]
      });
    } catch (injectError) {
      throw initialError;
    }
    return await chrome.tabs.sendMessage(tabId, message);
  }
}

async function waitForTabReady(tabId) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const tab = await chrome.tabs.get(tabId);
    if (tab.status === "complete") {
      return;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 150);
    });
  }
}

async function stopPlayback() {
  await reconcileOwnedTabs();
  if (playerTabId === null) {
    return;
  }

  try {
    await chrome.tabs.remove(playerTabId);
  } finally {
    await clearPlayerSession();
  }
}

async function reconcileOwnedTabs() {
  await loadPlayerSession();
  const ownedTabs = await findOwnedTabs();

  if (ownedTabs.length === 0) {
    await clearPlayerSession();
    return;
  }

  const primaryTab = ownedTabs[0];
  const extraTabs = ownedTabs.slice(1);

  if (extraTabs.length > 0) {
    await chrome.tabs.remove(extraTabs.map((tab) => tab.id).filter((id) => typeof id === "number"));
  }

  await updatePlayerSession(primaryTab.id ?? null, extractVideoIdFromTab(primaryTab));
}

async function findOwnedTabs() {
  const youtubeTabs = await chrome.tabs.query({
    url: "https://www.youtube.com/*"
  });

  const ownedTabs = [];

  for (const tab of youtubeTabs) {
    if (typeof tab.id !== "number" || !tab.url) {
      continue;
    }

    const isOwned = await isOwnedPlayerTab(tab.id);
    if (isOwned) {
      ownedTabs.push(tab);
    }
  }

  return ownedTabs
    .sort((a, b) => {
      if (a.id === playerTabId) {
        return -1;
      }
      if (b.id === playerTabId) {
        return 1;
      }
      const aId = a.id ?? 0;
      const bId = b.id ?? 0;
      return aId - bId;
    });
}

async function isOwnedPlayerTab(tabId) {
  try {
    await waitForTabReady(tabId);
    const response = await sendToYouTubeTab(tabId, {
      type: "GET_LEETNOISE_OWNERSHIP"
    });
    return response?.owned === true;
  } catch (error) {
    return false;
  }
}

function extractVideoIdFromTab(tab) {
  if (!tab.url) {
    return null;
  }

  try {
    const parsed = new URL(tab.url);
    return parsed.searchParams.get("v");
  } catch (error) {
    return null;
  }
}

async function loadPlayerSession() {
  const stored = await chrome.storage.session.get([
    SESSION_KEYS.playerTabId,
    SESSION_KEYS.playerVideoId
  ]);

  playerTabId = typeof stored[SESSION_KEYS.playerTabId] === "number" ? stored[SESSION_KEYS.playerTabId] : null;
  playerVideoId = typeof stored[SESSION_KEYS.playerVideoId] === "string" ? stored[SESSION_KEYS.playerVideoId] : null;
}

async function updatePlayerSession(nextTabId, nextVideoId) {
  playerTabId = typeof nextTabId === "number" ? nextTabId : null;
  playerVideoId = typeof nextVideoId === "string" ? nextVideoId : null;

  await chrome.storage.session.set({
    [SESSION_KEYS.playerTabId]: playerTabId,
    [SESSION_KEYS.playerVideoId]: playerVideoId
  });
}

async function clearPlayerSession() {
  playerTabId = null;
  playerVideoId = null;
  await chrome.storage.session.remove([
    SESSION_KEYS.playerTabId,
    SESSION_KEYS.playerVideoId
  ]);
}
