import { eq } from "drizzle-orm";
import { getDb, getObituaryMedia } from "../../../../../db";
import { getObituaryById } from "../../../../../db/obituaries";
import { obituaries } from "../../../../../db/schema";
import { requireObituaryApiAdmin } from "../../../../lib/obituary-auth";
import { photoObjectKey, readObituaryInput } from "../../../../lib/obituary-input";

export const dynamic = "force-dynamic";

function numericId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await requireObituaryApiAdmin();
  if ("error" in access) return access.error;
  const id = numericId((await context.params).id);
  if (!id) return Response.json({ error: "Invalid obituary." }, { status: 400 });

  let newPhotoKey: string | null = null;
  try {
    const existing = await getObituaryById(id);
    if (!existing) return Response.json({ error: "Obituary not found." }, { status: 404 });
    const input = readObituaryInput(await request.formData());

    if (input.photo) {
      newPhotoKey = photoObjectKey(input.photo);
      await getObituaryMedia().put(newPhotoKey, input.photo.stream(), {
        httpMetadata: { contentType: input.photo.type },
      });
    }

    const now = new Date().toISOString();
    const [record] = await getDb().update(obituaries).set({
      fullName: input.fullName,
      birthDate: input.birthDate,
      deathDate: input.deathDate,
      serviceDate: input.serviceDate,
      serviceLocation: input.serviceLocation,
      summary: input.summary,
      tribute: input.tribute,
      photoKey: newPhotoKey ?? existing.photoKey,
      photoContentType: input.photo?.type ?? existing.photoContentType,
      published: input.published,
      publishedAt: input.published ? existing.publishedAt ?? now : null,
      updatedAt: now,
    }).where(eq(obituaries.id, id)).returning();

    if (newPhotoKey && existing.photoKey) await getObituaryMedia().delete(existing.photoKey).catch(() => undefined);
    return Response.json({ obituary: record });
  } catch (error) {
    if (newPhotoKey) await getObituaryMedia().delete(newPhotoKey).catch(() => undefined);
    const message = error instanceof Error ? error.message : "The obituary could not be updated.";
    return Response.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await requireObituaryApiAdmin();
  if ("error" in access) return access.error;
  const id = numericId((await context.params).id);
  if (!id) return Response.json({ error: "Invalid obituary." }, { status: 400 });

  const existing = await getObituaryById(id);
  if (!existing) return Response.json({ error: "Obituary not found." }, { status: 404 });

  await getDb().delete(obituaries).where(eq(obituaries.id, id));
  if (existing.photoKey) await getObituaryMedia().delete(existing.photoKey).catch(() => undefined);
  return Response.json({ ok: true });
}
