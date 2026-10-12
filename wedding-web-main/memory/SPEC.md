# Mangal Milan — Living Specification

## Product
English-led one-page wedding invitation for Akanksha Kumari and Vivek Kumar, wedding date 25 November 2026 at 6:00 PM IST. Hindi is intentionally retained for the Ganesh invocation, both shlokas, event titles/descriptions, and the children’s “छादी” request. The guest journey starts on a Ganesh opening screen, then reveals the invitation and starts the selected background track.

## Public flow
- Matte cream-beige glass opening screen with the English lockup “AKANKSHA WEDS VIVEK” → invitation hero → letter → couple → IST countdown → five-event timeline → engagement gallery/lightbox → three venues/maps → बाल आग्रह → hosts → two-field RSVP → footer.
- Public navigation, family details, venues, hosts, RSVP copy, dates, and metadata are English; cultural verses and event copy are Hindi. Music starts only after opening, loops, fades to 35%, remembers mute, and pauses when the page is backgrounded.
- Dedicated bride and groom portrait assets are rotated 90° counter-clockwise for upright arch crops. Seeded gallery rotations are image-specific: 0°, -90°, -90°, -90°.
- The Shantinagar residence uses the owner-provided Google Maps short link and embed URL.
- Public content reads from `GET /api/invitation` and falls back to bundled defaults if the backend is unavailable.
- RSVP uses guest name and guest count through `POST /api/rsvps`.

## Admin flow
- `/admin` provides Basics, Couple, Events, Venues, Gallery, Text, Music, Theme, and RSVP tabs.
- Save & Publish writes the single Mongo-backed content document through `PUT /api/admin/invitation`; the prior version is retained and can be restored.
- Gallery and portrait uploads are browser-compressed to WebP. Music upload is limited to 5 MB. JSON backup/import and RSVP CSV export are available.
- **Owner authentication:** `/admin` displays a Firebase email/password login. Firebase validates the password; the backend permits only `rohitj.badkumar@gmail.com`, creates a random Mongo-backed httpOnly SameSite=Strict session, and never stores the password or exposes a token to JavaScript.
- Every `/api/admin/*` endpoint requires that owner session. Unauthenticated guests receive `401 Owner login required`; logout deletes the server session, and Firebase password reset is available from the login screen.

## Data model
`InvitationContent` contains `basics`, `couple`, `events`, `venues`, `gallery`, `texts`, `music`, and `theme`, with a version and timestamp. English editable counterparts use `_en` fields while the original Hindi source copy remains preserved in storage. RSVP documents contain `id`, `guest_name`, `guest_count`, and `created_at`.

## Seed facts
- Five events run from 21–25 November 2026; only listed timings are present.
- Three venues: Shantinagar residence, Hotel Vrindavan, and the Mokri Tilak destination.
- Four uploaded WebP photos and the provided MP3 are seeded as public assets.