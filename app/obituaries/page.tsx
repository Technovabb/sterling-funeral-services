import type { Metadata } from "next";
import Link from "next/link";
import { listPublishedObituaries } from "../../db/obituaries";
import { ContactBand, PageHero } from "../components/SiteShell";
import { lifeDates } from "../lib/obituary-format";

const title = "Obituaries | Sterling Funeral Services";
const description = "View obituary notices and service information published by Sterling Funeral Services.";
const socialImage = "https://images.unsplash.com/photo-1495764506633-93d4dfed7d1f?auto=format&fit=crop&w=1900&q=85";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, images: [socialImage] },
  twitter: { card: "summary_large_image", title, description, images: [socialImage] },
};

export const dynamic = "force-dynamic";

export default async function ObituariesPage() {
  const records = await listPublishedObituaries();
  return <>
    <PageHero eyebrow="Obituaries & Memorials" title="Remembering lives." emphasis="Sharing their stories." copy="A place for families and friends to find published notices, service information and lasting tributes." image={socialImage} />
    <section className="page-body obituary-index">
      <div className="lead">
        <p className="eyebrow">In loving memory</p>
        <h2>Honouring those<br/><em>we remember.</em></h2>
        <p>Published obituary notices will appear here. Please contact Sterling if you need assistance with a notice or service information.</p>
      </div>
      {records.length ? <div className="obituary-grid">
        {records.map((record) => <article className="obituary-card" key={record.id}>
          <Link className="obituary-card-image" href={`/obituaries/${record.slug}`} aria-label={`View the obituary for ${record.fullName}`}>
            {record.photoKey ? <img src={`/api/obituaries/${record.slug}/photo`} alt={`Portrait of ${record.fullName}`} /> : <span>{record.fullName.charAt(0)}</span>}
          </Link>
          <div className="obituary-card-copy">
            <p className="obituary-dates">{lifeDates(record.birthDate, record.deathDate) || "In loving memory"}</p>
            <h3><Link href={`/obituaries/${record.slug}`}>{record.fullName}</Link></h3>
            {record.summary && <p>{record.summary}</p>}
            <Link className="link-arrow" href={`/obituaries/${record.slug}`}>View obituary <span>→</span></Link>
          </div>
        </article>)}
      </div> : <div className="obituary-empty">
        <span aria-hidden="true">S</span>
        <h3>No obituaries have been published yet.</h3>
        <p>Please check again soon or contact Sterling Funeral Services for assistance.</p>
      </div>}
    </section>
    <ContactBand />
  </>;
}
