import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "@/react-app/hooks/useAuth";
import Header from "@/react-app/components/Header";
import Dashboard from "@/react-app/pages/Dashboard";
import Employees from "@/react-app/pages/Employees";
import Attendance from "@/react-app/pages/Attendance";
import ProtectedRoute from "@/react-app/components/ProtectedRoute";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/*" element={
              <ProtectedRoute>
                <Header />
                <main>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/employees" element={<Employees />} />
                    <Route path="/attendance" element={<Attendance />} />
                  </Routes>
                </main>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}
