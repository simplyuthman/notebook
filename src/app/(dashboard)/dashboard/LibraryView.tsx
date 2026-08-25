import Link from 'next/link';
import { cookies } from 'next/headers';
import { db } from '@/server/db';
import { config } from '@/config';
import { getUserSubscriptionInfo } from '@/server/billing';
import EmailVerificationBanner from './EmailVerificationBanner';
import ConfettiSplash from './ConfettiSplash';
import UpgradeSuccessBanner from './UpgradeSuccessBanner';
import NewBookButton from './NewBookButton';
import UploadNotesButton from './UploadNotesButton';
import UpgradeBannerLink from './UpgradeBannerLink';

type SignalState = 'free' | 'pro' | 'exhausted';

function getSignal(used: number, limit: number, hasActivePro: boolean): SignalState {
  if (used >= limit) {
    return hasActivePro ? 'pro' : 'exhausted';
  }
  return 'free';
}

function SignalChip({ signal, remaining }: { signal: SignalState; remaining: number }) {
  const chipBaseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'calc(var(--spacing-collection-extra-small-spacing) * 1px)',
    padding: 'calc(var(--spacing-collection-extra-small-spacing) * 1px) calc(var(--spacing-collection-small-spacing) * 1px)',
    borderRadius: 'calc(var(--spacing-collection-extra-small-spacing) * 1px)',
    fontFamily: 'var(--typography-label-small-fontfamily)',
    fontSize: 'var(--typography-label-small-fontsize)',
    fontWeight: '600',
    letterSpacing: 'var(--typography-label-small-letterspacing)',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  };

  if (signal === 'pro') {
    return (
      <span style={{ ...chipBaseStyle, backgroundColor: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)' }}>
        Pro
      </span>
    );
  }

  if (signal === 'exhausted') {
    return (
      <span
        style={{ ...chipBaseStyle, backgroundColor: 'var(--color-error-container)', color: 'var(--color-on-error-container)' }}
        title="Free plan limit reached"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2 1 21h22L12 2zm1 14h-2v2h2v-2zm0-6h-2v4h2v-4z" />
        </svg>
        Limit reached
      </span>
    );
  }

  return null;
}

function computeTrendPct(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// Below this share of remaining allowance the pill flips to its warning state.
const CAPACITY_LOW_THRESHOLD = 20;

/**
 * Share-of-limit pill: shows how much of the stat card's plan limit is still
 * available, counting down dynamically as books/images are uploaded.
 * Green/up arrow while a healthy share remains, red/down arrow when low.
 */
function TrendPill({ pct }: { pct: number }) {
  const isUp = pct >= CAPACITY_LOW_THRESHOLD;

  const textColor = isUp ? '#16a34a' : '#dc2626';

  const tooltipLabel = isUp
    ? `${pct}% of this limit still available`
    : pct === 0
    ? 'Free plan limit reached'
    : `Only ${pct}% of this limit left`;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '2px',
        padding: '2px 7px',
        fontFamily: 'var(--typography-label-small-fontfamily)',
        fontSize: 'var(--typography-label-small-fontsize)',
        fontWeight: '600',
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
        color: textColor,
        transition: 'background-color 0.3s, color 0.3s, border-color 0.3s',
      }}
      title={tooltipLabel}
    >
      <svg
        width="9"
        height="9"
        viewBox="0 0 10 10"
        fill="currentColor"
        aria-hidden="true"
        style={{ flexShrink: 0, transform: isUp ? 'none' : 'rotate(180deg)' }}
      >
        <path d="M5 1 L9 8 L1 8 Z" />
      </svg>
      {pct}%
    </span>
  );
}

