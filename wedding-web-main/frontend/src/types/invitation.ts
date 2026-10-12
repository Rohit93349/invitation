export interface PhotoItem {
  id: string;
  url: string;
  caption: string;
  caption_en: string;
  alt: string;
  alt_en: string;
  rotation: number;
}

export interface BasicInfo {
  page_title: string;
  page_title_en: string;
  bride_hi: string;
  bride_en: string;
  groom_hi: string;
  groom_en: string;
  wedding_date: string;
  wedding_time: string;
  family_label: string;
  family_label_en: string;
  celebration_label: string;
  celebration_label_en: string;
  romantic_hi: string;
  romantic_en: string;
  seo_description: string;
  seo_description_en: string;
  noindex: boolean;
  whatsapp_title: string;
  whatsapp_title_en: string;
  whatsapp_description: string;
  whatsapp_description_en: string;
  whatsapp_image: string;
}

export interface PersonInfo {
  name_hi: string;
  name_en: string;
  details: string[];
  details_en: string[];
  address: string;
  address_en: string;
  photo_url: string;
  photo_alt: string;
  photo_alt_en: string;
  photo_rotation: number;
}

export interface CoupleInfo {
  bride: PersonInfo;
  groom: PersonInfo;
  connector: string;
  connector_en: string;
  invitation_closing: string;
  invitation_closing_en: string;
}

export interface EventItem {
  id: string;
  date: string;
  day_hi: string;
  title_hi: string;
  title_en: string;
  time: string;
  description_hi: string;
  description_en: string;
  venue_id: string;
  photos: PhotoItem[];
  visible: boolean;
}

export interface VenueItem {
  id: string;
  name: string;
  name_en: string;
  address: string;
  address_en: string;
  details: string;
  details_en: string;
  map_link: string;
  embed_url: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  url: string;
  is_default: boolean;
}

export interface TextBlocks {
  shloka_hero: string;
  shloka_hero_en: string;
  shloka_events: string;
  shloka_events_en: string;
  invitation_intro: string;
  invitation_intro_en: string;
  venue_note: string;
  venue_note_en: string;
  kids_poem: string;
  kids_poem_en: string;
  kids_signature: string;
  kids_signature_en: string;
  kids_blessing: string;
  kids_blessing_en: string;
  welcome_hosts: string;
  welcome_hosts_en: string;
  well_wishers: string;
  well_wishers_en: string;
  aspirant: string;
  aspirant_en: string;
}

export interface ThemeConfig {
  preset: string;
  font: string;
  guest_track_picker: boolean;
  rsvp_enabled: boolean;
  section_visibility: Record<string, boolean>;
}

export interface InvitationContent {
  version: number;
  updated_at: string;
  basics: BasicInfo;
  ganesh_url: string;
  hero_ornament: string;
  couple: CoupleInfo;
  events: EventItem[];
  venues: VenueItem[];
  gallery: PhotoItem[];
  texts: TextBlocks;
  music: MusicTrack[];
  theme: ThemeConfig;
}

export interface RsvpCreate {
  guest_name: string;
  guest_count: number;
}

export interface RsvpResponse extends RsvpCreate {
  id: string;
  created_at: string;
}

export interface VersionSummary {
  id: string;
  version: number;
  created_at: string;
}