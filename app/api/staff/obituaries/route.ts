import { getDb, getObituaryMedia } from "../../../../db";
import { ensureObituarySchema } from "../../../../db/obituaries";
import { obituaries } from "../../../../db/schema";
import { requireObituaryApiAdmin } from "../../../lib/obituary-auth";
import { obituarySlug, photoObjectKey, readObituaryInput } from "../../../lib/obituary-input";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const access = await requireObituaryApiAdmin();
  if ("error" in access) return access.error;

  let uploadedKey: string | null = null;
  try {
    const input = readObituaryInput(await request.formData());
    await ensureObituarySchema();

    if (input.photo) {
      uploadedKey = photoObjectKey(input.photo);
      await getObituaryMedia().put(uploadedKey, input.photo.stream(), {
        httpMetadata: { contentType: input.photo.type },
      });
    }

    const now = new Date().toISOString();
    const [record] = await getDb().insert(obituaries).values({
      slug: obituarySlug(input.fullName),
      fullName: input.fullName,
      birthDate: input.birthDate,
      deathDate: input.deathDate,
      serviceDate: input.serviceDate,
      serviceLocation: input.serviceLocation,
      summary: input.summary,
      tribute: input.tribute,
      photoKey: uploadedKey,
      photoContentType: input.photo?.type ?? null,
      published: input.published,
      publishedAt: input.published ? now : null,
      createdByEmail: access.user.email,
      updatedAt: now,
    }).returning();

    return Response.json({ obituary: record }, { status: 201 });
  } catch (error) {
    if (uploadedKey) await getObituaryMedia().delete(uploadedKey).catch(() => undefined);
    const message = error instanceof Error ? error.message : "The obituary could not be saved.";
    return Response.json({ error: message }, { status: 400 });
  }
}
