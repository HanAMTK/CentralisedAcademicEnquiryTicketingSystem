import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

function App() {
  return (
    <BrowserRouter>
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
            path="/lecturer/ticket/:id"
            element={
              <ProtectedRoute allowedRoles={["lecturer"]}>
                <LecturerTicketDetail />
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;