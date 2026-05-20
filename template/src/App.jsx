import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AppAuthProvider, useAppAuth } from '@/lib/authContext.jsx';

import Login from '@/pages/Login';
import HomePage from '@/pages/HomePage';
import Emergencies from '@/pages/Emergencies';
import EmergencyDetail from '@/pages/EmergencyDetail';
import ReportEmergency from '@/pages/ReportEmergency';
import Events from '@/pages/Events';
import EventDetail from '@/pages/EventDetail';
import Responders from '@/pages/Responders';
import Profile from '@/pages/Profile';
import AppLayout from '@/components/layout/AppLayout';

const AuthenticatedApp = () => {
  const { currentUser, isLoading } = useAppAuth();

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <Login />} />
      
      {currentUser ? (
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/emergencies" element={<Emergencies />} />
          <Route path="/emergency/:id" element={<EmergencyDetail />} />
          <Route path="/report-emergency" element={<ReportEmergency />} />
          <Route path="/events" element={<Events />} />
          <Route path="/event/:id" element={<EventDetail />} />
          <Route path="/responders" element={<Responders />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
      
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AppAuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AppAuthProvider>
  );
}

export default App