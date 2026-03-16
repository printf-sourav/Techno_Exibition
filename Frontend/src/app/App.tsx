import { useState } from 'react';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth, UserRole } from './context/AuthContext';
import { LandingPage } from './components/LandingPage';
import { DashboardPage } from './components/DashboardPage';
import { HospitalMarketplace } from './components/HospitalMarketplace';
import { WasteDisposal } from './components/WasteDisposal';
import { NGODashboard } from './components/NGODashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';
import { PendingApprovalPage } from './components/auth/PendingApprovalPage';
import { Navigation } from './components/Navigation';

type Page = 'landing' | 'dashboard' | 'hospital' | 'waste' | 'ngo' | 'admin' | 'login' | 'signup' | 'pending';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [signupRole, setSignupRole] = useState<UserRole | null>(null);
  const { user } = useAuth();

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSignup = (role: UserRole) => {
    setSignupRole(role);
    setCurrentPage('signup');
  };

  return (
    <div className="min-h-screen">
      <Toaster position="top-right" richColors />
      {currentPage === 'landing' && <LandingPage onNavigate={handleNavigate} />}
      {currentPage === 'login' && <LoginPage onNavigate={handleNavigate} onSignup={handleSignup} />}
      {currentPage === 'signup' && signupRole && (
        <SignupPage role={signupRole} onNavigate={handleNavigate} onBack={() => setCurrentPage('login')} />
      )}
      {currentPage === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
      {currentPage === 'hospital' && <HospitalMarketplace onNavigate={handleNavigate} />}
      {currentPage === 'waste' && <WasteDisposal onNavigate={handleNavigate} />}
      {currentPage === 'ngo' && <NGODashboard onNavigate={handleNavigate} />}
      {currentPage === 'admin' && <AdminDashboard onNavigate={handleNavigate} />}
      {currentPage === 'pending' && <PendingApprovalPage onNavigate={handleNavigate} />}
      {currentPage !== 'landing' && currentPage !== 'login' && currentPage !== 'signup' && currentPage !== 'pending' && (
        <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}