const screens = {
  title: document.querySelector("#title-screen"),
  intro: document.querySelector("#intro-screen"),
  game: document.querySelector("#game-screen"),
  arrival: document.querySelector("#arrival-screen"),
  ending: document.querySelector("#ending-screen"),
  collection: document.querySelector("#collection-screen"),
};

const gameShell = document.querySelector("#game-shell");
const soundToggle = document.querySelector("#sound-toggle");
const backgroundMusic = document.querySelector("#background-music");
const player = document.querySelector("#player");
const itemsLayer = document.querySelector("#items-layer");
const trailLayer = document.querySelector("#trail-layer");
const obstaclesLayer = document.querySelector("#obstacles-layer");
const collectionCount = document.querySelector("#collection-count");
const progressFill = document.querySelector("#progress-fill");
const timeLeft = document.querySelector("#time-left");
const flightStatus = document.querySelector("#flight-status");
const mobileControlButtons = document.querySelectorAll(".mobile-control-button");
const memoryCard = document.querySelector("#memory-card");
const memoryImage = document.querySelector("#memory-image");
const memoryTitle = document.querySelector("#memory-title");
const memoryMessage = document.querySelector("#memory-message");
const arrivalSummary = document.querySelector("#arrival-summary");
const collectionGrid = document.querySelector("#collection-grid");
const collectionSummary = document.querySelector("#collection-summary");

const GAME_DURATION = 55000;
const PLAYER_STEP = 48;
const MOBILE_BUTTON_SPEED = 42;
const TRAIL_INTERVAL_MS = 95;
const MOBILE_TRAIL_INTERVAL_MS = 170;
const MAX_TRAIL_PARTICLES = 28;
const MAX_MOBILE_TRAIL_PARTICLES = 14;
const coarsePointerQuery = window.matchMedia("(pointer: coarse)");
let soundIsOn = true;
let activeScreen = "title";
let playerY = 48;
let mobileMoveDirection = 0;
let collectedCount = 0;
let startTime = 0;
let animationFrame = 0;
let memoryTimer = 0;
let statusTimer = 0;
let lastFrameTime = 0;
let elapsedGameTime = 0;
let slowdownUntil = 0;
let lastTrailTime = 0;
let currentRunItems = [];
const collectedItemIds = new Set();

const collectionItems = [
  {
    id: "futsal",
    title: "Futsal Days",
    message: "Let’s play again someday.",
    image: "futsal-v2.png",
    y: 32,
    at: 0.05,
  },
  {
    id: "futsal-friends",
    title: "Futsal Friends",
    message: "Same court, same friends, next time too.",
    image: "futsal-friends.jpg",
    y: 62,
    at: 0.12,
  },
  {
    id: "friends-at-tonteki",
    title: "Way & Jack",
    message: "Thank you for every story we shared.",
    image: "way-v2.jpg",
    y: 31,
    at: 0.19,
  },
  {
    id: "nemoto",
    title: "Nemoto",
    message: "Good times always begin at the counter.",
    image: "nemoto-v2.jpg",
    y: 65,
    at: 0.26,
  },
  {
    id: "momo-ririka",
    title: "Momo, Ririka & Jack",
    message: "You always made the night brighter.",
    image: "momo-ririka.jpg",
    y: 36,
    at: 0.33,
  },
  {
    id: "beer",
    title: "One More Cheers",
    message: "Here’s to the next time we meet.",
    image: "beer.jpg",
    y: 67,
    at: 0.4,
  },
  {
    id: "megu-nao",
    title: "Megusan & Naosan",
    message: "Thanks for making every night memorable.",
    image: "megu-nao-v2.jpg",
    y: 29,
    at: 0.47,
  },
  {
    id: "tonteki-family",
    title: "Our Tonteki Family",
    message: "No matter the distance, you’re part of the family.",
    image: "group.jpg",
    y: 60,
    at: 0.54,
  },
  {
    id: "momo-miyamoto",
    title: "Momo & Miyamoto",
    message: "Here’s to more laughter together.",
    image: "momo-miyamoto-v2.jpg",
    y: 34,
    at: 0.61,
  },
  {
    id: "tonteki",
    title: "Tonteki",
    message: "The taste of a place that feels like home.",
    image: "tonteki.jpeg",
    y: 65,
    at: 0.68,
  },
  {
    id: "lantern",
    title: "The Tonteki Lantern",
    message: "A warm light will always be waiting.",
    image: "lantern-v2.jpg",
    y: 30,
    at: 0.76,
  },
  {
    id: "tonteki-kitchen",
    title: "The Tonteki Kitchen",
    message: "Where so many good nights began.",
    image: "frying-pans-v2.jpg",
    y: 58,
    at: 0.85,
  },
];

