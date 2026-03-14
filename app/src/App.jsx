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
import LecturerPortalHome from "./pages/LecturerPortal/Home.jsx";

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

          {/* Protected routes — Lecturer */}
          <Route
            path="/lecturer"
            element={
              <ProtectedRoute allowedRoles={["lecturer"]}>
                <LecturerPortalHome />
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