export type ObituaryInput = {
  fullName: string;
  birthDate: string | null;
  deathDate: string | null;
  serviceDate: string | null;
  serviceLocation: string | null;
  summary: string;
  tribute: string;
  published: boolean;
  photo: File | null;
};

const allowedPhotoTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function field(form: FormData, name: string, max: number) {
  const value = String(form.get(name) ?? "").trim();
  if (value.length > max) throw new Error(`${name} is too long.`);
  return value;
}

export function readObituaryInput(form: FormData): ObituaryInput {
  const fullName = field(form, "fullName", 120);
  if (!fullName) throw new Error("The person’s full name is required.");

  const rawPhoto = form.get("photo");
  const photo = rawPhoto instanceof File && rawPhoto.size > 0 ? rawPhoto : null;
  if (photo && !allowedPhotoTypes.has(photo.type)) throw new Error("Please upload a JPG, PNG or WebP photograph.");
  if (photo && photo.size > 5 * 1024 * 1024) throw new Error("The photograph must be smaller than 5 MB.");

  const nullable = (value: string) => value || null;
  return {
    fullName,
    birthDate: nullable(field(form, "birthDate", 10)),
    deathDate: nullable(field(form, "deathDate", 10)),
    serviceDate: nullable(field(form, "serviceDate", 30)),
    serviceLocation: nullable(field(form, "serviceLocation", 180)),
    summary: field(form, "summary", 320),
    tribute: field(form, "tribute", 12000),
    published: form.get("published") === "true",
    photo,
  };
}

export function obituarySlug(fullName: string) {
  const base = fullName.toLowerCase().normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "memorial";
  return `${base}-${Date.now().toString(36)}`;
}

export function photoObjectKey(file: File) {
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  return `obituaries/${crypto.randomUUID()}.${extension}`;
}
