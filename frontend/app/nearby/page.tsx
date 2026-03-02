"use client";

import { useEffect, useState } from "react";
import { fetchNearbyPlaces, fetchLocationName } from "@/lib/api";

interface Place {
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  distance_km: number;
  image: string;
  rating?: number;
  review_count?: number;
}

const INITIAL_COUNT = 6;
const LOAD_MORE_COUNT = 6;

function StarRating({ rating, reviewCount }: { rating: number; reviewCount?: number }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <div className="rating-row">
      <div className="stars">
        {Array(full).fill(0).map((_, i) => (
          <span key={`f${i}`} className="star star-full">★</span>
        ))}
        {half && <span className="star star-half">★</span>}
        {Array(empty).fill(0).map((_, i) => (
          <span key={`e${i}`} className="star star-empty">★</span>
        ))}
      </div>
      <span className="rating-value">{rating.toFixed(1)}</span>
      {reviewCount !== undefined && (
        <span className="review-count">({reviewCount})</span>
      )}
    </div>
  );
}

export default function NearbyPage() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        const locationData = await fetchLocationName(lat, lon);

        if (!locationData.error) {
          setLocationName(`${locationData.city}, ${locationData.state}`);
        }

        fetchNearby(lat, lon);
      },
      () => {
        setLocationError(true);
      }
    );
  }, []);

  const fetchNearby = async (lat: number, lon: number) => {
    try {
      setLoading(true);
      const data = await fetchNearbyPlaces(lat, lon);
      if (!data.error) {
        const withRatings = data.map((place: Place) => ({
          ...place,
          rating: [3, 4, 5][Math.floor(Math.random() * 3)],
        }));
        setPlaces(withRatings);
      }
    } catch (error) {
      console.error("Nearby fetch failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const visiblePlaces = places.slice(0, visibleCount);
  const hasMore = visibleCount < places.length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Montserrat:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
          background: #080808;
          margin: 0;
          padding: 0;
          border: none;
          overflow-x: hidden;
          overflow-y: auto !important;
          height: auto !important;
          max-height: none !important;
        }

        :root {
          --gold: #C6A96E;
          --gold-light: #E2C99A;
          --gold-dark: #8A6D3D;
          --bg: #080808;
          --surface: #0E0E0E;
          --surface-2: #161616;
          --border: rgba(198, 169, 110, 0.15);
          --text-muted: rgba(255,255,255,0.38);
        }

        .nearby-root {
          min-height: 100vh;
          background: var(--bg);
          color: #fff;
          font-family: 'Montserrat', sans-serif;
          font-weight: 300;
          padding: 3.5rem 2rem 5rem;
          position: relative;
          overflow-x: hidden;
          overflow-y: visible;
        }

        .nearby-root::before {
          content: '';
          position: fixed;
          top: -30%;
          left: -20%;
          width: 70vw;
          height: 70vw;
          background: radial-gradient(circle, rgba(198,169,110,0.05) 0%, transparent 65%);
          pointer-events: none;
          z-index: 0;
        }

        .nearby-root::after {
          content: '';
          position: fixed;
          bottom: -20%;
          right: -10%;
          width: 50vw;
          height: 50vw;
          background: radial-gradient(circle, rgba(198,169,110,0.04) 0%, transparent 65%);
          pointer-events: none;
          z-index: 0;
        }

        .header {
          position: relative;
          z-index: 1;
          margin-bottom: 3rem;
          max-width: 900px;
        }

        .eyebrow {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.6rem;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .eyebrow::before {
          content: '';
          display: inline-block;
          width: 2rem;
          height: 1px;
          background: var(--gold);
          opacity: 0.6;
        }

        .title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2.8rem, 7vw, 5.5rem);
          font-weight: 300;
          line-height: 0.95;
          letter-spacing: -0.01em;
          color: #fff;
          margin: 0 0 1.25rem;
        }

        .title em {
          font-style: italic;
          color: var(--gold-light);
        }

        .location-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          background: rgba(198,169,110,0.08);
          border: 1px solid var(--border);
          padding: 0.35rem 0.9rem;
          border-radius: 100px;
          font-size: 0.72rem;
          color: var(--gold-light);
          letter-spacing: 0.08em;
        }

        .location-dot {
          width: 6px;
          height: 6px;
          background: var(--gold);
          border-radius: 50%;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .error-msg {
          color: #E07070;
          font-size: 0.8rem;
          letter-spacing: 0.05em;
        }

        .loading-wrapper {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          color: var(--text-muted);
          font-size: 0.78rem;
          letter-spacing: 0.1em;
          margin-top: 1rem;
        }

        .loading-bar {
          width: 80px;
          height: 1px;
          background: var(--border);
          overflow: hidden;
          border-radius: 2px;
        }

        .loading-bar-inner {
          height: 100%;
          background: var(--gold);
          animation: loadbar 1.4s ease-in-out infinite;
        }

        @keyframes loadbar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          position: relative;
          z-index: 1;
        }

        @media (max-width: 768px) {
          .grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.75rem;
          }
          .nearby-root {
            padding: 2rem 1rem 3rem;
          }
        }

        @media (max-width: 420px) {
          .grid { gap: 0.6rem; }
        }

        .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 4px;
          overflow: hidden;
          position: relative;
          cursor: default;
          transition: border-color 0.4s ease, transform 0.4s ease, box-shadow 0.4s ease;
          animation: fadeUp 0.6s ease both;
        }

        .card:hover {
          border-color: rgba(198,169,110,0.4);
          transform: translateY(-4px);
          box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(198,169,110,0.06);
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .card:nth-child(1) { animation-delay: 0.05s; }
        .card:nth-child(2) { animation-delay: 0.10s; }
        .card:nth-child(3) { animation-delay: 0.15s; }
        .card:nth-child(4) { animation-delay: 0.20s; }
        .card:nth-child(5) { animation-delay: 0.25s; }
        .card:nth-child(6) { animation-delay: 0.30s; }

        .card-img-wrap {
          position: relative;
          width: 100%;
          padding-top: 48%;
          overflow: hidden;
        }

        .card-img-wrap img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s ease;
          filter: brightness(0.85) saturate(0.9);
        }

        .card:hover .card-img-wrap img {
          transform: scale(1.06);
        }

        .card-img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent 40%, rgba(8,8,8,0.7) 100%);
        }

        .card-distance {
          position: absolute;
          top: 0.55rem;
          right: 0.55rem;
          background: rgba(8,8,8,0.75);
          backdrop-filter: blur(8px);
          border: 1px solid var(--border);
          border-radius: 2px;
          padding: 0.15rem 0.45rem;
          font-size: 0.6rem;
          letter-spacing: 0.1em;
          color: var(--gold-light);
        }

        .card-body {
          padding: 0.7rem 0.85rem 0.9rem;
          background: var(--surface);
        }

        .card-category {
          font-size: 0.55rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--gold);
          margin-bottom: 0.25rem;
          opacity: 0.8;
        }

        .card-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(0.9rem, 2vw, 1.1rem);
          font-weight: 400;
          line-height: 1.2;
          color: #fff;
          letter-spacing: 0.01em;
        }

        .card-divider {
          width: 1.2rem;
          height: 1px;
          background: var(--gold-dark);
          opacity: 0.5;
          margin: 0.5rem 0 0.55rem;
        }

        .rating-row {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .stars {
          display: flex;
          align-items: center;
          gap: 1px;
          line-height: 1;
        }

        .star {
          font-size: 0.65rem;
          line-height: 1;
        }

        .star-full {
          color: var(--gold);
        }

        .star-half {
          background: linear-gradient(90deg, var(--gold) 50%, rgba(255,255,255,0.15) 50%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .star-empty {
          color: rgba(255,255,255,0.15);
        }

        .rating-value {
          font-size: 0.65rem;
          font-weight: 500;
          color: var(--gold-light);
          letter-spacing: 0.04em;
        }

        .review-count {
          font-size: 0.58rem;
          color: var(--text-muted);
          letter-spacing: 0.03em;
        }

        .show-more-wrap {
          position: relative;
          z-index: 1;
          display: flex;
          justify-content: center;
          margin-top: 3rem;
        }

        .show-more-btn {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--gold-light);
          padding: 0.8rem 2.5rem;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.68rem;
          font-weight: 400;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          cursor: pointer;
          border-radius: 2px;
          transition: all 0.35s ease;
          position: relative;
          overflow: hidden;
        }

        .show-more-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(198,169,110,0.1), transparent);
          opacity: 0;
          transition: opacity 0.35s ease;
        }

        .show-more-btn:hover {
          border-color: rgba(198,169,110,0.5);
          color: #fff;
          letter-spacing: 0.3em;
        }

        .show-more-btn:hover::before {
          opacity: 1;
        }

        .count-label {
          position: relative;
          z-index: 1;
          text-align: center;
          margin-top: 1.25rem;
          font-size: 0.65rem;
          letter-spacing: 0.15em;
          color: var(--text-muted);
        }

        /* ── Skeleton ── */
        .skeleton-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          position: relative;
          z-index: 1;
        }

        @media (max-width: 768px) {
          .skeleton-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
        }

        .skeleton-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 4px;
          overflow: hidden;
          animation: fadeUp 0.4s ease both;
        }

        .skeleton-card:nth-child(1) { animation-delay: 0.05s; }
        .skeleton-card:nth-child(2) { animation-delay: 0.10s; }
        .skeleton-card:nth-child(3) { animation-delay: 0.15s; }
        .skeleton-card:nth-child(4) { animation-delay: 0.20s; }
        .skeleton-card:nth-child(5) { animation-delay: 0.25s; }
        .skeleton-card:nth-child(6) { animation-delay: 0.30s; }

        .skeleton-img {
          width: 100%;
          padding-top: 48%;
          background: var(--surface-2);
          position: relative;
          overflow: hidden;
        }

        .skeleton-body {
          padding: 0.7rem 0.85rem 0.9rem;
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .skeleton-line {
          border-radius: 2px;
          background: var(--surface-2);
          position: relative;
          overflow: hidden;
        }

        .skeleton-line::after,
        .skeleton-img::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(198,169,110,0.09) 50%,
            transparent 100%
          );
          animation: shimmer 1.6s ease-in-out infinite;
        }

        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .sk-cat   { height: 7px;  width: 38%; }
        .sk-name  { height: 13px; width: 70%; }
        .sk-div   { height: 1px;  width: 1.2rem; opacity: 0.3; }
        .sk-stars { height: 7px;  width: 50%; }
      `}</style>

      <div className="nearby-root">
        <div className="header">
          <div className="eyebrow">Discover</div>
          <h1 className="title">
            What's <em>Nearby</em>
          </h1>

          {locationName && (
            <div className="location-pill">
              <span className="location-dot" />
              {locationName}
            </div>
          )}

          {locationError && (
            <p className="error-msg">Location access required to discover nearby places.</p>
          )}


        </div>


        {loading && (
          <div className="skeleton-grid">
            {Array(6).fill(0).map((_, i) => (
              <div className="skeleton-card" key={i}>
                <div className="skeleton-img" />
                <div className="skeleton-body">
                  <div className="skeleton-line sk-cat" />
                  <div className="skeleton-line sk-name" />
                  <div className="skeleton-line sk-div" />
                  <div className="skeleton-line sk-stars" />
                </div>
              </div>
            ))}
          </div>
        )}

        {visiblePlaces.length > 0 && (
          <>
            <div className="grid">
              {visiblePlaces.map((place, index) => (
                <div className="card" key={index}>
                  <div className="card-img-wrap">
                    <img src={place.image} alt={place.name} />
                    <div className="card-img-overlay" />
                    <div className="card-distance">{place.distance_km} km</div>
                  </div>
                  <div className="card-body">
                    <div className="card-category">{place.category}</div>
                    <div className="card-name">{place.name}</div>
                    <div className="card-divider" />
                    {place.rating !== undefined && (
                      <StarRating rating={place.rating} reviewCount={place.review_count} />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="show-more-wrap">
                <button
                  className="show-more-btn"
                  onClick={() => setVisibleCount((v) => v + LOAD_MORE_COUNT)}
                >
                  Show More
                </button>
              </div>
            )}

            {places.length > 0 && (
              <p className="count-label">
                {Math.min(visibleCount, places.length)} of {places.length} places
              </p>
            )}
          </>
        )}
      </div>
    </>
  );
}