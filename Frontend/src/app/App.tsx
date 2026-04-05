import { useEffect, useState } from 'react';
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

type Page = 'landing' | 'dashboard' | 'hospital' | 'waste' | 'ngo' | 'admin' | 'login' | 'signup' | 'pending';

const ALL_PAGES: Page[] = ['landing', 'dashboard', 'hospital', 'waste', 'ngo', 'admin', 'login', 'signup', 'pending'];
const PROTECTED_PAGES: Page[] = ['dashboard', 'hospital', 'waste', 'ngo', 'admin', 'pending'];

const isPage = (page: string): page is Page => ALL_PAGES.includes(page as Page);

const getRoleHomePage = (role: UserRole): Page => {
  if (role === 'retailer') {
    return 'dashboard';
  }

  if (role === 'hospital') {
    return 'hospital';
  }

  if (role === 'ngo') {
    return 'ngo';
  }

  if (role === 'waste') {
    return 'waste';
  }

  return 'admin';
};

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [signupRole, setSignupRole] = useState<UserRole | null>(null);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated && PROTECTED_PAGES.includes(currentPage)) {
      setCurrentPage('login');
      return;
    }

    if (!isAuthenticated || !user) {
      return;
    }

    const roleHomePage = getRoleHomePage(user.role);
    const allowedPages = new Set<Page>([roleHomePage]);

    if (user.role === 'admin') {
      allowedPages.add('pending');
    }

    if (PROTECTED_PAGES.includes(currentPage) && !allowedPages.has(currentPage)) {
      setCurrentPage(roleHomePage);
    }
  }, [currentPage, isAuthenticated, user]);

  const handleNavigate = (page: string) => {
    const targetPage = isPage(page) ? page : user ? getRoleHomePage(user.role) : 'landing';

    if (!isAuthenticated || !user) {
      setCurrentPage(PROTECTED_PAGES.includes(targetPage) ? 'login' : targetPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const roleHomePage = getRoleHomePage(user.role);
    const allowedPages = new Set<Page>([roleHomePage]);

    if (user.role === 'admin') {
      allowedPages.add('pending');
    }

    setCurrentPage(allowedPages.has(targetPage) ? targetPage : roleHomePage);
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