// Random codes for code-only perks and gift cards (birthday card, app perks,
// gift card QR codes).

// No 0/O or 1/I, so a code can be read aloud or typed without mistakes.
// 32 characters, so one random byte picks one evenly.
export const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/** `length` characters from CODE_ALPHABET. Pass bytes in tests; otherwise they are random. */
export function randomCodePart(length: number, bytes: Uint8Array = crypto.getRandomValues(new Uint8Array(length))): string {
  return Array.from(bytes.slice(0, length), (byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join("");
}
