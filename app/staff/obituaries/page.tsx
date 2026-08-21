import Link from "next/link";
import { listAllObituaries } from "../../../db/obituaries";
import { chatGPTSignOutPath, requireChatGPTUser } from "../../chatgpt-auth";
import { isObituaryAdmin } from "../../lib/obituary-auth";
import { ObituaryManager } from "./ObituaryManager";

export const dynamic = "force-dynamic";

export default async function StaffObituariesPage() {
  const user = await requireChatGPTUser("/staff/obituaries");
  if (!isObituaryAdmin(user.email)) {
    return <section className="staff-shell staff-access">
      <p className="eyebrow">Sterling staff</p>
      <h1>Administrator access<br/><em>is not configured.</em></h1>
      <p>You are signed in as <strong>{user.email}</strong>, but this email has not been added to Sterling’s obituary administrators.</p>
      <Link className="button wine" href={chatGPTSignOutPath("/staff/obituaries")}>Use another account</Link>
    </section>;
  }

  const records = await listAllObituaries();
  return <section className="staff-shell">
    <header className="staff-title"><div><p className="eyebrow">Sterling staff</p><h1>Obituary <em>manager.</em></h1><p>Create a draft, upload a photograph, review the information and publish when the family has approved it.</p></div><div><span>Signed in as {user.email}</span><Link href="/obituaries">View public obituaries</Link><Link href={chatGPTSignOutPath("/")}>Sign out</Link></div></header>
    <section className="staff-guide" aria-labelledby="obituary-guide-title">
      <div className="staff-guide-intro">
        <p className="eyebrow">Quick walkthrough</p>
        <h2 id="obituary-guide-title">How to post an obituary</h2>
        <p>Save the notice as a draft first. Publish it only after the family has approved the photograph, spelling, dates and service details.</p>
      </div>
      <ol className="staff-guide-steps">
        <li><span>01</span><div><strong>Prepare the information</strong><p>Have the person’s full name, dates, service location, obituary wording and a family-approved photograph ready.</p></div></li>
        <li><span>02</span><div><strong>Complete the form</strong><p>Enter the available details below. Optional information can be left blank and added later.</p></div></li>
        <li><span>03</span><div><strong>Save a private draft</strong><p>Leave “Publish this obituary” unchecked, then select <em>Save obituary</em>. The draft will appear under Existing obituaries.</p></div></li>
        <li><span>04</span><div><strong>Check with the family</strong><p>Open the saved record and carefully confirm the name, wording, photograph, dates and service information.</p></div></li>
        <li><span>05</span><div><strong>Publish and verify</strong><p>Check “Publish this obituary,” select <em>Update</em>, then use “View public obituaries” above to confirm the finished notice.</p></div></li>
      </ol>
      <p className="staff-guide-note"><strong>Need to remove a notice from public view?</strong> Open it below, uncheck “Publish this obituary,” and select Update. This keeps the draft without deleting it.</p>
    </section>
    <ObituaryManager records={records} />
  </section>;
}
