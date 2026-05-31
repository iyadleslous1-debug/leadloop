interface EscalationRule {
  name: string;
  check: (messages: { role: string; content: string }[]) => { shouldEscalate: boolean; reason: string } | null;
}

const RULES: EscalationRule[] = [
  {
    name: "angry_buyer",
    check: (messages) => {
      const angryKeywords = ["angry", "frustrated", "not happy", "upset", "complain", "complaint", "annoyed",
        "غاضب", "غير راض", "مشكل", "شكوى", "fâché", "mécontent", "plains", "za3fan", "ghadban", "mch radhi"];
      const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content?.toLowerCase();
      if (lastUserMsg && angryKeywords.some((k) => lastUserMsg.includes(k))) {
        return { shouldEscalate: true, reason: "Angry or frustrated buyer detected" };
      }
      return null;
    },
  },
  {
    name: "high_value",
    check: (messages) => {
      const highValuePatterns = [/high.?value/i, /over\s+\d+k/i, /budget.*(?:above|over|more than)\s*(\d+)/i,
        /\$\s*(\d+)/, /(\d+)\s*(?:million|milion|m)/i];
      const allContent = messages.map((m) => m.content).join(" ").toLowerCase();
      const matches = highValuePatterns.filter((p) => p.test(allContent));
      if (matches.length >= 2) {
        return { shouldEscalate: true, reason: "High-value prospect detected" };
      }
      return null;
    },
  },
  {
    name: "repeated_questions",
    check: (messages) => {
      const userMsgs = messages.filter((m) => m.role === "user").map((m) => m.content.toLowerCase());
      if (userMsgs.length < 4) return null;
      const questionWords = ["price", "cost", "how much", "size", "location", "when",
        "السعر", "كم", "أين", "combien", "prix", "ou", "où", "chhal", "wein", "waqtach"];
      const questionCount = userMsgs.filter((m) => questionWords.some((w) => m.includes(w))).length;
      if (questionCount >= 3) {
        return { shouldEscalate: true, reason: "Repeated questions — buyer may need human assistance" };
      }
      return null;
    },
  },
];

export function checkEscalationRules(messages: { role: string; content: string }[]): { shouldEscalate: boolean; reason: string } {
  for (const rule of RULES) {
    const result = rule.check(messages);
    if (result?.shouldEscalate) return result;
  }
  return { shouldEscalate: false, reason: "" };
}
