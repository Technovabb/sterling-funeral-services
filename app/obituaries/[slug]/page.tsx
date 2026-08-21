import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedObituary } from "../../../db/obituaries";
import { ContactBand } from "../../components/SiteShell";
import { formatObituaryDate, lifeDates } from "../../lib/obituary-format";

export const dynamic = "force-dynamic";

async function requestOrigin() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "sterling-funeral-services.jadegoddard08.chatgpt.site";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const record = await getPublishedObituary(slug);
  if (!record) return { title: "Obituary Not Found | Sterling Funeral Services" };
  const title = `${record.fullName} | Obituary`;
  const description = record.summary || `View the obituary and service information for ${record.fullName}.`;
  const image = record.photoKey ? `${await requestOrigin()}/api/obituaries/${record.slug}/photo` : null;
  return {
    title,
    description,
    openGraph: { title, description, images: image ? [image] : [] },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : [] },
  };
}

export default async function ObituaryPage({ params }: { params: Promise<{ slug: string }> }) {
  const record = await getPublishedObituary((await params).slug);
  if (!record) notFound();
  const dates = lifeDates(record.birthDate, record.deathDate);

  return <>
    <article className="memorial-page">
      <div className="memorial-intro">
        <Link className="memorial-back" href="/obituaries">← All obituaries</Link>
        <div className="memorial-portrait">
          {record.photoKey ? <img src={`/api/obituaries/${record.slug}/photo`} alt={`Portrait of ${record.fullName}`} /> : <span>{record.fullName.charAt(0)}</span>}
        </div>
        <div className="memorial-heading">
          <p className="eyebrow light">In loving memory</p>
          <h1>{record.fullName}</h1>
          {dates && <p className="memorial-dates">{dates}</p>}
        </div>
      </div>
      <div className="memorial-content">
        <div className="memorial-tribute">
          <p className="eyebrow">A life remembered</p>
          {record.summary && <p className="memorial-summary">{record.summary}</p>}
          {record.tribute ? record.tribute.split(/\n+/).map((paragraph, index) => <p key={index}>{paragraph}</p>) : <p>This memorial notice has been published by Sterling Funeral Services.</p>}
        </div>
        {(record.serviceDate || record.serviceLocation) && <aside className="service-card">
          <p className="eyebrow">Service information</p>
          {record.serviceDate && <div><small>Date & time</small><strong>{formatObituaryDate(record.serviceDate, true)}</strong></div>}
          {record.serviceLocation && <div><small>Location</small><strong>{record.serviceLocation}</strong></div>}
          <p>Please contact Sterling if you require further assistance.</p>
        </aside>}
      </div>
    </article>
    <ContactBand />
  </>;
}
