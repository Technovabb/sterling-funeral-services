import type { Metadata } from "next";
import { ContactBand, PageHero } from "../components/SiteShell";

const title = "Funeral Services | Sterling Funeral Services";
const description = "Explore Sterling Funeral Services’ professional, personalised and compassionate funeral care.";
const socialImage = "https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1900&q=85";
export const metadata: Metadata = { title, description, openGraph: { title, description, images: [socialImage] }, twitter: { card: "summary_large_image", title, description, images: [socialImage] } };
const services = [
  ["01", "Funeral Arrangements", "Calm guidance through the decisions involved in arranging a dignified farewell for your loved one."],
  ["02", "Personalised Services", "Support in shaping a service that reflects the individual being remembered and the wishes of the family."],
  ["03", "Professional Care", "Considerate, dignified attention throughout the funeral arrangement process."],
  ["04", "Casket Guidance", "Personal assistance when reviewing casket styles and discussing suitable available options."],
  ["05", "Family Support", "Compassionate communication and practical guidance during an emotionally difficult time."],
  ["06", "Consultations", "A private conversation to understand your needs, explain the next steps and answer your questions."],
];

export default function ServicesPage() {
  return <><PageHero eyebrow="Our Services" title="Guidance for every" emphasis="important step." copy="Professional and personalised care, delivered with compassion and dignity from the first conversation onward." image="https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=1900&q=85" />
    <section className="page-body"><div className="lead"><p className="eyebrow">How we can help</p><h2>Thoughtful support.<br/><em>Clear guidance.</em></h2><p>Every family’s circumstances are different. Sterling will help you understand the available options and make decisions that feel appropriate for your family.</p></div><div className="service-list">{services.map(([number,title,text])=><article className="service-row" key={title}><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></section><ContactBand /></>;
}
