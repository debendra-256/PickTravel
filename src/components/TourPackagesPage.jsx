import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  ChevronRight,
  Clock3,
  Landmark,
  MapPin,
  MessageSquare,
  Palmtree,
  PawPrint,
  Phone
} from "lucide-react";
import { APP_CONFIG } from "../config/app.config";
import { assetUrl } from "../config/assetUrl";
import { TOUR_PACKAGE_CATEGORIES, loadTourPackages } from "../config/tourPackages";

const FALLBACK_IMAGE = "Gallery-Images/Gallery/konark-sun-temple.jpeg";
const HERO_IMAGE = "Gallery-Images/Gallery/konark-sun-temple.jpeg";

const resolveImage = (url) => {
  if (!url) return assetUrl(FALLBACK_IMAGE);
  return /^https?:\/\//i.test(url) ? url : assetUrl(url);
};

const readSlugFromHash = () => {
  const match = window.location.hash.match(/^#\/tour-packages\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : null;
};

const setPackageHash = (slug) => {
  const nextHash = slug ? `#/tour-packages/${slug}` : "#/tour-packages";
  if (window.location.hash !== nextHash) window.location.hash = nextHash;
};

function CategoryBadge({ name, size = 14 }) {
  if (name === "Spiritual Tours") return <Landmark size={size} />;
  if (name === "Odisha Vacation Tours") return <Palmtree size={size} />;
  if (name === "Wildlife Tours") return <PawPrint size={size} />;
  return <MapPin size={size} />;
}

function PackageCard({ pkg, onOpen }) {
  return (
    <article className="tp-card">
      <button
        type="button"
        className="tp-card-media"
        onClick={() => onOpen(pkg)}
        aria-label={`View details for ${pkg.title}`}
      >
        <img src={resolveImage(pkg.image)} alt={pkg.title} loading="lazy" />
        <span className="tp-card-duration">
          <Clock3 size={13} /> {pkg.duration}
        </span>
      </button>
      <div className="tp-card-body">
        <span className="tp-card-category">
          <CategoryBadge name={pkg.category} size={13} /> {pkg.category}
        </span>
        <h3>{pkg.title}</h3>
        <p>{pkg.summary}</p>
        <div className="tp-card-footer">
          <span className="tp-card-price">
            <small>Package price</small>
            {pkg.price}
          </span>
          <button type="button" className="tp-card-link" onClick={() => onOpen(pkg)}>
            View details <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </article>
  );
}

function PackageDetail({ pkg, onBack, onOpenEnquiry }) {
  const whatsappHref = APP_CONFIG.getWhatsappLink(
    `Hi Pick My Travels, I'm interested in the "${pkg.title}" package (${pkg.duration}). Please share the best quote and itinerary.`
  );
  const callHref = `tel:${APP_CONFIG.TOLL_FREE.replace(/\s+/g, "")}`;

  return (
    <>
      <div className="tp-detail-hero">
        <div
          className="tp-detail-hero-bg"
          style={{ backgroundImage: `url(${resolveImage(pkg.image)})` }}
          aria-hidden="true"
        />
        <div className="tp-detail-hero-overlay" aria-hidden="true" />
        <div className="container tp-detail-hero-inner">
          <nav className="tp-breadcrumb" aria-label="Breadcrumb">
            <span>Home</span>
            <ChevronRight size={13} />
            <button type="button" onClick={onBack}>Tour Packages</button>
            <ChevronRight size={13} />
            <span>{pkg.category}</span>
          </nav>
          <button type="button" className="tp-back-btn" onClick={onBack}>
            <ArrowLeft size={16} /> Back to packages
          </button>
          <span className="tp-detail-category">
            <CategoryBadge name={pkg.category} /> {pkg.category}
          </span>
          <h1>{pkg.title}</h1>
          <p className="tp-detail-subtitle">{pkg.bestFor}</p>
          <div className="tp-detail-meta">
            <span><Clock3 size={15} /> {pkg.duration}</span>
            <span><Calendar size={15} /> Flexible departure dates</span>
            <span><MapPin size={15} /> Odisha, India</span>
          </div>
        </div>
      </div>

      <div className="container tp-detail-body">
        <div className="tp-detail-main">
          <section className="tp-detail-section">
            <h2>Package overview</h2>
            <p>{pkg.summary}</p>
          </section>

          <section className="tp-detail-section">
            <h2>Tour highlights</h2>
            <ul className="tp-highlight-list">
              {pkg.highlights.map((item) => (
                <li key={item}><Check size={16} /> {item}</li>
              ))}
            </ul>
          </section>

          <section className="tp-detail-section">
            <h2>Day-wise itinerary</h2>
            <ol className="tp-itinerary">
              {pkg.itinerary.map((day) => (
                <li key={day.day}>
                  <span className="tp-day-badge">{day.day}</span>
                  <div>
                    <h3>{day.title}</h3>
                    <p>{day.details}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="tp-detail-section">
            <h2>Frequently asked questions</h2>
            <div className="tp-faq">
              <details>
                <summary>Can I customise this itinerary?</summary>
                <p>Yes. Tell us your travel dates, group size, and must-see places, and we will adjust the route and duration before confirming.</p>
              </details>
              <details>
                <summary>Are hotels included in the package?</summary>
                <p>Our quote can include hotel stay on request. Share your preferred budget and category, and we will suggest suitable options.</p>
              </details>
              <details>
                <summary>What type of vehicle will be provided?</summary>
                <p>We use air-conditioned sedans for small groups, SUVs for families, and tempo travellers for larger groups. The vehicle is confirmed with your quote.</p>
              </details>
            </div>
          </section>
        </div>

        <aside className="tp-detail-aside">
          <div className="tp-quote-card">
            <span className="tp-quote-eyebrow">Plan this trip</span>
            <strong>{pkg.title}</strong>
            <span className="tp-quote-duration"><Clock3 size={14} /> {pkg.duration}</span>
            <p>Call or WhatsApp us for a personalised quote and the best available dates.</p>
            <a className="btn-primary" href={whatsappHref} target="_blank" rel="noopener noreferrer">
              <MessageSquare size={16} /> Enquire on WhatsApp
            </a>
            <button type="button" className="btn-outline" onClick={onOpenEnquiry}>
              Send an enquiry
            </button>
            <a className="tp-call-link" href={callHref}>
              <Phone size={15} /> {APP_CONFIG.DISPLAY_WHATSAPP}
            </a>
          </div>

          <div className="tp-includes-card">
            <h3>Inclusions</h3>
            <ul>
              {pkg.inclusions.map((item) => (
                <li key={item}><Check size={14} /> {item}</li>
              ))}
            </ul>
            <h3>Exclusions</h3>
            <ul className="tp-exclusions">
              {pkg.exclusions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}

export function TourPackagesPage({ category = "All", onOpenEnquiry }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(category);
  const [selectedSlug, setSelectedSlug] = useState(readSlugFromHash);

  useEffect(() => {
    let active = true;

    loadTourPackages()
      .then((data) => {
        if (!active) return;
        setPackages(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load tour packages:", error);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleHashChange = () => setSelectedSlug(readSlugFromHash());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const selectedPackage = useMemo(
    () => packages.find((pkg) => pkg.slug === selectedSlug) || null,
    [packages, selectedSlug]
  );

  const categoryNames = useMemo(() => {
    const known = TOUR_PACKAGE_CATEGORIES.map((item) => item.name);
    const extra = [...new Set(packages.map((pkg) => pkg.category))].filter((name) => !known.includes(name));
    return [...known, ...extra];
  }, [packages]);

  const groups = useMemo(
    () =>
      categoryNames
        .map((name) => ({ name, items: packages.filter((pkg) => pkg.category === name) }))
        .filter((group) => group.items.length),
    [categoryNames, packages]
  );

  const visibleGroups = selectedCategory === "All"
    ? groups
    : groups.filter((group) => group.name === selectedCategory);

  const openPackage = (pkg) => {
    setSelectedSlug(pkg.slug);
    setPackageHash(pkg.slug);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closePackage = () => {
    setSelectedSlug(null);
    setPackageHash(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <section className="tour-packages-page">
        <div className="tp-loading container">Loading tour packages…</div>
      </section>
    );
  }

  if (selectedPackage) {
    return (
      <section className="tour-packages-page">
        <PackageDetail pkg={selectedPackage} onBack={closePackage} onOpenEnquiry={onOpenEnquiry} />
      </section>
    );
  }

  return (
    <section className="tour-packages-page">
      <div className="tp-hero">
        <div
          className="tp-hero-bg"
          style={{ backgroundImage: `url(${assetUrl(HERO_IMAGE)})` }}
          aria-hidden="true"
        />
        <div className="tp-hero-overlay" aria-hidden="true" />
        <div className="container tp-hero-inner">
          <nav className="tp-breadcrumb" aria-label="Breadcrumb">
            <span>Home</span>
            <ChevronRight size={13} />
            <span>Tour Packages</span>
          </nav>
          <span className="tp-script">Holiday Tour Packages</span>
          <h1>Your Perfect Journey Across Odisha</h1>
          <p>
            Spiritual circuits, family holidays, hill escapes, and wildlife trails — choose a package
            and our team will tailor it to your dates and group.
          </p>
        </div>
      </div>

      <div className="container tp-body">
        <div className="tp-filter" role="tablist" aria-label="Tour package categories">
          <button
            type="button"
            role="tab"
            aria-selected={selectedCategory === "All"}
            className={`tp-filter-btn ${selectedCategory === "All" ? "active" : ""}`}
            onClick={() => setSelectedCategory("All")}
          >
            All Packages <span>{packages.length}</span>
          </button>
          {groups.map((group) => (
            <button
              key={group.name}
              type="button"
              role="tab"
              aria-selected={selectedCategory === group.name}
              className={`tp-filter-btn ${selectedCategory === group.name ? "active" : ""}`}
              onClick={() => setSelectedCategory(group.name)}
            >
              {group.name} <span>{group.items.length}</span>
            </button>
          ))}
        </div>

        {visibleGroups.length ? (
          visibleGroups.map((group) => (
            <section key={group.name} className="tp-category">
              <div className="tp-section-head">
                <div>
                  <span className="tp-section-kicker">Curated for you</span>
                  <h2>{group.name}</h2>
                </div>
                <span className="tp-section-count">{group.items.length} packages</span>
              </div>
              <div className="tp-grid">
                {group.items.map((pkg) => (
                  <PackageCard key={pkg.id} pkg={pkg} onOpen={openPackage} />
                ))}
              </div>
            </section>
          ))
        ) : (
          <div className="tp-empty">No packages found in this category yet.</div>
        )}
      </div>
    </section>
  );
}
