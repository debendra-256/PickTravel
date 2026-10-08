import React from "react";
import { APP_CONFIG } from "../config/app.config";
import { MessageSquare } from "lucide-react";

export function WhatsappButton() {
  const whatsappUrl = APP_CONFIG.getWhatsappLink(
    "Hello Patra Travels! I would like to inquire about taxi rates, outstation packages, and vehicle availability."
  );

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-float-btn"
      title="Chat with Patra Travels on WhatsApp"
    >
      <MessageSquare size={30} fill="white" />
    </a>
  );
}
