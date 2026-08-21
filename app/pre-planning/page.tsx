import type { Metadata } from "next";
import Link from "next/link";
import { ContactBand, PageHero } from "../components/SiteShell";

const title = "Pre-Planning | Sterling Funeral Services";
const description = "Learn how pre-planning can help you record your wishes and make future decisions with greater clarity.";
const socialImage = "https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=1900&q=85";
export const metadata: Metadata = { title, description, openGraph: { title, description, images: [socialImage] }, twitter: { card: "summary_large_image", title, description, images: [socialImage] } };

export default function PrePlanningPage() {
  return <><PageHero eyebrow="Pre-Planning" title="A thoughtful decision." emphasis="A lasting gift." copy="Consider your wishes at your own pace and help those closest to you face the future with greater clarity." image="https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=1900&q=85" />
    <section className="page-body"><div className="lead"><p className="eyebrow">Planning ahead</p><h2>Make considered choices<br/><em>in your own time.</em></h2><p>Pre-planning is an opportunity to discuss your preferences, understand the decisions involved and record information that may help your family later. A conversation with Sterling can help you determine what level of planning feels right for you.</p></div>
      <div className="planning-steps"><article className="planning-step"><span>01</span><h3>Start a conversation</h3><p>Speak privately with Sterling about what pre-planning involves and the questions you may wish to consider.</p></article><article className="planning-step"><span>02</span><h3>Consider your wishes</h3><p>Think about the kind of service, personal details and practical preferences that matter to you.</p></article><article className="planning-step"><span>03</span><h3>Record key details</h3><p>Organise the information your family may need and keep your preferences clear and accessible.</p></article><article className="planning-step"><span>04</span><h3>Review when needed</h3><p>Return to your plan over time so it continues to reflect your circumstances and wishes.</p></article></div>
      <div className="faq-list"><div className="lead" style={{marginBottom:40}}><p className="eyebrow">Common questions</p><h2>Pre-planning,<br/><em>explained simply.</em></h2></div><article className="faq-item"><h3>Do I need to make every decision now?</h3><p>No. An initial consultation can simply help you understand the available areas of planning. You can decide how much you wish to document.</p></article><article className="faq-item"><h3>Can my family be involved?</h3><p>Yes. You may choose to include trusted family members in the conversation and share your preferences with them.</p></article><article className="faq-item"><h3>How do I begin?</h3><p>Contact Sterling to request a private pre-planning consultation and discuss the next appropriate step.</p></article></div>
      <div style={{textAlign:"center",marginTop:50}}><Link className="button wine" href="/contact">Request a consultation <span>→</span></Link></div>
    </section><ContactBand /></>;
}
