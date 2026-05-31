import type { ScoreBreakdown } from "@/types/lead";

export interface LeadScoreParams {
  intentScore: number;
  lastContactAt?: string | null;
  messageCount: number;
  hasPropertyMatch: boolean;
  followUpCompletionRate?: number;
}

export interface LeadScoreResult {
  total: number;
  breakdown: ScoreBreakdown;
}

export function calculateLeadScore(params: LeadScoreParams): LeadScoreResult {
  const intent = Math.round(Math.min(params.intentScore, 1) * 30);

  let recency = 0;
  if (params.lastContactAt) {
    const daysSince = (Date.now() - new Date(params.lastContactAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince <= 1) recency = 25;
    else if (daysSince <= 7) recency = 20;
    else if (daysSince <= 14) recency = 12;
    else if (daysSince <= 30) recency = 6;
    else recency = 2;
  }

  const engagement = Math.min(Math.floor((params.messageCount || 0) / 2) * 5, 20);

  const propertyMatch = params.hasPropertyMatch ? 15 : 0;

  const followUp = params.followUpCompletionRate !== undefined
    ? Math.round(Math.min(params.followUpCompletionRate, 1) * 10)
    : 0;

  const total = Math.min(intent + recency + engagement + propertyMatch + followUp, 100);

  return {
    total,
    breakdown: { intent, recency, engagement, propertyMatch, followUp },
  };
}

export function scoreToStatus(score: number): "hot" | "warm" | "cold" {
  if (score >= 67) return "hot";
  if (score >= 34) return "warm";
  return "cold";
}
