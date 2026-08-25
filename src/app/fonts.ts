/**
 * Font configuration for the app.
 *
 * DM Sans is loaded via Google Fonts for all general text and UI elements.
 * Neue Haas Grotesk variable (--font-neue-haas-grotesk) falls back to DM Sans
 * for numerical displays until licensed .woff2 font files are added.
 */
import { DM_Sans } from 'next/font/google';

export const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});
