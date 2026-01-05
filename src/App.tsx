import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import TrainingManagement from "./pages/TrainingManagement";
import ComplianceTracker from "./pages/ComplianceTracker";
import OfficerDashboard from "./pages/OfficerDashboard";
import AvailableTrainings from "./pages/AvailableTrainings";
import Attendance from "./pages/Attendance";
import MyAttendance from "./pages/MyAttendance";
import Reports from "./pages/Reports";
import TrainingSuggestions from "./pages/TrainingSuggestions";
import CooperativeRegistration from "./pages/CooperativeRegistration";
import MembershipProfiling from "./pages/MembershipProfiling";
import RegulatoryCompliance from "./pages/RegulatoryCompliance";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/training-management" element={<TrainingManagement />} />
          <Route path="/compliance-tracker" element={<ComplianceTracker />} />
          <Route path="/officer-dashboard" element={<OfficerDashboard />} />
          <Route path="/available-trainings" element={<AvailableTrainings />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/my-attendance" element={<MyAttendance />} />
          <Route path="/reports" element={<Reports />} />
          <Route
            path="/training-suggestions"
            element={<TrainingSuggestions />}
          />
          <Route path="/cooperative-registration" element={<CooperativeRegistration />} />
          <Route path="/membership-profiling" element={<MembershipProfiling />} />
          <Route path="/regulatory-compliance" element={<RegulatoryCompliance />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
