"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  ["Home", "/"],
  ["About", "/about"],
  ["Services", "/services"],
  ["Caskets", "/caskets"],
  ["Obituaries", "/obituaries"],
  ["Pre-Planning", "/pre-planning"],
  ["Contact", "/contact"],
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
    document.body.style.overflow = "";
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return <>
    <div className="topbar"><p>Excellence Through Service</p><a href="tel:+12462349195">Available 24/7 · (246) 234-9195</a></div>
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Sterling Funeral Services home"><span className="brand-mark">S</span><span><strong>STERLING</strong><small>FUNERAL SERVICES</small></span></Link>
      <nav className="desktop-nav" aria-label="Main navigation">
        {links.map(([label, href]) => <Link className={pathname === href ? "active" : ""} key={label} href={href}>{label}</Link>)}
      </nav>
      <a className="header-call" href="tel:+12462349195"><span>Call anytime</span>(246) 234-9195</a>
      <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-controls="mobile-menu" aria-label="Toggle navigation"><span></span><span></span></button>
    </header>
    <div id="mobile-menu" className={`mobile-menu ${menuOpen ? "open" : ""}`} aria-hidden={!menuOpen}>
      <nav aria-label="Mobile navigation">{links.map(([label, href]) => <Link className={pathname === href ? "active" : ""} key={label} href={href}>{label}<span>↗</span></Link>)}</nav>
      <Link className="button gold" href="/contact">Arrange a consultation</Link>
    </div>
    <main>{children}</main>
    <footer>
      <div className="footer-main">
        <div className="footer-brand"><Link className="brand" href="/"><span className="brand-mark">S</span><span><strong>STERLING</strong><small>FUNERAL SERVICES</small></span></Link><p>Compassionate guidance and dignified care, whenever your family needs us.</p></div>
        <div><h4>Explore</h4><Link href="/about">About us</Link><Link href="/services">Our services</Link><Link href="/caskets">Casket collection</Link><Link href="/obituaries">Obituaries</Link><Link href="/pre-planning">Pre-planning</Link></div>
        <div><h4>Contact</h4><a href="tel:+12462349195">(246) 234-9195</a><a href="tel:+12465717965">(246) 571-7965</a><p>Proudly serving families<br/>across Barbados</p></div>
        <div><h4>Availability</h4><p>Support available<br/>24 hours a day, 7 days a week</p><a className="footer-whatsapp" href="https://wa.me/12465717965" target="_blank" rel="noreferrer">WhatsApp us →</a></div>
      </div>
      <div className="footer-bottom"><p>© {new Date().getFullYear()} Sterling Funeral Services.</p><p><Link href="/staff/obituaries">Staff obituary login</Link> · Business details to be confirmed</p></div>
    </footer>
  </>;
}

export function PageHero({ eyebrow, title, emphasis, copy, image }: { eyebrow: string; title: string; emphasis: string; copy: string; image: string }) {
  return <section className="page-hero"><div className="page-hero-image" style={{ backgroundImage: `url(${image})` }}></div><div className="page-hero-shade"></div><div className="page-hero-content"><p className="eyebrow light">{eyebrow}</p><h1>{title}<br/><em>{emphasis}</em></h1><p>{copy}</p></div></section>;
}

export function ContactBand() {
  return <section className="contact-band"><div><p className="eyebrow light">Whenever you need us</p><h2>We’re here, <em>24 hours a day.</em></h2><p>When you are ready to talk, a caring member of our team is only a call or message away.</p></div><div className="contact-band-actions"><a className="button gold" href="tel:+12462349195">Call (246) 234-9195 <span>↗</span></a><a className="button outline" href="https://wa.me/12465717965" target="_blank" rel="noreferrer">WhatsApp <span>↗</span></a></div></section>;
}
