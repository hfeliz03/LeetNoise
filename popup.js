const MAX_VIDEOS = 6;

const videoNameInput = document.getElementById("video-name");
const videoUrlInput = document.getElementById("video-url");
const saveVideoButton = document.getElementById("save-video");
const formMessage = document.getElementById("form-message");
const autoPlayToggle = document.getElementById("auto-play-toggle");
const stopPlaybackButton = document.getElementById("stop-playback");
const videoList = document.getElementById("video-list");

let state = {
  videos: [],
  defaultVideoId: null,
  autoPlayOnTimer: true
};

bootstrap().catch((error) => {
  setMessage(error.message);
});

saveVideoButton.addEventListener("click", async () => {
  try {
    const nextVideo = buildVideoRecord(videoNameInput.value, videoUrlInput.value);

    if (state.videos.length >= MAX_VIDEOS) {
      throw new Error("You can only save up to 6 videos.");
    }

    if (state.videos.some((video) => video.videoId === nextVideo.videoId)) {
      throw new Error("That video is already saved.");
    }

    const videos = [...state.videos, nextVideo];
    const defaultVideoId = state.defaultVideoId || nextVideo.id;

    await persistState({ videos, defaultVideoId });
    videoNameInput.value = "";
    videoUrlInput.value = "";
    setMessage("Video saved.", true);
  } catch (error) {
    setMessage(error.message);
  }
});

autoPlayToggle.addEventListener("change", async () => {
  await persistState({ autoPlayOnTimer: autoPlayToggle.checked });
  setMessage(autoPlayToggle.checked ? "Auto-play enabled." : "Auto-play disabled.", true);
});

stopPlaybackButton.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "STOP_PLAYBACK" });
  setMessage("Player stopped.", true);
});

videoList.addEventListener("click", async (event) => {
  const target = event.target instanceof HTMLElement ? event.target : null;
  if (!target) {
    return;
  }

  const action = target.dataset.action;
  const id = target.dataset.id;
  if (!action || !id) {
    return;
  }

  if (action === "default") {
    await persistState({ defaultVideoId: id });
    setMessage("Default updated.", true);
    return;
  }

  if (action === "play") {
    const match = state.videos.find((video) => video.id === id);
    if (!match) {
      return;
    }
    await chrome.runtime.sendMessage({ type: "PLAY_VIDEO_BY_ID", videoId: match.videoId });
    setMessage(`Playing ${match.name}.`, true);
    return;
  }

  if (action === "delete") {
    const videos = state.videos.filter((video) => video.id !== id);
    const defaultVideoId = state.defaultVideoId === id ? videos[0]?.id ?? null : state.defaultVideoId;
    await persistState({ videos, defaultVideoId });
    setMessage("Video removed.", true);
  }
});

async function bootstrap() {
  const stored = await chrome.storage.sync.get(["videos", "defaultVideoId", "autoPlayOnTimer"]);
  state = {
    videos: Array.isArray(stored.videos) ? stored.videos : [],
    defaultVideoId: stored.defaultVideoId || null,
    autoPlayOnTimer: stored.autoPlayOnTimer !== false
  };
  autoPlayToggle.checked = state.autoPlayOnTimer;
  render();
}

async function persistState(partialState) {
  state = { ...state, ...partialState };
  await chrome.storage.sync.set(partialState);
  render();
}

function render() {
  videoList.innerHTML = "";

  for (const video of state.videos) {
    const item = document.createElement("li");
    item.className = "video-item";

    const isDefault = video.id === state.defaultVideoId;
    const sourceLabel = video.sourceUrl.replace(/^https?:\/\//, "");

    item.innerHTML = `
      <div class="video-row">
        <div>
          <div class="video-title">${escapeHtml(video.name)}</div>
          <div class="video-meta">${escapeHtml(sourceLabel)}</div>
        </div>
        ${isDefault ? '<span class="default-pill">Default</span>' : ""}
      </div>
      <div class="video-actions">
        <button data-action="play" data-id="${video.id}">Play</button>
        <button data-action="default" data-id="${video.id}">${isDefault ? "Selected" : "Make default"}</button>
        <button data-action="delete" data-id="${video.id}">Delete</button>
      </div>
    `;

    videoList.appendChild(item);
  }
}

function buildVideoRecord(name, sourceUrl) {
  const trimmedName = name.trim();
  const trimmedUrl = sourceUrl.trim();

  if (!trimmedName) {
    throw new Error("Enter a name for the video.");
  }

  const videoId = parseYouTubeVideoId(trimmedUrl);
  if (!videoId) {
    throw new Error("Enter a valid YouTube video URL.");
  }

  return {
    id: crypto.randomUUID(),
    name: trimmedName,
    sourceUrl: trimmedUrl,
    videoId,
    createdAt: Date.now()
  };
}

function parseYouTubeVideoId(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      return parsed.searchParams.get("v");
    }

    if (host === "youtu.be") {
      return parsed.pathname.slice(1) || null;
    }

    return null;
  } catch (error) {
    return null;
  }
}

function setMessage(message, isSuccess = false) {
  formMessage.textContent = message;
  formMessage.className = isSuccess ? "message success" : "message";
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