const obstacleClouds = [
  { id: "cloud-1", y: 48, at: 0.16, size: 1 },
  { id: "cloud-2", y: 25, at: 0.3, size: 0.82 },
  { id: "cloud-3", y: 69, at: 0.43, size: 1.08 },
  { id: "cloud-4", y: 43, at: 0.58, size: 0.9 },
  { id: "cloud-5", y: 65, at: 0.72, size: 0.86 },
  { id: "cloud-6", y: 28, at: 0.84, size: 1.04 },
];

const itemTimeSlots = [0.05, 0.12, 0.19, 0.26, 0.33, 0.4, 0.47, 0.54, 0.61, 0.68, 0.76, 0.85];

function preloadGameAssets() {
  const imageSources = new Set(collectionItems.map((item) => item.image));
  document.querySelectorAll("img[src]").forEach((image) => {
    if (image.getAttribute("src")) {
      imageSources.add(image.getAttribute("src"));
    }
  });

  imageSources.forEach((source) => {
    const image = new Image();
    image.decoding = "async";
    image.src = source;
  });
}

function showScreen(name) {
  Object.entries(screens).forEach(([screenName, screen]) => {
    screen.hidden = screenName !== name;
  });
  gameShell.classList.toggle("showing-ending", name === "ending" || name === "collection");
  activeScreen = name;
}

function createItems() {
  itemsLayer.replaceChildren();
  currentRunItems.forEach((item) => {
    const element = document.createElement("div");
    element.className = "collectible";
    element.dataset.id = item.id;
    element.style.setProperty("--item-y", `${item.y}%`);

    if (item.image) {
      const image = document.createElement("img");
      image.src = item.image;
      image.alt = item.title;
      image.decoding = "async";
      element.append(image);
    } else {
      const emoji = document.createElement("span");
      emoji.className = "emoji-item";
      emoji.textContent = item.emoji;
      emoji.setAttribute("aria-label", item.title);
      element.append(emoji);
    }

    itemsLayer.append(element);
  });
}

function createRandomItemLayout() {
  const shuffledItems = [...collectionItems];

  for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffledItems[index], shuffledItems[randomIndex]] = [shuffledItems[randomIndex], shuffledItems[index]];
  }

  currentRunItems = shuffledItems.map((item, index) => {
    const at = itemTimeSlots[index];
    const nearbyCloud = obstacleClouds.find((cloud) => Math.abs(cloud.at - at) < 0.045);
    let y = randomBetween(25, 69);

    if (nearbyCloud && Math.abs(nearbyCloud.y - y) < 20) {
      y = nearbyCloud.y > 47 ? randomBetween(24, 38) : randomBetween(57, 70);
    }

    return { ...item, at, y };
  });
}

