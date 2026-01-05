import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { EnrollmentWithCompanionDialog } from '@/components/EnrollmentWithCompanionDialog';
import { 
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  Loader2
} from 'lucide-react';

interface Training {
  id: string;
  training_id: string;
  title: string;
  topic: string;
  date: string;
  start_date: string;
  end_date: string | null;
  time: string;
  venue: string;
  speaker: string;
  capacity: number;
  status: string;
}

const AvailableTrainings = () => {
  const { toast } = useToast();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [enrolledTrainings, setEnrolledTrainings] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  const getCurrentUserId = () => {
    const userName = localStorage.getItem('userName') || 'officer.two';
    const userIdMap: { [key: string]: string } = {
      'officer.one': '22222222-2222-2222-2222-222222222222',
      'officer.two': '33333333-3333-3333-3333-333333333333',
      'officer.three': '44444444-4444-4444-4444-444444444444',
      'officer.four': '55555555-5555-5555-5555-555555555555'
    };
    return userIdMap[userName] || '33333333-3333-3333-3333-333333333333';
  };

  const loadTrainings = async () => {
    try {
      const { data, error } = await api.getTrainings();

      if (error) throw error;
      
      const availableTrainings = (data || []).filter(
        (t: Training) => t.status === 'upcoming' || t.status === 'ongoing'
      );
      setTrainings(availableTrainings);
    } catch (error) {
      console.error('Error loading trainings:', error);
      toast({
        title: "Error",
        description: "Failed to load available trainings",
        variant: "destructive",
      });
    }
  };

  const loadEnrolledTrainings = async () => {
    try {
      const currentUserId = getCurrentUserId();
      const { data, error } = await api.getTrainingRegistrations();

      if (error) throw error;
      
      const myRegistrations = (data || []).filter(
        (reg: any) => reg.officer_id === currentUserId
      );
      const enrolledIds = new Set(myRegistrations.map((reg: any) => reg.training_id));
      setEnrolledTrainings(enrolledIds);
    } catch (error) {
      console.error('Error loading enrolled trainings:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadTrainings(), loadEnrolledTrainings()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout title="Available Trainings" description="Browse and register for training events">
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading available trainings...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trainings
                .filter((training) => !enrolledTrainings.has(training.id))
                .map((training) => {
                  const isEnrolling = enrollingId === training.id;
                  
                  return (
                    <Card key={training.id} className="h-full flex flex-col">
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg line-clamp-2">{training.title}</CardTitle>
                          <Badge className={getStatusColor(training.status)}>
                            {training.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{training.topic}</p>
                      </CardHeader>
                      
                      <CardContent className="flex-1 flex flex-col">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            {new Date(training.start_date).toLocaleDateString()}
                            {training.end_date && training.end_date !== training.start_date && 
                              ` - ${new Date(training.end_date).toLocaleDateString()}`}
                          </div>
                          
                          {training.time && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="h-4 w-4 mr-2" />
                              {training.time}
                            </div>
                          )}
                          
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2" />
                            {training.venue}
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600">
                            <User className="h-4 w-4 mr-2" />
                            {training.speaker}
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600">
                            <Users className="h-4 w-4 mr-2" />
                            Capacity: {training.capacity}
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t">
                          <EnrollmentWithCompanionDialog 
                            training={training}
                            onEnrollmentSuccess={() => {
                              setEnrolledTrainings(prev => new Set([...prev, training.id]));
                              loadEnrolledTrainings();
                              loadTrainings();
                            }}
                          >
                            <Button 
                              disabled={isEnrolling}
                              className="w-full"
                              data-testid={`button-enroll-${training.id}`}
                            >
                              {isEnrolling ? 'Enrolling...' : 'Enroll Now'}
                            </Button>
                          </EnrollmentWithCompanionDialog>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
            
            {trainings.filter((training) => !enrolledTrainings.has(training.id)).length === 0 && (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Available Trainings</h3>
                <p className="text-gray-600">
                  {trainings.length === 0 
                    ? "There are currently no upcoming trainings available for enrollment."
                    : "You are already enrolled in all available trainings."}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AvailableTrainings;
