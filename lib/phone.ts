export function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[^+\d]/g, "");

  if (cleaned.startsWith("+")) {
    return cleaned;
  }

  if (cleaned.startsWith("00")) {
    return `+${cleaned.slice(2)}`;
  }

  if (cleaned.startsWith("0") && cleaned.length <= 11) {
    return `+213${cleaned.slice(1)}`;
  }

  return `+${cleaned}`;
}
