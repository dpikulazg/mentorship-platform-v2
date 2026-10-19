import { db } from './lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const initialContent = [
  {
    key: 'hero_title',
    en: 'Welcome to Mentorship',
    hr: 'Dobrodošli u Mentorship',
    type: 'text'
  },
  {
    key: 'hero_subtitle',
    en: 'A powerful Mentorship guides for your next project.',
    hr: 'Moćni Mentorship voditelji za vaš sljedeći projekt.',
    type: 'text'
  },
  {
    key: 'feature_1_title',
    en: 'User Management',
    hr: 'Upravljanje Korisnicima',
    type: 'text'
  },
  {
    key: 'feature_1_desc',
    en: 'Easily manage users and roles from the admin dashboard.',
    hr: 'Jednostavno upravljajte korisnicima i ulogama s admin nadzorne ploče.',
    type: 'text'
  },
  {
    key: 'feature_2_title',
    en: 'Monetization',
    hr: 'Monetizacija',
    type: 'text'
  },
  {
    key: 'feature_2_desc',
    en: 'Control monetization settings and subscription prices.',
    hr: 'Kontrolirajte postavke monetizacije i cijene pretplate.',
    type: 'text'
  },
  {
    key: 'about_title',
    en: 'About Us',
    hr: 'O Nama',
    type: 'text'
  },
  {
    key: 'about_content',
    en: 'PolyCMS is designed to help you build and manage content across multiple languages with ease.',
    hr: 'PolyCMS je dizajniran da vam pomogne u izgradnji i upravljanju sadržajem na više jezika s lakoćom.',
    type: 'text'
  }
];

export async function seedDatabase() {
  try {
    // Check if already seeded
    const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
    if (settingsDoc.exists()) return;

    console.log("Seeding database...");

    // Seed settings
    await setDoc(doc(db, 'settings', 'global'), {
      monetizationEnabled: false,
      subscriptionPrice: 9.99,
      currency: 'EUR'
    });

    // Seed content
    for (const item of initialContent) {
      const id = Math.random().toString(36).substr(2, 9);
      await setDoc(doc(db, 'content', id), {
        ...item,
        id,
        lastUpdated: new Date().toISOString(),
        updatedBy: 'system'
      });
    }

    console.log("Seeding complete.");
  } catch (error) {
    // If it's a permission error, it just means the user isn't an admin yet or data is already there but unreadable
    if (error instanceof Error && (error.message.includes('permission') || error.message.includes('offline'))) {
      console.warn("Seeding skipped: Missing permissions or offline. This is expected if you are not logged in as an admin.");
    } else {
      console.error("Seeding failed:", error);
    }
  }
}
