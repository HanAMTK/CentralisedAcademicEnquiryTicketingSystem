import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Auth pages
import Login from "./pages/Auth/Login.jsx";
import ChangePassword from "./pages/Auth/ChangePassword.jsx";
import ForgotPassword from "./pages/Auth/ForgotPassword.jsx";
import ResetPassword from "./pages/Auth/ResetPassword.jsx";

// Portal pages
import StudentPortalHome from "./pages/StudentPortal/Home.jsx";
import CreateTicket from "./pages/StudentPortal/CreateTicket.jsx";
import ViewAllTickets from "./pages/StudentPortal/ViewAllTickets.jsx";
import TicketDetail from "./pages/StudentPortal/TicketDetail.jsx";
import LecturerPortalHome from "./pages/LecturerPortal/Home.jsx";
import LecturerTicketDetail from "./pages/LecturerPortal/TicketDetail.jsx";
import LecturerDashboard from "./pages/LecturerPortal/Dashboard.jsx";
import Profile from "./pages/Shared/Profile.jsx";

// Admin pages
import AdminHome from "./pages/AdminPortal/Dashboard.jsx";
import AdminAnalytics from "./pages/AdminPortal/Analytics.jsx";
import AdminUserManagement from "./pages/AdminPortal/UserManagement.jsx";
import AdminModuleManagement from "./pages/AdminPortal/ModuleManagement.jsx";

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/change-password" element={<ChangePassword />} />

        {/* Protected routes — Student */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <StudentPortalHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/create"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <CreateTicket />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/tickets"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <ViewAllTickets />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/ticket/:id"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <TicketDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/profile"
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <Profile portal="student" />
            </ProtectedRoute>
          }
        />

        {/* Protected routes — Lecturer */}
        <Route
          path="/lecturer"
          element={
            <ProtectedRoute allowedRoles={["lecturer"]}>
              <LecturerPortalHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lecturer/dashboard"
          element={
            <ProtectedRoute allowedRoles={["lecturer"]}>
              <LecturerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lecturer/ticket/:id"
          element={
            <ProtectedRoute allowedRoles={["lecturer"]}>
              <LecturerTicketDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lecturer/profile"
          element={
            <ProtectedRoute allowedRoles={["lecturer"]}>
              <Profile portal="lecturer" />
            </ProtectedRoute>
          }
        />

        {/* Protected routes — Admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminUserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/modules"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminModuleManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Profile portal="admin" />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;