from datetime import datetime, timezone
from typing import Dict, List
from uuid import uuid4

from pydantic import BaseModel, Field, field_validator


class PhotoItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    url: str
    caption: str = ""
    caption_en: str = ""
    alt: str = ""
    alt_en: str = ""
    rotation: int = 0


class BasicInfo(BaseModel):
    page_title: str
    page_title_en: str = "Akanksha & Vivek — Wedding Celebration"
    bride_hi: str
    bride_en: str
    groom_hi: str
    groom_en: str
    wedding_date: str
    wedding_time: str = "18:00"
    family_label: str
    family_label_en: str = "Together with our families"
    celebration_label: str
    celebration_label_en: str = "Sacred Wedding Celebration"
    romantic_hi: str
    romantic_en: str
    seo_description: str
    seo_description_en: str = "A heartfelt invitation to celebrate the wedding of Akanksha and Vivek."
    noindex: bool = True
    whatsapp_title: str
    whatsapp_title_en: str = "Akanksha & Vivek — Wedding Invitation"
    whatsapp_description: str
    whatsapp_description_en: str = "Please join us for our wedding celebration on 25 November 2026."
    whatsapp_image: str = ""


class PersonInfo(BaseModel):
    name_hi: str
    name_en: str
    details: List[str]
    details_en: List[str] = Field(default_factory=list)
    address: str
    address_en: str = ""
    photo_url: str = ""
    photo_alt: str
    photo_alt_en: str = ""
    photo_rotation: int = 0


class CoupleInfo(BaseModel):
    bride: PersonInfo
    groom: PersonInfo
    connector: str = "संग"
    connector_en: str = "WEDS"
    invitation_closing: str
    invitation_closing_en: str = "Together with our families, we warmly invite you to grace this sacred wedding celebration and bless the bride and groom."


class EventItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    date: str
    day_hi: str
    title_hi: str
    title_en: str = ""
    time: str = ""
    description_hi: str = ""
    description_en: str = ""
    venue_id: str = ""
    photos: List[PhotoItem] = Field(default_factory=list)
    visible: bool = True


class VenueItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    name_en: str = ""
    address: str
    address_en: str = ""
    details: str = ""
    details_en: str = ""
    map_link: str = ""
    embed_url: str = ""


