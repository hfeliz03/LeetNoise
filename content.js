const START_PATTERNS = ["start timer", "start stopwatch"];
const RESUME_PATTERNS = ["resume timer", "resume stopwatch"];
const PAUSE_PATTERNS = ["pause timer", "pause stopwatch"];
const STOP_PATTERNS = [
  "end timer",
  "stop timer",
  "reset timer",
  "end stopwatch",
  "stop stopwatch",
  "reset stopwatch"
];

let lastActionKey = "";
let lastActionAt = 0;

document.addEventListener("click", handleInteraction, true);
document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    void handleInteraction(event);
  }
}, true);

async function handleInteraction(event) {
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
    await chrome.runtime.sendMessage({
      type: mapActionToMessage(action.type)
    });
  } catch (error) {
    console.debug("LeetNoise failed to handle timer action", error);
  }
}

function findTimerAction(event) {
  const candidates = collectCandidates(event);

  for (const candidate of candidates) {
    const combinedText = normalizeText([
      candidate.textContent,
      candidate.getAttribute("aria-label"),
      candidate.getAttribute("title"),
      candidate.getAttribute("data-e2e-locator")
    ].filter(Boolean).join(" "));

    if (!combinedText) {
      continue;
    }

    if (START_PATTERNS.some((pattern) => combinedText.includes(pattern))) {
      return { type: "start", label: combinedText };
    }

    if (RESUME_PATTERNS.some((pattern) => combinedText.includes(pattern))) {
      return { type: "resume", label: combinedText };
    }

    if (PAUSE_PATTERNS.some((pattern) => combinedText.includes(pattern))) {
      return { type: "pause", label: combinedText };
    }

    if (STOP_PATTERNS.some((pattern) => combinedText.includes(pattern))) {
      return { type: "stop", label: combinedText };
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

    addCandidate(item, elements, seen);
    addCandidate(item.closest("button"), elements, seen);
    addCandidate(item.closest("[role='button']"), elements, seen);

    let parent = item.parentElement;
    let depth = 0;
    while (parent && depth < 4) {
      addCandidate(parent, elements, seen);
      parent = parent.parentElement;
      depth += 1;
    }
  }

  const target = event.target instanceof Element ? event.target : null;
  if (target) {
    addCandidate(target, elements, seen);
    addCandidate(target.closest("button"), elements, seen);
    addCandidate(target.closest("[role='button']"), elements, seen);
  }

  return elements;
}

function addCandidate(element, elements, seen) {
  if (!(element instanceof Element) || seen.has(element)) {
    return;
  }

  seen.add(element);
  elements.push(element);
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

  return "STOP_PLAYBACK";
}
