import { getObituaryMedia } from "../../../../../db";
import { getPublishedObituary } from "../../../../../db/obituaries";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const obituary = await getPublishedObituary(slug);
  if (!obituary?.photoKey) return new Response("Not found", { status: 404 });

  const object = await getObituaryMedia().get(obituary.photoKey);
  if (!object) return new Response("Not found", { status: 404 });

  return new Response(object.body as ReadableStream, {
    headers: {
      "Content-Type": obituary.photoContentType ?? object.httpMetadata?.contentType ?? "image/jpeg",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
