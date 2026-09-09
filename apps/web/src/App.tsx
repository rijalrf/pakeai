import { Routes, Route, Navigate } from 'react-router-dom';
import { useSession } from '@/lib/auth-client';
import { LoginPage } from '@/pages/login';
import { RegisterPage } from '@/pages/register';
import { DashboardPage } from '@/pages/dashboard';
import { OnboardingPage } from '@/pages/onboarding';
import { InterviewPage } from '@/pages/projects/interview';
import { BrdPage } from '@/pages/projects/brd';
import { RoadmapPage } from '@/pages/projects/roadmap';
import { TasksPage } from '@/pages/projects/tasks';
import { ExecutePage } from '@/pages/projects/execute';
import { SettingsPage } from '@/pages/projects/settings';

function Protected({ children }: { children: React.ReactNode }) {
  const { data, isPending } = useSession();
  if (isPending) return <div className="p-8 text-muted-foreground">Memuat...</div>;
  if (!data?.user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/onboarding"
        element={
          <Protected>
            <OnboardingPage />
          </Protected>
        }
      />
      <Route
        path="/dashboard"
        element={
          <Protected>
            <DashboardPage />
          </Protected>
        }
      />
      <Route
        path="/projects/:projectId/brd"
        element={
          <Protected>
            <InterviewPage />
          </Protected>
        }
      />
      <Route
        path="/projects/:projectId/brd/view"
        element={
          <Protected>
            <BrdPage />
          </Protected>
        }
      />
      <Route
        path="/projects/:projectId/roadmap"
        element={
          <Protected>
            <RoadmapPage />
          </Protected>
        }
      />
      <Route
        path="/projects/:projectId/tasks"
        element={
          <Protected>
            <TasksPage />
          </Protected>
        }
      />
      <Route
        path="/projects/:projectId/execute"
        element={
          <Protected>
            <ExecutePage />
          </Protected>
        }
      />
      <Route
        path="/projects/:projectId/settings"
        element={
          <Protected>
            <SettingsPage />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
