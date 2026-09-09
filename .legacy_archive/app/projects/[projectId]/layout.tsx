'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { useProjectStore } from '@/lib/stores/project-store';

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const projectId = params.projectId as string;
  const { getProject } = useProjectStore();

  const project = getProject(projectId);

  return (
    <AppLayout
      projectId={projectId}
      projectName={project?.name || 'Project'}
      projectStatus={project?.status || 'discovery'}
    >
      {children}
    </AppLayout>
  );
}
