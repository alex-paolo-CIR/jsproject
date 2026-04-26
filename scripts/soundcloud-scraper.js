import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

const PROFILE_URL = "https://soundcloud.com/dassssh";
const ARTIST_VARIANTS = ["dash.", "dash", "dassssh"];
const DEFAULT_OUTPUT_FILE = path.join(PROJECT_ROOT, "data", "soundcloud_data.json");
const TIMEOUT_MS = 15000;
const TRACKS_LIMIT = 50;

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8",
  "Cache-Control": "max-age=0",
  "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1"
};

const API_HEADERS = {
  ...BROWSER_HEADERS,
  Accept: "application/json, text/javascript, */*; q=0.01",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-site",
  Referer: "https://soundcloud.com/",
  Origin: "https://soundcloud.com"
};

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`Timeout (${TIMEOUT_MS}ms): ${url}`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function formatDuration(ms) {
  const seconds = Math.floor((ms || 0) / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function normalizeArtworkUrl(url, size = "t500x500") {
  if (!url) {
    return null;
  }

  return url.replace(/large|t\d+x\d+/, size);
}

function dashIsMentioned(track) {
  const haystack = [
    track.title,
    track.tag_list,
    track.description,
    track.publisher_metadata?.artist,
    track.user?.username,
    track.user?.full_name
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return ARTIST_VARIANTS.some((variant) => {
    const escaped = variant.replace(".", "\\.");
    return new RegExp(`(^|[\\s/,+\\[\\(])${escaped}($|[\\s/,+\\]\\)])`, "i").test(haystack);
  });
}

async function fetchClientId(profileUrl = PROFILE_URL) {
  const response = await fetchWithTimeout(profileUrl, { headers: BROWSER_HEADERS });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while loading ${profileUrl}`);
  }

  const html = await response.text();
  const scriptUrls = [...html.matchAll(/src="(https:\/\/[^"]*sndcdn\.com[^"]*\.js[^"]*)"/g)].map((match) => match[1]);

  if (scriptUrls.length === 0) {
    throw new Error("No sndcdn script found on the SoundCloud page.");
  }

  for (const url of scriptUrls.slice(-8)) {
    try {
      const scriptResponse = await fetchWithTimeout(url, { headers: BROWSER_HEADERS });
      if (!scriptResponse.ok) {
        continue;
      }

      const text = await scriptResponse.text();
      const match = text.match(/client_id[=:"']+([a-zA-Z0-9]{20,40})/);
      if (match) {
        return match[1];
      }
    } catch {
      // SoundCloud rotates bundles often; one failing script should not stop lookup.
    }
  }

  throw new Error("SoundCloud client_id not found.");
}

async function resolveProfile(clientId, profileUrl = PROFILE_URL) {
  const url = `https://api-v2.soundcloud.com/resolve?url=${encodeURIComponent(profileUrl)}&client_id=${clientId}`;
  const response = await fetchWithTimeout(url, { headers: API_HEADERS });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`HTTP ${response.status} on /resolve: ${body.slice(0, 300)}`);
  }

  return response.json();
}

async function fetchPaginatedCollection(firstUrl, clientId) {
  const collection = [];
  let nextUrl = firstUrl;

  while (nextUrl) {
    const response = await fetchWithTimeout(nextUrl, { headers: API_HEADERS });
    if (!response.ok) {
      break;
    }

    const data = await response.json();
    collection.push(...(data.collection || []));
    nextUrl = data.next_href ? `${data.next_href}${data.next_href.includes("?") ? "&" : "?"}client_id=${clientId}` : null;
  }

  return collection;
}

function fetchAllTracks(userId, clientId) {
  const url = `https://api-v2.soundcloud.com/users/${userId}/tracks?client_id=${clientId}&limit=${TRACKS_LIMIT}&linked_partitioning=1`;
  return fetchPaginatedCollection(url, clientId);
}

function fetchAllReposts(userId, clientId) {
  const url = `https://api-v2.soundcloud.com/stream/users/${userId}/reposts?client_id=${clientId}&limit=${TRACKS_LIMIT}&linked_partitioning=1`;
  return fetchPaginatedCollection(url, clientId);
}

function fetchPlaylists(userId, clientId) {
  const url = `https://api-v2.soundcloud.com/users/${userId}/playlists?client_id=${clientId}&limit=50&linked_partitioning=1`;
  return fetchPaginatedCollection(url, clientId);
}

function parseProfile(user) {
  return {
    id: user.id,
    username: user.username,
    display_name: user.full_name || user.username,
    bio: user.description || null,
    location: [user.city, user.country_code].filter(Boolean).join(", ") || null,
    followers_count: user.followers_count,
    followings_count: user.followings_count,
    track_count: user.track_count,
    playlist_count: user.playlist_count,
    likes_count: user.likes_count ?? null,
    verified: user.verified ?? false,
    profile_url: user.permalink_url,
    avatar_url: normalizeArtworkUrl(user.avatar_url),
    created_at: user.created_at
  };
}

function parseTrack(track) {
  return {
    id: track.id,
    title: track.title,
    artist: track.user?.username || null,
    duration: formatDuration(track.duration),
    duration_ms: track.duration,
    plays: track.playback_count ?? 0,
    likes: track.likes_count ?? 0,
    reposts: track.reposts_count ?? 0,
    comments: track.comment_count ?? 0,
    published_at: track.display_date || track.created_at,
    genre: track.genre || null,
    tags: track.tag_list || null,
    description: track.description || null,
    url: track.permalink_url,
    artwork_url: normalizeArtworkUrl(track.artwork_url || track.user?.avatar_url),
    waveform_url: track.waveform_url || null
  };
}

function parsePlaylist(playlist) {
  return {
    id: playlist.id,
    title: playlist.title,
    type: playlist.set_type === "album" ? "album" : "EP/playlist",
    track_count: playlist.track_count,
    published_at: playlist.display_date || playlist.created_at,
    url: playlist.permalink_url,
    artwork_url: normalizeArtworkUrl(playlist.artwork_url || playlist.user?.avatar_url),
    track_ids: (playlist.tracks || []).map((track) => track.id)
  };
}

function classifyTracks(rawTracks, playlists) {
  const playlistTrackIds = new Set(playlists.flatMap((playlist) => playlist.track_ids));
  const albumTracks = [];
  const standaloneTracks = [];

  for (const rawTrack of rawTracks) {
    const track = parseTrack(rawTrack);
    const parent = playlists.find((playlist) => playlist.track_ids.includes(rawTrack.id));

    if (playlistTrackIds.has(rawTrack.id)) {
      albumTracks.push({
        ...track,
        album: parent?.title ?? null,
        album_type: parent?.type ?? null
      });
    } else {
      standaloneTracks.push(track);
    }
  }

  return { albumTracks, standaloneTracks };
}

function classifyReposts(rawReposts) {
  const withDash = [];
  const withoutDash = [];

  for (const item of rawReposts) {
    const inner = item.track || item.playlist || item;
    const parsed = {
      id: inner.id,
      title: inner.title ?? null,
      artist: inner.user?.username ?? null,
      url: inner.permalink_url ?? null,
      plays: inner.playback_count ?? 0,
      likes: inner.likes_count ?? 0,
      reposted_at: item.created_at,
      content_type: item.track ? "track" : "playlist",
      artwork_url: normalizeArtworkUrl(inner.artwork_url || inner.user?.avatar_url)
    };

    if (dashIsMentioned(inner)) {
      withDash.push({ ...parsed, dash_mention: true });
    } else {
      withoutDash.push({ ...parsed, dash_mention: false });
    }
  }

  withDash.sort((a, b) => b.plays - a.plays);

  return { withDash, withoutDash };
}

function sortByPublishedDateDesc(items, key = "published_at") {
  return [...items].sort((a, b) => new Date(b[key] || 0) - new Date(a[key] || 0));
}

export async function scrapeSoundCloudProfile(options = {}) {
  const profileUrl = options.profileUrl || PROFILE_URL;
  const clientId = await fetchClientId(profileUrl);
  const rawUser = await resolveProfile(clientId, profileUrl);
  const profile = parseProfile(rawUser);

  const [rawTracks, rawReposts, rawPlaylists] = await Promise.all([
    fetchAllTracks(rawUser.id, clientId),
    fetchAllReposts(rawUser.id, clientId),
    fetchPlaylists(rawUser.id, clientId)
  ]);

  const playlists = rawPlaylists.map(parsePlaylist);
  const { albumTracks, standaloneTracks } = classifyTracks(rawTracks, playlists);
  const { withDash, withoutDash } = classifyReposts(rawReposts);
  const allOwnTracks = sortByPublishedDateDesc([...albumTracks, ...standaloneTracks]);

  const data = {
    scraped_at: new Date().toISOString(),
    source_url: profileUrl,
    profile,
    discography: {
      albums: sortByPublishedDateDesc(playlists),
      album_tracks: sortByPublishedDateDesc(albumTracks),
      standalone_tracks: sortByPublishedDateDesc(standaloneTracks),
      all_tracks: allOwnTracks,
      reposts_featuring_dash: withDash,
      reposts_others: withoutDash,
      stats: {
        own_total_plays: allOwnTracks.reduce((sum, track) => sum + track.plays, 0),
        collab_total_plays: withDash.reduce((sum, track) => sum + track.plays, 0),
        most_played_own: [...allOwnTracks].sort((a, b) => b.plays - a.plays)[0]?.title ?? null,
        most_played_collab: withDash[0]?.title ?? null
      }
    }
  };

  if (options.outputFile) {
    await fs.mkdir(path.dirname(options.outputFile), { recursive: true });
    await fs.writeFile(options.outputFile, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  }

  return data;
}

export async function writeSoundCloudSnapshot(outputFile = DEFAULT_OUTPUT_FILE) {
  return scrapeSoundCloudProfile({ outputFile });
}

function printResults(data) {
  const tracks = data.discography.all_tracks;
  const reposts = data.discography.reposts_featuring_dash;

  console.log(`SoundCloud scrape: ${data.profile.display_name} (@${data.profile.username})`);
  console.log(`Source: ${data.source_url}`);
  console.log(`Tracks: ${tracks.length}`);
  for (const track of tracks) {
    console.log(`- ${track.title} | ${track.plays.toLocaleString("fr-FR")} plays | ${track.url}`);
  }

  console.log(`Reposts with dash mention: ${reposts.length}`);
  for (const repost of reposts) {
    console.log(`- ${repost.title} by ${repost.artist || "unknown"} | ${repost.url}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  try {
    const outputFile = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : DEFAULT_OUTPUT_FILE;
    const data = await writeSoundCloudSnapshot(outputFile);
    printResults(data);
    console.log(`Saved: ${outputFile}`);
  } catch (error) {
    console.error(`SoundCloud scrape failed: ${error.message}`);
    process.exitCode = 1;
  }
}
