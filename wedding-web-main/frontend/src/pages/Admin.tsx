import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowLeft, ArrowUp, Download, Eye, ImagePlus, LockKeyhole, LogOut, Mail, Music2, Plus, RotateCcw, Save, Trash2, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { defaultContent } from "@/data/defaultContent";
import { ApiError, apiGet, apiPost, apiPut } from "@/lib/api";
import type { AuthMessage, OwnerSession } from "@/types/auth";
import type { EventItem, InvitationContent, MusicTrack, PhotoItem, RsvpResponse, VersionSummary } from "@/types/invitation";

const ADMIN_TABS = [
  ["basics", "Basics"], ["couple", "Bride & Groom"], ["events", "Events"], ["venues", "Venues & Maps"],
  ["gallery", "Gallery"], ["texts", "Text Blocks"], ["music", "Music"], ["theme", "Theme"], ["rsvp", "RSVP"],
] as const;

const DAY_NAMES = ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"];

function OwnerLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showReset, setShowReset] = useState(false);
  const queryClient = useQueryClient();
  const login = useMutation({
    mutationFn: () => apiPost<OwnerSession>("/auth/login", { email, password }),
    onSuccess: (session) => {
      queryClient.setQueryData(["owner-session"], session);
      setPassword("");
      toast.success("Welcome back. Owner access unlocked.");
    },
    onError: (error) => {
      const message = error instanceof ApiError && error.status === 503
        ? "Owner login is temporarily unavailable."
        : "Incorrect owner email or password.";
      toast.error(message);
    },
  });
  const reset = useMutation({
    mutationFn: () => apiPost<AuthMessage>("/auth/password-reset", { email }),
    onSuccess: (result) => { toast.success(result.message); setShowReset(false); },
    onError: () => toast.error("Password reset is temporarily unavailable."),
  });

  return <div className="owner-login-page" data-testid="owner-login-page">
    <Link to="/" className="owner-login-back" data-testid="owner-login-back-link"><ArrowLeft /> Return to invitation</Link>
    <div className="owner-login-card" data-testid="owner-login-card">
      <div className="owner-lock"><LockKeyhole /></div>
      <p className="eyebrow" data-testid="owner-login-eyebrow">PRIVATE OWNER ACCESS</p>
      <h1 data-testid="owner-login-title">Invitation Management</h1>
      <p className="owner-login-copy" data-testid="owner-login-copy">Only the authorized owner can edit or publish this invitation.</p>
      {!showReset ? <form onSubmit={(event) => { event.preventDefault(); login.mutate(); }} data-testid="owner-login-form">
        <Field label="Owner email" testId="owner-login-email"><Input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required data-testid="owner-login-email-input" /></Field>
        <Field label="Password" testId="owner-login-password"><Input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} data-testid="owner-login-password-input" /></Field>
        <Button type="submit" size="lg" disabled={login.isPending} data-testid="owner-login-submit-button">{login.isPending ? "Signing in…" : "Sign in securely"}</Button>
        <button type="button" className="owner-reset-link" onClick={() => setShowReset(true)} data-testid="owner-forgot-password-button">Forgot password?</button>
      </form> : <form onSubmit={(event) => { event.preventDefault(); reset.mutate(); }} data-testid="owner-reset-form">
        <Field label="Firebase owner email" testId="owner-reset-email"><Input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required data-testid="owner-reset-email-input" /></Field>
        <Button type="submit" size="lg" disabled={reset.isPending} data-testid="owner-reset-submit-button"><Mail /> {reset.isPending ? "Sending…" : "Send reset email"}</Button>
        <button type="button" className="owner-reset-link" onClick={() => setShowReset(false)} data-testid="owner-reset-back-button">Back to sign in</button>
      </form>}
      <p className="owner-security-note" data-testid="owner-security-note">Secured by Firebase Authentication · Your password is never stored by this website</p>
    </div>
  </div>;
}

function cloneContent(content: InvitationContent) {
  return structuredClone(content);
}

