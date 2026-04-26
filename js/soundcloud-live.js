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
    .map((track, index) => {
      const meta = formatYear(track.published_at) || formatDuration(track.duration);
      const description = [
        track.genre,
        `${formatCompact(track.plays)} plays`,
        formatDuration(track.duration)
      ].filter(Boolean).join(" / ");

      return `
        <article class="recent-track${index === 0 ? " recent-track--feature" : ""}">
          <div class="recent-cover">${escapeHtml(coverText(track.title))}</div>
          <div class="recent-body">
            <div class="recent-head">
              <span class="recent-play">&gt;</span>
              <div class="recent-info">
                <p class="recent-artist">${escapeHtml(track.artist || "dash.")}</p>
                <p class="recent-title">${escapeHtml(track.title)}</p>
              </div>
              <span class="recent-meta">${escapeHtml(meta)}</span>
            </div>
            <p class="recent-description">${escapeHtml(description)}</p>
            <div class="calendar-actions">
              <a class="calendar-link" href="${escapeHtml(track.url)}" target="_blank" rel="noopener noreferrer">ecouter</a>
              ${index === 0 ? '<a class="calendar-link" href="tracks.html">voir les tracks</a>' : ""}
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderTrackCard(track) {
  const metaParts = [
    track.album ? `${track.album_type || "release"} / ${track.album}` : "single",
    formatDate(track.published_at)
  ];

  return `
    <article class="event-card track-card">
      <p class="event-date">${escapeHtml(metaParts.filter(Boolean).join(" / "))}</p>
      <h3>${escapeHtml(track.title)}</h3>
      <p class="track-mood">${escapeHtml([formatPlays(track.plays), formatDuration(track.duration), track.genre].filter(Boolean).join(" / "))}</p>
      <div class="track-stats" aria-label="Statistiques audio">
        <span>${escapeHtml(formatCompact(track.likes))} likes</span>
        <span>${escapeHtml(formatCompact(track.reposts))} partages</span>
        <span>${escapeHtml(formatCompact(track.comments))} commentaires</span>
      </div>
      ${renderSoundCloudEmbed(track, `Lecteur audio - ${track.title}`)}
      <div class="calendar-actions track-actions">
        <a class="calendar-link" href="${escapeHtml(track.url)}" target="_blank" rel="noopener noreferrer">écouter</a>
      </div>
    </article>
  `;
}

function renderRepostCard(repost) {
  return `
    <article class="event-card track-card track-card--repost">
      <p class="event-date">signal / ${escapeHtml(repost.artist || "audio")}</p>
      <h3>${escapeHtml(repost.title)}</h3>
      <p class="track-mood">${escapeHtml([formatPlays(repost.plays), formatDate(repost.reposted_at)].filter(Boolean).join(" / "))}</p>
      ${renderSoundCloudEmbed(repost, `Lecteur audio - ${repost.title}`)}
      <div class="calendar-actions track-actions">
        <a class="calendar-link" href="${escapeHtml(repost.url)}" target="_blank" rel="noopener noreferrer">ouvrir</a>
      </div>
    </article>
  `;
}

function renderTracksPage(data) {
  const grid = document.querySelector("[data-soundcloud-tracks]");
  const repostGrid = document.querySelector("[data-soundcloud-reposts]");

  if (grid) {
    const tracks = getAllTracks(data);
    if (tracks.length > 0) {
      grid.innerHTML = tracks.map(renderTrackCard).join("");
    }
  }

  if (repostGrid) {
    const reposts = data?.discography?.reposts_featuring_dash || [];
    repostGrid.innerHTML = reposts.length > 0
      ? reposts.map(renderRepostCard).join("")
      : '<p class="events-empty">Aucune apparition détectée pour le moment.</p>';
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
  if (document.querySelector("[data-soundcloud-latest], [data-soundcloud-tracks]")) {
    startLiveUpdates();
  }
});