function StatCard({
  label,
  value,
  limit,
  signal,
  remaining,
  trendPct,
}: {
  label: string;
  value: number;
  limit: number;
  signal: SignalState;
  remaining: number;
  trendPct?: number;
}) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface-container-low)',
        borderRadius: 'calc(var(--spacing-collection-small-spacing) * 1px)',
        padding: 'calc(var(--spacing-collection-medium-spacing) * 1px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'calc(var(--spacing-collection-extra-small-spacing) * 1px)',
        border: '1px solid var(--color-outline-variant, rgba(0, 0, 0, 0.08))',
      }}
    >
      {/* Card Header: Label + Pill + Chip */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'calc(var(--spacing-collection-small-spacing) * 1px)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--typography-label-medium-fontfamily)',
            fontSize: 'var(--typography-label-medium-fontsize)',
            letterSpacing: 'var(--typography-label-medium-letterspacing)',
            fontWeight: 'var(--typography-label-small-fontweight)',
            color: 'color-mix(in srgb, var(--color-on-surface-variant) 80%, var(--color-surface))',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minWidth: 0,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {/* trendPct now only toggles the capacity pill; the value shown is the share of `limit` still remaining. */}
          {trendPct !== undefined && (
            <TrendPill pct={limit > 0 ? Math.round((Math.min(remaining, limit) / limit) * 100) : 0} />
          )}
          <SignalChip signal={signal} remaining={remaining} />
        </span>
      </div>
      {/* Value */}
      <span
        style={{
          fontFamily: 'var(--typography-headline-large-fontfamily)',
          fontSize: 'var(--typography-headline-large-fontsize)',
          fontWeight: '600',
          color: 'var(--color-on-primary-container)',
        }}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * The default dashboard view: plan usage stats and the student's book grid.
 * Rendered by dashboard/page.tsx when no book view (?book=) is selected.
 */
export default async function LibraryView({
  isNewUser,
  isUpgraded,
}: {
  isNewUser: boolean;
  isUpgraded?: boolean;
}) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value ?? null;

  let user: { id: string; email: string; emailVerified: Date | null; plan: string } | null = null;

  if (userId) {
    user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, emailVerified: true, plan: true },
    });
  }

  const books = await db.book.findMany({
    where: userId ? { userId } : { id: "never" },
    include: {
      _count: { select: { images: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const imagesThisMonth = userId ? await db.sourceImage.count({
    where: {
      book: { userId },
      createdAt: { gte: startOfMonth }
    }
  }) : 0;

  const imagesLastMonth = userId ? await db.sourceImage.count({
    where: {
      book: { userId },
      createdAt: { gte: startOfLastMonth, lt: startOfMonth }
    }
  }) : 0;

  // Books created before this month (to compare month-over-month additions)
  const booksCreatedThisMonth = userId ? await db.book.count({
    where: { userId, createdAt: { gte: startOfMonth } }
  }) : 0;

  const booksCreatedLastMonth = userId ? await db.book.count({
    where: { userId, createdAt: { gte: startOfLastMonth, lt: startOfMonth } }
  }) : 0;

  const { plan: currentPlan, interval: currentInterval } = userId
    ? await getUserSubscriptionInfo(userId)
    : { plan: 'FREE' as const, interval: null };
  const hasActivePro = currentPlan === 'PRO';

  const imagesPerBook = userId ? await db.sourceImage.groupBy({
    by: ['bookId'],
    where: { book: { userId } },
    _count: { _all: true },
  }) : [];
  const maxBookImages = imagesPerBook.length ? Math.max(...imagesPerBook.map((g) => g._count._all)) : 0;

  const activeLimits = hasActivePro
    ? {
        monthlyImages: config.limits.pro.monthlyImages,
        maxBooks: 9999,
        perBookImages: config.limits.pro.perBookImages,
      }
    : config.limits.free;

  const monthlyImagesSignal = getSignal(imagesThisMonth, activeLimits.monthlyImages, hasActivePro);
  const booksSignal = getSignal(books.length, activeLimits.maxBooks, hasActivePro);
  const perBookSignal = getSignal(maxBookImages, activeLimits.perBookImages, hasActivePro);

  const imagesTrendPct = computeTrendPct(imagesThisMonth, imagesLastMonth);
  const booksTrendPct = computeTrendPct(booksCreatedThisMonth, booksCreatedLastMonth);

  const isUnverified = user && !user.emailVerified;

  return (
    <div
      style={{
        maxWidth: '1000px',
        margin: '20px 0',
        padding: 'calc(var(--spacing-collection-large-spacing) * 1px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'calc(var(--spacing-collection-large-spacing) * 1px)',
      }}
    >
      {/* Email Verification Banner */}
      {isUnverified && (
        <EmailVerificationBanner email={user!.email} />
      )}

      {/* Upgrade Success Notification */}
      {isUpgraded && (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '-8px' }}>
          <UpgradeSuccessBanner />
        </div>
      )}

      {/* Header Area */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'calc(var(--spacing-collection-base-spacing) * 1px)',
          marginTop: 'calc(var(--spacing-collection-medium-spacing) * 1px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'calc(var(--spacing-collection-medium-spacing) * 1px)' }}>
          <span style={{
            backgroundColor: hasActivePro ? 'var(--color-primary)' : 'var(--color-primary-container)',
            color: hasActivePro ? 'var(--color-on-primary)' : 'var(--color-on-primary-container)',
            padding: 'calc(var(--spacing-collection-extra-small-spacing) * 1px) calc(var(--spacing-collection-small-spacing) * 1px)',
            borderRadius: 'calc(var(--spacing-collection-medium-spacing) * 1px)',
            fontFamily: 'var(--typography-label-small-fontfamily)',
            fontSize: 'var(--typography-label-small-fontsize)',
            fontWeight: '600',
          }}>
            {hasActivePro ? 'PRO' : (user?.plan === 'PRO' ? 'PRO (EXPIRED)' : 'FREE')}
          </span>
        </div>

        <NewBookButton />
      </div>

      {/* Usage Stats Row — aligned horizontally */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 'calc(var(--spacing-collection-base-spacing) * 1px)',
      }}>
        <StatCard
          label={`Images this month (${activeLimits.monthlyImages} Max)`}
          value={imagesThisMonth}
          limit={activeLimits.monthlyImages}
          signal={monthlyImagesSignal}
          remaining={Math.max(0, activeLimits.monthlyImages - imagesThisMonth)}
          trendPct={imagesTrendPct}
        />
        <StatCard
          label={hasActivePro ? 'Books (Unlimited Pro)' : `Books (${activeLimits.maxBooks} Max)`}
          value={books.length}
          limit={activeLimits.maxBooks}
          signal={booksSignal}
          remaining={hasActivePro ? 9999 : Math.max(0, activeLimits.maxBooks - books.length)}
          trendPct={booksTrendPct}
        />
        <StatCard
          label={`Max images per book (${activeLimits.perBookImages} Max)`}
          value={maxBookImages}
          limit={activeLimits.perBookImages}
          signal={perBookSignal}
          remaining={Math.max(0, activeLimits.perBookImages - maxBookImages)}
        />
      </div>

      {/* Main Content Area */}
      <div
        style={
          books.length === 0
            ? {
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-outline)',
                borderRadius: 'calc(var(--spacing-collection-medium-spacing) * 1px)',
                padding: 'calc(var(--spacing-collection-large-spacing) * 1px)',
                boxSizing: 'border-box',
                marginTop: 'calc(var(--spacing-collection-large-spacing) * 1px)',
              }
            : {
                boxSizing: 'border-box',
                marginTop: 'calc(var(--spacing-collection-large-spacing) * 1px)',
              }
        }
      >
        {books.length === 0 ? (
          <div
            style={{
              minWidth: '100%',
              border: '2px dashed var(--color-outline-variant)',
              borderRadius: 'calc(var(--spacing-collection-medium-spacing) * 1px)',
              padding: 'calc(var(--spacing-collection-very-large-spacing) * 1px) calc(var(--spacing-collection-extra-large-spacing) * 1px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'calc(var(--spacing-collection-base-spacing) * 1px)',
              backgroundColor: 'transparent',
            }}
          >
            <div style={{ color: 'var(--color-on-surface-variant)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                <path d="M8 7h6" />
                <path d="M8 11h8" />
                <path d="M12 2v20" strokeDasharray="2 4" />
              </svg>
            </div>

            <h2
              style={{
                fontFamily: 'var(--typography-title-large-fontfamily)',
                fontSize: 'var(--typography-title-large-fontsize)',
                fontWeight: '600',
                color: 'var(--color-on-surface)',
                margin: 0,
              }}
            >
              No books yet
            </h2>
            <p
              style={{
                fontFamily: 'var(--typography-body-medium-fontfamily)',
                fontSize: 'var(--typography-body-medium-fontsize)',
                color: 'var(--color-on-surface-variant)',
                margin: '0 0 calc(var(--spacing-collection-small-spacing) * 1px) 0',
                textAlign: 'center'
              }}
            >
              Upload your handwritten notes and turn them into a structured digital book.
            </p>

            <NewBookButton
              buttonText="Create your first book"
              style={{
                padding: 'calc(var(--spacing-collection-small-spacing) * 1px) calc(var(--spacing-collection-large-spacing) * 1px)',
              }}
            />
          </div>
        ) : (
          <div>
            <h2
              style={{
                fontFamily: 'var(--typography-title-large-fontfamily)',
                fontSize: 'var(--typography-title-medium-fontsize)',
                fontWeight: '600',
                color: 'var(--color-on-surface)',
                marginTop: 0,
                marginBottom: 'calc(var(--spacing-collection-large-spacing) * 1px)',
                textTransform: 'uppercase',
                letterSpacing: '-1px',
              }}
            >
              Your Books
            </h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 'calc(var(--spacing-collection-large-spacing) * 1px)',
              }}
            >
              {books.map((book) => {
                const imagesCount = book._count?.images ?? 0;

                return (
                  <div
                    key={book.id}
                    style={{
                      backgroundColor: "var(--color-surface-container-lowest)",
                      border: "1px solid var(--color-outline)",
                      borderRadius: "calc(var(--spacing-collection-small-spacing) * 1px)",
                      padding: "calc(var(--spacing-collection-large-spacing) * 1px)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "calc(var(--spacing-collection-small-spacing) * 1px)",
                      minHeight: "130px",
                    }}
                  >
                    <div>
                      <Link
                        href={`/dashboard?book=${encodeURIComponent(book.title)}`}
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                        <h3
                          style={{
                            fontFamily: "var(--typography-title-medium-fontfamily)",
                            fontSize: "var(--typography-title-medium-fontsize)",
                            fontWeight: "600",
                            color: "var(--color-on-surface)",
                            margin: 0,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            cursor: "pointer",
                          }}
                        >
                          {book.title}
                        </h3>
                      </Link>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginTop: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--typography-body-small-fontfamily)",
                            fontSize: "var(--typography-body-small-fontsize)",
                            color: "var(--color-on-surface-variant)",
                          }}
                        >
                          Created {book.createdAt.toLocaleDateString()}
                        </span>
                        {imagesCount > 0 && (
                          <span
                            style={{
                              fontFamily: "var(--typography-label-small-fontfamily)",
                              fontSize: "11px",
                              fontWeight: "600",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              backgroundColor: "var(--color-primary-container)",
                              color: "var(--color-on-primary-container)",
                            }}
                          >
                            {imagesCount} note{imagesCount === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ flexGrow: 1 }} />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "calc(var(--spacing-collection-small-spacing) * 1px)",
                        marginTop: "calc(var(--spacing-collection-small-spacing) * 1px)",
                      }}
                    >
                      <span
                        style={{
                          backgroundColor: "var(--color-surface-variant)",
                          color: "var(--color-on-surface-variant)",
                          padding: "calc(var(--spacing-collection-extra-small-spacing) * 1px) calc(var(--spacing-collection-small-spacing) * 1px)",
                          borderRadius: "calc(var(--spacing-collection-extra-small-spacing) * 1px)",
                          fontFamily: "var(--typography-label-small-fontfamily)",
                          fontSize: "var(--typography-label-small-fontsize)",
                          fontWeight: "600",
                          textTransform: "capitalize",
                        }}
                      >
                        {book.status.toLowerCase()}
                      </span>
                      <UploadNotesButton bookId={book.id} bookTitle={book.title} imagesCount={imagesCount} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Limit Reached Warning Banner */}
      {booksSignal === 'exhausted' && (
        <div
          style={{
            padding: 'calc(var(--spacing-collection-base-spacing) * 1px)',
            backgroundColor: 'var(--color-error-container)',
            color: 'var(--color-on-error-container)',
            borderRadius: 'calc(var(--spacing-collection-small-spacing) * 1px)',
            fontFamily: 'var(--typography-body-medium-fontfamily)',
            fontSize: 'var(--typography-body-medium-fontsize)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: 'calc(var(--spacing-collection-small-spacing) * 1px)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path d="M12 2 1 21h22L12 2zm1 14h-2v2h2v-2zm0-6h-2v4h2v-4z" />
          </svg>
          <span>
            Free plan limit reached ({config.limits.free.maxBooks} books maximum). Please{' '}
            <UpgradeBannerLink currentPlan={hasActivePro ? 'PRO' : 'FREE'} currentInterval={currentInterval} />
          </span>
        </div>
      )}
    </div>
  );
}