async function imageToWebp(file: File): Promise<string> {
  if (file.size > 12 * 1024 * 1024) throw new Error("Image must be under 12 MB");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", .78));
  if (!blob) throw new Error("Could not process image");
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function Field({ label, testId, children }: { label: string; testId: string; children: React.ReactNode }) {
  return <div className="admin-field" data-testid={`${testId}-field`}><Label data-testid={`${testId}-label`}>{label}</Label>{children}</div>;
}

function BasicsEditor({ draft, setDraft }: { draft: InvitationContent; setDraft: (value: InvitationContent) => void }) {
  const update = (key: keyof InvitationContent["basics"], value: string | boolean) => {
    const next = cloneContent(draft);
    Object.assign(next.basics, { [key]: value });
    setDraft(next);
  };
  const uploadGanesh = async (file?: File) => {
    if (!file) return;
    try { const url = await imageToWebp(file); const next = cloneContent(draft); next.ganesh_url = url; setDraft(next); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Upload failed"); }
  };
  return <div className="admin-editor-grid" data-testid="basics-editor">
    <div className="admin-card wide"><h2 data-testid="basics-heading">Invitation Basics</h2><div className="field-grid">
      <Field label="Page title" testId="page-title"><Input value={draft.basics.page_title_en} onChange={(e) => update("page_title_en", e.target.value)} data-testid="page-title-input" /></Field>
      <Field label="Wedding date" testId="wedding-date"><Input type="date" value={draft.basics.wedding_date} onChange={(e) => update("wedding_date", e.target.value)} data-testid="wedding-date-input" /></Field>
      <Field label="Time (IST)" testId="wedding-time"><Input type="time" value={draft.basics.wedding_time} onChange={(e) => update("wedding_time", e.target.value)} data-testid="wedding-time-input" /></Field>
      <Field label="वधू का नाम (हिन्दी)" testId="bride-hi"><Input lang="hi" value={draft.basics.bride_hi} onChange={(e) => update("bride_hi", e.target.value)} data-testid="bride-hi-input" /></Field>
      <Field label="Bride name (English)" testId="bride-en"><Input value={draft.basics.bride_en} onChange={(e) => update("bride_en", e.target.value)} data-testid="bride-en-input" /></Field>
      <Field label="वर का नाम (हिन्दी)" testId="groom-hi"><Input lang="hi" value={draft.basics.groom_hi} onChange={(e) => update("groom_hi", e.target.value)} data-testid="groom-hi-input" /></Field>
      <Field label="Groom name (English)" testId="groom-en"><Input value={draft.basics.groom_en} onChange={(e) => update("groom_en", e.target.value)} data-testid="groom-en-input" /></Field>
      <Field label="Family line" testId="family-label-en"><Input value={draft.basics.family_label_en} onChange={(e) => update("family_label_en", e.target.value)} data-testid="family-label-en-input" /></Field>
      <Field label="Celebration title" testId="celebration-label"><Input value={draft.basics.celebration_label_en} onChange={(e) => update("celebration_label_en", e.target.value)} data-testid="celebration-label-input" /></Field>
      <Field label="रोमांटिक पंक्ति (हिन्दी)" testId="romantic-hi"><Textarea lang="hi" value={draft.basics.romantic_hi} onChange={(e) => update("romantic_hi", e.target.value)} data-testid="romantic-hi-input" /></Field>
      <Field label="Romantic line (English)" testId="romantic-en"><Textarea value={draft.basics.romantic_en} onChange={(e) => update("romantic_en", e.target.value)} data-testid="romantic-en-input" /></Field>
    </div></div>
    <div className="admin-card"><h2 data-testid="ganesh-editor-heading">Lord Ganesha Image</h2><div className="ganesh-admin-preview">{draft.ganesh_url ? <img src={draft.ganesh_url} alt="Uploaded Ganesh" /> : <span>Default gold line-art in use</span>}</div><label className="file-button" data-testid="ganesh-upload-button"><Upload size={16} /> Replace PNG / WebP<input type="file" accept="image/png,image/webp,image/jpeg" onChange={(e) => void uploadGanesh(e.target.files?.[0])} /></label>{draft.ganesh_url && <Button variant="ghost" onClick={() => { const next = cloneContent(draft); next.ganesh_url = ""; setDraft(next); }} data-testid="ganesh-reset-button">Use default</Button>}</div>
    <div className="admin-card"><h2 data-testid="share-preview-heading">WhatsApp preview</h2><Field label="Share title" testId="share-title"><Input value={draft.basics.whatsapp_title} onChange={(e) => update("whatsapp_title", e.target.value)} data-testid="share-title-input" /></Field><Field label="Share description" testId="share-description"><Textarea value={draft.basics.whatsapp_description} onChange={(e) => update("whatsapp_description", e.target.value)} data-testid="share-description-input" /></Field><label className="admin-check" data-testid="noindex-toggle-label"><input type="checkbox" checked={draft.basics.noindex} onChange={(e) => update("noindex", e.target.checked)} data-testid="noindex-toggle" /> Private invitation: noindex</label></div>
  </div>;
}

function CoupleEditor({ draft, setDraft }: { draft: InvitationContent; setDraft: (value: InvitationContent) => void }) {
  const updatePerson = (side: "bride" | "groom", key: string, value: string | number | string[]) => { const next = cloneContent(draft); Object.assign(next.couple[side], { [key]: value }); setDraft(next); };
  const upload = async (side: "bride" | "groom", file?: File) => { if (!file) return; try { const next = cloneContent(draft); next.couple[side].photo_url = await imageToWebp(file); next.couple[side].photo_rotation = 0; setDraft(next); } catch { toast.error("Photo upload failed"); } };
  return <div className="admin-editor-grid two" data-testid="couple-editor">
    {(["bride", "groom"] as const).map((side) => { const person = draft.couple[side]; const label = side === "bride" ? "Bride" : "Groom"; return <div className="admin-card" key={side} data-testid={`${side}-editor-card`}><h2>{label}</h2><div className="admin-photo-preview">{person.photo_url ? <img src={person.photo_url} alt={person.photo_alt_en || person.photo_alt} style={{ transform: `rotate(${person.photo_rotation}deg) scale(${person.photo_rotation ? 1.35 : 1})` }} /> : <span>No photo</span>}</div><label className="file-button" data-testid={`${side}-photo-upload`}><ImagePlus size={16} /> Replace photo<input type="file" accept="image/*" onChange={(e) => void upload(side, e.target.files?.[0])} /></label>
      <Field label="नाम (हिन्दी)" testId={`${side}-full-name-hi`}><Input lang="hi" value={person.name_hi} onChange={(e) => updatePerson(side, "name_hi", e.target.value)} data-testid={`${side}-full-name-hi-input`} /></Field>
      <Field label="Name (English)" testId={`${side}-full-name-en`}><Input value={person.name_en} onChange={(e) => updatePerson(side, "name_en", e.target.value)} data-testid={`${side}-full-name-en-input`} /></Field>
      <Field label="Family lines (one per line)" testId={`${side}-details`}><Textarea value={person.details_en.join("\n")} onChange={(e) => updatePerson(side, "details_en", e.target.value.split("\n"))} data-testid={`${side}-details-input`} /></Field>
      <Field label="Address" testId={`${side}-address`}><Textarea value={person.address_en} onChange={(e) => updatePerson(side, "address_en", e.target.value)} data-testid={`${side}-address-input`} /></Field>
      <Field label="Photo alt text" testId={`${side}-alt`}><Input value={person.photo_alt_en} onChange={(e) => updatePerson(side, "photo_alt_en", e.target.value)} data-testid={`${side}-alt-input`} /></Field>
    </div>; })}
    <div className="admin-card wide"><Field label="Invitation closing line" testId="invitation-closing"><Textarea value={draft.couple.invitation_closing_en} onChange={(e) => { const next = cloneContent(draft); next.couple.invitation_closing_en = e.target.value; setDraft(next); }} data-testid="invitation-closing-input" /></Field></div>
  </div>;
}

function EventsEditor({ draft, setDraft }: { draft: InvitationContent; setDraft: (value: InvitationContent) => void }) {
  const update = (index: number, key: keyof EventItem, value: EventItem[keyof EventItem]) => { const next = cloneContent(draft); Object.assign(next.events[index], { [key]: value }); setDraft(next); };
  const move = (index: number, offset: number) => { const next = cloneContent(draft); const target = index + offset; if (target < 0 || target >= next.events.length) return; [next.events[index], next.events[target]] = [next.events[target], next.events[index]]; setDraft(next); };
  const remove = (index: number) => { const next = cloneContent(draft); next.events.splice(index, 1); setDraft(next); };
  const add = () => { const next = cloneContent(draft); next.events.push({ id: crypto.randomUUID(), date: draft.basics.wedding_date, day_hi: DAY_NAMES[new Date(`${draft.basics.wedding_date}T12:00:00`).getDay()], title_hi: "नया कार्यक्रम", title_en: "New Event", time: "", description_hi: "", description_en: "", venue_id: draft.venues[0]?.id || "", photos: [], visible: true }); setDraft(next); };
  const uploadEventPhoto = async (index: number, file?: File) => { if (!file) return; try { const next = cloneContent(draft); next.events[index].photos.push({ id: crypto.randomUUID(), url: await imageToWebp(file), caption: next.events[index].title_hi, caption_en: next.events[index].title_en, alt: next.events[index].title_hi, alt_en: next.events[index].title_en, rotation: 0 }); setDraft(next); } catch { toast.error("Photo upload failed"); } };
  return <div data-testid="events-editor"><div className="editor-title-row"><div><h2>कार्यक्रम</h2><p>तारीख बदलने पर वार स्वतः अपडेट होगा। खाली समय सार्वजनिक पृष्ठ पर नहीं दिखेगा।</p></div><Button onClick={add} data-testid="add-event-button"><Plus /> कार्यक्रम जोड़ें</Button></div><div className="admin-stack">{draft.events.map((event, index) => <div className="admin-card event-admin-card" key={event.id} data-testid={`event-editor-${event.id}`}><div className="admin-card-toolbar"><Badge>{String(index + 1).padStart(2, "0")}</Badge><label className="admin-check"><input type="checkbox" checked={event.visible} onChange={(e) => update(index, "visible", e.target.checked)} data-testid={`event-visible-${event.id}`} /> दिखाएँ</label><Button variant="ghost" size="icon-sm" onClick={() => move(index, -1)} aria-label="Move up" data-testid={`event-move-up-${event.id}`}><ArrowUp /></Button><Button variant="ghost" size="icon-sm" onClick={() => move(index, 1)} aria-label="Move down" data-testid={`event-move-down-${event.id}`}><ArrowDown /></Button><Button variant="ghost" size="icon-sm" onClick={() => remove(index)} aria-label="Delete event" data-testid={`event-delete-${event.id}`}><Trash2 /></Button></div><div className="field-grid">
        <Field label="तिथि" testId={`event-date-${event.id}`}><Input type="date" value={event.date} onChange={(e) => { const next = cloneContent(draft); next.events[index].date = e.target.value; next.events[index].day_hi = DAY_NAMES[new Date(`${e.target.value}T12:00:00`).getDay()]; setDraft(next); }} data-testid={`event-date-input-${event.id}`} /></Field>
        <Field label="वार" testId={`event-day-${event.id}`}><Input value={event.day_hi} readOnly data-testid={`event-day-input-${event.id}`} /></Field>
        <Field label="समय (खाली छोड़ सकते हैं)" testId={`event-time-${event.id}`}><Input type="time" value={event.time} onChange={(e) => update(index, "time", e.target.value)} data-testid={`event-time-input-${event.id}`} /></Field>
        <Field label="कार्यक्रम (हिन्दी)" testId={`event-title-hi-${event.id}`}><Input lang="hi" value={event.title_hi} onChange={(e) => update(index, "title_hi", e.target.value)} data-testid={`event-title-hi-input-${event.id}`} /></Field>
        <Field label="Event title (English)" testId={`event-title-en-${event.id}`}><Input value={event.title_en} onChange={(e) => update(index, "title_en", e.target.value)} data-testid={`event-title-en-input-${event.id}`} /></Field>
        <Field label="Venue" testId={`event-venue-${event.id}`}><select value={event.venue_id} onChange={(e) => update(index, "venue_id", e.target.value)} data-testid={`event-venue-select-${event.id}`}>{draft.venues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name_en || venue.name}</option>)}</select></Field>
        <Field label="विवरण (हिन्दी)" testId={`event-desc-hi-${event.id}`}><Textarea lang="hi" value={event.description_hi} onChange={(e) => update(index, "description_hi", e.target.value)} data-testid={`event-desc-hi-input-${event.id}`} /></Field>
        <Field label="Description (English)" testId={`event-desc-en-${event.id}`}><Textarea value={event.description_en} onChange={(e) => update(index, "description_en", e.target.value)} data-testid={`event-desc-en-input-${event.id}`} /></Field>
      </div><label className="file-button small" data-testid={`event-photo-upload-${event.id}`}><ImagePlus size={15} /> फोटो जोड़ें ({event.photos.length}/3)<input type="file" accept="image/*" disabled={event.photos.length >= 3} onChange={(e) => void uploadEventPhoto(index, e.target.files?.[0])} /></label></div>)}</div></div>;
}

