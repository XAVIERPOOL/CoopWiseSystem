import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CooperativeRegistration from "./pages/CooperativeRegistration";
import MembershipProfiling from "./pages/MembershipProfiling";
import TrainingManagement from "./pages/TrainingManagement";
import RegulatoryCompliance from "./pages/RegulatoryCompliance";
import ComplianceTracker from "./pages/ComplianceTracker";
import Attendance from "./pages/Attendance";
import MyAttendance from "./pages/MyAttendance";
import TrainingSuggestions from "./pages/TrainingSuggestions";
import Reports from "./pages/Reports";
import AvailableTrainings from "./pages/AvailableTrainings";
import OfficerDashboard from "./pages/OfficerDashboard";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";
import SystemLogs from "C:/Users/XAVIER/Documents/CoopWiseSystem/src/pages/SystemLogs"; // <--- IMPORT THIS

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Admin & Head Modules */}
          <Route path="/cooperative-registration" element={<CooperativeRegistration />} />
          <Route path="/membership-profiling" element={<MembershipProfiling />} />
          <Route path="/training-management" element={<TrainingManagement />} />
          <Route path="/regulatory-compliance" element={<RegulatoryCompliance />} />
          <Route path="/compliance-tracker" element={<ComplianceTracker />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/training-suggestions" element={<TrainingSuggestions />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/logs" element={<SystemLogs />} /> {/* <--- ADD THIS ROUTE */}
          
          {/* Officer Modules */}
          <Route path="/officer-dashboard" element={<OfficerDashboard />} />
          <Route path="/available-trainings" element={<AvailableTrainings />} />
          <Route path="/my-attendance" element={<MyAttendance />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;