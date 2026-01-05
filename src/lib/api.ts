// Switched to a custom wrapper since we moved away from the direct Supabase client.
// Note: Make sure the proxy is configured in vite.config.ts for local dev, otherwise this 404s.
const API_BASE_URL = '/api';

interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

class ApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  // Profiles
  async getProfiles() {
    return this.request<any[]>('/profiles');
  }

  async getProfile(id: string) {
    return this.request<any>(`/profiles/${id}`);
  }

  // Trainings
  async getTrainings() {
    return this.request<any[]>('/trainings');
  }

  async getTrainingsWithMetrics() {
    return this.request<any[]>('/trainings/with-metrics');
  }

  async getTraining(id: string) {
    return this.request<any>(`/trainings/${id}`);
  }

  async createTraining(training: any) {
    return this.request<any>('/trainings', {
      method: 'POST',
      body: JSON.stringify(training),
    });
  }

  async updateTraining(id: string, training: any) {
    return this.request<any>(`/trainings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(training),
    });
  }

  async deleteTraining(id: string) {
    return this.request<any>(`/trainings/${id}`, {
      method: 'DELETE',
    });
  }

  // Training Registrations
  async getTrainingRegistrations() {
    return this.request<any[]>('/training-registrations');
  }

  async getTrainingRegistrationsByTraining(trainingId: string) {
    return this.request<any[]>(`/training-registrations/training/${trainingId}`);
  }

  async createTrainingRegistration(registration: { training_id: string; officer_id: string }) {
    return this.request<any>('/training-registrations', {
      method: 'POST',
      body: JSON.stringify(registration),
    });
  }

  async enrollWithCompanions(enrollment: {
    training_id: string;
    officer_id: string;
    companions?: Array<{ name: string; email: string; phone?: string; position?: string }>;
  }) {
    return this.request<any>('/training-registrations/enroll-with-companions', {
      method: 'POST',
      body: JSON.stringify(enrollment),
    });
  }

  // Attendance
  async getAttendance() {
    return this.request<any[]>('/attendance');
  }

  async getAttendanceByOfficer(officerId: string) {
    return this.request<any[]>(`/attendance/officer/${officerId}`);
  }

  async recordAttendance(attendance: {
    officer_id: string;
    training_id: string;
    recorded_by: string;
    method: string;
    check_in_time?: string;
  }) {
    return this.request<any>('/attendance', {
      method: 'POST',
      body: JSON.stringify(attendance),
    });
  }

  // Companion Registrations
  async getCompanionRegistrations() {
    return this.request<any[]>('/companion-registrations');
  }

  async getCompanionRegistrationsByTraining(trainingId: string) {
    return this.request<any[]>(`/companion-registrations/training/${trainingId}`);
  }

  async createCompanionRegistration(companion: {
    training_id: string;
    officer_id: string;
    companion_name: string;
    companion_email: string;
    companion_phone?: string;
    companion_position?: string;
  }) {
    return this.request<any>('/companion-registrations', {
      method: 'POST',
      body: JSON.stringify(companion),
    });
  }

  // Training Suggestions
  async getTrainingSuggestions() {
    return this.request<any[]>('/training-suggestions');
  }

  async createTrainingSuggestion(suggestion: {
    title: string;
    description: string;
    category: string;
    preferred_date?: string;
    justification?: string;
    priority: string;
    officer_id: string;
  }) {
    return this.request<any>('/training-suggestions', {
      method: 'POST',
      body: JSON.stringify(suggestion),
    });
  }

  async updateSuggestionStatus(id: string, status: 'pending' | 'approved' | 'implemented' | 'rejected') {
    return this.request<any>(`/training-suggestions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async implementSuggestion(id: string, trainingDetails?: {
    venue?: string;
    speaker?: string;
    capacity?: number;
    start_date?: string;
    end_date?: string;
    time?: string;
  }) {
    return this.request<any>(`/training-suggestions/${id}/implement`, {
      method: 'POST',
      body: JSON.stringify(trainingDetails || {}),
    });
  }

  // ===== COOPERATIVES (Module 1: Cooperative Registration) =====
  async getCooperatives(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request<any[]>(`/cooperatives${query}`);
  }

  async getCooperativesSummary() {
    return this.request<any>('/cooperatives/summary');
  }

  async getCooperative(id: string) {
    return this.request<any>(`/cooperatives/${id}`);
  }

  async createCooperative(cooperative: {
    name: string;
    type?: string;
    address?: string;
    city?: string;
    province?: string;
    region?: string;
    registration_number?: string;
    cda_registration_date?: string;
    tin?: string;
    contact_person?: string;
    contact_email?: string;
    contact_phone?: string;
    submitted_documents?: any[];
  }) {
    return this.request<any>('/cooperatives', {
      method: 'POST',
      body: JSON.stringify(cooperative),
    });
  }

  async updateCooperative(id: string, cooperative: any) {
    return this.request<any>(`/cooperatives/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cooperative),
    });
  }

  async updateCooperativeStatus(id: string, data: {
    status: 'pending' | 'approved' | 'rejected' | 'needs_resubmission';
    review_notes?: string;
    reviewed_by?: string;
  }) {
    return this.request<any>(`/cooperatives/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCooperative(id: string) {
    return this.request<any>(`/cooperatives/${id}`, {
      method: 'DELETE',
    });
  }

  // ===== MEMBERS (Module 2: Membership Profiling) =====
  async getMembers(params?: { status?: string; cooperative_id?: string }) {
    const queryParts = [];
    if (params?.status) queryParts.push(`status=${params.status}`);
    if (params?.cooperative_id) queryParts.push(`cooperative_id=${params.cooperative_id}`);
    const query = queryParts.length ? `?${queryParts.join('&')}` : '';
    return this.request<any[]>(`/members${query}`);
  }

  async getMembersSummary() {
    return this.request<any>('/members/summary');
  }

  async getMember(id: string) {
    return this.request<any>(`/members/${id}`);
  }

  async createMember(member: {
    cooperative_id?: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    suffix?: string;
    date_of_birth?: string;
    gender?: string;
    civil_status?: string;
    address?: string;
    city?: string;
    province?: string;
    email?: string;
    phone?: string;
    occupation?: string;
    tin?: string;
    photo_url?: string;
    documents?: any[];
  }) {
    return this.request<any>('/members', {
      method: 'POST',
      body: JSON.stringify(member),
    });
  }

  async updateMember(id: string, member: any) {
    return this.request<any>(`/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(member),
    });
  }

  async updateMemberStatus(id: string, data: {
    status: 'pending' | 'approved' | 'rejected';
    review_notes?: string;
    reviewed_by?: string;
    membership_date?: string;
  }) {
    return this.request<any>(`/members/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteMember(id: string) {
    return this.request<any>(`/members/${id}`, {
      method: 'DELETE',
    });
  }

  // ===== COMPLIANCE (Module 4: Regulatory Compliance Monitoring) =====
  async getComplianceRecords(params?: { status?: string; cooperative_id?: string; year?: number }) {
    const queryParts = [];
    if (params?.status) queryParts.push(`status=${params.status}`);
    if (params?.cooperative_id) queryParts.push(`cooperative_id=${params.cooperative_id}`);
    if (params?.year) queryParts.push(`year=${params.year}`);
    const query = queryParts.length ? `?${queryParts.join('&')}` : '';
    return this.request<any[]>(`/compliance${query}`);
  }

  async getComplianceSummary() {
    return this.request<any>('/compliance/summary');
  }

  async getCooperativeCompliance(cooperativeId: string) {
    return this.request<any[]>(`/compliance/cooperative/${cooperativeId}`);
  }

  async getComplianceRecord(id: string) {
    return this.request<any>(`/compliance/${id}`);
  }

  async createComplianceRecord(record: {
    cooperative_id: string;
    requirement_type: string;
    requirement_name: string;
    description?: string;
    due_date?: string;
    year?: number;
    documents?: any[];
  }) {
    return this.request<any>('/compliance', {
      method: 'POST',
      body: JSON.stringify(record),
    });
  }

  async updateComplianceRecord(id: string, record: any) {
    return this.request<any>(`/compliance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(record),
    });
  }

  async updateComplianceStatus(id: string, data: {
    status: 'pending' | 'submitted' | 'compliant' | 'non_compliant' | 'overdue';
    reviewer_notes?: string;
    reviewed_by?: string;
    submitted_date?: string;
  }) {
    return this.request<any>(`/compliance/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteComplianceRecord(id: string) {
    return this.request<any>(`/compliance/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();
