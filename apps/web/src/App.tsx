import { Routes, Route, Navigate } from 'react-router-dom';
import { useSession } from '@/lib/auth-client';
import { LoginPage } from '@/pages/login';
import { RegisterPage } from '@/pages/register';
import { HomePage } from '@/pages/home';
import { ProjectsPage } from '@/pages/projects/index';
import { ChatPage } from '@/pages/chat';
import { InterviewPage } from '@/pages/projects/interview';
import { TechStackPage } from '@/pages/projects/techstack';
import { BrdPage } from '@/pages/projects/brd';
import { TreePage } from '@/pages/projects/tree';
import { BoardPage } from '@/pages/projects/board';
import { GuidePage } from '@/pages/projects/guide';
import WizardLayout from '@/components/layout/wizard-layout';

function Protected({ children }: { children: React.ReactNode }) {
  const { data, isPending } = useSession();
  if (isPending) return <div className="p-8 text-muted-foreground">Memuat...</div>;
  if (!data?.user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes wrapped in WizardLayout */}
      <Route
        element={
          <Protected>
            <WizardLayout />
          </Protected>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/chat/:sessionId" element={<ChatPage />} />
        <Route path="/projects/:projectId/interview" element={<InterviewPage />} />
        <Route path="/projects/:projectId/techstack" element={<TechStackPage />} />
        <Route path="/projects/:projectId/brd" element={<BrdPage />} />
        <Route path="/projects/:projectId/tree" element={<TreePage />} />
        <Route path="/projects/:projectId/board" element={<BoardPage />} />
        <Route path="/projects/:projectId/guide" element={<GuidePage />} />
      </Route>

      {/* Fallback 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
