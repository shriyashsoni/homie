import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AppShell from '../components/layout/AppShell';

// Lazy-loaded pages
import Landing from '../pages/Landing';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import VerifyEmail from '../pages/auth/VerifyEmail';

import OnboardingIntent from '../pages/onboarding/Intent';
import OnboardingEssentials from '../pages/onboarding/Essentials';
import OnboardingQuiz from '../pages/onboarding/Quiz';
import OnboardingReview from '../pages/onboarding/Review';

import Dashboard from '../pages/Dashboard';
import Discover from '../pages/Discover';
import ListingsBrowse from '../pages/listings/Browse';
import ListingDetail from '../pages/listings/Detail';
import ListingCreate from '../pages/listings/Create';
import ListingEdit from '../pages/listings/Edit';
import MyListings from '../pages/listings/Mine';

import ProfileView from '../pages/profile/View';
import ProfileEdit from '../pages/profile/Edit';

import Connections from '../pages/Connections';
import Conversation from '../pages/Conversation';
import Viewings from '../pages/Viewings';
import Notifications from '../pages/Notifications';
import Settings from '../pages/Settings';

import AdminLayout from '../pages/admin/AdminLayout';
import AdminDashboard from '../pages/admin/Dashboard';
import AdminUsers from '../pages/admin/Users';
import AdminListings from '../pages/admin/Listings';
import AdminReports from '../pages/admin/Reports';

import NotFound from '../pages/NotFound';

function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

function AdminRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return (user?.isAdmin) ? <Outlet /> : <Navigate to="/dashboard" replace />;
}

function GuestRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? <Outlet /> : <Navigate to="/dashboard" replace />;
}

export const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  {
    element: <GuestRoute />,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
      { path: '/forgot-password', element: <ForgotPassword /> },
      { path: '/reset-password', element: <ResetPassword /> },
    ],
  },
  { path: '/verify-email', element: <VerifyEmail /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/onboarding',
        children: [
          { path: 'intent', element: <OnboardingIntent /> },
          { path: 'essentials', element: <OnboardingEssentials /> },
          { path: 'quiz', element: <OnboardingQuiz /> },
          { path: 'review', element: <OnboardingReview /> },
        ],
      },
      {
        element: <AppShell />,
        children: [
          { path: '/dashboard', element: <Dashboard /> },
          { path: '/discover', element: <Discover /> },
          { path: '/listings', element: <ListingsBrowse /> },
          { path: '/listings/create', element: <ListingCreate /> },
          { path: '/listings/mine', element: <MyListings /> },
          { path: '/listings/:id', element: <ListingDetail /> },
          { path: '/listings/:id/edit', element: <ListingEdit /> },
          { path: '/profile', element: <ProfileView /> },
          { path: '/profile/edit', element: <ProfileEdit /> },
          { path: '/profile/:id', element: <ProfileView /> },
          { path: '/connections', element: <Connections /> },
          { path: '/conversations/:id', element: <Conversation /> },
          { path: '/viewings', element: <Viewings /> },
          { path: '/notifications', element: <Notifications /> },
          { path: '/settings', element: <Settings /> },
        ],
      },
      {
        element: <AdminRoute />,
        children: [
          {
            path: '/admin',
            element: <AdminLayout />,
            children: [
              { index: true, element: <AdminDashboard /> },
              { path: 'users', element: <AdminUsers /> },
              { path: 'listings', element: <AdminListings /> },
              { path: 'reports', element: <AdminReports /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFound /> },
]);
