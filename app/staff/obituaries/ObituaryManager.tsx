"use client";

import { FormEvent, useState } from "react";

export type ManagedObituary = {
  id: number;
  slug: string;
  fullName: string;
  birthDate: string | null;
  deathDate: string | null;
  serviceDate: string | null;
  serviceLocation: string | null;
  summary: string;
  tribute: string;
  photoKey: string | null;
  published: boolean;
  updatedAt: string;
};

function ObituaryFields({ record }: { record?: ManagedObituary }) {
  return <>
    <div className="staff-field-row">
      <label>Full name<input name="fullName" required maxLength={120} defaultValue={record?.fullName ?? ""} /></label>
      <label>Photograph<input name="photo" type="file" accept="image/jpeg,image/png,image/webp" /></label>
    </div>
    <div className="staff-field-row three">
      <label>Birth date<input name="birthDate" type="date" defaultValue={record?.birthDate ?? ""} /></label>
      <label>Death date<input name="deathDate" type="date" defaultValue={record?.deathDate ?? ""} /></label>
      <label>Service date & time<input name="serviceDate" type="datetime-local" defaultValue={record?.serviceDate ?? ""} /></label>
    </div>
    <label>Service location<input name="serviceLocation" maxLength={180} defaultValue={record?.serviceLocation ?? ""} /></label>
    <label>Short introduction<textarea name="summary" maxLength={320} rows={3} defaultValue={record?.summary ?? ""} placeholder="A short summary shown on the obituary listing." /></label>
    <label>Obituary or tribute<textarea name="tribute" maxLength={12000} rows={9} defaultValue={record?.tribute ?? ""} placeholder="Write the full obituary here. Separate paragraphs with a blank line." /></label>
    <label className="publish-choice"><input name="published" type="checkbox" value="true" defaultChecked={record?.published ?? false} /><span>Publish this obituary on the public website</span></label>
    <p className="upload-note">JPG, PNG or WebP photographs only, up to 5 MB. Confirm the family has approved all words, dates and images before publishing.</p>
  </>;
}

export function ObituaryManager({ records }: { records: ManagedObituary[] }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>, method: "POST" | "PATCH", id?: number) {
    event.preventDefault();
    setBusy(true);
    setMessage("Saving…");
    const response = await fetch(id ? `/api/staff/obituaries/${id}` : "/api/staff/obituaries", {
      method,
      body: new FormData(event.currentTarget),
    });
    const result = await response.json() as { error?: string };
    if (!response.ok) {
      setMessage(result.error ?? "The obituary could not be saved.");
      setBusy(false);
      return;
    }
    setMessage("Saved successfully.");
    window.location.reload();
  }

  async function remove(record: ManagedObituary) {
    if (!window.confirm(`Permanently delete the obituary for ${record.fullName}?`)) return;
    setBusy(true);
    setMessage("Deleting…");
    const response = await fetch(`/api/staff/obituaries/${record.id}`, { method: "DELETE" });
    const result = await response.json() as { error?: string };
    if (!response.ok) {
      setMessage(result.error ?? "The obituary could not be deleted.");
      setBusy(false);
      return;
    }
    window.location.reload();
  }

  return <div className="staff-manager">
    {message && <p className="staff-message" role="status">{message}</p>}
    <section className="staff-panel">
      <div className="staff-panel-heading"><div><p className="eyebrow">New obituary</p><h2>Create a memorial notice</h2></div><span>Draft or publish</span></div>
      <form className="staff-form" onSubmit={(event) => submit(event, "POST")}><ObituaryFields /><button className="button wine" type="submit" disabled={busy}>Save obituary <span>→</span></button></form>
    </section>
    <section className="staff-panel">
      <div className="staff-panel-heading"><div><p className="eyebrow">Manage notices</p><h2>Existing obituaries</h2></div><span>{records.length} total</span></div>
      {records.length ? <div className="staff-records">{records.map((record) => <details className="staff-record" key={record.id}>
        <summary><span><strong>{record.fullName}</strong><small>{record.published ? "Published" : "Draft"}</small></span><span>Edit +</span></summary>
        <form className="staff-form" onSubmit={(event) => submit(event, "PATCH", record.id)}><ObituaryFields record={record} /><div className="staff-form-actions"><button className="button wine" type="submit" disabled={busy}>Update <span>→</span></button><button className="button danger" type="button" disabled={busy} onClick={() => remove(record)}>Delete</button></div></form>
      </details>)}</div> : <p className="staff-empty">No obituary records have been created yet.</p>}
    </section>
  </div>;
}
