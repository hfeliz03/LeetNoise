const CELEBRATION_SOUND_FILES = {
  "tada": "tada.mp3",
  "fanfare": "fanfare.mp3",
  "fireworks": "fireworks.mp3",
  "crowd-cheer": "crowd-cheer.mp3",
  "big-cheers": "big-cheers.mp3",
  "victory": "victory.mp3",
  "wow": "wow.mp3",
  "correct": "correct.mp3",
  "level-up": "level-up.mp3",
  "level-up-bells": "level-up-bells.mp3"
};

const DEFAULT_CELEBRATION_SOUND_ID = "tada";
const CELEBRATION_MAX_DURATION_MS = 5000;

const ACTION_DEFINITIONS = [
  { type: "start", labels: ["start timer", "start stopwatch", "start"], requiresTimerContext: true },
  { type: "resume", labels: ["resume timer", "resume stopwatch", "resume"], requiresTimerContext: true },
  { type: "pause", labels: ["pause timer", "pause stopwatch", "pause"], requiresTimerContext: true },
  {
    type: "stop",
    labels: [
      "end timer",
      "stop timer",
      "end stopwatch",
      "stop stopwatch",
      "stop",
      "end"
    ],
    requiresTimerContext: true
  },
  {
    type: "reset",
    labels: ["reset timer", "reset stopwatch", "reset"],
    requiresTimerContext: true
  }
];

const POST_SUBMIT_MIN_WAIT_MS = 1000;

let lastActionKey = "";
let lastActionAt = 0;
let lastAcceptedSignalAt = 0;
let submitPending = false;
let submitClickedAt = 0;
let lastObservedPath = window.location.pathname;

document.addEventListener("click", handleInteraction, true);
document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    void handleInteraction(event);
  }
}, true);
observeAcceptedSubmissions();
installRouteObservers();
queueAcceptedSubmissionCheck();

async function handleInteraction(event) {
  const submitIntent = findSubmitIntent(event);
  if (submitIntent) {
    submitPending = true;
    submitClickedAt = Date.now();
    setTimeout(queueAcceptedSubmissionCheck, POST_SUBMIT_MIN_WAIT_MS + 50);
  }

  const action = findTimerAction(event);
  if (!action) {
    return;
  }

  const now = Date.now();
  const actionKey = `${action.type}:${action.label}`;
  if (actionKey === lastActionKey && now - lastActionAt < 1500) {
    return;
  }
  lastActionKey = actionKey;
  lastActionAt = now;

  try {
    const messageType = mapActionToMessage(action.type);
    if (messageType === null) {
      return;
    }

    await chrome.runtime.sendMessage({
      type: messageType
    });
  } catch (error) {
    console.debug("LeetNoise failed to handle timer action", error);
  }
}

function findTimerAction(event) {
  const candidates = collectCandidates(event);

  for (const candidate of candidates) {
    const labels = extractCandidateLabels(candidate);
    if (labels.length === 0) {
      continue;
    }

    for (const action of ACTION_DEFINITIONS) {
      const matchedLabel = labels.find((label) => action.labels.includes(label));
      if (!matchedLabel) {
        continue;
      }

      if (action.requiresTimerContext && !hasTimerContext(candidate)) {
        continue;
      }

      return { type: action.type, label: matchedLabel };
    }
  }

  return null;
}

function collectCandidates(event) {
  const elements = [];
  const seen = new Set();
  const path = typeof event.composedPath === "function" ? event.composedPath() : [];

  for (const item of path) {
    if (!(item instanceof Element)) {
      continue;
    }

    addInteractiveCandidate(item, elements, seen);
    addInteractiveCandidate(item.closest("button"), elements, seen);
    addInteractiveCandidate(item.closest("[role='button']"), elements, seen);
  }

  const target = event.target instanceof Element ? event.target : null;
  if (target) {
    addInteractiveCandidate(target, elements, seen);
    addInteractiveCandidate(target.closest("button"), elements, seen);
    addInteractiveCandidate(target.closest("[role='button']"), elements, seen);
  }

  return elements;
}

function addInteractiveCandidate(element, elements, seen) {
  if (!(element instanceof Element) || seen.has(element)) {
    return;
  }

  if (!isInteractiveElement(element)) {
    return;
  }

  seen.add(element);
  elements.push(element);
}

function isInteractiveElement(element) {
  const tagName = element.tagName.toLowerCase();
  return tagName === "button" || element.getAttribute("role") === "button";
}

function extractCandidateLabels(candidate) {
  const rawValues = [
    candidate.getAttribute("aria-label"),
    candidate.getAttribute("title"),
    candidate.getAttribute("data-e2e-locator"),
    candidate.textContent
  ].filter(Boolean);

  const labels = new Set();

  for (const value of rawValues) {
    const normalized = normalizeText(value);
    if (!normalized) {
      continue;
    }

    labels.add(normalized);

    for (const line of normalized.split("\n")) {
      const trimmedLine = normalizeText(line);
      if (trimmedLine) {
        labels.add(trimmedLine);
      }
    }
  }

  return [...labels];
}

