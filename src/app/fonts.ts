/**
 * Font configuration for the app.
 *
 * Roboto is the Material Design 3 default typeface, loaded via next/font/google
 * for all general text and UI elements. `--font-roboto` is applied on <html> in
 * layout.tsx and consumed by the typography tokens in globals.css.
 */
import { Roboto } from 'next/font/google';

export const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto',
  display: 'swap',
});
