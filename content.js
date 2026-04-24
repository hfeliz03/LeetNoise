const TIMER_LABELS = ["timer", "time", "chronometer", "countdown"];

let lastTriggerAt = 0;

document.addEventListener("click", async (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) {
    return;
  }

  const trigger = findTimerTrigger(target);
  if (!trigger) {
    return;
  }

  const now = Date.now();
  if (now - lastTriggerAt < 1500) {
    return;
  }
  lastTriggerAt = now;

  try {
    await chrome.runtime.sendMessage({ type: "PLAY_DEFAULT_VIDEO" });
  } catch (error) {
    console.debug("LeetNoise failed to trigger playback", error);
  }
}, true);

function findTimerTrigger(startNode) {
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

    if (TIMER_LABELS.some((label) => combinedText.includes(label))) {
      return candidate;
    }
  }

  return null;
}

function normalizeText(value) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}
