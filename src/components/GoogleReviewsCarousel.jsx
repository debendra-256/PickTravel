import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { APP_CONFIG } from "../config/app.config";

function GoogleGLogo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function StarRow({ rating, size = 16 }) {
  return (
    <span className="google-review-stars" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          fill={i < rating ? "#fbbc04" : "#e2e8f0"}
          stroke={i < rating ? "#fbbc04" : "#e2e8f0"}
        />
      ))}
    </span>
  );
}

export function GoogleReviewsCarousel() {
  const reviews = APP_CONFIG.GOOGLE_REVIEWS.REVIEWS;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [perView, setPerView] = useState(3);

  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 700) setPerView(1);
      else if (window.innerWidth < 1024) setPerView(2);
      else setPerView(3);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const maxIndex = Math.max(0, reviews.length - perView);

  useEffect(() => {
    setIndex((prev) => Math.min(prev, maxIndex));
  }, [maxIndex]);

  useEffect(() => {
    if (paused || maxIndex === 0) return undefined;
    const timer = setInterval(() => {
      setIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 4500);
    return () => clearInterval(timer);
  }, [paused, maxIndex]);

  const initials = useMemo(
    () => reviews.map((review, i) => String.fromCharCode(65 + (i % 26))),
    [reviews]
  );

  const goPrev = () => setIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  const goNext = () => setIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));

  return (
    <section
      className="google-reviews-section"
      aria-label="Google reviews for Pick My Travels"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="container">
        <div className="google-reviews-header">
          <div className="google-reviews-brand">
            <div className="google-reviews-logo-wrap">
              <GoogleGLogo size={32} />
            </div>
            <div>
              <span className="badge badge-red" style={{ marginBottom: "0.4rem" }}>
                Traveller Love
              </span>
              <h2>What Google Reviewers Say</h2>
              <p>Real Google reviews for {APP_CONFIG.COMPANY_NAME} in Bhubaneswar.</p>
            </div>
          </div>

          <div className="google-reviews-score-card">
            <div className="google-reviews-score-num">{APP_CONFIG.GOOGLE_REVIEWS.RATING}</div>
            <div>
              <StarRow rating={5} size={18} />
              <div className="google-reviews-score-meta">
                {APP_CONFIG.GOOGLE_REVIEWS.COUNT} Google reviews
              </div>
            </div>
            <a
              className="google-reviews-cta"
              href={APP_CONFIG.GOOGLE_REVIEWS.MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Google
            </a>
          </div>
        </div>

        <div className="google-reviews-slider-wrap">
          <button type="button" className="google-reviews-nav prev" onClick={goPrev} aria-label="Previous reviews">
            <ChevronLeft size={22} />
          </button>

          <div className="google-reviews-viewport">
            <div
              className="google-reviews-track"
              style={{
                transform: `translateX(-${index * (100 / perView)}%)`,
              }}
            >
              {reviews.map((review, i) => (
                <div
                  className="google-review-slide"
                  key={review.id}
                  style={{ flex: `0 0 ${100 / perView}%` }}
                >
                  <article className="google-review-card">
                    <div className="google-review-card-top">
                      <div className="google-review-avatar" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                        {initials[i]}
                      </div>
                      <div>
                        <div className="google-review-name">Google Reviewer</div>
                        <div className="google-review-posted">{review.date} · Posted on Google</div>
                      </div>
                      <GoogleGLogo size={18} />
                    </div>
                    <StarRow rating={review.rating} />
                    <Quote className="google-review-quote-icon" size={28} />
                    <p className="google-review-text">“{review.text}”</p>
                  </article>
                </div>
              ))}
            </div>
          </div>

          <button type="button" className="google-reviews-nav next" onClick={goNext} aria-label="Next reviews">
            <ChevronRight size={22} />
          </button>
        </div>

        <div className="google-reviews-dots" role="tablist" aria-label="Review slides">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              type="button"
              className={`google-reviews-dot ${i === index ? "active" : ""}`}
              onClick={() => setIndex(i)}
              aria-label={`Show reviews group ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

const AVATAR_COLORS = ["#4285F4", "#EA4335", "#34A853", "#FBBC05", "#0f172a", "#d9232d", "#1e293b"];
