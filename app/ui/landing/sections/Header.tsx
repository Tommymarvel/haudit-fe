import { cookies } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';
import { Container } from '../Container';

const NAV_LINKS = [
  { label: 'Home', href: '#' },
  { label: 'Solutions', href: '#solutions' },
  { label: 'Features', href: '#features' },
  { label: 'Faq', href: '#faq' },
];

export async function Header() {
  const cookieStore = await cookies();
  const isAuthenticated = !!cookieStore.get('authToken')?.value;

  return (
    <Container className="flex items-center justify-between py-6">
      <Link href="/" className="shrink-0">
        <Image
          src="/landing/hero/logo.png"
          alt="Haudit"
          width={150}
          height={27}
          className="h-[27px] w-auto"
          priority
        />
      </Link>

      <nav className="hidden items-center gap-6 text-base text-[#101010] md:flex">
        {NAV_LINKS.map((link) => (
          <a key={link.label} href={link.href} className="hover:opacity-70">
            {link.label}
          </a>
        ))}
      </nav>

      {isAuthenticated ? (
        <Link
          href="/dashboard"
          className="hidden shrink-0 rounded-3xl border border-[#451e5f] px-6 py-3 text-base text-[#451e5f] transition hover:bg-[#451e5f] hover:text-white md:inline-flex md:items-center md:justify-center"
        >
          Dashboard
        </Link>
      ) : (
        <div className="hidden shrink-0 items-center gap-4 md:flex">
          <Link
            href="/login"
            className="text-base text-[#101010] hover:opacity-70"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-3xl border border-[#451e5f] px-6 py-3 text-base text-[#451e5f] transition hover:bg-[#451e5f] hover:text-white"
          >
            Get Started
          </Link>
        </div>
      )}
    </Container>
  );
}
