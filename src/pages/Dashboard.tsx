import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users,
  BookOpen,
  Calendar,
  BarChart3,
  UserCheck,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Lightbulb,
  Bell,
  Building2,
  ClipboardCheck,
  UserPlus,
  TrendingUp,
  TrendingDown,
  FileText,
  UserX,
  AlertCircle,
  ArrowRight,
  Activity,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { api } from "@/lib/api";
import { DashboardLayout } from "@/components/DashboardLayout";

interface TrainingSuggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  officer_name?: string;
}

interface ActivityItem {
  id: string;
  type: "registration" | "approval" | "training" | "compliance" | "member";
  message: string;
  timestamp: Date;
  icon: typeof Building2;
  color: string;
}

interface ActionItem {
  id: string;
  type: "urgent" | "warning" | "info";
  title: string;
  description: string;
  count?: number;
  route: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem("userRole") || "officer";
  const [suggestions, setSuggestions] = useState<TrainingSuggestion[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  useEffect(() => {
    if (userRole === "administrator") {
      fetchSuggestions();
    }
  }, [userRole]);

  const fetchSuggestions = async () => {
    try {
      const { data, error } = await api.getTrainingSuggestions();
      if (error) throw error;
      const pendingSuggestions = (data || []).filter(
        (s: TrainingSuggestion) => s.status === "pending",
      );
      setPendingCount(pendingSuggestions.length);
      setSuggestions(pendingSuggestions.slice(0, 5));
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const stats = {
    totalOfficers: 145,
    compliantOfficers: 89,
    pendingTrainings: 12,
    upcomingEvents: 5,
    myCompliance: 75,
    totalCooperatives: 47,
    pendingRegistrations: 8,
    pendingMembers: 15,
    overdueCompliance: 6,
  };

  const monthlyRegistrationData = [
    { month: "Jul", thisYear: 12, lastYear: 8 },
    { month: "Aug", thisYear: 15, lastYear: 10 },
    { month: "Sep", thisYear: 18, lastYear: 12 },
    { month: "Oct", thisYear: 14, lastYear: 16 },
    { month: "Nov", thisYear: 22, lastYear: 14 },
    { month: "Dec", thisYear: 28, lastYear: 18 },
  ];

  const trainingAttendanceData = [
    { name: "Ethics", registered: 45, attended: 42 },
    { name: "Finance", registered: 38, attended: 35 },
    { name: "Leadership", registered: 52, attended: 48 },
    { name: "Governance", registered: 30, attended: 28 },
    { name: "Compliance", registered: 65, attended: 58 },
  ];

  const recentActivities: ActivityItem[] = [
    {
      id: "1",
      type: "registration",
      message: "Naga Farmers Cooperative submitted registration application",
      timestamp: new Date(Date.now() - 15 * 60000),
      icon: Building2,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      id: "2",
      type: "member",
      message: "Maria Santos joined Bicol Multi-Purpose Cooperative",
      timestamp: new Date(Date.now() - 45 * 60000),
      icon: UserPlus,
      color: "text-indigo-600 dark:text-indigo-400",
    },
    {
      id: "3",
      type: "training",
      message: "Financial Management Seminar completed with 38 attendees",
      timestamp: new Date(Date.now() - 2 * 3600000),
      icon: BookOpen,
      color: "text-teal-600 dark:text-teal-400",
    },
    {
      id: "4",
      type: "approval",
      message: "City Transport Cooperative registration approved",
      timestamp: new Date(Date.now() - 4 * 3600000),
      icon: CheckCircle,
      color: "text-green-600 dark:text-green-400",
    },
    {
      id: "5",
      type: "compliance",
      message: "Camarines Sur Producers Coop submitted Annual Report",
      timestamp: new Date(Date.now() - 6 * 3600000),
      icon: ClipboardCheck,
      color: "text-orange-600 dark:text-orange-400",
    },
    {
      id: "6",
      type: "member",
      message: "Juan dela Cruz membership application pending review",
      timestamp: new Date(Date.now() - 8 * 3600000),
      icon: User,
      color: "text-purple-600 dark:text-purple-400",
    },
    {
      id: "7",
      type: "training",
      message: "New training suggestion: Cooperative Marketing Strategies",
      timestamp: new Date(Date.now() - 12 * 3600000),
      icon: Lightbulb,
      color: "text-yellow-600 dark:text-yellow-400",
    },
    {
      id: "8",
      type: "registration",
      message: "Sorsogon Credit Cooperative requested document resubmission",
      timestamp: new Date(Date.now() - 24 * 3600000),
      icon: FileText,
      color: "text-amber-600 dark:text-amber-400",
    },
  ];

  const actionItems: ActionItem[] = [
    {
      id: "1",
      type: "urgent",
      title: "Overdue Compliance Records",
      description: "Cooperatives with overdue regulatory requirements",
      count: stats.overdueCompliance,
      route: "/regulatory-compliance",
    },
    {
      id: "2",
      type: "warning",
      title: "Pending Registrations",
      description: "Cooperative applications awaiting review",
      count: stats.pendingRegistrations,
      route: "/cooperative-registration",
    },
    {
      id: "3",
      type: "warning",
      title: "Pending Member Applications",
      description: "Membership applications requiring approval",
      count: stats.pendingMembers,
      route: "/membership-profiling",
    },
    {
      id: "4",
      type: "info",
      title: "Training Suggestions",
      description: "Officer-submitted training topic suggestions",
      count: pendingCount,
      route: "/training-suggestions",
    },
  ];

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getActionItemStyles = (type: string) => {
    switch (type) {
      case "urgent":
        return {
          bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
          icon: AlertCircle,
          iconColor: "text-red-600 dark:text-red-400",
          badgeColor: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        };
      case "warning":
        return {
          bg: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
          icon: AlertTriangle,
          iconColor: "text-yellow-600 dark:text-yellow-400",
          badgeColor: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        };
      default:
        return {
          bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
          icon: Bell,
          iconColor: "text-blue-600 dark:text-blue-400",
          badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        };
    }
  };

  const officerCards = [
    {
      title: "My Compliance Dashboard",
      description: "View your training compliance status and requirements",
      icon: User,
      route: "/officer-dashboard",
      stats: `${stats.myCompliance}% Complete`,
      color:
        stats.myCompliance >= 90
          ? "text-green-600 dark:text-green-400"
          : stats.myCompliance >= 50
            ? "text-yellow-600 dark:text-yellow-400"
            : "text-red-600 dark:text-red-400",
    },
    {
      title: "Available Trainings",
      description: "Browse available training events and register",
      icon: BookOpen,
      route: "/available-trainings",
      stats: `${stats.upcomingEvents} Available`,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "My Attendance",
      description: "View your training attendance history",
      icon: Calendar,
      route: "/my-attendance",
      stats: "View History",
      color: "text-purple-600 dark:text-purple-400",
    },
  ];

  if (userRole === "officer") {
    return (
      <DashboardLayout
        title="Officer Dashboard"
        description="Track your training progress and compliance requirements"
      >
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass-card">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {stats.myCompliance}%
                </div>
                <p className="text-sm text-muted-foreground">Compliance Rate</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">3</div>
                <p className="text-sm text-muted-foreground">Completed Trainings</p>
              </CardContent>
            </Card>
            <Card className="glass-card">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">2</div>
                <p className="text-sm text-muted-foreground">Missing Requirements</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {officerCards.map((card, index) => (
              <Card
                key={index}
                className="glass-card hover:shadow-soft transition-all duration-200 cursor-pointer"
                onClick={() => navigate(card.route)}
                data-testid={`card-module-${card.route.replace('/', '')}`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <card.icon className={`h-8 w-8 ${card.color}`} />
                    <Badge variant="secondary" className="text-xs">
                      {card.stats}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {card.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button className="w-full" variant="outline">
                    Access Module
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-sm font-medium">Completed: Ethics Training</p>
                    <p className="text-xs text-muted-foreground">Completed on Dec 1, 2023</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  <div>
                    <p className="text-sm font-medium">Pending: Financial Management Training</p>
                    <p className="text-xs text-muted-foreground">Deadline: Jan 15, 2024</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Administrator Dashboard"
      description="Manage cooperative training programs and monitor compliance"
    >
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Total Cooperatives</p>
                  <p className="text-2xl font-bold">{stats.totalCooperatives}</p>
                  <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <TrendingUp className="h-3 w-3" />
                    <span>+12% this month</span>
                  </div>
                </div>
                <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Total Officers</p>
                  <p className="text-2xl font-bold">{stats.totalOfficers}</p>
                  <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <TrendingUp className="h-3 w-3" />
                    <span>+8% this month</span>
                  </div>
                </div>
                <Users className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Compliant Officers</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.compliantOfficers}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((stats.compliantOfficers / stats.totalOfficers) * 100)}% compliance rate
                  </p>
                </div>
                <UserCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Upcoming Trainings</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {stats.upcomingEvents}
                  </p>
                  <p className="text-xs text-muted-foreground">This month</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="glass-card lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle className="text-base">Cooperative Registrations</CardTitle>
                  <CardDescription>Monthly comparison with previous year</CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +55% YoY
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyRegistrationData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" tick={{ fill: 'currentColor' }} />
                    <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="thisYear"
                      name="2024"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="lastYear"
                      name="2023"
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <CardTitle className="text-base">Action Required</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {actionItems.map((item) => {
                const styles = getActionItemStyles(item.type);
                const IconComponent = styles.icon;
                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors hover:shadow-sm ${styles.bg}`}
                    onClick={() => navigate(item.route)}
                    data-testid={`action-item-${item.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <IconComponent className={`h-5 w-5 mt-0.5 ${styles.iconColor}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-medium truncate">{item.title}</h4>
                          {item.count !== undefined && item.count > 0 && (
                            <Badge className={`text-xs ${styles.badgeColor}`}>
                              {item.count}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle className="text-base">Training Attendance</CardTitle>
                  <CardDescription>Registered vs. Actual Attendance</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trainingAttendanceData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" tick={{ fill: 'currentColor' }} />
                    <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="registered" name="Registered" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="attended" name="Attended" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle className="text-base">Recent Activity</CardTitle>
                  <CardDescription>Latest system events</CardDescription>
                </div>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-64 px-6">
                <div className="space-y-1 py-2">
                  {recentActivities.map((activity) => {
                    const IconComponent = activity.icon;
                    return (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        data-testid={`activity-item-${activity.id}`}
                      >
                        <div className={`mt-0.5 ${activity.color}`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{activity.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatTimeAgo(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card
            className="glass-card hover:shadow-soft transition-all cursor-pointer"
            onClick={() => navigate("/cooperative-registration")}
            data-testid="card-quick-cooperative"
          >
            <CardContent className="p-4 text-center">
              <Building2 className="h-8 w-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
              <p className="text-sm font-medium">Cooperatives</p>
              <p className="text-xs text-muted-foreground">Manage registrations</p>
            </CardContent>
          </Card>
          <Card
            className="glass-card hover:shadow-soft transition-all cursor-pointer"
            onClick={() => navigate("/membership-profiling")}
            data-testid="card-quick-members"
          >
            <CardContent className="p-4 text-center">
              <UserPlus className="h-8 w-8 mx-auto mb-2 text-indigo-600 dark:text-indigo-400" />
              <p className="text-sm font-medium">Members</p>
              <p className="text-xs text-muted-foreground">Profile management</p>
            </CardContent>
          </Card>
          <Card
            className="glass-card hover:shadow-soft transition-all cursor-pointer"
            onClick={() => navigate("/training-management")}
            data-testid="card-quick-trainings"
          >
            <CardContent className="p-4 text-center">
              <BookOpen className="h-8 w-8 mx-auto mb-2 text-teal-600 dark:text-teal-400" />
              <p className="text-sm font-medium">Trainings</p>
              <p className="text-xs text-muted-foreground">Manage events</p>
            </CardContent>
          </Card>
          <Card
            className="glass-card hover:shadow-soft transition-all cursor-pointer"
            onClick={() => navigate("/reports")}
            data-testid="card-quick-reports"
          >
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
              <p className="text-sm font-medium">Reports</p>
              <p className="text-xs text-muted-foreground">Analytics & insights</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
