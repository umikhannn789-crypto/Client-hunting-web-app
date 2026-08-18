import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const result = await register(formData.name, formData.email, formData.password);
    if (result.success) {
      toast.success('Registration successful!');
      navigate('/user/dashboard');
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        
        {/* LEFT SIDE - Branding */}
        <div className="login-branding register-branding">
          <div className="brand-content">
            <div className="brand-icon-wrapper">
              <i className="fa-solid fa-crosshairs"></i>
            </div>
            <h1 className="brand-title">LeadHunter</h1>
            <p className="brand-desc">
              Join Lead Hunter today and unlock the power of global lead generation.
              Find high-quality business leads from any country effortlessly.
            </p>
            <div className="brand-features">
              <span><i className="fa-solid fa-check"></i> Smart Lead Generation</span>
              <span><i className="fa-solid fa-check"></i> Real-time Analytics</span>
              <span><i className="fa-solid fa-check"></i> Automated Scraping</span>
            </div>
          </div>
          <div className="deco-ring deco-ring-1"></div>
          <div className="deco-ring deco-ring-2"></div>
          <div className="deco-ring deco-ring-3"></div>
        </div>

        {/* RIGHT SIDE - Register Form */}
        <div className="login-form-wrapper register-wrapper">
          <div className="login-card register-card">
            <div className="form-header">
              <h2 className="form-title">Create Account</h2>
              <p className="form-subtitle">Join Lead Hunter and start generating leads today.</p>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Full Name</label>
                <div className="input-with-icon">
                  <i className="fa-solid fa-user"></i>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Enter your full name" />
                </div>
              </div>
              <div className="input-group">
                <label>Email Address</label>
                <div className="input-with-icon">
                  <i className="fa-solid fa-envelope"></i>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="Enter your email" />
                </div>
              </div>
              <div className="input-group">
                <label>Password</label>
                <div className="input-with-icon">
                  <i className="fa-solid fa-lock"></i>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Create a password" />
                </div>
              </div>
              <div className="input-group">
                <label>Confirm Password</label>
                <div className="input-with-icon">
                  <i className="fa-solid fa-lock"></i>
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required placeholder="Confirm your password" />
                </div>
              </div>
              <button type="submit" className="signin-btn signup-btn" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
            <div className="divider"><span>or continue with</span></div>
            <div className="social-buttons">
              <button type="button" className="social-btn google"><i className="fa-brands fa-google"></i> Google</button>
              <button type="button" className="social-btn github"><i className="fa-brands fa-github"></i> GitHub</button>
            </div>
            <p className="auth-link">Already have an account? <Link to="/login" className="toggle-link">Sign In</Link></p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Register;