import type { Metadata } from "next";
import { ContactBand, PageHero } from "../components/SiteShell";

const title = "About | Sterling Funeral Services";
const description = "Learn about Sterling Funeral Services and its commitment to compassionate, professional and dignified care across Barbados.";
const socialImage = "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1900&q=85";
export const metadata: Metadata = { title, description, openGraph: { title, description, images: [socialImage] }, twitter: { card: "summary_large_image", title, description, images: [socialImage] } };

export default function AboutPage() {
  return <><PageHero eyebrow="About Sterling" title="Service grounded" emphasis="in compassion." copy="A considered approach to funeral care, centred on dignity, integrity and the needs of each family." image="https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1900&q=85" />
    <section className="page-body"><div className="lead"><p className="eyebrow">Excellence Through Service</p><h2>Care that honours<br/><em>every life.</em></h2><p>Sterling Funeral Services is committed to supporting families with professional and dignified care, personalised service, compassionate guidance and integrity.</p></div><div className="value-grid"><article className="value-card"><span>01</span><h3>Compassion</h3><p>Every conversation is approached with patience, sensitivity and respect for the family’s circumstances.</p></article><article className="value-card"><span>02</span><h3>Dignity</h3><p>Each detail is handled thoughtfully, helping families create a fitting and meaningful farewell.</p></article><article className="value-card"><span>03</span><h3>Integrity</h3><p>Clear guidance and conscientious service are central to the way Sterling supports the community.</p></article></div>
      <div className="split-feature"><div className="feature-image" style={{backgroundImage:"url('https://images.unsplash.com/photo-1507501336603-6e31db2be093?auto=format&fit=crop&w=1200&q=85')"}} role="img" aria-label="A calm, warmly lit interior"></div><div className="split-copy"><p className="eyebrow">Leadership</p><h2>Professional care,<br/><em>personally led.</em></h2><p><strong>Mr Sheradan Lewis</strong><br/>Managing Director</p><p>Licensed Funeral Director, Embalmer and Undertaker.</p><p>Sterling proudly serves families across Barbados.</p></div></div>
    </section><ContactBand /></>;
}
