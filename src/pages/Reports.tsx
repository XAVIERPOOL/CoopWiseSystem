import { useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Download,
  Calendar,
  Users,
  TrendingUp,
  Award,
  FileText,
  BarChart3
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const overviewStats = {
    totalTrainings: 15,
    totalOfficers: 45,
    compliantOfficers: 32,
    upcomingTrainings: 5,
    completedThisMonth: 8,
    averageAttendance: 89
  };

  const trainingReports = [
    {
      id: 1,
      title: 'Financial Management Basics',
      date: '2024-01-15',
      attendees: 24,
      capacity: 30,
      completionRate: 80,
      status: 'completed'
    },
    {
      id: 2,
      title: 'Cooperative Governance',
      date: '2024-01-12',
      attendees: 45,
      capacity: 50,
      completionRate: 90,
      status: 'completed'
    },
    {
      id: 3,
      title: 'Digital Marketing for Coops',
      date: '2024-01-20',
      attendees: 18,
      capacity: 25,
      completionRate: 72,
      status: 'upcoming'
    }
  ];

  const complianceReports = [
    {
      cooperative: 'Naciatrasco Cooperative',
      totalOfficers: 12,
      compliant: 8,
      partiallyCompliant: 3,
      nonCompliant: 1,
      complianceRate: 67
    },
    {
      cooperative: 'Capatrasco Cooperative',
      totalOfficers: 15,
      compliant: 12,
      partiallyCompliant: 2,
      nonCompliant: 1,
      complianceRate: 80
    },
    {
      cooperative: 'Arise Cooperative',
      totalOfficers: 18,
      compliant: 15,
      partiallyCompliant: 2,
      nonCompliant: 1,
      complianceRate: 83
    }
  ];

  const handleExportReport = (reportType: string) => {
    toast({
      title: "Export Started",
      description: `${reportType} report is being prepared for download.`,
    });
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Trainings</p>
                <p className="text-3xl font-bold text-blue-600">{overviewStats.totalTrainings}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Officers</p>
                <p className="text-3xl font-bold text-green-600">{overviewStats.totalOfficers}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Compliant Officers</p>
                <p className="text-3xl font-bold text-purple-600">{overviewStats.compliantOfficers}</p>
              </div>
              <Award className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming Trainings</p>
                <p className="text-3xl font-bold text-orange-600">{overviewStats.upcomingTrainings}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed This Month</p>
                <p className="text-3xl font-bold text-red-600">{overviewStats.completedThisMonth}</p>
              </div>
              <FileText className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Attendance</p>
                <p className="text-3xl font-bold text-indigo-600">{overviewStats.averageAttendance}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overall Compliance Rate</CardTitle>
          <CardDescription>System-wide compliance across all cooperatives</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Overall Compliance</span>
              <span className="text-sm text-gray-600">71%</span>
            </div>
            <Progress value={71} className="h-3" />
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <p className="font-medium text-green-600">Compliant</p>
                <p className="text-gray-600">32 officers</p>
              </div>
              <div>
                <p className="font-medium text-yellow-600">Partial</p>
                <p className="text-gray-600">10 officers</p>
              </div>
              <div>
                <p className="font-medium text-red-600">Non-compliant</p>
                <p className="text-gray-600">3 officers</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderTrainingReports = () => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Training Attendance Reports</CardTitle>
            <CardDescription>Detailed attendance data for all training events</CardDescription>
          </div>
          <Button onClick={() => handleExportReport('Training Attendance')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Training Title</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Attendance</TableHead>
              <TableHead>Completion Rate</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trainingReports.map((training) => (
              <TableRow key={training.id}>
                <TableCell className="font-medium">{training.title}</TableCell>
                <TableCell>{new Date(training.date).toLocaleDateString()}</TableCell>
                <TableCell>{training.attendees}/{training.capacity}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Progress value={training.completionRate} className="h-2 w-16" />
                    <span className="text-sm">{training.completionRate}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={training.status === 'completed' ? 'default' : 'secondary'}>
                    {training.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderComplianceReports = () => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Cooperative Compliance Reports</CardTitle>
            <CardDescription>Compliance status breakdown by cooperative</CardDescription>
          </div>
          <Button onClick={() => handleExportReport('Compliance Status')}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cooperative</TableHead>
              <TableHead>Total Officers</TableHead>
              <TableHead>Compliant</TableHead>
              <TableHead>Partial</TableHead>
              <TableHead>Non-compliant</TableHead>
              <TableHead>Compliance Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {complianceReports.map((coop, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{coop.cooperative}</TableCell>
                <TableCell>{coop.totalOfficers}</TableCell>
                <TableCell className="text-green-600">{coop.compliant}</TableCell>
                <TableCell className="text-yellow-600">{coop.partiallyCompliant}</TableCell>
                <TableCell className="text-red-600">{coop.nonCompliant}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Progress value={coop.complianceRate} className="h-2 w-16" />
                    <span className="text-sm">{coop.complianceRate}%</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const reportSections = [
    { key: 'overview', label: 'Overview Dashboard', icon: BarChart3 },
    { key: 'training', label: 'Training Reports', icon: Calendar },
    { key: 'compliance', label: 'Compliance Reports', icon: Award },
  ];

  return (
    <DashboardLayout title="Reports & Analytics" description="Comprehensive reporting and analytics dashboard">
      <div className="p-6">
        <div className="flex space-x-4 mb-8">
          {reportSections.map((section) => (
            <Button
              key={section.key}
              variant={selectedReport === section.key ? "default" : "outline"}
              onClick={() => setSelectedReport(selectedReport === section.key ? null : section.key)}
              className="flex items-center space-x-2"
            >
              <section.icon className="h-4 w-4" />
              <span>{section.label}</span>
            </Button>
          ))}
        </div>

        <div className="space-y-6">
          {!selectedReport && renderOverview()}
          {selectedReport === 'overview' && renderOverview()}
          {selectedReport === 'training' && renderTrainingReports()}
          {selectedReport === 'compliance' && renderComplianceReports()}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;
