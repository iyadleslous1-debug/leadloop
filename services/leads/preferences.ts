import type { LeadPreferences } from "@/types/lead";

export function extractPreferences(text: string, existing?: LeadPreferences | null): LeadPreferences {
  const lower = text.toLowerCase();
  const prefs: LeadPreferences = { ...(existing || {}) };

  const budgetRegex = /(\d+[kKmMbB]?)\s*(?:to|-|and)?\s*(\d+[kKmMbB]?)?/g;
  const amounts: number[] = [];
  let match;
  while ((match = budgetRegex.exec(lower)) !== null) {
    const n = parseFloat(match[1].replace(/[kmb]/gi, ""));
    const multiplier = match[1].toLowerCase().includes("m") ? 1_000_000
      : match[1].toLowerCase().includes("b") ? 1_000_000_000
      : match[1].toLowerCase().includes("k") ? 1_000 : 1;
    amounts.push(n * multiplier);
  }

  const validAmounts = amounts.filter((a) => a >= 10000 && a <= 100_000_000);
  if (validAmounts.length >= 2) {
    prefs.budgetMin = Math.min(...validAmounts);
    prefs.budgetMax = Math.max(...validAmounts);
  } else if (validAmounts.length === 1) {
    prefs.budgetMin = Math.round(validAmounts[0] * 0.8);
    prefs.budgetMax = Math.round(validAmounts[0] * 1.2);
  }

  const cityKeywords = [
    "algiers", "الجزائر", "oran", "وهران", "constantine", "قسنطينة",
    "annaba", "عنابة", "tizi ouzou", "تيزي وزو", "setif", "سطيف",
    "blida", "البليدة", "tlemcen", "تلمسان", "bejaia", "بجاية",
  ];
  const foundCities = cityKeywords.filter((c) => lower.includes(c)).map((c) => c.toLowerCase());
  if (foundCities.length > 0) {
    prefs.cities = [...new Set([...(prefs.cities || []), ...foundCities])];
  }

  const typeKeywords: Record<string, string[]> = {
    villa: ["villa", "فيلا"],
    apartment: ["apartment", "flat", "condo", "studio", "شقة", "appartement"],
    house: ["house", "home", "maison", "منزل", "دار"],
    land: ["land", "terrain", "أرض"],
    commercial: ["commercial", "commerciale", "تجاري", "محل"],
  };

  for (const [type, kws] of Object.entries(typeKeywords)) {
    if (kws.some((kw) => lower.includes(kw))) {
      const current = prefs.propertyTypes || [];
      if (!current.includes(type)) {
        prefs.propertyTypes = [...current, type];
      }
    }
  }

  const bedroomMatch = lower.match(/(\d+)\s*(bedroom|bed|chambre|غرفة|غرف)\b/);
  if (bedroomMatch) {
    prefs.bedrooms = parseInt(bedroomMatch[1], 10);
  }

  const timelineKeywords: Record<string, string[]> = {
    "asap": ["asap", "urgent", "immediately", "as soon as", "right away", "الآن", "عاجل", "بسرعة"],
    "1-3 months": ["this month", "next month", "in a month", "شهر", "mois"],
    "3-6 months": ["in 3 months", "in a few months", "before summer", "3 mois"],
    "6+ months": ["not urgent", "just looking", "eventually", "في المستقبل", "plus tard"],
  };

  for (const [timeline, kws] of Object.entries(timelineKeywords)) {
    if (kws.some((kw) => lower.includes(kw))) {
      prefs.purchaseTimeline = timeline;
      break;
    }
  }

  const financingKeywords: Record<string, string[]> = {
    "cash": ["cash", "نقداً", "نقدا", "comptant", "espèces"],
    "mortgage": ["mortgage", "loan", "financing", "bank", "financement", "crédit", "prêt", "قرض", "بنك", "تمويل"],
    "installments": ["installment", "installments", "分期", "تقسيط", "tranches"],
  };

  for (const [financing, kws] of Object.entries(financingKeywords)) {
    if (kws.some((kw) => lower.includes(kw))) {
      prefs.financing = financing;
      break;
    }
  }

  return prefs;
}
