import React, { useState } from "react";
import { OfferBannerBAL } from "../bal/OfferBannerBAL";

export function FestiveOfferStrip() {
  const [offer] = useState(() => OfferBannerBAL.getOfferBanner());
  if (!offer.enabled || !(offer.title || offer.message || offer.code)) return null;

  return (
    <div className="top-festive-offer-strip" aria-label="Festive offer">
      <div className="festive-bulb-string" aria-hidden="true">
        {Array.from({ length: 14 }, (_, index) => (
          <span
            className="festive-bulb"
            key={index}
            style={{ "--bulb-delay": `${(index % 7) * 0.19}s`, "--bulb-hue": `${(index % 4) * 18 + 8}deg` }}
          />
        ))}
      </div>
      <div className="festive-road" aria-hidden="true">
        <div className="festive-road-plants">
          {Array.from({ length: 12 }, (_, index) => <span key={index} />)}
        </div>
      </div>
      <div className="festive-roadside-trees" aria-hidden="true">
        <img className="festive-roadside-tree festive-roadside-tree-left" src="/festive-roadside-tree.png" alt="" />
        <img className="festive-roadside-tree festive-roadside-tree-center" src="/festive-roadside-tree-pink.png" alt="" />
        <img className="festive-roadside-tree festive-roadside-tree-right" src="/festive-roadside-tree.png" alt="" />
      </div>
      <div className="festive-car-track" aria-hidden="true">
        <div className="festive-moving-car">
          <img className="festive-moving-car-image" src="/swift-dzire-white.png" alt="" />
          <span className="festive-car-wheel festive-car-wheel-front" />
          <span className="festive-car-wheel festive-car-wheel-rear" />
        </div>
        <div className="festive-moving-vehicle festive-moving-bus" aria-hidden="true">
          <img className="festive-moving-bus-image" src="/shyamoli-bus-green.png" alt="" />
          <span className="festive-bus-brand"><span className="festive-bus-brand-text">PICKMYTRAVELS.com</span></span>
          <span className="festive-bus-wheel festive-bus-wheel-one" />
          <span className="festive-bus-wheel festive-bus-wheel-two" />
          <span className="festive-bus-wheel festive-bus-wheel-three" />
        </div>
      </div>
      <div className="top-festive-offer-content">
        {offer.title && (
          <strong>{offer.title}</strong>
        )}
        {offer.message && <span>{offer.message}</span>}
        {offer.code && <b>USE CODE: {offer.code}</b>}
      </div>
    </div>
  );
}
