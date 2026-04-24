const titleNode = document.getElementById("player-title");
const statusNode = document.getElementById("player-status");
const frame = document.getElementById("player-frame");

const params = new URLSearchParams(window.location.search);
const videoId = params.get("videoId");

if (!videoId) {
  titleNode.textContent = "Missing video";
  statusNode.textContent = "Open LeetNoise and select a saved YouTube video.";
} else {
  titleNode.textContent = "Now playing";
  statusNode.textContent = "Audio was opened by LeetNoise from your saved default.";
  frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&controls=1&rel=0`;
}
