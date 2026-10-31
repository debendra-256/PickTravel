import React, { useEffect, useState } from "react";
import { APP_CONFIG } from "../config/app.config";
import { assetUrl } from "../config/assetUrl";
import { TOUR_PACKAGE_CATEGORIES, loadTourPackages } from "../config/tourPackages";
import {
  Phone,
  Mail,
  MessageSquare,
  UserCheck,
  Lock,
  Menu,
  X,
  ChevronDown,
  Navigation,
  ArrowRight,
  RotateCw,
  Plane,
  Users,
  LogOut,
  ExternalLink
} from "lucide-react";

export function Header({
  activeTab,
  setActiveTab,
  onOpenAuthModal,
  onOpenAdmin,
  onLogout,
  session,
  onOpenFeedback,
  onOpenEnquiry,
  onSelectBookingTab,
  onSelectPackageCategory,
  onSelectPackageLink,
  onSelectFleetFilter
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSubmenu, setMobileSubmenu] = useState(null); // 'services' | 'fleet' | 'packages'
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [tourPackages, setTourPackages] = useState([]);

  const isAdminDashboard = activeTab === "admin";

  useEffect(() => {
    let active = true;
    loadTourPackages()
      .then((list) => { if (active) setTourPackages(list); })
      .catch((error) => { console.error("Failed to load tour packages:", error); });
    return () => { active = false; };
  }, []);

  const packageGroups = TOUR_PACKAGE_CATEGORIES.map((category) => ({
    ...category,
    items: tourPackages.filter((pkg) => pkg.category === category.name)
  }));

  const handleNavClick = (pageName) => {
    setActiveTab(pageName);
    setMobileMenuOpen(false);
  };

  const handleServiceSelect = (tabName) => {
    setActiveTab("home");
    if (onSelectBookingTab) onSelectBookingTab(tabName);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePackageCategory = (categoryName) => {
    setActiveTab("packages");
    if (onSelectPackageCategory) onSelectPackageCategory(categoryName);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePackageLink = (slug) => {
    setActiveTab("packages");
    if (onSelectPackageLink) onSelectPackageLink(slug);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFleetSelect = (seaterFilter = "ALL") => {
    setActiveTab("fleet");
    if (onSelectFleetFilter) onSelectFleetFilter(seaterFilter);
    setMobileMenuOpen(false);
  };

  const toggleMobileSubmenu = (name) => {
    setMobileSubmenu(mobileSubmenu === name ? null : name);
  };

  return (
    <header>
      {/* Top Contact Bar */}
      <div className="top-bar">
        <div className="container top-bar-content">
          <div className="top-contacts">
            <a href={`tel:${APP_CONFIG.TOLL_FREE.replace(/\s+/g, "")}`} className="top-contact-item">
              <Phone size={14} className="text-red" />
              <span>Toll-Free: <strong>{APP_CONFIG.TOLL_FREE}</strong></span>
            </a>
            <a
              href={APP_CONFIG.getWhatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="top-contact-item"
            >
              <MessageSquare size={14} style={{ color: "#25d366" }} />
              <span>WhatsApp: <strong>{APP_CONFIG.DISPLAY_WHATSAPP}</strong></span>
            </a>
            <a href={`mailto:${APP_CONFIG.EMAIL}`} className="top-contact-item hide-mobile">
              <Mail size={14} />
              <span>{APP_CONFIG.EMAIL}</span>
            </a>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {session ? (
              <div
                className="admin-user-menu hide-mobile"
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) setAdminMenuOpen(false);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setAdminMenuOpen(false);
                }}
              >
                <button
                  type="button"
                  className="admin-user-menu-trigger"
                  aria-haspopup="menu"
                  aria-expanded={adminMenuOpen}
                  onClick={() => setAdminMenuOpen((open) => !open)}
                >
                  <UserCheck size={15} />
                  <span>{session.username}</span>
                  <ChevronDown size={13} />
                </button>
                {adminMenuOpen && (
                  <div className="admin-user-menu-dropdown" role="menu" aria-label="Admin account">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setAdminMenuOpen(false);
                        onOpenAdmin?.();
                      }}
                    >
                      <UserCheck size={15} />
                      Dashboard
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="admin-user-menu-logout"
                      onClick={() => {
                        setAdminMenuOpen(false);
                        onLogout?.();
                      }}
                    >
                      <LogOut size={15} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="hide-mobile"
                style={{
                  background: "transparent",
                  color: "#cbd5e1",
                  fontSize: "0.82rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem"
                }}
              >
                <Lock size={13} />
                <span>Admin Login</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav className="main-header">
        <div className="container nav-container">
          {/* Brand Logo */}
          <div className="logo-brand" style={{ cursor: "pointer" }} onClick={() => handleNavClick("home")}>
            <img className="site-logo-image" src={assetUrl("picklogo.png")} alt="Pick My Travels" />
          </div>

          {/* HIDE ALL PUBLIC MENUS IF ON ADMIN DASHBOARD AFTER LOGIN */}
          {!isAdminDashboard ? (
            <>
              {/* Desktop Navigation Menu with SubMenus */}
              <ul className="nav-menu hide-mobile-menu">
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === "home" ? "active" : ""}`}
                    onClick={() => handleNavClick("home")}
                  >
                    Home
                  </button>
                </li>

                {/* SubMenu 1: Taxi Services */}
                <li className="nav-item dropdown">
                  <button className="nav-link dropdown-toggle">
                    <span>Taxi Services</span>
                    <ChevronDown size={14} />
                  </button>
                  <div className="dropdown-menu">
                    <button className="dropdown-item" onClick={() => handleServiceSelect("Local Trip")}>
                      <Navigation size={18} className="text-red" />
                      <div>
                        <div className="dropdown-title">Local City Cab</div>
                        <div className="dropdown-desc">8 Hrs / 12 Hrs Package Rentals</div>
                      </div>
                    </button>

                    <button className="dropdown-item" onClick={() => handleServiceSelect("One Way")}>
                      <ArrowRight size={18} className="text-red" />
                      <div>
                        <div className="dropdown-title">Outstation One Way</div>
                        <div className="dropdown-desc">Inter-city & Point to Point Cabs</div>
                      </div>
                    </button>

                    <button className="dropdown-item" onClick={() => handleServiceSelect("Round Trip")}>
                      <RotateCw size={18} className="text-red" />
                      <div>
                        <div className="dropdown-title">Outstation Round Trip</div>
                        <div className="dropdown-desc">Multi-day Outstation Tour Cabs</div>
                      </div>
                    </button>

                    <button className="dropdown-item" onClick={() => handleServiceSelect("Airport Transfer")}>
                      <Plane size={18} className="text-red" />
                      <div>
                        <div className="dropdown-title">Airport Pickup & Drop</div>
                        <div className="dropdown-desc">24/7 BJU Airport Doorstep Taxi</div>
                      </div>
                    </button>
                  </div>
                </li>

                {/* SubMenu 2: Our Fleet */}
                <li className="nav-item dropdown">
                  <button
                    className={`nav-link dropdown-toggle ${activeTab === "fleet" ? "active" : ""}`}
                    onClick={() => handleNavClick("fleet")}
                  >
                    <span>Our Fleet</span>
                    <ChevronDown size={14} />
                  </button>
                  <div className="dropdown-menu">
                    <button className="dropdown-item" onClick={() => handleFleetSelect("ALL")}>
                      <Navigation size={18} className="text-red" />
                      <div>
                        <div className="dropdown-title">All Vehicles & Rates</div>
                        <div className="dropdown-desc">Sedans, SUVs, Vans & Buses</div>
                      </div>
                    </button>

                    <button className="dropdown-item" onClick={() => handleFleetSelect("4")}>
                      <Users size={18} className="text-red" />
                      <div>
                        <div className="dropdown-title">4-Seater Sedans</div>
                        <div className="dropdown-desc">Swift Dzire, Etios, Aura</div>
                      </div>
                    </button>

                    <button className="dropdown-item" onClick={() => handleFleetSelect("7")}>
                      <Users size={18} className="text-red" />
                      <div>
                        <div className="dropdown-title">6 & 7-Seater SUVs</div>
                        <div className="dropdown-desc">Innova Crysta, Ertiga, Carens</div>
                      </div>
                    </button>

                    <button className="dropdown-item" onClick={() => handleFleetSelect("12")}>
                      <Users size={18} className="text-red" />
                      <div>
                        <div className="dropdown-title">12-26 Seater Tempo Travellers</div>
                        <div className="dropdown-desc">Spacious AC Vans & Mini Buses</div>
                      </div>
                    </button>
                  </div>
                </li>

                {/* SubMenu 3: Tour Packages */}
                <li className="nav-item dropdown">
                  <button
                    className={`nav-link dropdown-toggle ${activeTab === "packages" ? "active" : ""}`}
                    onClick={() => handlePackageCategory("All")}
                  >
                    <span>Tour Packages</span>
                    <ChevronDown size={14} />
                  </button>
                  <div className="dropdown-menu tour-mega">
                    {packageGroups.map((group) => {
                      const CategoryIcon = group.icon;
                      return (
                        <div key={group.name} className="tour-mega-col">
                          <button
                            className="tour-mega-head"
                            onClick={() => handlePackageCategory(group.name)}
                          >
                            <CategoryIcon size={15} className="text-red" />
                            <span>{group.name}</span>
                          </button>
                          <div className="tour-mega-links">
                            {group.items.map((pkg) => (
                              <button
                                key={pkg.id}
                                className="tour-mega-link"
                                onClick={() => handlePackageLink(pkg.slug)}
                              >
                                {pkg.title}
                              </button>
                            ))}
                          </div>
                          <button
                            className="tour-mega-all"
                            onClick={() => handlePackageCategory(group.name)}
                          >
                            View all <ArrowRight size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </li>

                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === "blogs" ? "active" : ""}`}
                    onClick={() => handleNavClick("blogs")}
                  >
                    Blogs
                  </button>
                </li>

                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === "gallery" ? "active" : ""}`}
                    onClick={() => handleNavClick("gallery")}
                  >
                    Gallery
                  </button>
                </li>

                {activeTab === "home" && (
                  <li className="nav-item">
                    <button className="nav-link" onClick={onOpenFeedback}>
                      Contact Us
                    </button>
                  </li>
                )}

                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === "rates" ? "active" : ""}`}
                    onClick={() => handleNavClick("rates")}
                  >
                    Rate Chart
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === "about" ? "active" : ""}`}
                    onClick={() => handleNavClick("about")}
                  >
                    About Us
                  </button>
                </li>
              </ul>

              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <button className="btn-primary hide-mobile" onClick={onOpenEnquiry}>
                  Quick Enquiry
                </button>

                {/* Mobile Hamburger Toggle Button */}
                <button
                  className="hamburger-btn show-mobile-only"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle Navigation Menu"
                >
                  {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
                </button>
              </div>
            </>
          ) : (
            /* SIMPLE ADMIN HEADER ACTION BAR WHEN ON DASHBOARD */
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <button
                className="btn-outline"
                onClick={() => handleNavClick("home")}
                style={{ fontSize: "0.85rem", padding: "0.5rem 1rem" }}
              >
                <ExternalLink size={15} />
                <span>Back to Main Website</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Dropdown Menu Drawer (Only on public view) */}
        {mobileMenuOpen && !isAdminDashboard && (
          <div className="mobile-drawer show-mobile-only">
            <button
              className={`mobile-drawer-link ${activeTab === "home" ? "active" : ""}`}
              onClick={() => handleNavClick("home")}
            >
              Home Portal
            </button>

            {/* Mobile Services Submenu Toggle */}
            <div>
              <button
                className="mobile-drawer-link"
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                onClick={() => toggleMobileSubmenu("services")}
              >
                <span>Taxi Services</span>
                <ChevronDown size={16} style={{ transform: mobileSubmenu === "services" ? "rotate(180deg)" : "rotate(0)" }} />
              </button>
              {mobileSubmenu === "services" && (
                <div className="mobile-submenu-list">
                  <button className="mobile-submenu-item" onClick={() => handleServiceSelect("Local Trip")}>Local City Cab</button>
                  <button className="mobile-submenu-item" onClick={() => handleServiceSelect("One Way")}>Outstation One Way</button>
                  <button className="mobile-submenu-item" onClick={() => handleServiceSelect("Round Trip")}>Outstation Round Trip</button>
                  <button className="mobile-submenu-item" onClick={() => handleServiceSelect("Airport Transfer")}>Airport Pickup & Drop</button>
                </div>
              )}
            </div>

            {/* Mobile Fleet Submenu Toggle */}
            <div>
              <button
                className="mobile-drawer-link"
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                onClick={() => toggleMobileSubmenu("fleet")}
              >
                <span>Our Fleet Vehicles</span>
                <ChevronDown size={16} style={{ transform: mobileSubmenu === "fleet" ? "rotate(180deg)" : "rotate(0)" }} />
              </button>
              {mobileSubmenu === "fleet" && (
                <div className="mobile-submenu-list">
                  <button className="mobile-submenu-item" onClick={() => handleFleetSelect("ALL")}>All Vehicles & Rates</button>
                  <button className="mobile-submenu-item" onClick={() => handleFleetSelect("4")}>4-Seater Sedans</button>
                  <button className="mobile-submenu-item" onClick={() => handleFleetSelect("7")}>6 & 7-Seater SUVs</button>
                  <button className="mobile-submenu-item" onClick={() => handleFleetSelect("12")}>12-26 Seater Tempo Travellers</button>
                </div>
              )}
            </div>

            {/* Mobile Packages Submenu Toggle */}
            <div>
              <button
                className="mobile-drawer-link"
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                onClick={() => toggleMobileSubmenu("packages")}
              >
                <span>Tour Packages</span>
                <ChevronDown size={16} style={{ transform: mobileSubmenu === "packages" ? "rotate(180deg)" : "rotate(0)" }} />
              </button>
              {mobileSubmenu === "packages" && (
                <div className="mobile-submenu-list">
                  {packageGroups.map((group) => (
                    <div key={group.name} className="mobile-package-group">
                      <button
                        className="mobile-submenu-item mobile-package-heading"
                        onClick={() => handlePackageCategory(group.name)}
                      >
                        <span>{group.name}</span>
                        <span className="mobile-package-count">{group.items.length}</span>
                      </button>
                      {group.items.map((pkg) => (
                        <button
                          key={pkg.id}
                          className="mobile-package-link"
                          onClick={() => handlePackageLink(pkg.slug)}
                        >
                          {pkg.title}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              className={`mobile-drawer-link ${activeTab === "blogs" ? "active" : ""}`}
              onClick={() => handleNavClick("blogs")}
            >
              Travel Blogs
            </button>
            <button
              className={`mobile-drawer-link ${activeTab === "gallery" ? "active" : ""}`}
              onClick={() => handleNavClick("gallery")}
            >
              Gallery
            </button>
            {activeTab === "home" && (
              <button
                className="mobile-drawer-link"
                onClick={() => {
                  onOpenFeedback();
                  setMobileMenuOpen(false);
                }}
              >
                Share Feedback
              </button>
            )}

            <button
              className={`mobile-drawer-link ${activeTab === "rates" ? "active" : ""}`}
              onClick={() => handleNavClick("rates")}
            >
              Rate Chart
            </button>

            <button
              className={`mobile-drawer-link ${activeTab === "about" ? "active" : ""}`}
              onClick={() => handleNavClick("about")}
            >
              About Us
            </button>

            {session ? (
              <>
                <button
                  className="mobile-drawer-link"
                  onClick={() => {
                    onOpenAdmin();
                    setMobileMenuOpen(false);
                  }}
                >
                  Admin Console ({session.username})
                </button>
                <button
                  className="mobile-drawer-link"
                  onClick={() => {
                    onLogout?.();
                    setMobileMenuOpen(false);
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                className="mobile-drawer-link"
                onClick={() => {
                  onOpenAuthModal();
                  setMobileMenuOpen(false);
                }}
              >
                Admin / Staff Login
              </button>
            )}

            <button
              className="btn-primary"
              style={{ marginTop: "1rem", width: "100%", justifyContent: "center" }}
              onClick={() => {
                onOpenEnquiry();
                setMobileMenuOpen(false);
              }}
            >
              Quick Enquiry
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}
