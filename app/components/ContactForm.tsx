"use client";

import { FormEvent } from "react";

export function ContactForm() {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const message = [
      "Hello Sterling Funeral Services, I would like to request a consultation.",
      `Name: ${data.get("name") || ""}`,
      `Phone: ${data.get("phone") || ""}`,
      `Preferred contact: ${data.get("preference") || ""}`,
      `How can you help: ${data.get("message") || ""}`,
    ].join("\n");
    window.open(`https://wa.me/12465717965?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  return <form className="contact-form" onSubmit={submit}>
    <p className="eyebrow">Request a consultation</p>
    <div className="field-row"><div className="field"><label htmlFor="name">Your name</label><input id="name" name="name" required /></div><div className="field"><label htmlFor="phone">Phone number</label><input id="phone" name="phone" type="tel" required /></div></div>
    <div className="field"><label htmlFor="preference">Preferred way to reach you</label><select id="preference" name="preference"><option>Phone call</option><option>WhatsApp message</option></select></div>
    <div className="field"><label htmlFor="message">How may we assist?</label><textarea id="message" name="message" required></textarea></div>
    <button className="button wine" type="submit">Continue on WhatsApp <span>↗</span></button>
    <p className="form-note">Submitting opens WhatsApp with your message. Please do not include sensitive personal or payment information.</p>
  </form>;
}
