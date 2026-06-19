import { redirect } from 'next/navigation';
import { verifyAdmin } from '@/lib/auth';

export const metadata = {
  title: 'Admin Dashboard - upGrad Enrolment Portal',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    redirect('/login');
  }
  return <>{children}</>;
}
