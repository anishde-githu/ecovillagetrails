import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/legacy/index.html');
}