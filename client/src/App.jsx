import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// === PATH FIXES (Aapke exact folder structure ke hisaab se) ===
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import UserDashboard from './pages/user/UserDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
// ==============================================================

// Optional: Agar aapke paas PrivateRoute hai toh usko import kar lein
// import PrivateRoute from './components/common/PrivateRoute';

function App() {
  return (
    <Router>
      {/* AuthProvider MUST be INSIDE Router */}
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/user/dashboard" element={<UserDashboard />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          {/* Default route */}
          <Route path="/" element={<Login />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;