function VenuesEditor({ draft, setDraft }: { draft: InvitationContent; setDraft: (value: InvitationContent) => void }) {
  const update = (index: number, key: string, value: string) => { const next = cloneContent(draft); Object.assign(next.venues[index], { [key]: value }); setDraft(next); };
  return <div data-testid="venues-editor"><div className="editor-title-row"><div><h2>Venues & Maps</h2><p>A map is generated from the English address when the embed URL is blank.</p></div></div><div className="admin-editor-grid">{draft.venues.map((venue, index) => <div className="admin-card" key={venue.id} data-testid={`venue-editor-${venue.id}`}><Badge>Venue {index + 1}</Badge><Field label="Name" testId={`venue-name-${venue.id}`}><Input value={venue.name_en} onChange={(e) => update(index, "name_en", e.target.value)} data-testid={`venue-name-input-${venue.id}`} /></Field><Field label="Address" testId={`venue-address-${venue.id}`}><Textarea value={venue.address_en} onChange={(e) => update(index, "address_en", e.target.value)} data-testid={`venue-address-input-${venue.id}`} /></Field><Field label="Details" testId={`venue-details-${venue.id}`}><Input value={venue.details_en} onChange={(e) => update(index, "details_en", e.target.value)} data-testid={`venue-details-input-${venue.id}`} /></Field><Field label="Google Maps link" testId={`venue-map-link-${venue.id}`}><Input value={venue.map_link} onChange={(e) => update(index, "map_link", e.target.value)} placeholder="https://maps.google.com/..." data-testid={`venue-map-link-input-${venue.id}`} /></Field><Field label="Optional embed URL" testId={`venue-embed-${venue.id}`}><Input value={venue.embed_url} onChange={(e) => update(index, "embed_url", e.target.value)} data-testid={`venue-embed-input-${venue.id}`} /></Field></div>)}</div></div>;
}

