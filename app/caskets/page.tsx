import type { Metadata } from "next";
import { ContactBand, PageHero } from "../components/SiteShell";

const title = "Casket Collection | Sterling Funeral Services";
const description = "View representative casket styles and contact Sterling Funeral Services for current selections and guidance.";
const socialImage = "https://sterling-funeral-services.jadegoddard08.chatgpt.site/images/caskets/deep-wine.webp";
export const metadata: Metadata = { title, description, openGraph: { title, description, images: [socialImage] }, twitter: { card: "summary_large_image", title, description, images: [socialImage] } };
const caskets = [
  ["Deep Wine Finish", "Polished deep-wine finish · Gold-tone hardware", "/images/caskets/deep-wine.webp"],
  ["Natural Wood Finish", "Warm natural grain · Gold-tone hardware", "/images/caskets/natural-wood.webp"],
  ["Classic Burgundy Finish", "Rich burgundy finish · Decorative gold-tone hardware", "/images/caskets/classic-burgundy.webp"],
  ["Blue & Ivory Finish", "Blue and ivory finish · Silver-tone hardware", "/images/caskets/blue-ivory.webp"],
  ["Green & Ivory Finish", "Green and ivory finish · Silver-tone hardware", "/images/caskets/green-ivory.webp"],
  ["Purple Finish", "Purple finish · Silver-tone hardware", "/images/caskets/purple.webp"],
  ["Traditional Mahogany Finish", "Deep wood finish · Traditional detailing", "/images/caskets/traditional-mahogany.webp"],
  ["White Finish", "White finish · Gold-tone hardware", "/images/caskets/white.webp"],
];

export default function CasketsPage() {
  return <><PageHero eyebrow="Casket Collection" title="Chosen with care." emphasis="Presented with dignity." copy="Browse representative styles, then speak with Sterling for guidance on current designs, finishes and availability." image="/images/caskets/deep-wine.webp" />
    <section className="page-body casket-page"><div className="collection-note"><strong>Sterling collection:</strong> These photographs show representative caskets supplied by Sterling. Please contact us to confirm current finishes, specifications, availability and pricing.</div><div className="casket-grid">{caskets.map(([name,detail,image])=><article className="casket-card" key={name}><div className="casket-image"><img src={image} alt={`${name} casket`} /><span>Sterling collection</span></div><div className="casket-info"><div><h3>{name}</h3><p>{detail}</p></div><a href={`https://wa.me/12465717965?text=${encodeURIComponent(`Hello Sterling, I would like information about the ${name} casket style.`)}`} target="_blank" rel="noreferrer" aria-label={`Ask about ${name}`}>↗</a></div></article>)}</div></section><ContactBand /></>;
}
