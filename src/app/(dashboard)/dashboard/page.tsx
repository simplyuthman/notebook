import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { getBookDetails, serializeBookForClient } from '@/server/books';
import { settleProSubscription } from '@/server/billing';
import LibraryView from './LibraryView';
import BookViewClient from './BookViewClient';

export const metadata: Metadata = {
  title: 'My Books',
  description: 'Your NotesBook dashboard — view and manage your digital books.',
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

/**
 * The dashboard hosts both dashboard views on one route:
 * - default: the book library (LibraryView)
 * - ?book=<title>: that book's detail view (BookViewClient), rendered in place
 *   of the library — there is no separate /book/[id] route.
 */
export default async function DashboardPage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  const isNewUser = searchParams.new_user === 'true';

  // Payment return from Flutterwave's hosted checkout. Settle server-side
  // (verify via API + paired ledger write) instead of trusting the redirect.
  // settleProSubscription is idempotent by reference, and the redirect to a
  // clean /dashboard keeps refreshes from re-running it needlessly.
  const rawStatus = (typeof searchParams.status === 'string' ? searchParams.status : '').toLowerCase();
  const rawTxId = typeof searchParams.transaction_id === 'string'
    ? searchParams.transaction_id
    : typeof searchParams.tx_id === 'string'
    ? searchParams.tx_id
    : typeof searchParams.id === 'string'
    ? searchParams.id
    : typeof searchParams.flw_ref === 'string'
    ? searchParams.flw_ref
    : null;
  const rawTxRef = typeof searchParams.tx_ref === 'string'
    ? searchParams.tx_ref
    : typeof searchParams.txRef === 'string'
    ? searchParams.txRef
    : typeof searchParams.reference === 'string'
    ? searchParams.reference
    : null;

  const isSuccessStatus = rawStatus === 'successful' || rawStatus === 'completed' || rawStatus === 'success';

  if (rawTxRef && (isSuccessStatus || rawTxId)) {
    let outcome: string | null = null;
    try {
      outcome = await settleProSubscription(rawTxRef, rawTxId);
    } catch (err) {
      // Never block the dashboard on settlement errors; the webhook remains
      // the retrying source of truth.
      console.error('billing.redirect.settle_failed', { err, tx_ref: rawTxRef });
    }
    if (outcome === 'GRANTED' || outcome === 'DUPLICATE') {
      redirect('/dashboard?upgraded=true');
    }
    redirect('/dashboard');
  }

  const isUpgraded = searchParams.upgraded === 'true';

  const rawBook = searchParams.book;
  const bookIdentifier = typeof rawBook === 'string' && rawBook.length > 0 ? decodeURIComponent(rawBook) : null;

  if (!bookIdentifier) {
    return <LibraryView isNewUser={isNewUser} isUpgraded={isUpgraded} />;
  }

  // Book view — ownership is enforced inside getBookDetails (userId + bookIdentifier).
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value ?? null;

  if (!userId) {
    redirect('/auth');
  }

  const book = await getBookDetails(userId, bookIdentifier);

  if (!book) {
    notFound();
  }

  return <BookViewClient book={serializeBookForClient(book)} />;
}
