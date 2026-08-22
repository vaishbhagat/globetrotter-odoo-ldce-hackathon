import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { Sidebar } from '../components/Sidebar';
import { AuthPage } from '../pages/AuthPage';
import { DashboardPage } from '../pages/DashboardPage';
import { TripsListPage } from '../pages/TripsListPage';
import { TripCreatorPage } from '../pages/TripCreatorPage';
import { ItineraryBuilderPage } from '../pages/ItineraryBuilderPage';
import { TimelinePage } from '../pages/TimelinePage';
import { BudgetPage } from '../pages/BudgetPage';
import { ExplorePage } from '../pages/ExplorePage';
import { ProfilePage } from '../pages/ProfilePage';
import { SharedTripPage } from '../pages/SharedTripPage';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { AdminRoute } from '../components/AdminRoute';

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export function Router() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/shared/:slug" element={<SharedTripPage />} />

          {/* Protected routes with Sidebar layout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DashboardPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/trips"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <TripsListPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/trips/new"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <TripCreatorPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/trips/:id/builder"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ItineraryBuilderPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/trips/:id/timeline"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <TimelinePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/trips/:id/budget"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <BudgetPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/explore"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ExplorePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <ProfilePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AppLayout>
                  <AdminDashboardPage />
                </AppLayout>
              </AdminRoute>
            }
          />

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
