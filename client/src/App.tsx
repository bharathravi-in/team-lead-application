import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import FeaturesPage from './pages/FeaturesPage';
import FeatureDetailPage from './pages/FeatureDetailPage';
import PeopleDirectoryPage from './pages/PeopleDirectoryPage';
import PlanningPage from './pages/PlanningPage';
import type { JSX } from 'react';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { token, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-slate-400 font-medium">
        Loading TechLead Hub...
      </div>
    );
  }
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/features" replace />} />
        <Route path="features" element={<FeaturesPage />} />
        <Route path="features/:id" element={<FeatureDetailPage />} />
        <Route path="planning" element={<PlanningPage />} />
        <Route path="people" element={<PeopleDirectoryPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster 
          position="top-right" 
          toastOptions={{
            style: {
              background: '#0f172a',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              fontSize: '13px',
            }
          }} 
        />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
