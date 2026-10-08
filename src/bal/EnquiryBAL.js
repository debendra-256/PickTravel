import { dbFactory } from "../dal/DBFactory";
import { APP_CONFIG } from "../config/app.config";

export class EnquiryBAL {
  static submitEnquiry(enquiryData) {
    if (!enquiryData.name || !enquiryData.phone) {
      return { success: false, message: "Name and Phone number are required." };
    }

    const newEnquiry = {
      id: `ENQ-${Date.now().toString().slice(-4)}`,
      name: enquiryData.name.trim(),
      phone: enquiryData.phone.trim(),
      email: enquiryData.email ? enquiryData.email.trim() : "N/A",
      message: enquiryData.message ? enquiryData.message.trim() : "General Enquiry",
      status: "New",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      type: enquiryData.type || "General Enquiry"
    };

    const driver = dbFactory.getDriver();
    const inserted = driver.insert("Enquiries", newEnquiry);

    // WhatsApp links open a prefilled notification for the administrator.
    const waText = [
      "New website enquiry",
      `Enquiry ID: ${newEnquiry.id}`,
      `Name: ${newEnquiry.name}`,
      `Phone: ${newEnquiry.phone}`,
      `Email: ${newEnquiry.email}`,
      `Type: ${newEnquiry.type}`,
      `Message: ${newEnquiry.message}`
    ].join("\n");
    const whatsappUrl = APP_CONFIG.getWhatsappLink(waText);

    if (inserted) {
      return {
        success: true,
        enquiry: inserted,
        whatsappUrl: whatsappUrl,
        message: "Thank you! Your enquiry has been received. Our team will contact you shortly."
      };
    }

    return { success: false, message: "Failed to submit enquiry." };
  }

  static getEnquiries() {
    const driver = dbFactory.getDriver();
    return driver.findAll("Enquiries");
  }
}
