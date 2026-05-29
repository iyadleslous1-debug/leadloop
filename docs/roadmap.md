# LeadLoop Roadmap

## Phase 1 — Backend + Dashboard UI (Current)

- [x] Supabase project connected
- [x] Database schema (profiles, leads) with RLS
- [x] Auto-create profile on signup
- [x] TypeScript types (Lead, Profile, LeadStatus)
- [x] Supabase clients (browser + server + middleware)
- [x] Auth proxy (route protection)
- [x] Auth pages (login/signup with Supabase)
- [x] API routes (leads CRUD)
- [x] Service layer (leads, auth)
- [x] Dashboard layout (sidebar + navbar)
- [x] Dashboard overview (stats cards + recent leads)
- [x] Leads page (full table)
- [ ] Seed script or mock data for testing
- [ ] Run `proxy.ts` migration (user action)

## Phase 2 — AI + WhatsApp

- [ ] OpenRouter/Groq integration
- [ ] AI auto-reply endpoint
- [ ] WhatsApp webhook
- [ ] Follow-up scheduling
- [ ] Notification system

## Phase 3 — Polish

- [ ] Analytics page
- [ ] Settings page
- [ ] Lead creation form
- [ ] Lead detail/edit page
- [ ] Search and filter
- [ ] n8n workflow integration
