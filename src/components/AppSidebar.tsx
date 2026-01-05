import { useLocation, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Building2,
  UserPlus,
  GraduationCap,
  ClipboardCheck,
  Users,
  Calendar,
  BarChart3,
  Lightbulb,
  LogOut,
  BookOpen,
  CheckCircle,
} from 'lucide-react';
import nccdoLogo from '../../attached_assets/462853451_531127746179171_9134722409661138434_n_1762934895081.jpg';

interface AppSidebarProps {
  userRole: string;
  userName: string;
}

export function AppSidebar({ userRole, userName }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  const adminMenuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      url: "/dashboard",
    },
    {
      title: "Cooperative Registration",
      icon: Building2,
      url: "/cooperative-registration",
    },
    {
      title: "Membership Profiling",
      icon: UserPlus,
      url: "/membership-profiling",
    },
    {
      title: "Training Management",
      icon: GraduationCap,
      url: "/training-management",
    },
    {
      title: "Regulatory Compliance",
      icon: ClipboardCheck,
      url: "/regulatory-compliance",
    },
    {
      title: "Compliance Tracker",
      icon: Users,
      url: "/compliance-tracker",
    },
    {
      title: "Attendance",
      icon: Calendar,
      url: "/attendance",
    },
    {
      title: "Training Suggestions",
      icon: Lightbulb,
      url: "/training-suggestions",
    },
    {
      title: "Reports",
      icon: BarChart3,
      url: "/reports",
    },
  ];

  const officerMenuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      url: "/dashboard",
    },
    {
      title: "My Compliance",
      icon: CheckCircle,
      url: "/officer-dashboard",
    },
    {
      title: "Available Trainings",
      icon: BookOpen,
      url: "/available-trainings",
    },
    {
      title: "My Attendance",
      icon: Calendar,
      url: "/my-attendance",
    },
  ];

  const menuItems = userRole === 'administrator' ? adminMenuItems : officerMenuItems;

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <img
            src={nccdoLogo}
            alt="NCCDO Logo"
            className="h-10 w-10 rounded-full object-cover ring-2 ring-sidebar-primary/30"
          />
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm text-sidebar-foreground truncate">NCCDO</span>
            <span className="text-xs text-sidebar-foreground/70 truncate">City of Naga</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">
            {userRole === 'administrator' ? 'Administration' : 'Officer Portal'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                  >
                    <a
                      href={item.url}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(item.url);
                      }}
                      data-testid={`sidebar-link-${item.url.replace('/', '')}`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-sidebar-primary/20 flex items-center justify-center">
              <span className="text-sm font-medium text-sidebar-primary">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-medium text-sidebar-foreground truncate">{userName}</span>
              <Badge variant="outline" className="w-fit text-xs capitalize bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border">
                {userRole}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
