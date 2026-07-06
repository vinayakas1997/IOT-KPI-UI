import type { ReactNode } from 'react';

interface DashboardContainerProps {
  main: ReactNode;
  sidebar: ReactNode;
}

export function DashboardContainer({ main, sidebar }: DashboardContainerProps) {
  return (
    <div className="dashboard-container">
      <div className="main-content">{main}</div>
      <div className="sidebar">{sidebar}</div>
    </div>
  );
}
