import React from "react";

export function FeedbackFloatTab({ onOpenFeedback, onOpenEnquiry }) {
  return (
    <div className="floating-side-tabs">
      <button
        type="button"
        className="side-contact-float-tab side-contact-float-tab--feedback"
        onClick={onOpenFeedback}
        title="Share feedback"
        aria-label="Open feedback form"
      >
        <span className="side-contact-float-tab__label">FEEDBACK</span>
      </button>
      <button
        type="button"
        className="side-contact-float-tab side-contact-float-tab--enquiry"
        onClick={onOpenEnquiry}
        title="Send an enquiry"
        aria-label="Open enquiry form"
      >
        <span className="side-contact-float-tab__label">ENQUIRY</span>
      </button>
    </div>
  );
}
