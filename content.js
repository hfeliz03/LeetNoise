const START_PATTERNS = ["start timer", "start stopwatch"];
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

document.addEventListener("click", async (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) {
    return;
  }

  const action = findTimerAction(target);
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
      type: action.type === "start" ? "PLAY_DEFAULT_VIDEO" : "STOP_PLAYBACK"
    });
  } catch (error) {
    console.debug("LeetNoise failed to handle timer action", error);
  }
}, true);

function findTimerAction(startNode) {
  const candidates = [startNode, startNode.closest("button"), startNode.closest("[role='button']")].filter(Boolean);

  for (const candidate of candidates) {
    if (!(candidate instanceof Element)) {
      continue;
    }

    const combinedText = normalizeText([
      candidate.textContent,
      candidate.getAttribute("aria-label"),
      candidate.getAttribute("title"),
      candidate.getAttribute("data-e2e-locator")
    ].filter(Boolean).join(" "));

    if (START_PATTERNS.some((pattern) => combinedText.includes(pattern))) {
      return { type: "start", label: combinedText };
    }

    if (STOP_PATTERNS.some((pattern) => combinedText.includes(pattern))) {
      return { type: "stop", label: combinedText };
    }
  }

  return null;
}

function normalizeText(value) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}
