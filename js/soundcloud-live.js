const SOUNDCLOUD_API_URL = "/api/soundcloud";
const SOUNDCLOUD_EVENTS_URL = "/api/soundcloud/events";
const SOUNDCLOUD_POLL_MS = 60000;

const numberFormatter = new Intl.NumberFormat("fr-FR");
const compactFormatter = new Intl.NumberFormat("fr-FR", {
  notation: "compact",
  maximumFractionDigits: 1
});

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) {
    return "date inconnue";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function formatYear(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : String(date.getFullYear());
}

function formatDuration(value) {
  return value || "0:00";
}

function formatPlays(value) {
  return `${numberFormatter.format(value || 0)} plays`;
}

function formatCompact(value) {
  return compactFormatter.format(value || 0);
}

function hasNumericValue(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function soundCloudEmbedUrl(url) {
  const params = new URLSearchParams({
    url: String(url || ""),
    color: "#c7ced9",
    auto_play: "false",
    hide_related: "true",
    show_comments: "false",
    show_user: "true",
    show_reposts: "false",
    show_teaser: "false",
    visual: "false"
  });

  return `https://w.soundcloud.com/player/?${params.toString()}`;
}

function renderSoundCloudEmbed(item, label) {
  if (!item?.url) {
    return "";
  }

  return `
    <div class="soundcloud-embed">
      <iframe
        title="${escapeHtml(label)}"
        allow="autoplay"
        src="${escapeHtml(soundCloudEmbedUrl(item.url))}"
      ></iframe>
    </div>
  `;
}

function coverText(title) {
  const words = String(title || "dash")
    .replace(/[^\w\s.]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "D";
  }

  if (words.length === 1) {
    return words[0].slice(0, 4).toUpperCase();
  }

  return words.slice(0, 2).map((word) => word[0]).join("").toUpperCase();
}

const TRACK_CAROUSEL_PATTERNS = ["circles", "lines", "dots", "grid", "noise", "wave"];
const TRACK_CAROUSEL_MOBILE_QUERY = "(max-width: 760px)";
const TRACK_CAROUSEL_SWATCHES = [
  { bg: "#e8152a", accent: "#ff4d5e" },
  { bg: "#102947", accent: "#40d4ff" },
  { bg: "#f6b635", accent: "#161616" },
  { bg: "#8c4dff", accent: "#e1ff3b" },
  { bg: "#22b77a", accent: "#d9fff0" },
  { bg: "#f2eee7", accent: "#111111" },
  { bg: "#1b1f2a", accent: "#f5f7fb" },
  { bg: "#d55638", accent: "#ffe1c7" }
];

const trackCarouselState = {
  initialized: false,
  current: 0,
  animating: false,
  dragStartX: 0,
  dragDeltaX: 0,
  dragging: false,
  suppressCardClick: false,
  tracksKey: "",
  items: [],
  elements: null
};

function hashString(value) {
  let hash = 2166136261;
  const text = String(value || "");

  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function seededRandom(seed) {
  let state = seed;

  return function random() {
    state += 0x6D2B79F5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildNoisePattern(item) {
  const random = seededRandom(hashString(`${item.title}${item.bg}${item.accent}`));
  let rectangles = "";

  for (let i = 0; i < 42; i += 1) {
    const x = Math.floor(random() * 236);
    const y = Math.floor(random() * 236);
    const width = 2 + Math.floor(random() * 18);
    const height = 2 + Math.floor(random() * 18);
    const opacity = (0.08 + random() * 0.24).toFixed(2);

    rectangles += `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${item.accent}" opacity="${opacity}"/>`;
  }

  return rectangles;
}

function buildTrackPattern(item) {
  const accent = item.accent;
  const patterns = {
    circles: `
      <circle cx="78" cy="88" r="86" fill="${accent}" opacity=".46"/>
      <circle cx="178" cy="154" r="96" fill="${accent}" opacity=".24"/>
    `,
    lines: Array.from({ length: 6 }, (_, index) => {
      const offset = index * 46 - 88;
      return `<line x1="${offset}" y1="256" x2="${offset + 190}" y2="-16" stroke="${accent}" stroke-width="18" opacity=".42" stroke-linecap="round"/>`;
    }).join(""),
    dots: Array.from({ length: 36 }, (_, index) => {
      const x = 20 + (index % 6) * 40;
      const y = 20 + Math.floor(index / 6) * 40;
      return `<circle cx="${x}" cy="${y}" r="7" fill="${accent}" opacity=".48"/>`;
    }).join(""),
    grid: `
      <path d="M0 40H240M0 80H240M0 120H240M0 160H240M0 200H240M40 0V240M80 0V240M120 0V240M160 0V240M200 0V240" stroke="${accent}" stroke-width="3" opacity=".34"/>
    `,
    noise: buildNoisePattern(item),
    wave: `
      <path d="M-12 76Q42 18 96 76T204 76T312 76" fill="none" stroke="${accent}" stroke-width="22" opacity=".42" stroke-linecap="round"/>
      <path d="M-18 160Q42 102 102 160T222 160T342 160" fill="none" stroke="${accent}" stroke-width="18" opacity=".28" stroke-linecap="round"/>
    `
  };

  return patterns[item.pattern] || patterns.circles;
}

function buildTrackPatternDataUri(item) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">
      <rect width="240" height="240" fill="${item.bg}"/>
      ${buildTrackPattern(item)}
    </svg>
  `.replace(/\s{2,}/g, " ").trim();

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

function getTrackReleaseType(track) {
  const rawType = String(track?.album_type || track?.content_type || "").toLowerCase();

  if (rawType.includes("album")) {
    return "Album";
  }

  if (rawType.includes("ep") || rawType.includes("playlist")) {
    return "EP";
  }

  return "Single";
}

function buildTrackCarouselItem(track, index) {
  const hash = hashString(`${track?.id || ""}${track?.title || ""}${track?.url || ""}`);
  const swatch = TRACK_CAROUSEL_SWATCHES[hash % TRACK_CAROUSEL_SWATCHES.length];

  return {
    id: track?.id || track?.url || `${track?.title || "track"}-${index}`,
    title: track?.title || "track",
    type: getTrackReleaseType(track),
    bg: swatch.bg,
    accent: swatch.accent,
    pattern: TRACK_CAROUSEL_PATTERNS[(hash + index) % TRACK_CAROUSEL_PATTERNS.length],
    img: track?.artwork_url || "",
    track
  };
}

function getTrackCarouselElements() {
  const root = document.querySelector("[data-track-carousel]");

  if (!root) {
    return null;
  }

  return {
    root,
    deck: root.querySelector("[data-track-carousel-deck]"),
    cards: root.querySelector("[data-track-carousel-cards]"),
    dots: root.querySelector("[data-track-carousel-dots]"),
    prev: root.querySelector("[data-track-carousel-prev]"),
    next: root.querySelector("[data-track-carousel-next]"),
    title: root.querySelector("[data-track-carousel-title]"),
    type: root.querySelector("[data-track-carousel-type]"),
    player: root.querySelector("[data-track-carousel-player]")
  };
}

function normalizeTrackCarouselIndex(index) {
  const count = trackCarouselState.items.length;
  return count > 0 ? (index + count) % count : 0;
}

function getTrackRelativePosition(index) {
  const count = trackCarouselState.items.length;
  let pos = index - trackCarouselState.current;
  const half = count / 2;

  if (pos > half) {
    pos -= count;
  }

  if (pos < -half) {
    pos += count;
  }

  return pos;
}

function getTransform(pos) {
  const abs = Math.abs(pos);
  const cardSize = trackCarouselState.elements?.cards?.offsetWidth || 240;
  const spacing = cardSize >= 400 ? 118 : 68;
  const tx = pos * spacing;
  const tz = -abs * 55;
  const ry = pos * -14;
  const scale = Math.max(0, 1 - abs * 0.08);
  const opacity = Math.max(0, 1 - abs * 0.25);

  return {
    transform: `translateX(${tx}px) translateZ(${tz}px) rotateY(${ry}deg) scale(${scale})`,
    zIndex: 10 - abs,
    opacity
  };
}

function updateTrackCarouselPlayer(item) {
  const elements = trackCarouselState.elements;

  if (!elements?.player) {
    return;
  }

  if (!item?.track?.url) {
    elements.player.innerHTML = '<p class="track-carousel-empty">aucun lecteur disponible.</p>';
    return;
  }

  const publishedAt = item.track.published_at || item.track.reposted_at;
  const meta = [
    item.track.artist,
    formatDate(publishedAt),
    item.track.duration ? formatDuration(item.track.duration) : null,
    formatPlays(item.track.plays)
  ].filter(Boolean);

  elements.player.innerHTML = `
    <div class="track-carousel-player-head">
      <p>${escapeHtml(meta.join(" / "))}</p>
      <a href="${escapeHtml(item.track.url)}" target="_blank" rel="noopener noreferrer">ouvrir</a>
    </div>
    ${renderSoundCloudEmbed(item.track, `Lecteur audio - ${item.title}`)}
  `;
}

function updateTrackCarousel() {
  const elements = trackCarouselState.elements;
  const activeItem = trackCarouselState.items[trackCarouselState.current];

  if (!elements || !activeItem) {
    return;
  }

  elements.cards.querySelectorAll(".cover-card").forEach((card, index) => {
    const pos = getTrackRelativePosition(index);
    const abs = Math.abs(pos);
    const state = getTransform(pos);
    const visible = abs <= 2;

    card.style.transform = state.transform;
    card.style.zIndex = String(state.zIndex);
    card.style.opacity = visible ? String(state.opacity) : "0";
    card.style.filter = abs === 0 ? "saturate(1.06)" : "saturate(.82) brightness(.82)";
    card.style.pointerEvents = visible ? "auto" : "none";
    card.setAttribute("aria-hidden", visible ? "false" : "true");
    card.classList.toggle("is-active", index === trackCarouselState.current);
    card.classList.toggle("is-hidden", !visible);
  });

  elements.dots.querySelectorAll(".dot").forEach((dot, index) => {
    dot.classList.toggle("is-active", index === trackCarouselState.current);
    dot.setAttribute("aria-current", index === trackCarouselState.current ? "true" : "false");
  });

  elements.title.textContent = activeItem.title;
  elements.type.textContent = activeItem.type;
  updateTrackCarouselPlayer(activeItem);
}

function goToTrackCarousel(index) {
  const next = normalizeTrackCarouselIndex(index);

  if (trackCarouselState.animating || next === trackCarouselState.current) {
    return;
  }

  trackCarouselState.current = next;
  trackCarouselState.animating = true;
  updateTrackCarousel();

  window.setTimeout(() => {
    trackCarouselState.animating = false;
  }, 600);
}

function isTrackCarouselTextInput(target) {
  return target instanceof Element && Boolean(target.closest("input, textarea, select, [contenteditable]"));
}

function getClosestTrackCarouselElement(target, selector) {
  return target instanceof Element ? target.closest(selector) : null;
}

function handleTrackCarouselKeydown(event) {
  if (
    event.defaultPrevented ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    isTrackCarouselTextInput(event.target) ||
    trackCarouselState.items.length <= 1
  ) {
    return;
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    goToTrackCarousel(trackCarouselState.current - 1);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    goToTrackCarousel(trackCarouselState.current + 1);
  }
}

function canDragTrackCarousel(event) {
  return event.pointerType === "touch" && window.matchMedia(TRACK_CAROUSEL_MOBILE_QUERY).matches;
}

function getTrackCarouselCardFromPoint(clientX, clientY) {
  const elements = trackCarouselState.elements;

  if (!elements?.cards) {
    return null;
  }

  const hitPadding = 10;
  const candidates = Array.from(elements.cards.querySelectorAll("[data-track-carousel-card]"))
    .map((card, index) => {
      const pos = getTrackRelativePosition(index);

      if (Math.abs(pos) > 2) {
        return null;
      }

      const rect = card.getBoundingClientRect();

      if (
        clientX < rect.left - hitPadding ||
        clientX > rect.right + hitPadding ||
        clientY < rect.top - hitPadding ||
        clientY > rect.bottom + hitPadding
      ) {
        return null;
      }

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      return {
        card,
        pos,
        rect,
        distance: Math.abs(clientX - centerX) + Math.abs(clientY - centerY) * 0.2,
        zIndex: Number(card.style.zIndex || 0)
      };
    })
    .filter(Boolean);

  if (candidates.length === 0) {
    return null;
  }

  const activeCandidate = candidates.find((candidate) => candidate.pos === 0);

  if (activeCandidate) {
    const activeCenterX = activeCandidate.rect.left + activeCandidate.rect.width / 2;
    const direction = Math.sign(clientX - activeCenterX);
    const sideCandidates = candidates.filter((candidate) => Math.sign(candidate.pos) === direction);

    if (direction !== 0 && sideCandidates.length > 0) {
      const edgeDistance = direction > 0
        ? activeCandidate.rect.right - clientX
        : clientX - activeCandidate.rect.left;
      const edgeThreshold = Math.min(90, activeCandidate.rect.width * 0.18);

      if (edgeDistance <= edgeThreshold) {
        return sideCandidates
          .sort((a, b) => Math.abs(a.pos) - Math.abs(b.pos) || b.zIndex - a.zIndex || a.distance - b.distance)[0]
          .card;
      }
    }
  }

  const candidateCards = new Set(candidates.map((candidate) => candidate.card));
  const pointedCard = document.elementsFromPoint(clientX, clientY)
    .map((element) => getClosestTrackCarouselElement(element, "[data-track-carousel-card]"))
    .find((card) => card && candidateCards.has(card));

  if (pointedCard) {
    return pointedCard;
  }

  candidates.sort((a, b) => b.zIndex - a.zIndex || a.distance - b.distance);

  return candidates[0]?.card || null;
}

function handleTrackCarouselDeckClick(event) {
  if (
    trackCarouselState.suppressCardClick ||
    getClosestTrackCarouselElement(event.target, ".btn-nav") ||
    trackCarouselState.items.length <= 1
  ) {
    return;
  }

  const card = getTrackCarouselCardFromPoint(event.clientX, event.clientY);

  if (!card) {
    return;
  }

  goToTrackCarousel(Number(card.dataset.index));
}

function ensureTrackCarousel() {
  const elements = getTrackCarouselElements();

  if (!elements?.deck || !elements.cards || !elements.dots || !elements.prev || !elements.next) {
    return null;
  }

  trackCarouselState.elements = elements;

  if (trackCarouselState.initialized) {
    return elements;
  }

  elements.dots.addEventListener("click", (event) => {
    const dot = event.target.closest("[data-track-carousel-dot]");

    if (!dot) {
      return;
    }

    goToTrackCarousel(Number(dot.dataset.index));
  });

  elements.prev.addEventListener("click", () => goToTrackCarousel(trackCarouselState.current - 1));
  elements.next.addEventListener("click", () => goToTrackCarousel(trackCarouselState.current + 1));
  elements.deck.addEventListener("click", handleTrackCarouselDeckClick);
  document.addEventListener("keydown", handleTrackCarouselKeydown);

  elements.deck.addEventListener("pointerdown", (event) => {
    if (getClosestTrackCarouselElement(event.target, ".btn-nav") || !canDragTrackCarousel(event)) {
      return;
    }

    trackCarouselState.dragging = true;
    trackCarouselState.dragStartX = event.clientX;
    trackCarouselState.dragDeltaX = 0;
    elements.deck.setPointerCapture(event.pointerId);
  });

  elements.deck.addEventListener("pointermove", (event) => {
    if (!trackCarouselState.dragging) {
      return;
    }

    trackCarouselState.dragDeltaX = event.clientX - trackCarouselState.dragStartX;
  });

  elements.deck.addEventListener("pointerup", (event) => {
    if (!trackCarouselState.dragging) {
      return;
    }

    trackCarouselState.dragging = false;
    elements.deck.releasePointerCapture(event.pointerId);

    if (Math.abs(trackCarouselState.dragDeltaX) > 30) {
      trackCarouselState.suppressCardClick = true;
      goToTrackCarousel(trackCarouselState.current + (trackCarouselState.dragDeltaX < 0 ? 1 : -1));

      window.setTimeout(() => {
        trackCarouselState.suppressCardClick = false;
      }, 120);
    }
  });

  elements.deck.addEventListener("pointercancel", () => {
    trackCarouselState.dragging = false;
    trackCarouselState.dragDeltaX = 0;
  });

  trackCarouselState.initialized = true;
  return elements;
}

function renderTrackCarouselCards(items) {
  const elements = trackCarouselState.elements;

  elements.cards.innerHTML = items.map((item, index) => {
    const title = escapeHtml(item.title);
    const type = escapeHtml(item.type);
    const image = item.img
      ? `<img class="cover-image" src="${escapeHtml(item.img)}" alt="" loading="lazy">`
      : "";
    const texture = item.img
      ? ""
      : `
        <img class="cover-pattern" src="${buildTrackPatternDataUri(item)}" alt="">
        <span class="cover-shine" aria-hidden="true"></span>
      `;

    return `
      <button class="cover-card${item.img ? " has-image" : ""}" type="button" data-track-carousel-card data-index="${index}" aria-label="${title}, ${type}">
        ${image}
        ${texture}
        <span class="cover-label">
          <span>${type}</span>
          <strong>${title}</strong>
        </span>
      </button>
    `;
  }).join("");

  elements.dots.innerHTML = items.map((item, index) => `
    <button class="dot" type="button" data-track-carousel-dot data-index="${index}" aria-label="Afficher ${escapeHtml(item.title)}"></button>
  `).join("");
}

function renderTrackCarousel(data) {
  const elements = ensureTrackCarousel();

  if (!elements) {
    return;
  }

  const tracks = [
    ...getAllTracks(data),
    ...(data?.discography?.reposts_featuring_dash || [])
  ].sort((a, b) => {
    const dateA = new Date(a.published_at || a.reposted_at || 0).getTime();
    const dateB = new Date(b.published_at || b.reposted_at || 0).getTime();
    return dateB - dateA;
  });

  if (tracks.length === 0) {
    return;
  }

  const previousId = trackCarouselState.items[trackCarouselState.current]?.id;
  const items = tracks.map(buildTrackCarouselItem);
  const nextKey = items.map((item) => item.id).join("|");

  trackCarouselState.items = items;

  if (previousId) {
    const nextCurrent = items.findIndex((item) => item.id === previousId);
    trackCarouselState.current = nextCurrent >= 0 ? nextCurrent : 0;
  } else {
    trackCarouselState.current = Math.min(trackCarouselState.current, items.length - 1);
  }

  if (trackCarouselState.tracksKey !== nextKey) {
    trackCarouselState.tracksKey = nextKey;
    renderTrackCarouselCards(items);
  }

  updateTrackCarousel();
}

function getAllTracks(data) {
  return data?.discography?.all_tracks || [
    ...(data?.discography?.album_tracks || []),
    ...(data?.discography?.standalone_tracks || [])
  ];
}

function setStatus(data) {
  const statusNodes = document.querySelectorAll("[data-soundcloud-status]");
  const date = data?.scraped_at ? formatDate(data.scraped_at) : "";
  const text = data?.stale
    ? "audio disponible"
    : `mis à jour ${date}`;

  statusNodes.forEach((node) => {
    node.textContent = text;
  });
}

function renderHomeLatest(data) {
  const list = document.querySelector("[data-soundcloud-latest]");
  if (!list) {
    return;
  }

  const tracks = getAllTracks(data).slice(0, 3);
  if (tracks.length === 0) {
    return;
  }

  list.innerHTML = tracks
    .map((track) => {
      return `
        <article class="recent-track">
          <div class="recent-body">
            <div class="recent-title-line">
              <span class="recent-disc" aria-hidden="true"></span>
              <p class="recent-title">${escapeHtml(track.title)}</p>
            </div>
            <p class="recent-stats">
              <span>${escapeHtml(formatPlays(track.plays))}</span>
              <span>${escapeHtml(formatDate(track.published_at))}</span>
            </p>
            ${renderSoundCloudEmbed(track, `Lecteur audio - ${track.title}`)}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderTrackCard(track) {
  const publishedAt = track.published_at || track.reposted_at;
  const metaParts = [
    track.album ? `${track.album_type || "release"} / ${track.album}` : "track",
    formatDate(publishedAt)
  ];
  const moodParts = [
    formatPlays(track.plays),
    track.duration ? formatDuration(track.duration) : null,
    track.genre
  ].filter(Boolean);
  const statParts = [
    hasNumericValue(track.likes) ? `${formatCompact(track.likes)} likes` : null,
    hasNumericValue(track.reposts) ? `${formatCompact(track.reposts)} partages` : null,
    hasNumericValue(track.comments) ? `${formatCompact(track.comments)} commentaires` : null
  ].filter(Boolean);

  return `
    <article class="event-card track-card">
      <p class="event-date">${escapeHtml(metaParts.filter(Boolean).join(" / "))}</p>
      <h3>${escapeHtml(track.title)}</h3>
      <p class="track-mood">${escapeHtml(moodParts.join(" / "))}</p>
      ${statParts.length > 0 ? `
        <div class="track-stats" aria-label="Statistiques audio">
          ${statParts.map((stat) => `<span>${escapeHtml(stat)}</span>`).join("")}
        </div>
      ` : ""}
      ${renderSoundCloudEmbed(track, `Lecteur audio - ${track.title}`)}
      <div class="calendar-actions track-actions">
        <a class="calendar-link" href="${escapeHtml(track.url)}" target="_blank" rel="noopener noreferrer">écouter</a>
      </div>
    </article>
  `;
}

function renderTracksPage(data) {
  const grid = document.querySelector("[data-soundcloud-tracks]");

  if (grid) {
    const tracks = [
      ...getAllTracks(data),
      ...(data?.discography?.reposts_featuring_dash || [])
    ].sort((a, b) => {
      const dateA = new Date(a.published_at || a.reposted_at || 0).getTime();
      const dateB = new Date(b.published_at || b.reposted_at || 0).getTime();
      return dateB - dateA;
    });

    if (tracks.length > 0) {
      grid.innerHTML = tracks.map(renderTrackCard).join("");
    }
  }

  const profileNodes = document.querySelectorAll("[data-soundcloud-profile]");
  profileNodes.forEach((node) => {
    const profile = data?.profile;
    const stats = data?.discography?.stats;
    if (!profile || !stats) {
      return;
    }

    node.textContent = `${profile.track_count} tracks publics / ${formatPlays(stats.own_total_plays)} / ${numberFormatter.format(profile.followers_count || 0)} followers`;
  });
}

function renderSoundCloud(data) {
  setStatus(data);
  renderHomeLatest(data);
  renderTrackCarousel(data);
  renderTracksPage(data);
}

async function fetchSoundCloudData(force = false) {
  const response = await fetch(`${SOUNDCLOUD_API_URL}${force ? "?refresh=1" : ""}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Audio API HTTP ${response.status}`);
  }

  return response.json();
}

function startPolling() {
  fetchSoundCloudData(false).then(renderSoundCloud).catch(() => {});
  setInterval(() => {
    fetchSoundCloudData(true).then(renderSoundCloud).catch(() => {});
  }, SOUNDCLOUD_POLL_MS);
}

function startLiveUpdates() {
  if (!("EventSource" in window)) {
    startPolling();
    return;
  }

  const events = new EventSource(SOUNDCLOUD_EVENTS_URL);
  let receivedFirstEvent = false;

  events.addEventListener("soundcloud", (event) => {
    receivedFirstEvent = true;
    renderSoundCloud(JSON.parse(event.data));
  });

  events.addEventListener("error", () => {
    if (!receivedFirstEvent) {
      events.close();
      startPolling();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector("[data-soundcloud-latest], [data-soundcloud-tracks], [data-track-carousel]")) {
    startLiveUpdates();
  }
});
