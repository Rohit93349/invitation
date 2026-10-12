import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CalendarPlus, ChevronDown, Heart, MapPin, Menu, Music2, Pause, Play, Share2, X } from "lucide-react";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GaneshMark } from "@/components/GaneshMark";
import type { EventItem, InvitationContent, PhotoItem, RsvpCreate, RsvpResponse } from "@/types/invitation";

const NAV_ITEMS = [["home", "Home"], ["couple", "Couple"], ["events", "Events"], ["gallery", "Gallery"], ["venues", "Venue"], ["rsvp", "RSVP"]] as const;

const PERSON_FALLBACKS = {
  bride: {
    details: ["Granddaughter of: Late Govardhan Prasad Sinha", "Only daughter of: Mrs. Sushma Kumari & Mr. Devendra Kumar"],
    address: "Shantinagar (Lane No. 3), Post & Police Station—Jehanabad, District—Jehanabad, Bihar",
  },
  groom: {
    details: ["Younger son of: Mrs. Devmanti Devi & Mr. Shardanand Singh"],
    address: "Mohalla Mokri (near Sanskritik Bhawan), Post & Police Station—Arwal, District—Arwal, Bihar",
  },
} as const;

const VENUE_FALLBACKS: Record<string, { name: string; address: string; details: string }> = {
  home: { name: "Our Residence", address: "Shantinagar (Lane No. 3), Jehanabad, Bihar", details: "Ceremonies on 22–24 November and the Tilak departure point" },
  hotel: { name: "Hotel Vrindavan (Ghoda Aspatal)", address: "Hotel Vrindavan (Ghoda Aspatal), Jehanabad, Bihar", details: "Baraat welcome and reception dinner — 25 November" },
  tilak: { name: "Tilak Destination", address: "Mohalla Mokri (near Sanskritik Bhawan), Arwal, Bihar", details: "Tilak destination for 21 November" },
};

const EVENT_DESCRIPTION_FALLBACKS: Record<string, string> = {
  "tilak-event": "The Tilak party will depart at 3:00 PM in various vehicles from Shantinagar, Jehanabad, for Mohalla Mokri (near Sanskritik Bhawan), Arwal.",
  wedding: "Baraat arrival, reception dinner from 6:00 PM, followed by the wedding ceremony at night.",
};

function formatEnglishDate(value: string, includeWeekday = false) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", { weekday: includeWeekday ? "long" : undefined, day: "numeric", month: "long", year: "numeric" });
}

function getDateParts(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return {
    day: String(date.getDate()).padStart(2, "0"),
    month: date.toLocaleDateString("en-US", { month: "long" }).toUpperCase(),
    year: String(date.getFullYear()),
    weekday: date.toLocaleDateString("en-US", { weekday: "long" }),
  };
}

function formatTime(value: string) {
  if (!value) return "";
  const [hour, minute] = value.split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
}

