import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Award,
  Loader2
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AttendanceRecord {
  id: string;
  training_id: string;
  recorded_at: string;
  method: string;
  training: {
    id: string;
    title: string;
    date: string;
    venue: string;
    speaker: string;
    topic: string;
    status: string;
  };
}

const MyAttendance = () => {
  const navigate = useNavigate();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyAttendance();
  }, []);

  const loadMyAttendance = async () => {
    try {
      const mockAttendance: AttendanceRecord[] = [
        {
          id: '1',
          training_id: 'train-001',
          recorded_at: '2023-12-15T09:00:00Z',
          method: 'manual',
          training: {
            id: 'train-001',
            title: 'Cooperative Ethics Training',
            date: '2023-12-15',
            venue: 'Community Center Hall A',
            speaker: 'Dr. Maria Santos',
            topic: 'Ethics and Governance',
            status: 'completed'
          }
        },
        {
          id: '2',
          training_id: 'train-002',
          recorded_at: '2023-11-28T14:30:00Z',
          method: 'qr',
          training: {
            id: 'train-002',
            title: 'Financial Management Basics',
            date: '2023-11-28',
            venue: 'Training Room B',
            speaker: 'Prof. Juan dela Cruz',
            topic: 'Financial Management',
            status: 'completed'
          }
        },
        {
          id: '3',
          training_id: 'train-003',
          recorded_at: '2023-11-15T10:15:00Z',
          method: 'manual',
          training: {
            id: 'train-003',
            title: 'Member Relations Workshop',
            date: '2023-11-15',
            venue: 'Conference Room C',
            speaker: 'Ms. Ana Rodriguez',
            topic: 'Member Relations',
            status: 'completed'
          }
        }
      ];

      setAttendanceRecords(mockAttendance);
    } catch (error) {
      console.error('Error loading attendance:', error);
      toast({
        title: "Error",
        description: "Failed to load attendance records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getMethodBadge = (method: string) => {
    const methodConfig = {
      manual: { label: 'Manual', class: 'bg-blue-100 text-blue-800' },
      qr: { label: 'QR Code', class: 'bg-green-100 text-green-800' },
      nfc: { label: 'NFC', class: 'bg-purple-100 text-purple-800' },
      biometric: { label: 'Biometric', class: 'bg-orange-100 text-orange-800' }
    };
    
    const config = methodConfig[method as keyof typeof methodConfig] || methodConfig.manual;
    return (
      <Badge className={config.class}>
        {config.label}
      </Badge>
    );
  };

  return (
    <DashboardLayout title="My Attendance" description="View your training attendance history">
      <div className="p-6 max-w-4xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading attendance records...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">{attendanceRecords.length}</div>
                  <p className="text-sm text-gray-600">Trainings Attended</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">100%</div>
                  <p className="text-sm text-gray-600">Attendance Rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">3</div>
                  <p className="text-sm text-gray-600">Certificates Earned</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Completed Training Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                {attendanceRecords.length > 0 ? (
                  <div className="space-y-4">
                    {attendanceRecords.map((record) => (
                      <div key={record.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {record.training.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              Topic: {record.training.topic}
                            </p>
                            <p className="text-sm text-gray-600">
                              Speaker: {record.training.speaker}
                            </p>
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Attended
                            </Badge>
                            {getMethodBadge(record.method)}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            {new Date(record.training.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            {record.training.venue}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            {new Date(record.recorded_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Attendance Records</h3>
                    <p className="text-gray-600 mb-4">You haven't attended any trainings yet.</p>
                    <Button onClick={() => navigate('/available-trainings')}>
                      Browse Available Trainings
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => navigate('/available-trainings')} 
                className="flex-1"
              >
                <Users className="h-4 w-4 mr-2" />
                Browse Available Trainings
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/officer-dashboard')}
                className="flex-1"
              >
                View Compliance Dashboard
              </Button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyAttendance;
