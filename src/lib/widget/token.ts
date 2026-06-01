import { createHash, randomBytes } from "crypto";

export function generateWidgetToken(): string {
  return randomBytes(24).toString("base64url");
}

export function hashWidgetToken(token: string): string {
  return createHash("sha256").update(token.trim()).digest("hex");
}
