import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Home() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('authToken')?.value;

  if (authToken) {
    redirect('/dashboard');
  }

  redirect('/login');
}
