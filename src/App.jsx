import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { BookingTabs } from "./components/BookingTabs";
import { FleetSection } from "./components/FleetSection";
import { RateChartPage } from "./components/RateChartPage";
import { AboutUsPage } from "./components/AboutUsPage";
import { GalleryPage } from "./components/GalleryPage";
import { TourPackagesPage } from "./components/TourPackagesPage";
import { BlogSection } from "./components/BlogSection";
import { AdminDashboard } from "./components/AdminDashboard";
import { AuthModal } from "./components/AuthModal";
import { AddCarModal } from "./components/AddCarModal";
import { FeedbackModal } from "./components/FeedbackModal";
import { FeedbackFloatTab } from "./components/FeedbackFloatTab";
import { WhatsappButton } from "./components/WhatsappButton";
import { GoogleReviewsCarousel } from "./components/GoogleReviewsCarousel";
import { OfferScroller } from "./components/OfferScroller";
import { AuthBAL } from "./bal/AuthBAL";
import { GlobalSpinner } from "./components/GlobalSpinner";

export default function App() {
  const [activePage, setActivePage] = useState(() =>
    window.location.hash.startsWith("#/tour-packages") ? "packages" : "home"
  );
  const [session, setSession] = useState(null);

  // Cars reactivity version counter
  const [carsVersion, setCarsVersion] = useState(0);
  const [carToEdit, setCarToEdit] = useState(null);

  // SubMenu navigation selections
  const [bookingTab, setBookingTab] = useState("Local Trip");
  const [packagesCategory, setPackagesCategory] = useState("All");

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [addCarModalOpen, setAddCarModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackModalMode, setFeedbackModalMode] = useState("feedback");

  useEffect(() => {
    let active = true;
    AuthBAL.restoreSession().then((user) => { if (active) setSession(user); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const preventContextMenu = (event) => event.preventDefault();
    document.addEventListener("contextmenu", preventContextMenu);
    return () => document.removeEventListener("contextmenu", preventContextMenu);
  }, []);

  useEffect(() => {
    if (activePage !== "packages" && window.location.hash.startsWith("#/tour-packages")) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, [activePage]);

  const handleLoginSuccess = (userSession) => {
    setSession(userSession);
    setActivePage("admin");
  };

  const handleLogout = () => {
    AuthBAL.logout();
    setSession(null);
    setActivePage("home");
  };

  const handleBookingSuccess = (booking) => {
    console.log("New Booking saved to DAL:", booking);
  };

  const handleOpenAddCar = () => {
    setCarToEdit(null);
    setAddCarModalOpen(true);
  };

  const handleOpenEditCar = (car) => {
    setCarToEdit(car);
    setAddCarModalOpen(true);
  };

  const handleOpenContactModal = (mode) => {
    setFeedbackModalMode(mode);
    setFeedbackModalOpen(true);
  };

  const handleCarSaved = () => {
    setCarsVersion((prev) => prev + 1);
    setActivePage("fleet");
  };

  const handlePackageCategory = (category) => {
    setPackagesCategory(category);
    setActivePage("packages");
    if (window.location.hash.startsWith("#/tour-packages/")) {
      window.location.hash = "#/tour-packages";
    }
  };

  const handlePackageLink = (slug) => {
    setActivePage("packages");
    window.location.hash = `#/tour-packages/${slug}`;
  };

  return (
    <div className={activePage === "rates" ? "rate-chart-print-mode" : ""} style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header Bar */}
      <Header
        activeTab={activePage}
        setActiveTab={setActivePage}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenAdmin={() => {
          if (!session) {
            setAuthModalOpen(true);
          } else {
            setActivePage("admin");
          }
        }}
        session={session}
        onOpenFeedback={() => handleOpenContactModal("feedback")}
        onOpenEnquiry={() => handleOpenContactModal("enquiry")}
        onSelectBookingTab={(tab) => {
          setBookingTab(tab);
          setActivePage("home");
        }}
        onSelectPackageCategory={handlePackageCategory}
        onSelectPackageLink={handlePackageLink}
        onSelectFleetFilter={() => {
          setActivePage("fleet");
        }}
      />

      {/* Main Page Routing */}
      <main style={{ flex: 1 }}>
        {activePage === "home" && (
          <>
            {/* Hero Booking Engine Tabs */}
            <BookingTabs
              onBookingSuccess={handleBookingSuccess}
              carsVersion={carsVersion}
              initialTab={bookingTab}
            />

            {/* Why Choose Us Section */}
            <section className="offer-only-section" style={{ background: "#ffffff" }}>
              <div className="container">
                <OfferScroller onBook={() => document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" })} />
              </div>
            </section>

            {/* Fleet Showcase */}
            <FleetSection
              carsVersion={carsVersion}
            />

            {/* Blogs Section */}
            <BlogSection />
          </>
        )}

        {activePage === "fleet" && (
          <FleetSection
            carsVersion={carsVersion}
          />
        )}

        {activePage === "blogs" && <BlogSection />}

        {activePage === "gallery" && <GalleryPage />}

        {activePage === "packages" && (
          <TourPackagesPage
            key={packagesCategory}
            category={packagesCategory}
            onOpenEnquiry={() => handleOpenContactModal("enquiry")}
          />
        )}

        {activePage === "rates" && <RateChartPage carsVersion={carsVersion} />}

        {activePage === "about" && <AboutUsPage />}

        {activePage === "admin" && (
          <AdminDashboard
            session={session}
            carsVersion={carsVersion}
            onCarsChange={() => setCarsVersion((prev) => prev + 1)}
            onOpenAddCar={handleOpenAddCar}
            onEditCar={handleOpenEditCar}
            onOpenAuthModal={() => setAuthModalOpen(true)}
          />
        )}
      </main>

      {activePage === "home" && <GoogleReviewsCarousel />}

      {/* Footer & Floating WhatsApp */}
      <Footer
        setActiveTab={setActivePage}
        onOpenAuthModal={() => setAuthModalOpen(true)}
        onOpenFeedback={() => handleOpenContactModal("feedback")}
        showFeedback={activePage === "home"}
      />

      {activePage === "home" && !feedbackModalOpen && (
        <FeedbackFloatTab
          onOpenFeedback={() => handleOpenContactModal("feedback")}
          onOpenEnquiry={() => handleOpenContactModal("enquiry")}
        />
      )}

      <WhatsappButton />

      <GlobalSpinner />

      {/* Global Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        session={session}
        onLoginSuccess={handleLoginSuccess}
      />

      <AddCarModal
        isOpen={addCarModalOpen && !!session}
        carToEdit={carToEdit}
        onClose={() => {
          setAddCarModalOpen(false);
          setCarToEdit(null);
        }}
        onCarAdded={handleCarSaved}
      />

      <FeedbackModal
        isOpen={feedbackModalOpen}
        mode={feedbackModalMode}
        onClose={() => setFeedbackModalOpen(false)}
      />
    </div>
  );
}
