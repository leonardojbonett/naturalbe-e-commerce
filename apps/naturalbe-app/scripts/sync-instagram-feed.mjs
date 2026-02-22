import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

function requiredEnv(name) {
  const value = process.env[name];

  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required env var: ${name}`);
  }

  return value.trim();
}

function optionalIntEnv(name, fallback) {
  const value = process.env[name];

  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function sanitizeItem(item) {
  if (!item?.id || !item?.permalink || !item?.media_type) {
    return null;
  }

  const mediaType = String(item.media_type);
  const mediaUrl = typeof item.media_url === "string" ? item.media_url : "";
  const thumbnailUrl = typeof item.thumbnail_url === "string" ? item.thumbnail_url : null;

  if (!mediaUrl && !thumbnailUrl) {
    return null;
  }

  return {
    id: String(item.id),
    caption: typeof item.caption === "string" ? item.caption : "",
    mediaType,
    mediaUrl: mediaUrl || thumbnailUrl,
    thumbnailUrl,
    permalink: String(item.permalink),
    timestamp: typeof item.timestamp === "string" ? item.timestamp : ""
  };
}

async function fetchInstagramFeed() {
  const token = requiredEnv("INSTAGRAM_ACCESS_TOKEN");
  const igUserId = requiredEnv("INSTAGRAM_IG_USER_ID");
  const username = process.env.INSTAGRAM_USERNAME?.trim() || "naturalbe__";
  const graphVersion = process.env.INSTAGRAM_GRAPH_VERSION?.trim() || "v22.0";
  const itemLimit = optionalIntEnv("INSTAGRAM_ITEMS_LIMIT", 8);
  const profileUrl =
    process.env.INSTAGRAM_PROFILE_URL?.trim() || `https://www.instagram.com/${username}/`;

  const url = new URL(`https://graph.facebook.com/${graphVersion}/${igUserId}/media`);
  url.searchParams.set(
    "fields",
    "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp"
  );
  url.searchParams.set("limit", String(itemLimit));
  url.searchParams.set("access_token", token);

  const response = await fetch(url);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Instagram Graph API failed: HTTP ${response.status} ${body}`);
  }

  const payload = await response.json();
  const list = Array.isArray(payload?.data) ? payload.data : [];
  const items = list.map(sanitizeItem).filter(Boolean);

  return {
    username,
    profileUrl,
    updatedAt: new Date().toISOString(),
    items
  };
}

async function saveFeed() {
  const outputPath =
    process.env.INSTAGRAM_FEED_OUTPUT?.trim() || path.join("public", "instagram-feed.json");
  const feed = await fetchInstagramFeed();
  const folder = path.dirname(outputPath);

  await mkdir(folder, { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(feed, null, 2)}\n`, "utf8");

  console.log(`Instagram feed written to ${outputPath} (${feed.items.length} posts).`);
}

saveFeed().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
