import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrainingSuggestionDialog } from '@/components/TrainingSuggestionDialog';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Mail,
  Calendar,
  FileText,
  Lightbulb,
  Plus,
  Upload,
  File,
  Loader2,
  ClipboardCheck
} from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
// Updating the Officer Name to allign with the DATABASE CHANGES //
interface Officer {
  id: number;
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  cooperative: string;
  cooperative_id?: string;
  position: string;
  complianceRate: number;
  status: string;
  lastTraining: string;
  missingRequirements: string[];
  completedTrainings: number;
  requiredTrainings: number;
}

const REQUIRED_DOCUMENTS = [
  'Annual Report',
  'Audited Financial Statements',
  'Certificate of Compliance'
];

const OfficerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [currentOfficer, setCurrentOfficer] = useState<Officer | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [submittedDocs, setSubmittedDocs] = useState<string[]>([]);

  // Define mandatory trainings based on roles
  const roleRequirements: Record<string, string[]> = {
    'President': ['Leadership Development', 'Governance Training', 'Strategic Planning'],
    'Vice President': ['Leadership Development', 'Governance Training'],
    'Secretary': ['Governance Training', 'Record Management'],
    'Treasurer': ['Financial Management', 'Governance Training'],
    'Auditor': ['Audit Training', 'Financial Management', 'Risk Management', 'Ethics Training'],
    'Board Member': ['Governance Training', 'Ethics Training', 'Cooperative Principles'],
    'Representative': ['Member Relations', 'Cooperative Principles'],
    'Regular Member': ['Cooperative Principles']
  };

  useEffect(() => {
    const fetchOfficerData = async () => {
      setLoading(true);
      try {
        const userName = localStorage.getItem('userName') || '';
        const userEmail = userName ? `${userName}@coopwise.com` : 'officer@coopwise.com';

        // 1. Fetch Member Profile
        const membersRes = await api.getMembers();
        let matchedMember = null;
        if (membersRes.data) {
          // In a real app, you'd match by user ID. For now, we try to match by email or just take a default officer role
          matchedMember = membersRes.data.find((m: any) => m.email === userEmail || m.email === 'maria.rodriguez@nlcoop.com');
        }

        if (!matchedMember) {
          // Fallback if no specific member found in DB for the login
          matchedMember = {
            id: '2',
            first_name: userName.split('.')[0] || 'Maria',
            middle_name: 'Elena',
            last_name: userName.split('.')[1] || 'Rodriguez',
            email: userEmail,
            cooperative_name: 'Northern Luzon Cooperative',
            role: 'Secretary'
          };
        }

        // 2. Fetch Training Registrations
        const regsRes = await api.getTrainingRegistrations();
        const myRegistrations = (regsRes.data || []).filter((r: any) => r.officer_id === localStorage.getItem('userId') || r.officer_id === '33333333-3333-3333-3333-333333333333');
        const completedTrainingsCount = myRegistrations.filter((r: any) => r.status === 'attended' || r.status === 'completed').length;

        // Ensure we handle completed training names if the API returned joined tables (mocking for now if missing)
        const completedTrainingNames = myRegistrations.map((r: any) => r.training?.topic || 'General Training');

        const role = matchedMember.role || 'Regular Member';
        const required = roleRequirements[role] || roleRequirements['Regular Member'];

        // Determine what is still missing
        const missing = required.filter(req => !completedTrainingNames.some((completed: string) => completed.includes(req) || req.includes(completed)));

        const complianceRate = Math.round(((required.length - missing.length) / required.length) * 100) || 0;

        let status = 'non-compliant';
        if (complianceRate === 100) status = 'compliant';
        else if (complianceRate >= 50) status = 'partial';

        setCurrentOfficer({
          id: matchedMember.id,
          first_name: matchedMember.first_name,
          middle_name: matchedMember.middle_name,
          last_name: matchedMember.last_name,
          email: matchedMember.email,
          cooperative: matchedMember.cooperative_name || matchedMember.cooperative,
          cooperative_id: matchedMember.cooperative_id || 'b096da52-5165-48d1-a48b-10dc992ad8b8', // Valid UUID
          position: role,
          complianceRate,
          status,
          lastTraining: myRegistrations.length > 0 ? myRegistrations[0].created_at : '2023-11-15', // Mocking last training date based on newest reg
          missingRequirements: missing,
          completedTrainings: required.length - missing.length,
          requiredTrainings: required.length
        });

      } catch (error) {
        console.error("Error fetching officer data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOfficerData();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docName: string) => {
    const file = e.target.files?.[0];
    if (!file || !currentOfficer) return;

    setUploadingDoc(docName);
    try {
      const { error } = await api.createComplianceRecord({
        cooperative_id: currentOfficer.cooperative_id || 'b096da52-5165-48d1-a48b-10dc992ad8b8',
        requirement_type: 'Regulatory',
        requirement_name: docName,
        description: `Uploaded by ${displayFullName}`,
        file: file
      });

      if (error) throw error;

      toast({
        title: "Document Uploaded",
        description: `${docName} has been submitted for review.`
      });

      setSubmittedDocs(prev => [...prev, docName]);
    } catch (err) {
      console.error("Upload error:", err);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your document.",
        variant: "destructive"
      });
    } finally {
      setUploadingDoc(null);
      // Reset input
      e.target.value = '';
    }
  };

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
  if (loading || !currentOfficer) {
    return (
      <DashboardLayout title="My Compliance Dashboard" description="View your training compliance status">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
          <span className="text-lg text-gray-600">Loading compliance data...</span>
        </div>
      </DashboardLayout>
    );
  }

  //Helper to display full name//
  const displayFullName = `${currentOfficer.first_name} ${currentOfficer.middle_name ? currentOfficer.middle_name + ' ' : ''}${currentOfficer.last_name}`;

  return (
    <DashboardLayout title="My Compliance Dashboard" description="View your training compliance status">
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4 md:space-y-6">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  {/* Displaying the full name in first name middle name last name order */}
                  <h2 className="text-2xl font-bold text-gray-900">{displayFullName}</h2>
                  <p className="text-gray-600 flex items-center mt-1">
                    <Mail className="h-4 w-4 mr-2" />
                    {currentOfficer.email}
                  </p>
                </div>
              </div>
              <Badge className={getStatusColor(currentOfficer.status)}>
                {getStatusIcon(currentOfficer.status)}
                <span className="ml-1 capitalize">{currentOfficer.status.replace('-', ' ')}</span>
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <p><strong>Cooperative:</strong> {currentOfficer.cooperative}</p>
              <p><strong>Position:</strong> {currentOfficer.position}</p>
              <p className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                <strong>Last Training:</strong> {new Date(currentOfficer.lastTraining).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-1">{currentOfficer.complianceRate}%</div>
              <p className="text-sm text-gray-600">Overall Compliance</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">{currentOfficer.completedTrainings}</div>
              <p className="text-sm text-gray-600">Completed Trainings</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 text-center">
              <div className="text-3xl font-bold text-red-600 mb-1">{currentOfficer.missingRequirements.length}</div>
              <p className="text-sm text-gray-600">Missing</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <div className="flex flex-col gap-4 md:gap-6">
            <Card>
              <CardContent className="p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Training Progress</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Completion Progress</span>
                    <span className="text-sm text-gray-600">{currentOfficer.completedTrainings}/{currentOfficer.requiredTrainings}</span>
                  </div>
                  <Progress value={currentOfficer.complianceRate} className="h-3" />
                  <p className="text-xs text-gray-600">
                    You have completed {currentOfficer.completedTrainings} out of {currentOfficer.requiredTrainings} required trainings
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Lightbulb className="h-5 w-5 text-blue-500 mr-2" />
                  Suggest a Training
                </h3>
                <p className="text-gray-600 mb-3 text-sm">
                  Have a training topic in mind that would benefit your cooperative?
                </p>
                <TrainingSuggestionDialog>
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Submit Suggestion
                  </Button>
                </TrainingSuggestionDialog>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-4 md:gap-6">
            {/* --- NEW REGULATORY COMPLIANCE UPLOAD MODULE --- */}
            <Card className="border-blue-100 bg-blue-50/30 flex-1">
              <CardContent className="p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <ClipboardCheck className="h-5 w-5 text-blue-600 mr-2" />
                  Regulatory Compliance Documents
                </h3>
                <p className="text-gray-600 mb-4 text-sm">
                  Please upload your cooperative's mandatory annual requirements below.
                </p>

                <div className="space-y-3">
                  {REQUIRED_DOCUMENTS.map((doc, idx) => {
                    const isSubmitted = submittedDocs.includes(doc);

                    return (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm gap-4">
                        <div className="flex items-start">
                          <File className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900">{doc}</p>
                            <p className="text-xs text-gray-500">Required annually</p>
                          </div>
                        </div>

                        <div className="flex items-center min-w-[120px] justify-end">
                          {isSubmitted ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" /> Submitted
                            </Badge>
                          ) : (
                            <div className="relative">
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                onChange={(e) => handleFileUpload(e, doc)}
                                disabled={uploadingDoc === doc}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full sm:w-auto"
                                disabled={uploadingDoc === doc}
                              >
                                {uploadingDoc === doc ? (
                                  <><Loader2 className="h-3 w-3 mr-2 animate-spin" /> Uploading...</>
                                ) : (
                                  <><Upload className="h-3 w-3 mr-2" /> Upload PDF</>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {currentOfficer.missingRequirements.length > 0 ? (
          <Card>
            <CardContent className="p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                Missing Requirements
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentOfficer.missingRequirements.map((requirement, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center truncate mr-2">
                      <FileText className="h-4 w-4 text-red-600 mr-2 shrink-0" />
                      <span className="text-sm font-medium text-red-800 truncate">{requirement}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 shrink-0"
                      onClick={() => navigate('/available-trainings')}
                    >
                      Find
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-center text-center sm:text-left gap-4">
              <CheckCircle className="h-10 w-10 text-green-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">All Requirements Complete!</h3>
                <p className="text-sm text-gray-600">Congratulations! You have met all your training requirements.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default OfficerDashboard;
