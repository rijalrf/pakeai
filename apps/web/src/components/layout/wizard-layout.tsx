// WizardLayout: Header + full-width content (tanpa stepper)
import { Outlet } from 'react-router-dom';
import { Header } from './header';
import { useLocation } from 'react-router-dom';

export default function WizardLayout() {
  const location = useLocation();
  const isChat = location.pathname.startsWith('/chat/');
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className={isChat || isHome ? '' : 'px-6 py-6'}>
        <Outlet />
      </main>
    </div>
  );
}
