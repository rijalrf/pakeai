// WizardLayout: Header + stepper + full-width content (no container)
import { Outlet } from 'react-router-dom';
import { Header } from './header';
import { Stepper } from '@/components/wizard/stepper';
import { useLocation } from 'react-router-dom';

export default function WizardLayout() {
  const location = useLocation();
  // Tampilkan stepper hanya untuk route /projects/:id/* yang bukan chat session dan bukan /projects
  const showStepper = location.pathname.startsWith('/projects/') && location.pathname !== '/projects';
  const isChat = location.pathname.startsWith('/chat/');
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {showStepper && <Stepper />}
      <main className={isChat || isHome ? '' : 'px-6 py-6'}>
        <Outlet />
      </main>
    </div>
  );
}
