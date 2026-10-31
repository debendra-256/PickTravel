import React, { useEffect, useMemo, useState } from "react";
import { Camera, ChevronLeft, ChevronRight, X } from "lucide-react";
import { assetUrl } from "../config/assetUrl";

const GALLERY_MANIFEST = "Gallery-Images/Gallery/Gallery.json";

const resolveImageUrl = (url) => (/^https?:\/\//i.test(url) ? url : assetUrl(url));

export function GalleryPage() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(null);

  useEffect(() => {
    let active = true;

    fetch(assetUrl(GALLERY_MANIFEST))
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to load ${GALLERY_MANIFEST}`);
        return response.json();
      })
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data)
          ? data
              .filter((item) => item && typeof item.url === "string" && item.url.trim())
              .map((item) => ({
                url: item.url.trim(),
                description: typeof item.description === "string" ? item.description.trim() : ""
              }))
          : [];
        setPhotos(list);
        setLoading(false);
      })
      .catch((error) => {
        console.error(`Failed to load ${GALLERY_MANIFEST}:`, error);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const activeIndex = activePhoto
    ? photos.findIndex((photo) => photo.url === activePhoto.url)
    : -1;

  useEffect(() => {
    if (!activePhoto) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setActivePhoto(null);
        return;
      }
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

      const index = photos.findIndex((photo) => photo.url === activePhoto.url);
      if (index < 0) return;
      const step = event.key === "ArrowRight" ? 1 : -1;
      setActivePhoto(photos[(index + step + photos.length) % photos.length]);
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [activePhoto, photos]);

  const showPhoto = (step) => {
    if (activeIndex < 0) return;
    setActivePhoto(photos[(activeIndex + step + photos.length) % photos.length]);
  };

  const countLabel = useMemo(() => {
    if (!photos.length) return "";
    return `${photos.length} moment${photos.length === 1 ? "" : "s"} captured`;
  }, [photos.length]);

  return (
    <section className="gallery-page">
      <div className="gallery-hero">
        <div className="container gallery-hero-inner">
          <span className="gallery-script">Travel Moments</span>
          <h1>
            Gallery <span className="gallery-title-divider">|</span>{" "}
            <span className="gallery-title-accent">Best Travels in Bhubaneswar</span>
          </h1>
          <p>Real journeys, happy travellers, and the beautiful destinations we cover across Odisha.</p>
          {countLabel && <span className="gallery-count">{countLabel}</span>}
        </div>
      </div>

      <div className="container gallery-body">
        {loading ? (
          <div className="gallery-grid" aria-hidden="true">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="gallery-card gallery-card-loading" />
            ))}
          </div>
        ) : photos.length ? (
          <div className="gallery-grid">
            {photos.map((photo, index) => (
              <button
                key={photo.url}
                type="button"
                className="gallery-card"
                onClick={() => setActivePhoto(photo)}
                aria-label={`Open photo${photo.description ? `: ${photo.description}` : ` ${index + 1}`}`}
              >
                <img src={resolveImageUrl(photo.url)} alt={photo.description || "Pick My Travels travel photo"} loading="lazy" />
                <span className="gallery-card-overlay">
                  {photo.description && <span className="gallery-card-caption">{photo.description}</span>}
                </span>
                <span className="gallery-card-zoom" aria-hidden="true">
                  <Camera size={17} />
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="gallery-empty">
            <Camera size={30} />
            <strong>Photos coming soon</strong>
            <p>Add images to public/Gallery-Images/Gallery and run <code>npm run gallery:sync</code> to publish them here.</p>
          </div>
        )}
      </div>

      {activePhoto && (
        <div
          className="gallery-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={activePhoto.description || "Gallery photo"}
          onClick={() => setActivePhoto(null)}
        >
          <div className="gallery-lightbox-inner" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="gallery-lightbox-close"
              onClick={() => setActivePhoto(null)}
              aria-label="Close photo viewer"
            >
              <X size={20} />
            </button>

            {photos.length > 1 && (
              <button
                type="button"
                className="gallery-lightbox-nav prev"
                onClick={() => showPhoto(-1)}
                aria-label="Previous photo"
              >
                <ChevronLeft size={24} />
              </button>
            )}

            <img
              className="gallery-lightbox-image"
              src={resolveImageUrl(activePhoto.url)}
              alt={activePhoto.description || "Pick My Travels travel photo"}
            />

            {photos.length > 1 && (
              <button
                type="button"
                className="gallery-lightbox-nav next"
                onClick={() => showPhoto(1)}
                aria-label="Next photo"
              >
                <ChevronRight size={24} />
              </button>
            )}

            <div className="gallery-lightbox-info">
              {activePhoto.description && <p>{activePhoto.description}</p>}
              <span className="gallery-lightbox-count">
                {activeIndex + 1} / {photos.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
