import { getObituaryAdminEmails } from "../../db";
import { getChatGPTUser } from "../chatgpt-auth";

export function isObituaryAdmin(email: string) {
  const allowed = getObituaryAdminEmails()
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
}

export async function requireObituaryApiAdmin() {
  const user = await getChatGPTUser();
  if (!user) return { error: Response.json({ error: "Sign in is required." }, { status: 401 }) } as const;
  if (!isObituaryAdmin(user.email)) return { error: Response.json({ error: "You do not have access to the obituary manager." }, { status: 403 }) } as const;
  return { user } as const;
}
