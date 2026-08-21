import type { Metadata } from "next";
import { ContactForm } from "../components/ContactForm";
import { PageHero } from "../components/SiteShell";

const title = "Contact | Sterling Funeral Services";
const description = "Call or message Sterling Funeral Services for compassionate support and funeral arrangement guidance across Barbados.";
const socialImage = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1900&q=85";
export const metadata: Metadata = { title, description, openGraph: { title, description, images: [socialImage] }, twitter: { card: "summary_large_image", title, description, images: [socialImage] } };

export default function ContactPage() {
  return <><PageHero eyebrow="Contact Sterling" title="A caring voice" emphasis="when you need one." copy="Call or message Sterling to request assistance, arrange a consultation or ask about the next steps." image="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1900&q=85" />
    <section className="page-body contact-layout"><div className="contact-details"><p className="eyebrow">Get in touch</p><h2>Here to support<br/><em>families across Barbados.</em></h2><p>For immediate assistance, please call. You can also send a WhatsApp message or use the consultation form to prepare your message.</p><div className="contact-method"><small>Telephone</small><a href="tel:+12462349195">(246) 234-9195</a></div><div className="contact-method"><small>Mobile & WhatsApp</small><a href="https://wa.me/12465717965" target="_blank" rel="noreferrer">(246) 571-7965</a></div><div className="contact-method"><small>Service area</small><p>Families across Barbados</p></div><div className="contact-method"><small>Availability</small><p>24 hours a day, 7 days a week</p></div></div><ContactForm /></section>
  </>;
}
