import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  User,
  Mail,
  Calendar,
  FileText,
  Edit,
  Building2,
  Users,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import EditOfficerDialog from '@/components/EditOfficerDialog';

interface Officer {
  id: number;
  name: string;
  email: string;
  cooperative: string;
  position: string;
  complianceRate: number;
  status: string;
  lastTraining: string;
  missingRequirements: string[];
  completedTrainings: number;
  requiredTrainings: number;
}

const ComplianceTracker = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);

  const [adminStats, setAdminStats] = useState({
    totalCooperatives: 0,
    totalOfficers: 0,
    compliantOfficers: 0,
    upcomingEvents: 0,
  });

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const { data, error } = await api.getAdminStats();
        if (!error && data) setAdminStats(data);
      } catch (error) {}
    };
    fetchAdminStats();
  }, []);

  const [officers, setOfficers] = useState<Officer[]>([
    {
      id: 1,
      name: 'Juan Miguel Santos',
      email: 'juan.santos@mmcoop.com',
      cooperative: 'Capatrasco Cooperative',
      position: 'Board Member',
      complianceRate: 95,
      status: 'compliant',
      lastTraining: '2024-01-10',
      missingRequirements: [],
      completedTrainings: 8,
      requiredTrainings: 8
    },
    {
      id: 2,
      name: 'Maria Elena Rodriguez',
      email: 'maria.rodriguez@nlcoop.com',
      cooperative: 'Naciatrasco Cooperative',
      position: 'Secretary',
      complianceRate: 60,
      status: 'partial',
      lastTraining: '2023-11-15',
      missingRequirements: ['Financial Management', 'Governance Training'],
      completedTrainings: 3,
      requiredTrainings: 5
    },
    {
      id: 3,
      name: 'Roberto Cruz',
      email: 'roberto.cruz@cviscoop.com',
      cooperative: 'Arise Cooperative',
      position: 'Treasurer',
      complianceRate: 25,
      status: 'non-compliant',
      lastTraining: '2023-08-20',
      missingRequirements: ['Financial Management', 'Audit Training', 'Risk Management'],
      completedTrainings: 1,
      requiredTrainings: 4
    },
    {
      id: 4,
      name: 'Ana Cristina Dela Cruz',
      email: 'ana.delacruz@mdcoop.com',
      cooperative: 'LigtasCab Cooperative',
      position: 'Chairman',
      complianceRate: 100,
      status: 'compliant',
      lastTraining: '2024-01-08',
      missingRequirements: [],
      completedTrainings: 6,
      requiredTrainings: 6
    },
    {
      id: 5,
      name: 'Carlos Antonio Reyes',
      email: 'carlos.reyes@stcoop.com',
      cooperative: 'NagaCityVet Cooperative',
      position: 'Board Member',
      complianceRate: 40,
      status: 'partial',
      lastTraining: '2023-12-01',
      missingRequirements: ['Governance Training', 'Ethics Training'],
      completedTrainings: 2,
      requiredTrainings: 5
    },
    {
      id: 6,
      name: 'Patricia Mae Villanueva',
      email: 'patricia.villanueva@bicol.coop',
      cooperative: 'Bicol Region Cooperative Union',
      position: 'Vice Chairman',
      complianceRate: 85,
      status: 'compliant',
      lastTraining: '2023-12-28',
      missingRequirements: ['Strategic Planning'],
      completedTrainings: 7,
      requiredTrainings: 8
    },
    {
      id: 7,
      name: 'Ferdinand Jose Aquino',
      email: 'ferdinand.aquino@ilocos.coop',
      cooperative: 'Calabanga Fishermen Cooperative',
      position: 'Auditor',
      complianceRate: 30,
      status: 'non-compliant',
      lastTraining: '2023-09-12',
      missingRequirements: ['Audit Training', 'Financial Management', 'Risk Management', 'Ethics Training'],
      completedTrainings: 2,
      requiredTrainings: 6
    },
    {
      id: 8,
      name: 'Rosario Carmen Bautista',
      email: 'rosario.bautista@pampanga.coop',
      cooperative: 'Naga Farmers Cooperative',
      position: 'Secretary',
      complianceRate: 75,
      status: 'partial',
      lastTraining: '2024-01-05',
      missingRequirements: ['Member Relations', 'Strategic Planning'],
      completedTrainings: 6,
      requiredTrainings: 8
    },
    {
      id: 9,
      name: 'Emmanuel David Santos',
      email: 'emmanuel.santos@cebu.coop',
      cooperative: 'Biggz Diner',
      position: 'Treasurer',
      complianceRate: 90,
      status: 'compliant',
      lastTraining: '2023-12-20',
      missingRequirements: ['Legal Compliance'],
      completedTrainings: 9,
      requiredTrainings: 10
    },
    {
      id: 10,
      name: 'Marilou Grace Fernandez',
      email: 'marilou.fernandez@davao.coop',
      cooperative: 'Magsaysay Transport Cooperative',
      position: 'Board Member',
      complianceRate: 50,
      status: 'partial',
      lastTraining: '2023-10-15',
      missingRequirements: ['Governance Training', 'Leadership Development', 'Cooperative Principles'],
      completedTrainings: 4,
      requiredTrainings: 8
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'non-compliant':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'partial':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'non-compliant':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const assignTraining = (officerId: number, officerName: string) => {
    toast({
      title: "Training Assigned",
      description: `Relevant training has been assigned to ${officerName}. They will receive a notification.`,
    });
  };

  const editOfficer = (officer: Officer) => {
    setSelectedOfficer(officer);
    setEditDialogOpen(true);
  };

  const handleSaveOfficer = (updatedOfficer: Officer) => {
    setOfficers(prevOfficers => 
      prevOfficers.map(officer => 
        officer.id === updatedOfficer.id ? updatedOfficer : officer
      )
    );
  };

  // UPDATED LOGIC HERE: Added .sort() to arrange by status
  const filteredOfficers = officers
    .filter(officer => {
      const matchesSearch = officer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           officer.cooperative.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || officer.status === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      const priority: Record<string, number> = {
        'compliant': 1,
        'partial': 2,
        'non-compliant': 3
      };
      
      const priorityA = priority[a.status] || 4;
      const priorityB = priority[b.status] || 4;
      
      return priorityA - priorityB;
    });

  const complianceStats = {
    total: officers.length,
    compliant: officers.filter(o => o.status === 'compliant').length,
    partial: officers.filter(o => o.status === 'partial').length,
    nonCompliant: officers.filter(o => o.status === 'non-compliant').length
  };

  return (
    <DashboardLayout title="Officer Compliance Tracker" description="Monitor and manage officer training compliance">
      <div className="p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
            <Card className="glass-card overflow-hidden border-none text-foreground relative shadow-lg group">
              <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full mix-blend-plus-lighter opacity-50 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              <div className="absolute -right-4 -top-4 opacity-[0.03] dark:opacity-[0.08] pointer-events-none group-hover:rotate-12 transition-transform duration-700">
                <Building2 className="h-40 w-40 text-blue-500" />
              </div>
              <CardContent className="p-6 relative z-10">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Cooperatives</p>
                  <p className="text-4xl font-extrabold tracking-tight mt-1 bg-gradient-to-br from-blue-400 to-blue-600 bg-clip-text text-transparent">
                    {adminStats.totalCooperatives}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card overflow-hidden border-none text-foreground relative shadow-lg group">
              <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full mix-blend-plus-lighter opacity-50 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              <div className="absolute -right-4 -top-4 opacity-[0.03] dark:opacity-[0.08] pointer-events-none group-hover:rotate-12 transition-transform duration-700">
                <Users className="h-40 w-40 text-indigo-500" />
              </div>
              <CardContent className="p-6 relative z-10">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Officers</p>
                  <p className="text-4xl font-extrabold tracking-tight mt-1 bg-gradient-to-br from-indigo-400 to-indigo-600 bg-clip-text text-transparent">
                    {adminStats.totalOfficers}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card overflow-hidden border-none text-foreground relative shadow-lg group">
              <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full mix-blend-plus-lighter opacity-50 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              <div className="absolute -right-4 -top-4 opacity-[0.03] dark:opacity-[0.08] pointer-events-none group-hover:rotate-12 transition-transform duration-700">
                <ShieldCheck className="h-40 w-40 text-emerald-500" />
              </div>
              <CardContent className="p-6 relative z-10">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Compliant Officers</p>
                  <div className="flex items-end justify-between mt-1">
                    <p className="text-4xl font-extrabold tracking-tight bg-gradient-to-br from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                      {adminStats.compliantOfficers}
                    </p>
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm font-semibold mb-1">
                      {adminStats.totalOfficers > 0 ? Math.round((adminStats.compliantOfficers / adminStats.totalOfficers) * 100) : 0}% 
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card overflow-hidden border-none text-foreground relative shadow-lg group">
              <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full mix-blend-plus-lighter opacity-50 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              <div className="absolute -right-4 -top-4 opacity-[0.03] dark:opacity-[0.08] pointer-events-none group-hover:rotate-12 transition-transform duration-700">
                <Calendar className="h-40 w-40 text-purple-500" />
              </div>
              <CardContent className="p-6 relative z-10">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Upcoming Trainings</p>
                  <p className="text-4xl font-extrabold tracking-tight mt-1 bg-gradient-to-br from-purple-400 to-purple-600 bg-clip-text text-transparent">
                    {adminStats.upcomingEvents}
                  </p>
                </div>
              </CardContent>
            </Card>
        </motion.div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search officers or cooperatives..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                {['all', 'compliant', 'partial', 'non-compliant'].map((status) => (
                  <Button
                    key={status}
                    variant={filterStatus === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus(status)}
                    className="capitalize"
                  >
                    {status === 'all' ? 'All' : status.replace('-', ' ')}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {filteredOfficers.map((officer) => (
            <Card key={officer.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-2">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          {officer.name}
                        </h3>
                        <p className="text-sm text-gray-600 flex items-center mt-1">
                          <Mail className="h-4 w-4 mr-2" />
                          {officer.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(officer.status)}>
                          {getStatusIcon(officer.status)}
                          <span className="ml-1 capitalize">{officer.status.replace('-', ' ')}</span>
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => editOfficer(officer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>Cooperative:</strong> {officer.cooperative}</p>
                      <p><strong>Position:</strong> {officer.position}</p>
                      <p className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <strong>Last Training:</strong> {new Date(officer.lastTraining).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Compliance Progress</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Overall Progress</span>
                        <span>{officer.complianceRate}%</span>
                      </div>
                      <Progress value={officer.complianceRate} className="h-2" />
                      <p className="text-xs text-gray-600">
                        {officer.completedTrainings}/{officer.requiredTrainings} trainings completed
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Missing Requirements</h4>
                    {officer.missingRequirements.length > 0 ? (
                      <div className="space-y-2">
                        {officer.missingRequirements.slice(0, 2).map((req, index) => (
                          <div key={index} className="flex items-center text-sm text-red-600">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {req}
                          </div>
                        ))}
                        {officer.missingRequirements.length > 2 && (
                          <p className="text-xs text-gray-600">
                            +{officer.missingRequirements.length - 2} more
                          </p>
                        )}
                        <Button 
                          size="sm" 
                          className="w-full mt-3"
                          onClick={() => assignTraining(officer.id, officer.name)}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Assign Training
                        </Button>
                      </div>
                    ) : (
                      <div className="text-sm text-green-600 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        All requirements met
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredOfficers.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No officers found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <EditOfficerDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        officer={selectedOfficer}
        onSave={handleSaveOfficer}
      />
    </DashboardLayout>
  );
};

export default ComplianceTracker;