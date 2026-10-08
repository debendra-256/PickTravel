import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Award, Car, ChevronLeft, ChevronRight, Clock, CreditCard, MapPin, Plane, ShieldCheck, Sparkles, Tag, Users } from "lucide-react";
import { APP_CONFIG } from "../config/app.config";
import { assetUrl } from "../config/assetUrl";
import { FestiveOfferStrip } from "./FestiveOfferStrip";

const offers = [
  {
    id: "welcome",
    icon: Tag,
    eyebrow: "A little something for your trip",
    headline: "₹500 OFF",
    detail: "Enjoy a discount on your next cab booking.",
    code: APP_CONFIG.COUPON_CODE,
    tone: "red"
  },
  {
    id: "airport",
    icon: Plane,
    eyebrow: "Airport transfers",
    headline: "LAND. RELAX. RIDE.",
    detail: "Reliable pickup and drop at Biju Patnaik International Airport.",
    code: "ON-TIME PICKUP",
    tone: "blue"
  },
  {
    id: "group",
    icon: Users,
    eyebrow: "Travel together",
    headline: "ROOM FOR EVERYONE",
    detail: "Choose from spacious vehicles for family and group journeys.",
    code: "EXPLORE OUR FLEET",
    tone: "green"
  },
  {
    id: "outstation",
    icon: Car,
    eyebrow: "Make the journey yours",
    headline: "OUTSTATION, YOUR WAY",
    detail: "Plan a comfortable trip across Odisha with a local driver.",
    code: "START YOUR TRIP",
    tone: "purple"
  },
  {
    id: "diwali",
    icon: Sparkles,
    eyebrow: "Celebrate the Festival of Lights",
    headline: "DIWALI RIDES, MADE BRIGHTER",
    detail: "Make festive visits easy with a comfortable ride for family and friends.",
    code: "BOOK NOW",
    tone: "diwali"
  }
];

const serviceHighlights = [
  { icon: Award, title: "Trusted local drivers" },
  { icon: MapPin, title: "Odisha route experts" },
  { icon: Clock, title: "24×7 travel support" },
  { icon: ShieldCheck, title: "Clear, upfront fares" },
  { icon: CreditCard, title: "UPI, cards, net banking & cash" },
  { icon: Car, title: "Vehicles for every group" }
];

export function OfferScroller({ onBook }) {
  const trackRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((index) => {
    const track = trackRef.current;
    if (!track) return;
    const nextIndex = (index + offers.length) % offers.length;
    const card = track.querySelectorAll(".offer-card")[nextIndex];
    if (!card) return;
    const left = card.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft;
    track.scrollTo({ left, behavior: "smooth" });
    setActiveIndex(nextIndex);
  }, []);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = window.setInterval(() => goTo(activeIndex + 1), 5000);
    return () => window.clearInterval(timer);
  }, [activeIndex, goTo, paused]);

  return (
    <section className="offer-scroller-section" aria-label="Travel offers and highlights">
      <div className="service-ribbon" aria-label="Pick My Travels service highlights">
        <div className="service-ribbon-track">
          {[0, 1].map((copy) => (
            <div className="service-ribbon-group" key={copy} aria-hidden={copy === 1 ? "true" : undefined}>
              {serviceHighlights.map(({ icon: Icon, title }) => (
                <div className="service-ribbon-item" key={title}>
                  <Icon size={23} strokeWidth={1.8} aria-hidden="true" />
                  <span>{title}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <FestiveOfferStrip />
      <div className="offer-scroller-heading">
        <div>
          <span className="offer-scroller-kicker">GOOD TRIPS, GREAT EXTRAS</span>
          <h3>Offers for the road ahead</h3>
        </div>
        <div className="offer-scroller-arrows">
          <button type="button" onClick={() => goTo(activeIndex - 1)} aria-label="Previous offers"><ChevronLeft size={20} /></button>
          <button type="button" onClick={() => goTo(activeIndex + 1)} aria-label="Next offers"><ChevronRight size={20} /></button>
        </div>
      </div>
      <div
        className="offer-scroller-track"
        ref={trackRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
        }}
        onScroll={(event) => {
          const track = event.currentTarget;
          const cards = [...track.querySelectorAll(".offer-card")];
          const nearest = cards.reduce((best, card, index) => {
            const distance = Math.abs(card.getBoundingClientRect().left - track.getBoundingClientRect().left);
            return distance < best.distance ? { index, distance } : best;
          }, { index: 0, distance: Number.POSITIVE_INFINITY });
          setActiveIndex((current) => current === nearest.index ? current : nearest.index);
        }}
      >
        {offers.map((offer) => {
          const Icon = offer.icon;
          return (
            <article className={`offer-card offer-card-${offer.tone}`} key={offer.id}>
              {offer.id === "diwali" && <img className="offer-diwali-art" src={assetUrl("diwali-lakshmi.png")} alt="" aria-hidden="true" />}
              <div className="offer-card-top">
                <span className="offer-card-icon"><Icon size={25} strokeWidth={2.2} /></span>
                <span className="offer-card-eyebrow">{offer.eyebrow}</span>
              </div>
              <h4>{offer.headline}</h4>
              <p>{offer.detail}</p>
              <button type="button" className="offer-card-action" onClick={onBook}>
                {offer.code}<ArrowRight size={16} />
              </button>
            </article>
          );
        })}
      </div>
      <div className="offer-scroller-dots" aria-label="Choose an offer">
        {offers.map((offer, index) => (
          <button
            type="button"
            key={offer.id}
            className={index === activeIndex ? "active" : ""}
            onClick={() => goTo(index)}
            aria-label={`Show offer ${index + 1}`}
            aria-current={index === activeIndex ? "true" : undefined}
          />
        ))}
      </div>
      <p className="offer-scroller-hint">Swipe or scroll to explore</p>
    </section>
  );
}
