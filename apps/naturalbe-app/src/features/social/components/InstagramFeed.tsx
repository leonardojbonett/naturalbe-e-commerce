import { useEffect, useState } from "react";
import { fetchInstagramFeed } from "../instagramApi";
import type { InstagramFeed } from "../types";

function trimCaption(caption: string): string {
  const normalized = caption.trim();

  if (normalized.length <= 85) {
    return normalized;
  }

  return `${normalized.slice(0, 82)}...`;
}

export function InstagramFeed() {
  const [feed, setFeed] = useState<InstagramFeed | null>(null);

  useEffect(() => {
    let active = true;

    fetchInstagramFeed().then((data) => {
      if (!active) {
        return;
      }

      setFeed(data);
    });

    return () => {
      active = false;
    };
  }, []);

  if (!feed || feed.items.length === 0) {
    return null;
  }

  return (
    <section className="instagram-section card" aria-label="Feed de Instagram">
      <div className="instagram-head">
        <h2 className="instagram-title">Ultimas publicaciones en Instagram</h2>
        <a href={feed.profileUrl} className="instagram-link" target="_blank" rel="noreferrer">
          @{feed.username}
        </a>
      </div>
      <div className="instagram-grid">
        {feed.items.map((item) => (
          <a
            key={item.id}
            href={item.permalink}
            className="instagram-card"
            target="_blank"
            rel="noreferrer"
          >
            <img
              className="instagram-media"
              src={item.mediaType === "VIDEO" ? (item.thumbnailUrl ?? item.mediaUrl) : item.mediaUrl}
              alt={item.caption || "Publicacion de Instagram Natural Be"}
              loading="lazy"
            />
            <p className="instagram-caption">{trimCaption(item.caption || "Ver publicacion")}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
