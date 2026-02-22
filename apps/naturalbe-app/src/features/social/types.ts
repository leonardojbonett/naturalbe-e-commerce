export type InstagramMediaType = "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";

export type InstagramFeedItem = {
  id: string;
  caption: string;
  mediaType: InstagramMediaType;
  mediaUrl: string;
  thumbnailUrl: string | null;
  permalink: string;
  timestamp: string;
};

export type InstagramFeed = {
  username: string;
  profileUrl: string;
  updatedAt: string;
  items: InstagramFeedItem[];
};
