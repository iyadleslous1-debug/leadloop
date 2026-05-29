# Database Schema

## Tables

### profiles

| Column     | Type      | Description                |
|------------|-----------|----------------------------|
| id         | uuid      | Primary key, references auth.users |
| name       | text      | Display name               |
| avatar_url | text      | Profile picture URL        |
| phone      | text      | Phone number               |
| created_at | timestamptz | Auto-generated           |

RLS: Users can view and update only their own profile.

### leads

| Column            | Type      | Description                    |
|-------------------|-----------|--------------------------------|
| id                | uuid      | Primary key, auto-generated    |
| user_id           | uuid      | Foreign key to profiles.id     |
| name              | text      | Lead name                      |
| phone             | text      | Phone number                   |
| email             | text      | Email address                  |
| status            | text      | 'hot', 'warm', or 'cold'       |
| source            | text      | 'whatsapp', 'website', 'referral', 'manual', 'import' |
| notes             | text      | Internal notes                 |
| last_contact_at   | timestamptz | Last interaction date        |
| next_follow_up_at | timestamptz | Scheduled follow-up          |
| created_at        | timestamptz | Auto-generated               |
| updated_at        | timestamptz | Auto-updated                 |

RLS: Users can view, insert, update, and delete only their own leads.

## Triggers

- `on_auth_user_created` — When a user signs up via Supabase Auth, automatically creates a profile row.

## Run Migration

Run `scripts/init.sql` in Supabase Dashboard SQL Editor.
