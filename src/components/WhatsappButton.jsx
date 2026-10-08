import React from "react";
import { APP_CONFIG } from "../config/app.config";
import { MessageSquare, Phone } from "lucide-react";

export function WhatsappButton() {
  const whatsappUrl = APP_CONFIG.getWhatsappLink("");
  const callUrl = `tel:${APP_CONFIG.TOLL_FREE.replace(/\D/g, "")}`;

  return (
    <div className="floating-contact-actions">
      <a
        href={callUrl}
        className="call-float-btn"
        aria-label={`Call Pick My Travels at ${APP_CONFIG.DISPLAY_WHATSAPP}`}
        title="Call Pick My Travels"
      >
        <Phone size={26} fill="white" />
      </a>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-float-btn"
        aria-label="Chat with Pick My Travels on WhatsApp"
        title="Chat with Pick My Travels on WhatsApp"
      >
        <MessageSquare size={30} fill="white" />
      </a>
    </div>
  );
}
