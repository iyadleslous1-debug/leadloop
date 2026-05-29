# LeadLoop

LeadLoop is an AI-powered follow-up assistant for real estate agents.

## Goal

Help real estate agents stop losing leads by automating follow-up through WhatsApp and AI.

## Core Problem

Real estate agents:
- get many leads per month
- forget to follow up
- respond too late
- lose deals to competitors
- waste time on repetitive messages

## MVP Features

- Lead dashboard
- Lead status tags (Hot/Warm/Cold)
- AI auto replies (OpenRouter/Groq)
- Automated follow-up scheduling
- Hot / Warm / Cold scoring
- Simple clean dashboard

## Tech Stack

- Next.js 16
- Tailwind CSS 4
- Supabase (Auth + Database)
- shadcn/ui (radix-nova style)
- OpenRouter / Groq (AI)
- n8n later for workflows

## Current Phase

Phase 1: Backend-first — Supabase schema, auth, API, then dashboard UI with real data.

## File Structure

```
app/              — Next.js App Router pages and API routes
components/       — UI components (layout, leads, dashboard)
lib/              — Supabase clients and auth helpers
types/            — TypeScript interfaces
services/         — Business logic layer (leads, auth)
data/             — Data files
docs/             — Documentation
scripts/          — Migration scripts
proxy.ts          — Auth guard (Next.js 16 middleware replacement)
```
