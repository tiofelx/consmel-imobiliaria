import Header from '../components/Header';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/WhatsAppButton';
import { verifySession } from '@/lib/auth';

export default async function PublicLayout({ children }) {
  const session = await verifySession();
  const user = session ? { name: session.name, email: session.email, role: session.role } : null;

  return (
    <>
      <Header user={user} />
      <main>{children}</main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