function randomBetween(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

function createObstacles() {
  obstaclesLayer.replaceChildren();
  obstacleClouds.forEach((cloud) => {
    const element = document.createElement("div");
    element.className = "obstacle-cloud";
    element.dataset.id = cloud.id;
    element.style.setProperty("--cloud-y", `${cloud.y}%`);
    element.style.setProperty("--cloud-size", cloud.size);
    element.innerHTML = "<span></span><span></span><span></span>";
    obstaclesLayer.append(element);
  });
}

function startGame() {
  cancelAnimationFrame(animationFrame);
  clearTimeout(memoryTimer);
  clearTimeout(statusTimer);
  memoryCard.hidden = true;
  flightStatus.hidden = true;
  player.classList.remove("cloud-hit");
  collectedCount = 0;
  collectedItemIds.clear();
  mobileMoveDirection = 0;
  playerY = 48;
  elapsedGameTime = 0;
  slowdownUntil = 0;
  lastTrailTime = 0;
  player.style.top = `${playerY}%`;
  collectionCount.textContent = `0 / ${collectionItems.length}`;
  progressFill.style.width = "0%";
  timeLeft.textContent = "0:55";
  createRandomItemLayout();
  createItems();
  createObstacles();
  trailLayer.replaceChildren();
  showScreen("game");
  startTime = performance.now();
  lastFrameTime = startTime;
  animationFrame = requestAnimationFrame(updateGame);
}

function updateGame(now) {
  const delta = Math.min(now - lastFrameTime, 50);
  const speedMultiplier = now < slowdownUntil ? 0.42 : 1;
  elapsedGameTime += delta * speedMultiplier;
  lastFrameTime = now;

  const progress = Math.min(elapsedGameTime / GAME_DURATION, 1);
  const remainingSeconds = Math.max(0, Math.ceil((GAME_DURATION - elapsedGameTime) / 1000));
  const shellWidth = gameShell.clientWidth;

  progressFill.style.width = `${progress * 100}%`;
  timeLeft.textContent = `0:${String(remainingSeconds).padStart(2, "0")}`;
  updateMobileButtonFlight(delta);
  addTrailParticle(now);

  document.querySelectorAll(".collectible:not(.collected)").forEach((element) => {
    const item = currentRunItems.find((candidate) => candidate.id === element.dataset.id);
    const relativeProgress = (progress - item.at) / 0.16;
    const x = shellWidth * (1.12 - relativeProgress * 1.3);
    element.style.left = `${x}px`;

    if (relativeProgress >= 0 && relativeProgress <= 1.25 && elementsOverlap(player, element)) {
      collectItem(item, element);
    }
  });

  document.querySelectorAll(".obstacle-cloud:not(.passed)").forEach((element) => {
    const cloud = obstacleClouds.find((candidate) => candidate.id === element.dataset.id);
    const relativeProgress = (progress - cloud.at) / 0.13;
    const x = shellWidth * (1.15 - relativeProgress * 1.35);
    element.style.left = `${x}px`;

    if (!element.classList.contains("hit") && relativeProgress >= 0 && relativeProgress <= 1.2 && elementsOverlap(player, element, 32)) {
      hitCloud(element, now);
    }
    if (relativeProgress > 1.25) {
      element.classList.add("passed");
    }
  });

  if (progress >= 1) {
    finishGame();
    return;
  }

  animationFrame = requestAnimationFrame(updateGame);
}

function elementsOverlap(first, second, padding = 22) {
  const a = first.getBoundingClientRect();
  const b = second.getBoundingClientRect();
  return !(
    a.right - padding < b.left ||
    a.left + padding > b.right ||
    a.bottom - padding < b.top ||
    a.top + padding > b.bottom
  );
}

function collectItem(item, element) {
  element.classList.add("collected");
  collectedCount += 1;
  collectedItemIds.add(item.id);
  collectionCount.textContent = `${collectedCount} / ${collectionItems.length}`;
  showMemoryCard(item);
}

function addTrailParticle(now) {
  const isMobileLike = coarsePointerQuery.matches;
  const interval = isMobileLike ? MOBILE_TRAIL_INTERVAL_MS : TRAIL_INTERVAL_MS;
  if (now - lastTrailTime < interval) return;
  lastTrailTime = now;
  const playerBounds = player.getBoundingClientRect();
  const gameBounds = screens.game.getBoundingClientRect();
  const particle = document.createElement("span");
  particle.className = "trail-particle";
  particle.style.left = `${playerBounds.left - gameBounds.left + 20}px`;
  particle.style.top = `${playerBounds.top - gameBounds.top + playerBounds.height * 0.58}px`;
  particle.style.setProperty("--trail-drift", `${Math.random() * 18 - 9}px`);
  trailLayer.append(particle);
  const maxParticles = isMobileLike ? MAX_MOBILE_TRAIL_PARTICLES : MAX_TRAIL_PARTICLES;
  while (trailLayer.childElementCount > maxParticles) {
    trailLayer.firstElementChild?.remove();
  }
  setTimeout(() => particle.remove(), 1900);
}

function hitCloud(element, now) {
  element.classList.add("hit");
  slowdownUntil = Math.max(slowdownUntil, now + 1600);
  player.classList.remove("cloud-hit");
  void player.offsetWidth;
  player.classList.add("cloud-hit");
  flightStatus.hidden = false;
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    flightStatus.hidden = true;
    player.classList.remove("cloud-hit");
  }, 1600);
}

