import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole') || '';
  const userName = localStorage.getItem('userName') || 'User';

  useEffect(() => {
    // Security Check: if there is no userole kick them out to login page //
    if (!userRole) {
      navigate('/login');
    }
  }, [userRole, navigate]);
// Dounle protection: Do not render the page if they are not logged in //
  if (!userRole) {
    return null;
  }

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex min-h-screen w-full">
        <AppSidebar userRole={userRole} userName={userName} />
        <SidebarInset className="flex flex-col flex-1">
          <header className="glass-surface sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-border/50 px-6 py-3">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="-ml-2" data-testid="button-sidebar-toggle" />
              {title && (
                <div className="flex flex-col">
                  <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
                  {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                  )}
                </div>
              )}
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
