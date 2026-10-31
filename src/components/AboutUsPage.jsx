import React from "react";
import { ArrowUpRight, Award, Building2, Car, CheckCircle2, Clock3, Mail, MapPin, Phone, Route, ShieldCheck, Users } from "lucide-react";
import { APP_CONFIG } from "../config/app.config";
import { assetUrl } from "../config/assetUrl";

const strengths = [
  {
    icon: Route,
    title: "Reliable Car Rental Services",
    description: "Choose from a range of vehicles to suit your travel needs.",
  },
  {
    icon: Route,
    title: "Local & Outstation Travel",
    description: "Explore Bhubaneswar, Puri, and the beautiful destinations of Odisha with ease.",
  },
  {
    icon: Car,
    title: "Comfortable Journeys",
    description: "Enjoy convenient travel for family outings, business trips, and sightseeing tours.",
  },
  {
    icon: Users,
    title: "Customer-Focused Service",
    description: "We strive to make every booking simple and every journey pleasant.",
  },
  {
    icon: ShieldCheck,
    title: "Travel Experience You Can Trust",
    description: "Our experience in the tourism and travel industry helps us understand what travellers need.",
  },
];

export function AboutUsPage() {
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(APP_CONFIG.ADDRESS)}`;
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(APP_CONFIG.ADDRESS)}&output=embed`;

  return (
    <section className="about-us-page">
      <section className="about-us-hero">
        <div className="container about-us-hero-grid">
          <div className="about-us-intro">
            <span className="about-us-eyebrow"><span /> About Pick My Travels</span>
            <h1>Your Trusted Travel Partner in Bhubaneswar</h1>
            <p className="about-us-tagline">Comfortable Journeys. Memorable Experiences. Reliable Service.</p>
            <p>
              Welcome to <strong>Pick My Travels</strong> — your trusted partner for car rentals, taxi services, local sightseeing, and outstation tours across Bhubaneswar, Puri, and Odisha.<br />
              Established in <strong>1999</strong>, Pick My Travels is dedicated to making every journey comfortable, convenient, and hassle-free.<br />
              Whether you need a taxi for local travel, an airport transfer, a family trip, a business journey, or an outstation tour, we offer reliable travel solutions tailored to your needs.
            </p>
            <div className="about-us-hero-facts">
              <span><strong>Since 1999</strong><small>Travel experience</small></span>
              <span><strong>Bhubaneswar & Puri</strong><small>Local expertise</small></span>
              <span><strong>Across Odisha</strong><small>Journeys made easier</small></span>
            </div>
          </div>

          <div className="about-us-brand-card">
            <iframe
              className="about-us-google-map"
              src={mapEmbedUrl}
              title="Pick My Travels office location in Bhubaneswar on Google Maps"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <span className="about-us-map-label"><MapPin size={15} /> Bhubaneswar office</span>
            <div className="about-us-brand-caption">
              <span className="about-us-brand-pin"><MapPin size={18} /></span>
              <div><strong>Pick My Travels</strong><span>{APP_CONFIG.ADDRESS}</span></div>
              <a href={directionsUrl} target="_blank" rel="noopener noreferrer" aria-label="Open Pick My Travels office in Google Maps">
                <ArrowUpRight size={18} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Recognition & Trust Section */}
      <section className="about-us-recognition-section">
        <div className="container about-us-recognition-grid">
          <div className="about-us-recognition-image-wrap">
            <img
              src={assetUrl("about-recognition.jpg")}
              alt="Pick My Travels felicitated at Lok Bhavan, Odisha"
              className="about-us-recognition-image"
              loading="lazy"
            />
            <div className="about-us-recognition-badge">
              <Award size={16} />
              <span>Lok Bhavan, Odisha</span>
            </div>
          </div>
          <div className="about-us-recognition-content">
            <span className="about-us-section-kicker">Honour & Recognition</span>
            <h2>Proudly Serving Odisha with Trust & Excellence</h2>
            <p>
              A moment of immense pride and privilege for the <strong>Pick My Travels</strong> family — being felicitated at <strong>Lok Bhavan, Odisha</strong>.
            </p>
            <p>
              This honour reflects our journey since <strong>1999</strong> and our dedication to delivering safe, dignified, and dependable travel experiences across Bhubaneswar, Puri, and every corner of Odisha.
            </p>
            <div className="about-us-recognition-highlights">
              <div className="about-us-recognition-highlight-item">
                <CheckCircle2 size={18} color="#16a34a" />
                <span>Govt. Approved & Verified Travel Partner</span>
              </div>
              <div className="about-us-recognition-highlight-item">
                <CheckCircle2 size={18} color="#16a34a" />
                <span>Recognised for Reliable Road Transport</span>
              </div>
              <div className="about-us-recognition-highlight-item">
                <CheckCircle2 size={18} color="#16a34a" />
                <span>Trusted by Thousands of Happy Travellers</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container about-us-story">
        <div className="about-us-section-heading">
          <span className="about-us-section-kicker">What sets us apart</span>
          <h2>Why Choose Pick My Travels?</h2>
          <p>We make it easier to plan comfortable and dependable travel around Bhubaneswar, Puri, and Odisha.</p>
        </div>
        <div className="about-us-strength-grid">
          {strengths.map(({ icon: Icon, title, description }, index) => (
            <article className="about-us-strength-card" key={title}>
              <span className={`about-us-strength-icon about-us-strength-icon-${index + 1}`}><Icon size={22} /></span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-us-commitment-section">
        <div className="container about-us-commitment">
          <span className="about-us-section-kicker">Our Commitment</span>
          <h2>Every journey should be more than reaching a destination.</h2>
          <p>
            At Pick My Travels, we believe every journey should be comfortable, safe, and memorable.
            Our goal is to provide dependable transportation and personalised service so you can
            travel with confidence and peace of mind. Whether you are a local resident or visiting
            Odisha, let us help you discover the region’s temples, beaches, cultural attractions,
            and scenic destinations.
          </p>
        </div>
      </section>

      <section className="about-us-office-section">
        <div className="container about-us-office-layout">
          <div className="about-us-office-copy">
            <span className="about-us-section-kicker">Visit or get in touch</span>
            <h2>Our Bhubaneswar office</h2>
            <p>Our team is here to help with your vehicle, route and booking questions.</p>
            <a className="about-us-directions" href={directionsUrl} target="_blank" rel="noopener noreferrer">
              Get directions <ArrowUpRight size={16} />
            </a>
          </div>
          <div className="about-us-office-card">
            <div className="about-us-office-card-icon"><Building2 size={23} /></div>
            <div className="about-us-office-details">
              <span className="about-us-office-label">Pick My Travels</span>
              <address>{APP_CONFIG.ADDRESS}</address>
              <a href={`tel:${APP_CONFIG.TOLL_FREE.replace(/\s+/g, "")}`}><Phone size={16} /> {APP_CONFIG.TOLL_FREE}</a>
              <a href={`mailto:${APP_CONFIG.EMAIL}`}><Mail size={16} /> {APP_CONFIG.EMAIL}</a>
            </div>
            <div className="about-us-office-hours"><Clock3 size={15} /> Travel support available 24/7</div>
          </div>
        </div>
        <div className="container about-us-closing-tagline">Pick My Travels — Your Journey, Our Responsibility.</div>
      </section>
    </section>
  );
}
