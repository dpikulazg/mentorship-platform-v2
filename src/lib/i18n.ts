import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "nav": {
        "home": "Home",
        "admin": "Admin",
        "login": "Login",
        "logout": "Logout",
        "features": "Features",
        "course": "Course",
        "pricing": "Pricing",
        "dashboard": "Dashboard",
        "start_selling": "Start Selling"
      },
      "hero": {
        "badge": "Platform for selling your trading course",
        "title": "Professional site for <0>video course</0>, login and section-based lessons",
        "desc": "This is a serious prototype showing how your real platform would look: landing page, sales, user login, dashboard, and video lessons organized by modules.",
        "cta_start": "Start with Course",
        "cta_dashboard": "View Dashboard",
        "feat_responsive": "Responsive design",
        "feat_video": "Video sections",
        "feat_login": "Login and packages"
      },
      "features": {
        "tag": "Capabilities",
        "title": "What this site can have",
        "v1_title": "Video lessons by sections",
        "v1_text": "Each module has its lessons, duration, description and video player.",
        "v2_title": "User Login",
        "v2_text": "Students log in and immediately see their dashboard, progress and locked modules.",
        "v3_title": "Protected Content",
        "v3_text": "Lessons can be available only to users who bought the course or a specific package.",
        "v4_title": "Progress Tracking",
        "v4_text": "Clear overview of completed lessons and progress through the entire program.",
        "v5_title": "Mobile Optimized",
        "v5_text": "All sections work on mobile, tablet and computer without a separate version.",
        "v6_title": "Admin for You",
        "v6_text": "Later easily add video upload, editing modules, prices and users."
      },
      "course": {
        "tag": "Course Experience",
        "title": "Video lessons organized by modules",
        "note": "Here you can later insert your real videos from Vimeo, Bunny, S3 or private hosting.",
        "sidebar_title": "Modules and Lessons",
        "active": "Active",
        "lessons_count": "{{count}} lessons",
        "locked_title": "This lesson is locked",
        "locked_desc": "Unlocks after purchasing a higher package or manual access approval.",
        "materials": "Lesson Materials",
        "pdf": "PDF Script",
        "checklist": "Entry Checklist",
        "homework": "Homework task",
        "lesson_desc_placeholder": "Here goes the lesson description, additional explanations, PDF materials, links and tasks. Later you can add a download section, comments or a quiz to each lesson.",
        "duration": "Duration",
        "format": "Format",
        "access": "Access",
        "unlocked": "Unlocked",
        "locked": "Locked"
      },
      "pricing": {
        "tag": "Pricing",
        "title": "Packages for selling your course",
        "popular": "Most Popular",
        "choose": "Choose Plan"
      },
      "auth_preview": {
        "tag": "Login and student part",
        "title": "Preview of how user enters the course",
        "preview_tag": "Auth preview",
        "form_title": "Login form",
        "email": "Email",
        "password": "Password",
        "btn": "Log In",
        "note": "Later this can be connected to real login via Supabase, Firebase or custom backend.",
        "status_tag": "Student status",
        "logged_in": "User Logged In",
        "guest": "Guest",
        "active_access": "Active Access",
        "no_access": "No Access",
        "pkg": "Purchased Package",
        "completed": "Completed",
        "device": "Device",
        "device_val": "Mobile + Web",
        "footer_note": "This part shows that the site can have a separate space for students, unlocking content by package and a clear overview of what the user has watched."
      },
      "footer": {
        "title": "This is a good base for a real .com site",
        "desc": "The next step is connecting real videos, payments, domain and user database. After that, the site can be published online on your domain and work normally on both mobile and computer.",
        "cta_publish": "Publish Course",
        "cta_domain": "Connect Domain"
      },
      "admin": {
        "title": "Admin Dashboard",
        "users": "User Management",
        "cms": "Content Management",
        "monetization": "Monetization",
        "save": "Save Changes"
      },
      "common": {
        "loading": "Loading...",
        "error": "An error occurred",
        "success": "Success"
      }
    }
  },
  hr: {
    translation: {
      "nav": {
        "home": "Početna",
        "admin": "Admin",
        "login": "Prijava",
        "logout": "Odjava",
        "features": "Mogućnosti",
        "course": "Course",
        "pricing": "Cijene",
        "dashboard": "Dashboard",
        "start_selling": "Pokreni prodaju"
      },
      "hero": {
        "badge": "Platforma za prodaju tvog trading coursea",
        "title": "Profesionalna stranica za <0>video course</0>, login i otvaranje lekcija po sekcijama",
        "desc": "Ovo je ozbiljniji prototip koji pokazuje kako bi izgledala tvoja prava platforma: naslovnica, prodaja, prijava korisnika, dashboard i video lekcije raspoređene po modulima.",
        "cta_start": "Kreni s courseom",
        "cta_dashboard": "Pogledaj dashboard",
        "feat_responsive": "Responsive dizajn",
        "feat_video": "Video sekcije",
        "feat_login": "Login i paketi"
      },
      "features": {
        "tag": "Mogućnosti",
        "title": "Što ova stranica može imati",
        "v1_title": "Video lekcije po sekcijama",
        "v1_text": "Svaki modul ima svoje lekcije, trajanje, opis i player za video sadržaj.",
        "v2_title": "Login za korisnike",
        "v2_text": "Polaznici se prijave i odmah vide svoj dashboard, napredak i zaključane module.",
        "v3_title": "Zaštićen sadržaj",
        "v3_text": "Lekcije mogu biti dostupne samo korisnicima koji su kupili course ili određeni paket.",
        "v4_title": "Praćenje napretka",
        "v4_text": "Jasan pregled završenih lekcija i napretka kroz cijeli program.",
        "v5_title": "Prilagođeno za mobitel",
        "v5_text": "Sve sekcije rade na mobitelu, tabletu i računalu bez posebne zasebne verzije.",
        "v6_title": "Admin za tebe",
        "v6_text": "Kasnije se lako doda upload videa, uređivanje modula, cijena i korisnika."
      },
      "course": {
        "tag": "Course iskustvo",
        "title": "Video lekcije raspoređene po modulima",
        "note": "Ovdje kasnije možeš ubaciti svoja prava videa s Vimeo, Bunny, S3 ili privatnog hostinga.",
        "sidebar_title": "Moduli i lekcije",
        "active": "Aktivno",
        "lessons_count": "{{count}} lekcije",
        "locked_title": "Ova lekcija je zaključana",
        "locked_desc": "Otključava se nakon kupnje višeg paketa ili ručnog odobrenja pristupa.",
        "materials": "Materijali lekcije",
        "pdf": "PDF skripta",
        "checklist": "Checklist za entry",
        "homework": "Homework zadatak",
        "lesson_desc_placeholder": "Ovdje ide opis lekcije, dodatna objašnjenja, PDF materijali, linkovi i zadaci. Kasnije možeš svakoj lekciji dodati i download sekciju, komentare ili kviz.",
        "duration": "Trajanje",
        "format": "Format",
        "access": "Pristup",
        "unlocked": "Otključano",
        "locked": "Zaključano"
      },
      "pricing": {
        "tag": "Cijene",
        "title": "Paketi za prodaju tvog coursea",
        "popular": "Najpopularnije",
        "choose": "Odaberi plan"
      },
      "auth_preview": {
        "tag": "Login i student dio",
        "title": "Prikaz kako korisnik ulazi u course",
        "preview_tag": "Auth preview",
        "form_title": "Login forma",
        "email": "Email",
        "password": "Lozinka",
        "btn": "Prijavi se",
        "note": "Kasnije se ovdje može spojiti pravi login preko Supabase, Firebase ili custom backend rješenja.",
        "status_tag": "Student status",
        "logged_in": "Korisnik prijavljen",
        "guest": "Gost",
        "active_access": "Aktivan pristup",
        "no_access": "Bez pristupa",
        "pkg": "Kupljeni paket",
        "completed": "Dovršeno",
        "device": "Uređaj",
        "device_val": "Mobitel + Web",
        "footer_note": "Ovaj dio pokazuje da stranica može imati zaseban prostor za polaznike, otključavanje sadržaja po paketu i jasan pregled što je korisnik pogledao."
      },
      "footer": {
        "title": "Ovo je dobra baza za pravu .com stranicu",
        "desc": "Sljedeći korak je spajanje pravih videa, naplate, domene i baze korisnika. Nakon toga se stranica može objaviti online na tvojoj domeni i normalno raditi i na mobitelu i na računalu.",
        "cta_publish": "Objavi course",
        "cta_domain": "Spoji domenu"
      },
      "admin": {
        "title": "Admin Nadzorna Ploča",
        "users": "Upravljanje Korisnicima",
        "cms": "Upravljanje Sadržajem",
        "monetization": "Monetizacija",
        "save": "Spremi Promjene"
      },
      "common": {
        "loading": "Učitavanje...",
        "error": "Došlo je do pogreške",
        "success": "Uspjeh"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
