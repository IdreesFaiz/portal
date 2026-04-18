/**
 * Login page uses a standalone layout — no sidebar/header.
 * Overrides the admin layout for this route only.
 */
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