function showMemoryCard(item) {
  clearTimeout(memoryTimer);
  memoryTitle.textContent = item.title;
  memoryMessage.textContent = item.message;
  memoryImage.src = item.image || "";
  memoryImage.alt = item.image ? item.title : "";
  memoryImage.hidden = !item.image;
  memoryCard.hidden = false;
  memoryTimer = setTimeout(() => {
    memoryCard.hidden = true;
  }, 1800);
}

function movePlayer(nextY) {
  if (activeScreen !== "game") return;
  playerY = Math.max(18, Math.min(76, nextY));
  player.style.top = `${playerY}%`;
}

function updateMobileButtonFlight(delta) {
  if (mobileMoveDirection === 0) return;
  const seconds = delta / 1000;
  movePlayer(playerY + mobileMoveDirection * MOBILE_BUTTON_SPEED * seconds);
}

function finishGame() {
  cancelAnimationFrame(animationFrame);
  memoryCard.hidden = true;
  flightStatus.hidden = true;
  mobileMoveDirection = 0;
  arrivalSummary.textContent = `You brought ${collectedCount} of ${collectionItems.length} memories home.`;
  showScreen("arrival");
}

function showCollection() {
  collectionGrid.replaceChildren();
  const collectedItems = collectionItems.filter((item) => collectedItemIds.has(item.id));
  collectionSummary.textContent = `You collected ${collectedItems.length} of ${collectionItems.length} memories.`;

  if (collectedItems.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "collection-empty";
    emptyMessage.textContent = "No memories collected this time. Let’s fly again!";
    collectionGrid.append(emptyMessage);
  }

  collectedItems.forEach((item) => {
    const card = document.createElement("article");
    card.className = "collection-card";

    const image = document.createElement("img");
    image.src = item.image;
    image.alt = item.title;

    const copy = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = item.title;
    const message = document.createElement("p");
    message.textContent = item.message;

    copy.append(title, message);
    card.append(image, copy);
    collectionGrid.append(card);
  });

  showScreen("collection");
}

function playBackgroundMusic() {
  if (!soundIsOn) return;
  backgroundMusic.volume = 0.42;
  backgroundMusic.play().catch(() => {
    // Some browsers wait for another user action before starting audio.
  });
}

function toggleSound() {
  soundIsOn = !soundIsOn;
  soundToggle.textContent = `Sound: ${soundIsOn ? "On" : "Off"}`;
  soundToggle.setAttribute("aria-pressed", String(soundIsOn));
  if (soundIsOn) {
    playBackgroundMusic();
  } else {
    backgroundMusic.pause();
  }
}

document.querySelector("#start-button").addEventListener("click", () => {
  preloadGameAssets();
  playBackgroundMusic();
  showScreen("intro");
});
document.querySelector("#takeoff-button").addEventListener("click", () => {
  preloadGameAssets();
  startGame();
});
document.querySelector("#ending-button").addEventListener("click", () => showScreen("ending"));
document.querySelector("#collection-button").addEventListener("click", showCollection);
document.querySelector("#play-again-button").addEventListener("click", () => showScreen("intro"));
document.querySelectorAll(".back-title-button").forEach((button) => {
  button.addEventListener("click", () => showScreen("title"));
});
soundToggle.addEventListener("click", toggleSound);

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowUp") {
    event.preventDefault();
    movePlayer(playerY - PLAYER_STEP / 10);
  }
  if (event.key === "ArrowDown") {
    event.preventDefault();
    movePlayer(playerY + PLAYER_STEP / 10);
  }
});

mobileControlButtons.forEach((button) => {
  const direction = button.dataset.direction === "up" ? -1 : 1;

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    mobileMoveDirection = direction;
    movePlayer(playerY + direction * (PLAYER_STEP / 10));
    button.setPointerCapture?.(event.pointerId);
  });

  ["pointerup", "pointercancel", "lostpointercapture", "pointerleave"].forEach((eventName) => {
    button.addEventListener(eventName, () => {
      mobileMoveDirection = 0;
    });
  });
});

window.untilNextTime = {
  collectionItems,
  currentRunItems: () => currentRunItems,
  finishGame,
  preloadGameAssets,
  startGame,
};

if ("requestIdleCallback" in window) {
  requestIdleCallback(preloadGameAssets, { timeout: 2500 });
} else {
  setTimeout(preloadGameAssets, 1200);
}
