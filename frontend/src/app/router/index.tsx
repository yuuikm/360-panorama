import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '../../pages/admin/LoginPage';
import { AdminLayout } from '../../pages/admin/AdminLayout';
import { DashboardPage } from '../../pages/admin/DashboardPage';
import { ObjectsPage } from '../../pages/admin/ObjectsPage';
import { ObjectDetailsPage } from '../../pages/admin/ObjectDetailsPage';
import { PanoramaEditorPage } from '../../pages/admin/PanoramaEditorPage';
import { PublicViewPage } from '../../pages/public-view/PublicViewPage';
import { ProtectedRoute } from '../../features/auth/ProtectedRoute';

export const router = createBrowserRouter([
  // Public View Route
  {
    path: '/view/:publicToken',
    element: <PublicViewPage />,
  },

  // Admin Auth Route
  {
    path: '/admin/login',
    element: <LoginPage />,
  },

  // Protected Panorama Editor (Full screen)
  {
    path: '/admin/objects/:id/panoramas/:panoramaId',
    element: (
      <ProtectedRoute>
        <PanoramaEditorPage />
      </ProtectedRoute>
    ),
  },

  // Protected Admin Routes with Layout
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'objects',
        element: <ObjectsPage />,
      },
      {
        path: 'objects/:id',
        element: <ObjectDetailsPage />,
      },
    ],
  },

  // Fallback
  {
    path: '*',
    element: <Navigate to="/admin" replace />,
  },
]);
