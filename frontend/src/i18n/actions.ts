'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function setLocale(locale: 'en' | 'fr' | 'es' | 'de') {
  const cookieStore = await cookies();
  cookieStore.set('locale', locale, { path: '/', maxAge: 60 * 60 * 24 * 365 });
  console.log('Cookie locale set:', cookieStore.get('locale'));
  revalidatePath('/');

}
