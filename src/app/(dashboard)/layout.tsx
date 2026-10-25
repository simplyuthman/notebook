import { cookies } from 'next/headers';
import { db } from '@/server/db';
import { redirect } from 'next/navigation';
import { getUserSubscriptionInfo } from '@/server/billing';
import UserAvatarMenu from './UserAvatarMenu';
import UpgradePlanButton from './UpgradePlanButton';
import ThemeToggle from '@/components/ThemeToggle';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value ?? null;

  if (!userId) {
    redirect('/auth');
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  // Effective plan and interval are derived from LIVE subscription data.
  const { plan: currentPlan, interval: currentInterval } = await getUserSubscriptionInfo(userId);

  const displayName = user?.name || user?.email || 'User';

  const initials = (() => {
    if (user?.name?.trim()) {
      const parts = user.name.trim().split(/\s+/);
      const first = parts[0]?.[0] ?? '';
      const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
      return `${first}${last}`.toUpperCase();
    }
    return (user?.email?.[0] ?? '?').toUpperCase();
  })();

  return (
    <div
      style={{
        maxWidth: '1000px',
        margin: '0 auto',
        minHeight: '100vh',
        backgroundColor: 'var(--color-surface)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          padding: 'calc(var(--spacing-collection-extra-large-spacing) * 1px) calc(var(--spacing-collection-large-spacing) * 1px) 0 calc(var(--spacing-collection-large-spacing) * 1px)',
          backgroundColor: 'var(--color-surface)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--color-outline-variant, rgba(0, 0, 0, 0.08))',
            paddingBottom: 'calc(var(--spacing-collection-extra-large-spacing) * 1px)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'calc(var(--spacing-collection-small-spacing) * 1px)',
              fontFamily: 'var(--typography-label-large-fontfamily)',
              fontSize: 'var(--typography-label-large-fontsize)',
              fontWeight: '700',
              color: 'var(--color-on-surface)',
            }}
          >
            NotesBook
          </div>
          
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'calc(var(--spacing-collection-medium-spacing, 12) * 1px)',
            }}
          >
            <ThemeToggle />
            <UpgradePlanButton currentPlan={currentPlan} currentInterval={currentInterval} />
            <UserAvatarMenu displayName={displayName} initials={initials} />
          </div>
        </div>
      </header>


      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>
    </div>
  );
}
