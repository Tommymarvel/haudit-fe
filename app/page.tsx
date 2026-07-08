import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LandingPage } from './ui/landing/LandingPage';

export default async function Home() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('authToken')?.value;

  if (authToken) {
    redirect('/dashboard');
  }

  return <LandingPage />;
}
