const ACTION_DEFINITIONS = [
  { type: "start", labels: ["start timer", "start stopwatch"], requiresTimerContext: false },
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

let lastActionKey = "";
let lastActionAt = 0;
let lastAcceptedSignalAt = 0;

document.addEventListener("click", handleInteraction, true);
document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    void handleInteraction(event);
  }
}, true);
observeAcceptedSubmissions();

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

function observeAcceptedSubmissions() {
  const observer = new MutationObserver(() => {
    if (!hasAcceptedSubmissionSignal()) {
      return;
    }

    const now = Date.now();
    if (now - lastAcceptedSignalAt < 3000) {
      return;
    }
    lastAcceptedSignalAt = now;

    void chrome.runtime.sendMessage({ type: "STOP_PLAYBACK" }).catch((error) => {
      console.debug("LeetNoise failed to stop after accepted submission", error);
    });
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true
  });
}

function hasAcceptedSubmissionSignal() {
  const selectors = [
    "[data-e2e-locator='submission-result']",
    "[data-e2e-locator='console-result']",
    "[role='dialog']",
    "[class*='result']",
    "[class*='submission']"
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
    text.includes("accepted") ||
    text.includes("all test cases passed") ||
    text.includes("runtime beats") ||
    text.includes("memory beats")
  );
}
