import Link from "next/link";
import { ContactBand } from "./components/SiteShell";

export default function Home() {
  return <>
    <section className="hero">
      <div className="hero-image" role="img" aria-label="Ivory lilies and roses arranged against a deep burgundy background"></div>
      <div className="hero-shade"></div>
      <div className="hero-frame" aria-hidden="true"></div>
      <div className="hero-monogram" aria-hidden="true"><span>S</span><small>Excellence Through Service</small></div>
      <div className="hero-content">
        <p className="eyebrow light">Compassion · Dignity · Excellence</p>
        <h1>Here When You<br/>Need Us <em>Most.</em></h1>
        <p className="hero-copy">Professional, personalised funeral services delivered with compassion, dignity and integrity for families across Barbados.</p>
        <div className="hero-actions"><a className="button gold" href="tel:+12462349195">Call Us <span>↗</span></a><a className="button outline" href="https://wa.me/12465717965" target="_blank" rel="noreferrer">WhatsApp <span>↗</span></a><Link className="page-link" href="/contact">Arrange a Consultation <span>→</span></Link></div>
      </div>
      <p className="hero-service-note" aria-hidden="true">Honouring lives <i></i> Serving with integrity</p>
    </section>
    <section className="trust-strip" aria-label="Sterling commitments"><div><span className="trust-icon">◇</span><p><strong>Dignified Care</strong><small>Professional support for every family</small></p></div><div><span className="trust-icon">24</span><p><strong>Available 24/7</strong><small>Here whenever you need guidance</small></p></div><div><span className="trust-icon">✦</span><p><strong>Personalised Service</strong><small>Arrangements shaped around your wishes</small></p></div></section>
    <section className="section intro-grid"><div className="feature-image" style={{backgroundImage:"url('https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=85')"}} role="img" aria-label="An elegant arrangement of flowers"></div><div className="copy-block"><p className="eyebrow">Welcome to Sterling</p><h2>Honouring lives.<br/><em>Serving with integrity.</em></h2><p>When a loved one passes, families deserve clear guidance and considerate care. Sterling Funeral Services supports you through each decision with patience, respect and attention to detail.</p><Link className="link-arrow" href="/about">Discover our approach <span>→</span></Link></div></section>
    <section className="section" style={{background:"var(--cream)"}}><div className="copy-block"><p className="eyebrow">How we can help</p><h2>Support for each<br/><em>important decision.</em></h2></div><div className="home-cards"><article className="home-card"><span>01</span><h3>Funeral Services</h3><p>Thoughtful arrangements and professional care, tailored to your family’s needs.</p><Link href="/services">Explore services →</Link></article><article className="home-card"><span>02</span><h3>Casket Collection</h3><p>View representative styles and speak with us about available selections.</p><Link href="/caskets">View collection →</Link></article><article className="home-card"><span>03</span><h3>Pre-Planning</h3><p>Make considered choices in your own time and ease the burden on loved ones.</p><Link href="/pre-planning">Learn about planning →</Link></article></div></section>
    <ContactBand />
  </>;
}