function getCountdown(date: string, time: string) {
  const target = new Date(`${date}T${time || "18:00"}:00+05:30`).getTime();
  const remaining = Math.max(0, target - Date.now());
  return {
    days: Math.floor(remaining / 86400000),
    hours: Math.floor((remaining / 3600000) % 24),
    minutes: Math.floor((remaining / 60000) % 60),
    seconds: Math.floor((remaining / 1000) % 60),
  };
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function GoldDivider({ testId }: { testId: string }) {
  return <div className="gold-divider" aria-hidden="true" data-testid={testId}><span>✦</span></div>;
}

function SectionHeading({ eyebrow, title, subtitle, testId }: { eyebrow: string; title: string; subtitle?: string; testId: string }) {
  return (
    <div className="section-heading" data-testid={testId}>
      <p className="eyebrow" data-testid={`${testId}-eyebrow`}>{eyebrow}</p>
      <h2 lang="en" data-testid={`${testId}-title`}>{title}</h2>
      {subtitle && <p className="heading-subtitle" data-testid={`${testId}-subtitle`}>{subtitle}</p>}
      <GoldDivider testId={`${testId}-divider`} />
    </div>
  );
}

function ArchPhoto({ url, alt, rotation, testId }: { url: string; alt: string; rotation: number; testId: string }) {
  return (
    <div className="arch-photo" data-testid={testId}>
      {url ? (
        <img src={url} alt={alt} loading="lazy" style={{ transform: `rotate(${rotation}deg) scale(${Math.abs(rotation) % 180 === 90 ? 1.32 : 1})` }} data-testid={`${testId}-image`} />
      ) : (
        <div className="photo-placeholder" data-testid={`${testId}-placeholder`}><span>Lotus</span><small>Photo</small></div>
      )}
    </div>
  );
}

function OpeningScreen({ content, onOpen }: { content: InvitationContent; onOpen: () => void }) {
  return (
    <motion.div className="opening-screen" exit={{ opacity: 0 }} transition={{ duration: .8 }} data-testid="opening-screen">
      <motion.div className="door door-left" exit={{ x: "-102%" }} transition={{ duration: 1.15, ease: [0.76, 0, 0.24, 1] }} data-testid="opening-left-door" />
      <motion.div className="door door-right" exit={{ x: "102%" }} transition={{ duration: 1.15, ease: [0.76, 0, 0.24, 1] }} data-testid="opening-right-door" />
      <div className="opening-border" data-testid="opening-ornamental-border">
        <GaneshMark imageUrl={content.ganesh_url} className="opening-ganesh" />
        <p lang="hi" className="opening-blessing" data-testid="opening-blessing">॥ श्री गणेशाय नमः ॥</p>
        <p className="opening-kicker" data-testid="opening-family-label">{content.basics.family_label_en}</p>
        <h1 lang="en" className="opening-names" data-testid="opening-couple-names">
          AKANKSHA <span>WEDS</span> VIVEK
        </h1>
        <p className="opening-date" data-testid="opening-date">{formatEnglishDate(content.basics.wedding_date, true)}</p>
        <Button className="open-invitation-button" size="lg" onClick={onOpen} data-testid="open-invitation-button">
          Open Invitation
        </Button>
        <p className="opening-note" data-testid="opening-music-note"><Music2 size={14} /> Best experienced with music</p>
      </div>
    </motion.div>
  );
}

function EventCard({ event, index, content }: { event: EventItem; index: number; content: InvitationContent }) {
  const venue = content.venues.find((item) => item.id === event.venue_id);
  const venueFallback = venue ? VENUE_FALLBACKS[venue.id] : undefined;
  const venueAddress = venue?.address_en || venueFallback?.address || "";
  const mapHref = venue?.map_link || (venue ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueAddress)}` : "");
  const calendarHref = useMemo(() => {
    const start = `${event.date.replaceAll("-", "")}${event.time ? `T${event.time.replace(":", "")}00` : ""}`;
    const text = encodeURIComponent(event.title_en || "Wedding Event");
    const location = encodeURIComponent(venueAddress);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${start}&location=${location}`;
  }, [event, venueAddress]);
  return (
    <motion.article className="event-card" initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .25 }} data-testid={`event-card-${event.id}`}>
      <div className="event-number" data-testid={`event-number-${event.id}`}>{String(index + 1).padStart(2, "0")}</div>
      <div className="event-arch" aria-hidden="true" />
      {event.photos[0] ? <ArchPhoto url={event.photos[0].url} alt={event.photos[0].alt_en || event.photos[0].alt || event.title_en} rotation={event.photos[0].rotation} testId={`event-photo-${event.id}`} /> : <div className="event-symbol" data-testid={`event-placeholder-${event.id}`}>❦</div>}
      <p className="event-date" data-testid={`event-date-${event.id}`}>{formatEnglishDate(event.date)} · {new Date(`${event.date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long" })}</p>
      <h3 lang="hi" data-testid={`event-title-${event.id}`}>{event.title_hi}</h3>
      {event.time && <p className="event-time" data-testid={`event-time-${event.id}`}>{formatTime(event.time)}</p>}
      {event.description_hi && <p lang="hi" className="event-description" data-testid={`event-description-${event.id}`}>{event.description_hi}</p>}
      {venue && <p className="event-venue" data-testid={`event-venue-${event.id}`}><MapPin size={15} /> {venue.name_en || venueFallback?.name || "Wedding Venue"}</p>}
      <div className="event-actions" data-testid={`event-actions-${event.id}`}>
        {mapHref && <a href={mapHref} target="_blank" rel="noreferrer" data-testid={`event-map-button-${event.id}`}>Get Directions</a>}
        <a href={calendarHref} target="_blank" rel="noreferrer" data-testid={`event-calendar-button-${event.id}`}><CalendarPlus size={14} /> Add to Calendar</a>
      </div>
    </motion.article>
  );
}

function MusicControl({ content, opened }: { content: InvitationContent; opened: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [trackId, setTrackId] = useState(content.music.find((track) => track.is_default)?.id || content.music[0]?.id || "");
  const selected = content.music.find((track) => track.id === trackId) || content.music[0];

  useEffect(() => {
    if (!opened || !audioRef.current || !selected) return;
    const audio = audioRef.current;
    audio.volume = 0;
    if (localStorage.getItem("wedding-muted") === "true") return;
    audio.play().then(() => {
      setPlaying(true);
      let volume = 0;
      const fade = window.setInterval(() => {
        volume = Math.min(.35, volume + .035);
        audio.volume = volume;
        if (volume >= .35) window.clearInterval(fade);
      }, 100);
    }).catch(() => setPlaying(false));
  }, [opened, selected]);

  useEffect(() => {
    const handleVisibility = () => {
      if (!audioRef.current) return;
      if (document.hidden) audioRef.current.pause();
      else if (playing) void audioRef.current.play();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [playing]);

  if (!opened || !selected) return null;
  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) { void audio.play(); setPlaying(true); localStorage.setItem("wedding-muted", "false"); }
    else { audio.pause(); setPlaying(false); localStorage.setItem("wedding-muted", "true"); }
  };
  return (
    <div className="music-dock" data-testid="music-player">
      <audio ref={audioRef} src={selected.url} loop preload="none" data-testid="background-audio" />
      {content.theme.guest_track_picker && content.music.length > 1 && (
        <select value={trackId} onChange={(event) => setTrackId(event.target.value)} aria-label="Choose music" data-testid="music-track-picker">
          {content.music.map((track) => <option key={track.id} value={track.id}>{track.title}</option>)}
        </select>
      )}
      <button onClick={toggle} aria-label={playing ? "Pause music" : "Play music"} className="music-button" data-testid="music-toggle-button">
        {playing ? <><span className="equalizer"><i /><i /><i /></span><Pause size={15} /></> : <Play size={19} />}
      </button>
    </div>
  );
}

export default function WeddingInvitation({ content }: { content: InvitationContent }) {
  const [opened, setOpened] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [lightbox, setLightbox] = useState<PhotoItem | null>(null);
  const [countdown, setCountdown] = useState(() => getCountdown(content.basics.wedding_date, content.basics.wedding_time));
  const [guestName, setGuestName] = useState("");
  const [guestCount, setGuestCount] = useState("1");
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const reduceMotion = useReducedMotion();
  const visible = content.theme.section_visibility;
  const weddingDate = getDateParts(content.basics.wedding_date);

  useEffect(() => {
    const timer = window.setInterval(() => setCountdown(getCountdown(content.basics.wedding_date, content.basics.wedding_time)), 1000);
    return () => window.clearInterval(timer);
  }, [content.basics.wedding_date, content.basics.wedding_time]);

  useEffect(() => {
    document.title = content.basics.page_title_en;
    const robots = document.querySelector('meta[name="robots"]');
    robots?.setAttribute("content", content.basics.noindex ? "noindex,nofollow" : "index,follow");
  }, [content.basics]);

  const rsvpMutation = useMutation({
    mutationFn: (payload: RsvpCreate) => apiPost<RsvpResponse>("/rsvps", payload),
    onSuccess: () => { setGuestName(""); setGuestCount("1"); setRsvpSuccess(true); toast.success("Thank you for celebrating this special moment with us!"); },
    onError: () => toast.error("We could not confirm your response. Please try again."),
  });

  const share = async () => {
    const data = { title: content.basics.whatsapp_title_en, text: content.basics.whatsapp_description_en, url: window.location.href };
    if (navigator.share) await navigator.share(data).catch(() => undefined);
    else window.open(`https://wa.me/?text=${encodeURIComponent(`${data.text} ${data.url}`)}`, "_blank");
  };

  return (
    <div className={`wedding-site theme-${content.theme.preset} font-${content.theme.font}`} data-testid="wedding-invitation">
      <AnimatePresence>{!opened && <OpeningScreen content={content} onOpen={() => setOpened(true)} />}</AnimatePresence>
      <div className={opened ? "invitation-revealed" : "invitation-hidden"} aria-hidden={!opened}>
        <header className="site-nav" data-testid="main-navigation">
          <button className="nav-monogram" onClick={() => scrollToSection("home")} aria-label="Home" data-testid="nav-monogram-button">A<span>&</span>V</button>
          <nav className="desktop-nav" aria-label="Invitation sections" data-testid="desktop-navigation-links">
            {NAV_ITEMS.map(([id, label]) => <button key={id} onClick={() => scrollToSection(id)} data-testid={`nav-${id}-button`}>{label}</button>)}
          </nav>
          <div className="nav-actions" data-testid="navigation-actions">
            <button onClick={() => setMobileNav(true)} className="mobile-menu-button" aria-label="Open menu" data-testid="mobile-menu-open-button"><Menu /></button>
          </div>
        </header>

        <AnimatePresence>
          {mobileNav && <motion.div className="mobile-menu" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }} data-testid="mobile-navigation-menu">
            <button onClick={() => setMobileNav(false)} aria-label="Close menu" data-testid="mobile-menu-close-button"><X /></button>
            {NAV_ITEMS.map(([id, label]) => <button key={id} onClick={() => { scrollToSection(id); setMobileNav(false); }} data-testid={`mobile-nav-${id}-button`}>{label}</button>)}
          </motion.div>}
        </AnimatePresence>

        <main>
          <section id="home" className="hero-section" data-testid="hero-section">
            <div className="hero-pattern" aria-hidden="true" />
            <motion.div className="hero-content" initial={reduceMotion ? false : { opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
              <GaneshMark imageUrl={content.ganesh_url} className="hero-ganesh" />
              <p lang="hi" className="ganesh-invocation" data-testid="hero-ganesh-invocation">॥ श्री गणेशाय नमः ॥</p>
              <p lang="hi" className="hero-shloka" data-testid="hero-shloka">{content.texts.shloka_hero}</p>
              <p className="hero-family" data-testid="hero-family-label">{content.basics.family_label_en}</p>
              <h1 className="hero-names" data-testid="hero-couple-names">
                <span lang="en">{content.basics.bride_en}</span>
                <b>&</b>
                <span lang="en">{content.basics.groom_en}</span>
              </h1>
              <p className="hero-celebration" data-testid="hero-celebration-label">{content.basics.celebration_label_en}</p>
              <div className="hero-date-lockup" data-testid="hero-wedding-date"><span>{weddingDate.day}</span><div>{weddingDate.month}<small>{weddingDate.year} · {weddingDate.weekday}</small></div></div>
              <p lang="en" className="hero-romance" data-testid="hero-romantic-line">{content.basics.romantic_en}</p>
              <button className="scroll-cue" onClick={() => scrollToSection("letter")} aria-label="Scroll to invitation" data-testid="hero-scroll-button"><span>Discover more</span><ChevronDown /></button>
            </motion.div>
          </section>

          {visible.letter && <section id="letter" className="letter-section section-shell" data-testid="invitation-letter-section">
            <motion.div className="letter-card" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="lotus-seal" aria-hidden="true">✦</div>
              <p className="letter-intro" data-testid="invitation-letter-intro">{content.texts.invitation_intro_en}</p>
              <h2 lang="en" data-testid="invitation-letter-names">{content.couple.bride.name_en} <em>{content.couple.connector_en}</em> {content.couple.groom.name_en}</h2>
              <p className="letter-copy" data-testid="invitation-letter-closing">{content.couple.invitation_closing_en}</p>
              <GoldDivider testId="invitation-letter-divider" />
              <p className="venue-note" data-testid="invitation-venue-note">{content.texts.venue_note_en}</p>
            </motion.div>
          </section>}

          {visible.couple && <section id="couple" className="couple-section section-shell" data-testid="couple-section">
            <SectionHeading eyebrow="BRIDE · GROOM" title="Two souls, one sacred bond" subtitle="The beginning of forever" testId="couple-heading" />
            <div className="couple-grid">
              {[content.couple.bride, content.couple.groom].map((person, index) => <motion.article key={person.name_en} className="person-card" initial={{ opacity: 0, x: index ? 30 : -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} data-testid={index ? "groom-card" : "bride-card"}>
                <ArchPhoto url={person.photo_url} alt={person.photo_alt_en || person.photo_alt} rotation={person.photo_rotation} testId={index ? "groom-portrait" : "bride-portrait"} />
                <p className="person-role" data-testid={`${index ? "groom" : "bride"}-role`}>{index ? "GROOM" : "BRIDE"}</p>
                <h3 lang="en" data-testid={`${index ? "groom" : "bride"}-name`}>{index ? "VIVEK" : "AKANKSHA"}</h3>
                {(person.details_en.length ? person.details_en : PERSON_FALLBACKS[index ? "groom" : "bride"].details).map((detail, detailIndex) => <p key={detail} className="person-detail" data-testid={`${index ? "groom" : "bride"}-detail-${detailIndex}`}>{detail}</p>)}
              </motion.article>)}
              <div className="couple-connector" lang="en" data-testid="couple-connector"><span>❦</span>{content.couple.connector_en}<span>❦</span></div>
            </div>
          </section>}

          {visible.countdown && <section className="countdown-section" data-testid="countdown-section">
            <p className="countdown-kicker" data-testid="countdown-kicker">THE AUSPICIOUS MOMENT AWAITS</p>
            <h2 lang="en" data-testid="countdown-title">Until the Sacred Pheras</h2>
            <div className="countdown-grid" data-testid="countdown-values">
              {([["days", "Days"], ["hours", "Hours"], ["minutes", "Minutes"], ["seconds", "Seconds"]] as const).map(([key, label]) => <div key={key} data-testid={`countdown-${key}`}><strong>{String(countdown[key]).padStart(2, "0")}</strong><span>{label}</span></div>)}
            </div>
            <p className="countdown-date" data-testid="countdown-target">{content.basics.wedding_date.split("-").reverse().join(" · ")} — {formatTime(content.basics.wedding_time)} IST</p>
          </section>}

          {visible.events && <section id="events" className="events-section section-shell" data-testid="events-section">
            <SectionHeading eyebrow="AUSPICIOUS OCCASIONS" title="The celebrations" subtitle="Five days of love, family and blessings" testId="events-heading" />
            <p lang="hi" className="event-shloka" data-testid="events-shloka">{content.texts.shloka_events}</p>
            <div className="events-timeline" data-testid="events-timeline">
              {content.events.filter((event) => event.visible).map((event, index) => <EventCard key={event.id} event={event} index={index} content={content} />)}
            </div>
          </section>}

          {visible.gallery && <section id="gallery" className="gallery-section section-shell" data-testid="gallery-section">
            <SectionHeading eyebrow="ENGAGEMENT & MEMORIES" title="Golden moments of love" subtitle="Our engagement story" testId="gallery-heading" />
            <div className="gallery-grid" data-testid="engagement-gallery">
              {content.gallery.map((photo, index) => <button key={photo.id} className={`gallery-item gallery-${index % 4}`} onClick={() => setLightbox(photo)} data-testid={`gallery-photo-${photo.id}`}>
                <img src={photo.url} alt={photo.alt_en || photo.alt || "A cherished wedding memory"} loading="lazy" style={{ transform: `rotate(${photo.rotation}deg) scale(${Math.abs(photo.rotation) % 180 === 90 ? 1.35 : 1})` }} />
                <span lang="en">{photo.caption_en || "A cherished memory"}</span>
              </button>)}
            </div>
          </section>}

          {visible.venues && <section id="venues" className="venues-section section-shell" data-testid="venues-section">
            <SectionHeading eyebrow="WHERE TO JOIN US" title="Venues & directions" subtitle="We await your gracious presence" testId="venues-heading" />
            <div className="venue-list">
              {content.venues.map((venue, index) => {
                const fallback = VENUE_FALLBACKS[venue.id];
                const address = venue.address_en || fallback?.address || "Jehanabad, Bihar";
                const embed = venue.embed_url || `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;
                const directions = venue.map_link || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
                return <article className="venue-card" key={venue.id} data-testid={`venue-card-${venue.id}`}>
                  <div className="venue-copy"><span className="venue-index">0{index + 1}</span><MapPin /><h3 lang="en" data-testid={`venue-name-${venue.id}`}>{venue.name_en || fallback?.name || "Wedding Venue"}</h3><p data-testid={`venue-address-${venue.id}`}>{address}</p><small data-testid={`venue-details-${venue.id}`}>{venue.details_en || fallback?.details || "Wedding celebration venue"}</small><a href={directions} target="_blank" rel="noreferrer" data-testid={`venue-directions-${venue.id}`}>Get Directions <span>→</span></a></div>
                  <iframe title={`${venue.name_en || fallback?.name || "Wedding venue"} map`} src={embed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" data-testid={`venue-map-${venue.id}`} />
                </article>;
              })}
            </div>
          </section>}

          {visible.kids && <section className="kids-section" data-testid="kids-request-section">
            <div className="kids-card"><p className="eyebrow kids-request-underline" data-testid="kids-eyebrow">A LITTLE REQUEST FROM THE LITTLE ONES</p><h2 lang="en" data-testid="kids-title">Children’s Request</h2><p lang="hi" className="kids-poem" data-testid="kids-poem">{content.texts.kids_poem}</p><strong lang="hi" data-testid="kids-signature">{content.texts.kids_signature}</strong></div>
          </section>}

          {visible.hosts && <section className="hosts-section section-shell" data-testid="hosts-section">
            <SectionHeading eyebrow="OUR DEAREST ONES" title="A heartfelt welcome" testId="hosts-heading" />
            <div className="hosts-grid">
              <div data-testid="welcome-hosts-card"><h3>Welcoming Hosts</h3><p>{content.texts.welcome_hosts_en}</p></div>
              <div data-testid="well-wishers-card"><h3>With Warm Wishes</h3><p>{content.texts.well_wishers_en}</p></div>
              <div data-testid="aspirant-card"><h3>With Compliments From</h3><p>Devendra Kumar</p></div>
            </div>
          </section>}

          {visible.rsvp && content.theme.rsvp_enabled && <section id="rsvp" className="rsvp-section" data-testid="rsvp-section">
            <div className="rsvp-card"><Heart className="rsvp-heart" /><p className="eyebrow" data-testid="rsvp-eyebrow">YOUR PRESENCE IS OUR BLESSING</p><h2 lang="en" data-testid="rsvp-title">Kindly confirm your attendance</h2><p data-testid="rsvp-subtitle">Please respond by 15 November 2026</p>
              <form onSubmit={(event) => { event.preventDefault(); rsvpMutation.mutate({ guest_name: guestName, guest_count: Number(guestCount) }); }} data-testid="rsvp-form">
                <div><Label htmlFor="guest-name" data-testid="guest-name-label">Guest Name</Label><Input id="guest-name" value={guestName} onChange={(event) => setGuestName(event.target.value)} required minLength={2} data-testid="guest-name-input" /></div>
                <div><Label htmlFor="guest-count" data-testid="guest-count-label">Number of Guests</Label><Input id="guest-count" type="number" min="1" max="20" value={guestCount} onChange={(event) => setGuestCount(event.target.value)} required data-testid="guest-count-input" /></div>
                <Button type="submit" size="lg" disabled={rsvpMutation.isPending} data-testid="rsvp-submit-button">{rsvpMutation.isPending ? "Confirming…" : "Confirm Attendance"}</Button>
              </form>
              <AnimatePresence>{rsvpSuccess && <motion.p className="rsvp-success" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} data-testid="rsvp-success-message">Thank you for celebrating this special moment with us!</motion.p>}</AnimatePresence>
            </div>
          </section>}
        </main>

        <footer className="site-footer" data-testid="invitation-footer"><div className="footer-floral" aria-hidden="true">❦</div><p data-testid="footer-love-line">With love, Akanksha & Vivek</p><strong data-testid="footer-date">25 · 11 · 2026</strong><button onClick={share} data-testid="whatsapp-share-button"><Share2 size={16} /> Share Invitation</button><a href="/admin" data-testid="admin-link">Owner</a></footer>
        <MusicControl content={content} opened={opened} />
      </div>

      <AnimatePresence>{lightbox && <motion.div className="lightbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} data-testid="gallery-lightbox"><button onClick={() => setLightbox(null)} aria-label="Close photo" data-testid="lightbox-close-button"><X /></button><img src={lightbox.url} alt={lightbox.alt_en || lightbox.alt || "A cherished wedding memory"} style={{ transform: `rotate(${lightbox.rotation}deg) scale(${Math.abs(lightbox.rotation) % 180 === 90 ? .72 : 1})` }} data-testid="lightbox-image" /><p lang="en" data-testid="lightbox-caption">{lightbox.caption_en || "A cherished memory"}</p></motion.div>}</AnimatePresence>
    </div>
  );
}