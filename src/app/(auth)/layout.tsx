import ThemeToggle from '@/components/ThemeToggle';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="auth-layout"
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'var(--color-surface)',
        color: 'var(--color-on-surface)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 'calc(var(--spacing-collection-base-spacing) * 1px)',
          right: 'calc(var(--spacing-collection-base-spacing) * 1px)',
        }}
      >
        <ThemeToggle />
      </div>

      <div
        style={{
          width: 'min(90%, 28rem)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