function GalleryEditor({ draft, setDraft }: { draft: InvitationContent; setDraft: (value: InvitationContent) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = async (files: FileList | null) => { if (!files) return; const allowed = Array.from(files).slice(0, Math.max(0, 20 - draft.gallery.length)); try { const items: PhotoItem[] = []; for (const file of allowed) items.push({ id: crypto.randomUUID(), url: await imageToWebp(file), caption: "", caption_en: "", alt: "", alt_en: "", rotation: 0 }); const next = cloneContent(draft); next.gallery.push(...items); setDraft(next); } catch { toast.error("One or more photos could not be processed"); } };
  const move = (index: number, offset: number) => { const next = cloneContent(draft); const target = index + offset; if (target < 0 || target >= next.gallery.length) return; [next.gallery[index], next.gallery[target]] = [next.gallery[target], next.gallery[index]]; setDraft(next); };
  return <div data-testid="gallery-editor"><div className="editor-title-row"><div><h2>Engagement Gallery</h2><p>Photos are compressed to WebP in your browser. Maximum 20.</p></div><Button onClick={() => inputRef.current?.click()} data-testid="gallery-upload-button"><ImagePlus /> Add photos</Button><input ref={inputRef} className="hidden-input" type="file" accept="image/*" multiple onChange={(e) => void upload(e.target.files)} /></div><div className="gallery-admin-grid">{draft.gallery.map((photo, index) => <div className="gallery-admin-item" key={photo.id} data-testid={`gallery-editor-item-${photo.id}`}><div className="gallery-admin-image"><img src={photo.url} alt={photo.alt_en || "Gallery"} style={{ transform: `rotate(${photo.rotation}deg) scale(${photo.rotation ? 1.28 : 1})` }} /></div><Input value={photo.caption_en} onChange={(e) => { const next = cloneContent(draft); next.gallery[index].caption_en = e.target.value; setDraft(next); }} placeholder="English caption" data-testid={`gallery-caption-${photo.id}`} /><Input value={photo.alt_en} onChange={(e) => { const next = cloneContent(draft); next.gallery[index].alt_en = e.target.value; setDraft(next); }} placeholder="English alt text" data-testid={`gallery-alt-${photo.id}`} /><div><Button variant="ghost" size="icon-sm" onClick={() => move(index, -1)} data-testid={`gallery-up-${photo.id}`}><ArrowUp /></Button><Button variant="ghost" size="icon-sm" onClick={() => move(index, 1)} data-testid={`gallery-down-${photo.id}`}><ArrowDown /></Button><Button variant="ghost" size="icon-sm" onClick={() => { const next = cloneContent(draft); next.gallery.splice(index, 1); setDraft(next); }} data-testid={`gallery-delete-${photo.id}`}><Trash2 /></Button></div></div>)}</div></div>;
}

function TextsEditor({ draft, setDraft }: { draft: InvitationContent; setDraft: (value: InvitationContent) => void }) {
  const fields: [keyof InvitationContent["texts"], string][] = [["shloka_hero_en", "Ganesha verse meaning"], ["shloka_events_en", "Auspicious verse meaning"], ["invitation_intro_en", "Invitation opening"], ["venue_note_en", "Venue note"], ["kids_poem_en", "Children’s request"], ["kids_signature_en", "Children’s signature"], ["kids_blessing_en", "Blessing verse"], ["welcome_hosts_en", "Welcoming hosts"], ["well_wishers_en", "Well-wishers"], ["aspirant_en", "With compliments from"]];
  return <div className="admin-card" data-testid="texts-editor"><h2>English Text Blocks</h2><div className="field-grid">{fields.map(([key, label]) => <Field label={label} testId={`text-${key}`} key={key}><Textarea value={draft.texts[key]} onChange={(e) => { const next = cloneContent(draft); next.texts[key] = e.target.value; setDraft(next); }} data-testid={`text-${key}-input`} /></Field>)}</div></div>;
}

function MusicEditor({ draft, setDraft }: { draft: InvitationContent; setDraft: (value: InvitationContent) => void }) {
  const addUrl = () => { const next = cloneContent(draft); next.music.push({ id: crypto.randomUUID(), title: "नया गीत", url: "", is_default: next.music.length === 0 }); setDraft(next); };
  const upload = async (index: number, file?: File) => { if (!file) return; if (file.size > 5 * 1024 * 1024) { toast.error("MP3 must be 5 MB or smaller"); return; } const next = cloneContent(draft); next.music[index].url = await fileToDataUrl(file); setDraft(next); };
  return <div data-testid="music-editor"><div className="editor-title-row"><div><h2>संगीत प्लेलिस्ट</h2><p>केवल royalty-free या licensed direct MP3 उपयोग करें।</p></div><Button onClick={addUrl} data-testid="add-track-button"><Plus /> Track जोड़ें</Button></div><div className="admin-stack">{draft.music.map((track: MusicTrack, index) => <div className="admin-card music-admin-row" key={track.id} data-testid={`music-track-${track.id}`}><Music2 /><Field label="गीत का नाम" testId={`track-title-${track.id}`}><Input value={track.title} onChange={(e) => { const next = cloneContent(draft); next.music[index].title = e.target.value; setDraft(next); }} data-testid={`track-title-input-${track.id}`} /></Field><Field label="Direct MP3 link" testId={`track-url-${track.id}`}><Input value={track.url.startsWith("data:") ? "Uploaded MP3" : track.url} onChange={(e) => { const next = cloneContent(draft); next.music[index].url = e.target.value; setDraft(next); }} data-testid={`track-url-input-${track.id}`} /></Field><label className="file-button small" data-testid={`track-upload-${track.id}`}><Upload size={15} /> MP3 upload<input type="file" accept="audio/mpeg" onChange={(e) => void upload(index, e.target.files?.[0])} /></label><label className="admin-check"><input type="radio" name="default-track" checked={track.is_default} onChange={() => { const next = cloneContent(draft); next.music.forEach((item, itemIndex) => item.is_default = itemIndex === index); setDraft(next); }} data-testid={`track-default-${track.id}`} /> Default</label><Button variant="ghost" size="icon-sm" onClick={() => { const next = cloneContent(draft); next.music.splice(index, 1); setDraft(next); }} data-testid={`track-delete-${track.id}`}><Trash2 /></Button>{track.url && <audio src={track.url} controls preload="none" data-testid={`track-preview-${track.id}`} />}</div>)}</div></div>;
}

function ThemeEditor({ draft, setDraft }: { draft: InvitationContent; setDraft: (value: InvitationContent) => void }) {
  const sections: [string, string][] = [["letter", "आमंत्रण पत्र"], ["couple", "वर-वधू"], ["countdown", "Countdown"], ["events", "कार्यक्रम"], ["gallery", "गैलरी"], ["venues", "स्थल"], ["kids", "बाल आग्रह"], ["hosts", "परिवार"], ["rsvp", "RSVP"]];
  return <div className="admin-editor-grid" data-testid="theme-editor"><div className="admin-card"><h2>रंग शैली</h2><div className="preset-grid">{[["ivory-gold", "Ivory Gold"], ["champagne-taupe", "Champagne Taupe"], ["blush-sage", "Blush Sage"]].map(([value, label]) => <button className={draft.theme.preset === value ? "selected" : ""} onClick={() => { const next = cloneContent(draft); next.theme.preset = value; setDraft(next); }} key={value} data-testid={`theme-${value}-button`}><i className={value} />{label}</button>)}</div></div><div className="admin-card"><h2>अनुभाग दिखाएँ</h2><div className="visibility-list">{sections.map(([key, label]) => <label key={key} data-testid={`section-${key}-label`}><input type="checkbox" checked={draft.theme.section_visibility[key] !== false} onChange={(e) => { const next = cloneContent(draft); next.theme.section_visibility[key] = e.target.checked; setDraft(next); }} data-testid={`section-${key}-toggle`} /> {label}</label>)}</div></div><div className="admin-card"><h2>अतिथि विकल्प</h2><label className="admin-check"><input type="checkbox" checked={draft.theme.rsvp_enabled} onChange={(e) => { const next = cloneContent(draft); next.theme.rsvp_enabled = e.target.checked; setDraft(next); }} data-testid="rsvp-enabled-toggle" /> RSVP चालू</label><label className="admin-check"><input type="checkbox" checked={draft.theme.guest_track_picker} onChange={(e) => { const next = cloneContent(draft); next.theme.guest_track_picker = e.target.checked; setDraft(next); }} data-testid="track-picker-toggle" /> अतिथि track picker</label></div></div>;
}

function RsvpEditor() {
  const query = useQuery({ queryKey: ["admin-rsvps"], queryFn: () => apiGet<RsvpResponse[]>("/admin/rsvps") });
  const total = query.data?.reduce((sum, item) => sum + item.guest_count, 0) || 0;
  return <div data-testid="rsvp-responses-editor"><div className="editor-title-row"><div><h2>RSVP प्रतिक्रियाएँ</h2><p>{query.data?.length || 0} responses · {total} guests</p></div><a className={buttonVariants({ variant: "outline" })} href="/api/admin/rsvps.csv" download data-testid="rsvp-csv-export"><Download /> CSV Export</a></div><div className="admin-card table-wrap"><table data-testid="rsvp-responses-table"><thead><tr><th>Guest Name</th><th>Guests</th><th>Submitted</th></tr></thead><tbody>{query.data?.map((item) => <tr key={item.id}><td>{item.guest_name}</td><td>{item.guest_count}</td><td>{new Date(item.created_at).toLocaleString()}</td></tr>)}</tbody></table>{!query.data?.length && <p className="empty-state" data-testid="rsvp-empty-state">अभी कोई RSVP नहीं आया है।</p>}</div></div>;
}

export default function Admin() {
  const [tab, setTab] = useState<(typeof ADMIN_TABS)[number][0]>("basics");
  const [draft, setDraft] = useState(() => cloneContent(defaultContent));
  const [preview, setPreview] = useState(false);
  const queryClient = useQueryClient();
  const session = useQuery({ queryKey: ["owner-session"], queryFn: () => apiGet<OwnerSession>("/auth/me"), retry: false });
  const authenticated = session.data?.authenticated === true;
  const query = useQuery({ queryKey: ["invitation"], queryFn: () => apiGet<InvitationContent>("/invitation"), retry: false, enabled: authenticated });
  const versions = useQuery({ queryKey: ["invitation-versions"], queryFn: () => apiGet<VersionSummary[]>("/admin/invitation/versions"), retry: false, enabled: authenticated });
  useEffect(() => { if (query.data) setDraft(cloneContent(query.data)); }, [query.data]);

  const saveMutation = useMutation({ mutationFn: () => apiPut<InvitationContent>("/admin/invitation", draft), onSuccess: (saved) => { setDraft(cloneContent(saved)); queryClient.setQueryData(["invitation"], saved); void versions.refetch(); toast.success("Invitation published instantly"); }, onError: () => toast.error("Save failed. Please try again.") });
  const restoreMutation = useMutation({ mutationFn: (versionId: string) => apiPost<InvitationContent>("/admin/invitation/restore", { version_id: versionId }), onSuccess: (saved) => { setDraft(cloneContent(saved)); queryClient.setQueryData(["invitation"], saved); toast.success("Previous version restored"); } });
  const logoutMutation = useMutation({
    mutationFn: () => apiPost<AuthMessage>("/auth/logout"),
    onSuccess: () => { queryClient.clear(); toast.success("Signed out securely"); },
  });
  const exportBackup = () => { const blob = new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `aakanksha-vivek-invitation-v${draft.version}.json`; anchor.click(); URL.revokeObjectURL(url); };
  const importBackup = async (file?: File) => { if (!file) return; try { const parsed = JSON.parse(await file.text()) as InvitationContent; setDraft(parsed); toast.success("Backup loaded. Review and Save & Publish."); } catch { toast.error("This backup file is not valid"); } };

  if (session.isPending) return <div className="admin-loading" data-testid="owner-session-loading">Checking owner access…</div>;
  if (!authenticated) return <OwnerLogin />;

  return <div className="admin-page" data-testid="admin-page">
    <header className="admin-header" data-testid="admin-header"><div><Link to="/" className="admin-back" data-testid="admin-back-link"><ArrowLeft /> Invitation</Link><h1 lang="en" data-testid="admin-title">Invitation Management</h1><p data-testid="admin-subtitle">Akanksha & Vivek · Owner dashboard</p></div><div className="admin-header-actions"><Badge variant="outline" data-testid="owner-session-badge">Owner · {session.data.email}</Badge><Button variant="outline" onClick={() => setPreview(true)} data-testid="live-preview-button"><Eye /> Live Preview</Button><Button variant="outline" onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending} data-testid="owner-logout-button"><LogOut /> Sign out</Button><Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} data-testid="save-publish-button"><Save /> {saveMutation.isPending ? "Publishing…" : "Save & Publish"}</Button></div></header>
    <div className="admin-layout"><aside className="admin-sidebar" data-testid="admin-tabs">{ADMIN_TABS.map(([key, label], index) => <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)} data-testid={`admin-tab-${key}`}><span>{String(index + 1).padStart(2, "0")}</span>{label}</button>)}<div className="sidebar-tools"><Button variant="outline" onClick={exportBackup} data-testid="export-backup-button"><Download /> Backup JSON</Button><label className="file-button small" data-testid="import-backup-button"><Upload /> Import JSON<input type="file" accept="application/json" onChange={(e) => void importBackup(e.target.files?.[0])} /></label>{versions.data?.[0] && <Button variant="ghost" onClick={() => restoreMutation.mutate(versions.data![0].id)} data-testid="restore-version-button"><RotateCcw /> Restore v{versions.data[0].version}</Button>}</div></aside>
      <main className="admin-content" data-testid="admin-content">{tab === "basics" && <BasicsEditor draft={draft} setDraft={setDraft} />}{tab === "couple" && <CoupleEditor draft={draft} setDraft={setDraft} />}{tab === "events" && <EventsEditor draft={draft} setDraft={setDraft} />}{tab === "venues" && <VenuesEditor draft={draft} setDraft={setDraft} />}{tab === "gallery" && <GalleryEditor draft={draft} setDraft={setDraft} />}{tab === "texts" && <TextsEditor draft={draft} setDraft={setDraft} />}{tab === "music" && <MusicEditor draft={draft} setDraft={setDraft} />}{tab === "theme" && <ThemeEditor draft={draft} setDraft={setDraft} />}{tab === "rsvp" && <RsvpEditor />}</main>
    </div>
    {preview && <div className="admin-preview-modal" data-testid="admin-preview-modal"><div><button onClick={() => setPreview(false)} data-testid="preview-close-button">Close preview</button><iframe title="Invitation live preview" src="/" data-testid="admin-preview-frame" /></div></div>}
  </div>;
}