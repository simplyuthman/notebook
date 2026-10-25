import type { Metadata, Viewport } from 'next';
import { roboto } from './fonts';
import './globals.css';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://notesbook.app';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),

  applicationName: 'NotesBook',

  // Title template — child pages supply `%s`, marketing home uses `title.absolute`
  title: {
    default: 'NotesBook',
    template: '%s | NotesBook',
  },

  description:
    'NotesBook uses AI to turn photos of your handwritten notes into a clean, structured, editable digital book. Built for Nigerian students and self-learners.',

  keywords: [
    'handwritten notes to digital',
    'AI notes transcription',
    'student notes app Nigeria',
    'convert notes to book',
    'handwriting OCR',
    'digital notebook',
    'note organizer Africa',
    'NotesBook',
  ],

  authors: [{ name: 'NotesBook' }],
  creator: 'NotesBook',
  publisher: 'NotesBook',

  // Canonical and locale
  alternates: {
    canonical: '/',
  },

  // Open Graph
  openGraph: {
    type: 'website',
    siteName: 'NotesBook',
    title: {
      default: 'NotesBook',
      template: '%s | NotesBook',
    },
    description:
      'Turn photos of handwritten notes into a clean, editable digital book — built for students across Africa.',
    locale: 'en_NG',
    url: APP_URL,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NotesBook — Turn handwritten notes into a digital book',
      },
    ],
  },

  // Twitter / X card
  twitter: {
    card: 'summary_large_image',
    title: {
      default: 'NotesBook',
      template: '%s | NotesBook',
    },
    description:
      'Turn photos of handwritten notes into a clean, editable digital book — built for students across Africa.',
    images: ['/og-image.png'],
  },

  // Default robots for public pages (private pages override this with noindex)
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// Viewport is a separate export in Next.js 15 (themeColor moved here from metadata)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
    { media: '(prefers-color-scheme: dark)', color: '#121212' },
  ],
};

// Applies the persisted (or system) theme before first paint to avoid a flash.
const themeInitScript = `(function(){try{var stored=localStorage.getItem('notesbook-theme');var theme=stored==='light'||stored==='dark'?stored:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');var root=document.documentElement;root.dataset.theme=theme;root.style.colorScheme=theme;}catch(e){document.documentElement.dataset.theme='light';}})();`;

// JSON-LD structured data for Google — WebApplication schema
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'NotesBook',
  url: APP_URL,
  description:
    'A web application that turns photos of handwritten student notes into clean, structured, editable digital books using AI.',
  applicationCategory: 'EducationApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'NGN',
    description: 'Free plan available; Pro plan with higher limits',
  },
  audience: {
    '@type': 'EducationalAudience',
    educationalRole: 'student',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-NG" className={roboto.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        style={{
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-on-surface)',
          margin: 0,
        }}
      >
        {children}
      </body>
    </html>
  );
}
