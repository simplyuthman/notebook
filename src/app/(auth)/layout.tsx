export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="auth-layout"
      style={{
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
          width: 'min(90%, 28rem)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
