# Cursor 확장 개발 프롬프트

You are a senior full-stack product engineer.

Convert this static Day Anchor prototype into a production-ready Next.js MVP.

Requirements:
- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- PWA support
- Mobile-first responsive UI

Core entities:
- days
- schedule_blocks
- tasks
- notes
- voice_memos
- reminders
- activity_events

Features:
1. User authentication
2. Date-based daily board
3. Create/edit/delete schedule blocks
4. Add/edit/delete checklist tasks
5. Mark tasks as done/skipped/carried
6. Add text notes
7. Record voice memo via MediaRecorder API
8. Upload voice memo to Supabase Storage
9. Attach notes/voice memos to schedule block
10. Daily review and 7-day insights
11. Activity event logging
12. PWA manifest and service worker

UX principles:
- Keep the Today page as the main operating board.
- Make schedule block creation possible in under 10 seconds.
- Make quick memo and quick task accessible from the current time block.
- Keep mobile UI calm, card-based, and widget-like.
