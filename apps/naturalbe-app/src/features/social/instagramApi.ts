import { z } from "zod";
import { appEnv } from "../../core/config/env";
import type { InstagramFeed } from "./types";

const instagramFeedSchema = z.object({
  username: z.string().min(1),
  profileUrl: z.string().url(),
  updatedAt: z.string().min(1),
  items: z.array(
    z.object({
      id: z.string().min(1),
      caption: z.string().default(""),
      mediaType: z.enum(["IMAGE", "VIDEO", "CAROUSEL_ALBUM"]),
      mediaUrl: z.string().url(),
      thumbnailUrl: z.string().url().nullable(),
      permalink: z.string().url(),
      timestamp: z.string().min(1)
    })
  )
});

let instagramFeedCache: InstagramFeed | null = null;

export async function fetchInstagramFeed(): Promise<InstagramFeed | null> {
  if (instagramFeedCache) {
    return instagramFeedCache;
  }

  try {
    const response = await fetch(appEnv.instagramFeedPath);

    if (!response.ok) {
      return null;
    }

    const raw = await response.json();
    const parsed = instagramFeedSchema.safeParse(raw);

    if (!parsed.success) {
      return null;
    }

    instagramFeedCache = parsed.data;
    return instagramFeedCache;
  } catch {
    return null;
  }
}