class MusicTrack(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    title: str
    url: str
    is_default: bool = False


class TextBlocks(BaseModel):
    shloka_hero: str
    shloka_hero_en: str = "O Lord Ganesha of the curved trunk and mighty form, radiant as a million suns, please remove all obstacles from all our endeavours, always."
    shloka_events: str
    shloka_events_en: str = "Auspicious is Lord Vishnu, auspicious is the bearer of Garuda; auspicious is the lotus-eyed Lord, Hari, the abode of all auspiciousness."
    invitation_intro: str
    invitation_intro_en: str = "Dear Guest, with the infinite grace of the Almighty—"
    venue_note: str
    venue_note_en: str = "Wedding venues: All wedding ceremonies will begin from our residence in Shantinagar. The Baraat welcome and reception dinner will be held at Hotel Vrindavan (Ghoda Aspatal)."
    kids_poem: str
    kids_poem_en: str = "With our tiny feet, how could we come to invite you?\nPlease do not forget to join us for our beloved aunt's wedding."
    kids_signature: str
    kids_signature_en: str = "— Ravi"
    kids_blessing: str
    kids_blessing_en: str = "Their hearts are gentle and the path is new; may their life together be filled with joy.\nPlease come and bless them with your love."
    welcome_hosts: str
    welcome_hosts_en: str = "Ravindra Kumar, Dr. Tarkeshwar Nath"
    well_wishers: str
    well_wishers_en: str = "Rahul Kumar, Rohit Kumar, Lalbihari Prasad, Mukesh Kumar Verma, Arvind Kumar Verma, Prateek, Palak, Ayansh and the entire family."
    aspirant: str
    aspirant_en: str = "Devendra Kumar"


class ThemeConfig(BaseModel):
    preset: str = "ivory-gold"
    font: str = "lora"
    guest_track_picker: bool = False
    rsvp_enabled: bool = True
    section_visibility: Dict[str, bool] = Field(default_factory=dict)


class InvitationContent(BaseModel):
    version: int = 1
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    basics: BasicInfo
    ganesh_url: str = ""
    hero_ornament: str = "peacock"
    couple: CoupleInfo
    events: List[EventItem]
    venues: List[VenueItem]
    gallery: List[PhotoItem]
    texts: TextBlocks
    music: List[MusicTrack]
    theme: ThemeConfig


class VersionSummary(BaseModel):
    id: str
    version: int
    created_at: datetime


class RestoreRequest(BaseModel):
    version_id: str


class RsvpCreate(BaseModel):
    guest_name: str = Field(min_length=2, max_length=120)
    guest_count: int = Field(ge=1, le=20)

    @field_validator("guest_name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        return " ".join(value.split())


class RsvpResponse(RsvpCreate):
    id: str = Field(default_factory=lambda: str(uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


PHOTO_URLS = [
    "https://customer-assets-lqy194kg.emergentagent.net/job_39a4cbac-3cab-40af-b6b0-8493bbb0e5d0/artifacts/19a554a37abbd357_DSC_2499.webp",
    "https://customer-assets-lqy194kg.emergentagent.net/job_39a4cbac-3cab-40af-b6b0-8493bbb0e5d0/artifacts/8ff00250712ac081_DSC_2443.webp",
    "https://customer-assets-lqy194kg.emergentagent.net/job_39a4cbac-3cab-40af-b6b0-8493bbb0e5d0/artifacts/a44898395a8f0cc7_DSC_2409.webp",
    "https://customer-assets-lqy194kg.emergentagent.net/job_39a4cbac-3cab-40af-b6b0-8493bbb0e5d0/artifacts/d21320107f415a18_DSC_2381.webp",
]

BRIDE_PORTRAIT_URL = "https://customer-assets-39nsmqrw.emergentagent.net/job_mangal-milan/artifacts/d4f0131241c64611_DSC_2440.webp"
GROOM_PORTRAIT_URL = "https://customer-assets-39nsmqrw.emergentagent.net/job_mangal-milan/artifacts/cccc31663891dad5_DSC_1953.webp"
HOME_MAP_LINK = "https://maps.app.goo.gl/sxbxhZCDoCv1t1Yq9"
HOME_MAP_EMBED = "https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d227.44627380220572!2d84.9931079204224!3d25.218004094779513!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e1!3m2!1sen!2sin!4v1791799203910!5m2!1sen!2sin"
GALLERY_ROTATIONS = [0, -90, -90, -90]

MUSIC_URL = "https://customer-assets-lqy194kg.emergentagent.net/job_39a4cbac-3cab-40af-b6b0-8493bbb0e5d0/artifacts/f490f062c3a3d02f_Hari_Sukhmani_-_Beriaan_%28mp3.pm%29.mp3"


def default_invitation() -> InvitationContent:
    venues = [
        VenueItem(
            id="home",
            name="हमारा निवास स्थान",
            name_en="Our Residence",
            address="शांतिनगर (गली नं०-3), जहानाबाद, बिहार",
            address_en="Shantinagar (Lane No. 3), Jehanabad, Bihar",
            details="22–24 नवम्बर के कार्यक्रम एवं शुभ तिलक का प्रस्थान स्थल",
            details_en="Ceremonies on 22–24 November and the Tilak departure point",
            map_link=HOME_MAP_LINK,
            embed_url=HOME_MAP_EMBED,
        ),
        VenueItem(
            id="hotel",
            name="होटल वृन्दावन (घोड़ा अस्पताल)",
            name_en="Hotel Vrindavan (Ghoda Aspatal)",
            address="होटल वृन्दावन (घोड़ा अस्पताल), जहानाबाद, बिहार",
            address_en="Hotel Vrindavan (Ghoda Aspatal), Jehanabad, Bihar",
            details="बारात स्वागत एवं प्रीतिभोज — 25 नवम्बर",
            details_en="Baraat welcome and reception dinner — 25 November",
        ),
        VenueItem(
            id="tilak",
            name="शुभ तिलक गंतव्य",
            name_en="Tilak Destination",
            address="मोहल्ला मोकरी (सांस्कृतिक भवन के पास), अरवल, बिहार",
            address_en="Mohalla Mokri (near Sanskritik Bhawan), Arwal, Bihar",
            details="21 नवम्बर का शुभ तिलक गंतव्य",
            details_en="Tilak destination for 21 November",
        ),
    ]
    gallery = [
        PhotoItem(id=f"gallery-{index + 1}", url=url, caption=caption, caption_en=caption_en, alt=caption, alt_en=caption_en, rotation=rotation)
        for index, (url, caption, caption_en, rotation) in enumerate(
            zip(PHOTO_URLS, ["एक खूबसूरत शुरुआत", "साथ का उत्सव", "आकांक्षा", "शुभ स्मृतियाँ"], ["A beautiful beginning", "A celebration of togetherness", "Akanksha", "Golden memories"], GALLERY_ROTATIONS)
        )
    ]
    return InvitationContent(
        basics=BasicInfo(
            page_title="आकांक्षा एवं विवेक — पावन विवाहोत्सव",
            page_title_en="Akanksha & Vivek — Wedding Celebration",
            bride_hi="आकांक्षा",
            bride_en="AKANKSHA",
            groom_hi="विवेक",
            groom_en="VIVEK",
            wedding_date="2026-11-25",
            wedding_time="18:00",
            family_label="सपरिवार",
            family_label_en="Together with our families",
            celebration_label="पावन विवाहोत्सव",
            celebration_label_en="Sacred Wedding Celebration",
            romantic_hi="दो दिल, एक खूबसूरत सफ़र और जीवन भर की अनमोल यादें।",
            romantic_en="Two hearts, one beautiful journey, and a lifetime of memories waiting to be made.",
            seo_description="आकांक्षा एवं विवेक के पावन विवाहोत्सव का स्नेहभरा निमंत्रण।",
            seo_description_en="A heartfelt invitation to celebrate the wedding of Akanksha and Vivek.",
            whatsapp_title="आकांक्षा एवं विवेक — विवाह निमंत्रण",
            whatsapp_title_en="Akanksha & Vivek — Wedding Invitation",
            whatsapp_description="25 नवम्बर 2026 को हमारे पावन विवाहोत्सव में आपका स्नेहपूर्वक स्वागत है।",
            whatsapp_description_en="Please join us for our wedding celebration on 25 November 2026.",
            whatsapp_image=PHOTO_URLS[0],
        ),
        couple=CoupleInfo(
            bride=PersonInfo(
                name_hi="आयुष्मती आकांक्षा कुमारी",
                name_en="Akanksha Kumari",
                details=[
                    "सुपौत्री: स्व० गोवर्द्धन प्रसाद सिन्हा",
                    "एकमात्र सुपुत्री: श्रीमती सुषमा कुमारी एवं श्री देवेन्द्र कुमार",
                ],
                details_en=[
                    "Granddaughter of: Late Govardhan Prasad Sinha",
                    "Only daughter of: Mrs. Sushma Kumari & Mr. Devendra Kumar",
                ],
                address="मोहल्ला – शांतिनगर (गली नं०-3), पो०+थाना – जहानाबाद, जिला – जहानाबाद (बिहार)",
                address_en="Shantinagar (Lane No. 3), Post & Police Station—Jehanabad, District—Jehanabad, Bihar",
                photo_url=BRIDE_PORTRAIT_URL,
                photo_alt="आकांक्षा की विवाह पूर्व तस्वीर",
                photo_alt_en="Portrait of Akanksha",
                photo_rotation=-90,
            ),
            groom=PersonInfo(
                name_hi="चिरंजीवी विवेक कुमार",
                name_en="Vivek Kumar",
                details=["कनिष्ठ सुपुत्र: श्रीमती देवमंती देवी एवं श्री शारदानंद सिंह"],
                details_en=["Younger son of: Mrs. Devmanti Devi & Mr. Shardanand Singh"],
                address="मोहल्ला – मोकरी (सांस्कृतिक भवन के पास), पो०+थाना – अरवल, जिला – अरवल (बिहार)",
                address_en="Mohalla Mokri (near Sanskritik Bhawan), Post & Police Station—Arwal, District—Arwal, Bihar",
                photo_url=GROOM_PORTRAIT_URL,
                photo_alt="विवेक की विवाह पूर्व तस्वीर",
                photo_alt_en="Portrait of Vivek",
                photo_rotation=-90,
            ),
            invitation_closing="के पावन विवाहोत्सव की मधुरिम बेला में सपरिवार पधार कर वर-वधू को शुभ आशीर्वाद प्रदान करने हेतु स्नेहभरा आमंत्रण।",
            invitation_closing_en="Together with our families, we warmly invite you to grace this sacred wedding celebration and bless the bride and groom.",
        ),
        events=[
            EventItem(
                id="tilak-event", date="2026-11-21", day_hi="शनिवार", title_hi="शुभ तिलक प्रस्थान", title_en="Tilak Departure", time="15:00",
                description_hi="शुभ तिलक 03 बजे विभिन्न वाहनों द्वारा मोहल्ला शांतिनगर (जहानाबाद) से मोहल्ला मोकरी (सांस्कृतिक भवन के पास), अरवल के लिए प्रस्थान करेगी।",
                description_en="The Tilak party will depart at 3:00 PM in various vehicles from Shantinagar, Jehanabad, for Mohalla Mokri (near Sanskritik Bhawan), Arwal.", venue_id="tilak",
            ),
            EventItem(id="matkor", date="2026-11-22", day_hi="रविवार", title_hi="मटकोर", title_en="Matkor", venue_id="home"),
            EventItem(id="mandap", date="2026-11-23", day_hi="सोमवार", title_hi="मण्डपाच्छादन, मेहंदी, गणेश पूजा", title_en="Mandap, Mehendi & Ganesh Puja", venue_id="home"),
            EventItem(id="haldi", date="2026-11-24", day_hi="मंगलवार", title_hi="हल्दी कलश, धृतढ़ारी, देवपूजन", title_en="Haldi Kalash, Ghritdhari & Dev Pujan", venue_id="home"),
            EventItem(
                id="wedding", date="2026-11-25", day_hi="बुधवार", title_hi="बारात आगमन – प्रीतिभोज एवं शुभ विवाह", title_en="Baraat, Reception Dinner & Wedding", time="18:00",
                description_hi="बारात आगमन – प्रीतिभोज संध्या 6 बजे से एवं रात्रि में शुभ विवाह", description_en="Baraat arrival, reception dinner from 6:00 PM, followed by the wedding ceremony at night.", venue_id="hotel",
            ),
        ],
        venues=venues,
        gallery=gallery,
        texts=TextBlocks(
            shloka_hero="वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ । निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा ॥",
            shloka_events="मंगलम् भगवान विष्णुः, मंगलम् गरुड़ध्वजः । मंगलम् पुण्डरीकाक्षः, मंगलायतनो हरिः ॥",
            invitation_intro="मान्यवर, परम पिता परमेश्वर की असीम अनुकम्पा से –",
            venue_note="विवाह स्थल: समस्त वैवाहिक कार्यक्रम हमारे निवास स्थान शांतिनगर से एवं बारात स्वागत एवं प्रीतिभोज होटल वृन्दावन (घोड़ा अस्पताल) से सम्पन्न होगी।",
            kids_poem="छोटे-छोटे पाँव हमारे, कैसे आऊँ मनाने को,\nमेरी बुआ की ‘छादी’ में आप भूल ना जाना आने को।",
            kids_signature="— \"रावी\"",
            kids_blessing="कोमल मन है राह कठिन, वर-वधू दोनों नादान ।\nसुखमय बीते इनका जीवन, कृपया आकर दें वरदान ॥",
            welcome_hosts="रविन्द्र कुमार, डॉ० तारकेश्वर नाथ",
            well_wishers="राहुल कुमार, रोहित कुमार, लालबिहारी प्रसाद, मुकेश कुमार वर्मा, अरविन्द कुमार वर्मा, प्रतीक, पलक, आयांश एवं समस्त परिवार।",
            aspirant="देवेन्द्र कुमार, मो०-शांतिनगर (गली नं०-3), पो०+थाना – जहानाबाद, जिला – जहानाबाद (बिहार)",
        ),
        music=[MusicTrack(id="beriaan", title="Beriaan — Hari & Sukhmani", url=MUSIC_URL, is_default=True)],
        theme=ThemeConfig(
            section_visibility={
                "letter": True, "couple": True, "countdown": True, "events": True,
                "gallery": True, "venues": True, "kids": True, "hosts": True, "rsvp": True,
            }
        ),
    )