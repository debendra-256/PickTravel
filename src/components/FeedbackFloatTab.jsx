import React from "react";

export function FeedbackFloatTab({ onOpen }) {
  return (
    <button
      type="button"
      className="feedback-float-tab"
      onClick={onOpen}
      title="Share feedback"
      aria-label="Open feedback form"
    >
      <span className="feedback-float-tab__label">FEEDBACK</span>
    </button>
  );
}