function hasTimerContext(element) {
  let current = element;
  let depth = 0;

  while (current && depth < 5) {
    const contextText = normalizeText([
      current.textContent,
      current.getAttribute("aria-label"),
      current.getAttribute("title")
    ].filter(Boolean).join(" "));

    if (/(timer|stopwatch|\b\d{1,2}:\d{2}:\d{2}\b|\bhr\b|\bmin\b)/.test(contextText)) {
      return true;
    }

    current = current.parentElement;
    depth += 1;
  }

  return false;
}

function normalizeText(value) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function mapActionToMessage(actionType) {
  if (actionType === "start") {
    return "START_DEFAULT_VIDEO";
  }

  if (actionType === "resume") {
    return "RESUME_PLAYBACK";
  }

  if (actionType === "pause") {
    return "PAUSE_PLAYBACK";
  }

  if (actionType === "reset") {
    return null;
  }

  return "STOP_PLAYBACK";
}

function findSubmitIntent(event) {
  const candidates = collectCandidates(event);

  for (const candidate of candidates) {
    const labels = extractCandidateLabels(candidate);
    if (labels.includes("submit")) {
      return true;
    }
  }

  return false;
}

function observeAcceptedSubmissions() {
  const observer = new MutationObserver(() => {
    if (window.location.pathname !== lastObservedPath) {
      lastObservedPath = window.location.pathname;
      queueAcceptedSubmissionCheck();
    }

    queueAcceptedSubmissionCheck();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

function installRouteObservers() {
  const originalPushState = history.pushState.bind(history);
  const originalReplaceState = history.replaceState.bind(history);

  history.pushState = function (...args) {
    const result = originalPushState(...args);
    handleRouteChange();
    return result;
  };

  history.replaceState = function (...args) {
    const result = originalReplaceState(...args);
    handleRouteChange();
    return result;
  };

  window.addEventListener("popstate", handleRouteChange);
}

function handleRouteChange() {
  if (window.location.pathname === lastObservedPath) {
    queueAcceptedSubmissionCheck();
    return;
  }

  lastObservedPath = window.location.pathname;
  queueAcceptedSubmissionCheck();
}

function queueAcceptedSubmissionCheck() {
  requestAnimationFrame(() => {
    void maybeStopForAcceptedSubmission();
  });
}

async function maybeStopForAcceptedSubmission() {
  if (!submitPending) {
    return;
  }

  const now = Date.now();
  // Require a brief gap so the previous run's "Accepted" text has cleared
  // before we accept it as the new result.
  if (now - submitClickedAt < POST_SUBMIT_MIN_WAIT_MS) {
    return;
  }

  if (!hasAcceptedSubmissionSignal()) {
    return;
  }

  if (now - lastAcceptedSignalAt < 3000) {
    return;
  }
  lastAcceptedSignalAt = now;
  submitPending = false;

  console.info("LeetNoise: accepted submission detected, attempting to pause player");

  await pauseOrStopPlayer();
  await playCelebrationSound();
}

async function pauseOrStopPlayer() {
  try {
    const response = await chrome.runtime.sendMessage({ type: "PAUSE_PLAYBACK" });
    const paused = response && response.ok === true && response.controlled === true;
    if (paused) {
      console.info("LeetNoise: paused YouTube player");
      return;
    }

    console.info("LeetNoise: pause did not take effect, closing player instead", response);
    await chrome.runtime.sendMessage({ type: "STOP_PLAYBACK" });
  } catch (error) {
    console.debug("LeetNoise failed to pause after accepted submission", error);
    try {
      await chrome.runtime.sendMessage({ type: "STOP_PLAYBACK" });
    } catch (closeError) {
      console.debug("LeetNoise failed to close after accepted submission", closeError);
    }
  }
}

async function playCelebrationSound() {
  try {
    const stored = await chrome.storage.sync.get(["celebrationSoundId"]);
    const id = stored.celebrationSoundId || DEFAULT_CELEBRATION_SOUND_ID;
    if (id === "off") {
      return;
    }
    const file = CELEBRATION_SOUND_FILES[id];
    if (!file) {
      return;
    }
    const audio = new Audio(chrome.runtime.getURL(`assets/sounds/${file}`));
    audio.volume = 0.7;
    await audio.play();
    setTimeout(() => audio.pause(), CELEBRATION_MAX_DURATION_MS);
  } catch (error) {
    console.debug("LeetNoise failed to play celebration sound", error);
  }
}

function hasAcceptedSubmissionSignal() {
  for (const element of document.querySelectorAll("[data-e2e-locator='submission-result']")) {
    const text = normalizeText(element.textContent || "");
    if (text.includes("accepted")) {
      return true;
    }
  }

  const selectors = [
    "[role='dialog']",
    "[class*='submission']",
    "[class*='result']"
  ];

  for (const selector of selectors) {
    for (const element of document.querySelectorAll(selector)) {
      const text = normalizeText(element.textContent || "");
      if (isAcceptedSubmissionText(text)) {
        return true;
      }
    }
  }
  return false;
}

function isAcceptedSubmissionText(text) {
  if (!text) {
    return false;
  }

  return (
    text.includes("accepted") &&
    (
      text.includes("testcases passed") ||
      text.includes("submitted at") ||
      text.includes("runtime beats") ||
      text.includes("memory beats")
    )
  );
}

