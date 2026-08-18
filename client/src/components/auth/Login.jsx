import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const [signUpData, setSignUpData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [signUpLoading, setSignUpLoading] = useState(false);
  const { register } = useAuth();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(email, password);
    if (result.success) {
      toast.success('Login successful!');
      navigate(result.data.role === 'admin' ? '/admin/dashboard' : '/user/dashboard');
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  const handleSignUpChange = (e) => {
    setSignUpData({ ...signUpData, [e.target.name]: e.target.value });
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    if (signUpData.password !== signUpData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (signUpData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSignUpLoading(true);
    const result = await register(signUpData.name, signUpData.email, signUpData.password);
    if (result.success) {
      toast.success('Registration successful!');
      navigate('/user/dashboard');
    } else {
      toast.error(result.message);
    }
    setSignUpLoading(false);
  };

  const toggleForm = () => {
    setIsSignUp(!isSignUp);
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        
        {/* ===== LEFT SIDE - Branding (Slides Right) ===== */}
        <div className={`login-branding ${isSignUp ? 'slide-right' : ''}`}>
          <div className="brand-content">
            <div className="brand-icon-wrapper">
              <i className="fa-solid fa-crosshairs"></i>
            </div>
            <h1 className="brand-title">LeadHunter</h1>
            <p className="brand-desc">
              Discover, capture, and convert leads with our intelligent platform.
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

        {/* ===== RIGHT SIDE - Forms (Slides Left) ===== */}
        <div className={`login-form-wrapper ${isSignUp ? 'slide-left' : ''}`}>
          <div className="login-card">
            
            {/* ===== LOGIN FORM ===== */}
            <div className={`form-panel ${isSignUp ? 'hidden' : 'active'}`}>
              <div className="form-header">
                <h2 className="form-title">Welcome Back</h2>
                <p className="form-subtitle">Sign in to your account</p>
              </div>
              
              <form onSubmit={handleLoginSubmit}>
                <div className="input-group">
                  <label>Email Address</label>
                  <div className="input-with-icon">
                    <i className="fa-solid fa-envelope"></i>
                    <input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required 
                      placeholder="Enter your email" 
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Password</label>
                  <div className="input-with-icon">
                    <i className="fa-solid fa-lock"></i>
                    <input 
                      type="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                      placeholder="Enter your password" 
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <div className="remember-me">
                    <input type="checkbox" id="remember" />
                    <label htmlFor="remember">Remember me</label>
                  </div>
                  <Link to="#" className="forgot-pass">Forgot Password?</Link>
                </div>

                <button type="submit" className="signin-btn" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="divider"><span>or continue with</span></div>

              <div className="social-buttons">
                <button type="button" className="social-btn google">
                  <i className="fa-brands fa-google"></i> Google
                </button>
                <button type="button" className="social-btn github">
                  <i className="fa-brands fa-github"></i> GitHub
                </button>
              </div>

              <p className="auth-link">
                Don't have an account?{' '}
                <span onClick={toggleForm} className="toggle-link">Create one</span>
              </p>
            </div>

            {/* ===== SIGN UP FORM ===== */}
            <div className={`form-panel signup-panel ${isSignUp ? 'active' : 'hidden'}`}>
              <div className="form-header">
                <h2 className="form-title">Create Account</h2>
                <p className="form-subtitle">Join LeadHunter today</p>
              </div>
              
              <form onSubmit={handleSignUpSubmit}>
                <div className="input-group">
                  <label>Full Name</label>
                  <div className="input-with-icon">
                    <i className="fa-solid fa-user"></i>
                    <input 
                      type="text" 
                      name="name"
                      value={signUpData.name} 
                      onChange={handleSignUpChange} 
                      required 
                      placeholder="Enter your full name" 
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Email Address</label>
                  <div className="input-with-icon">
                    <i className="fa-solid fa-envelope"></i>
                    <input 
                      type="email" 
                      name="email"
                      value={signUpData.email} 
                      onChange={handleSignUpChange} 
                      required 
                      placeholder="Enter your email" 
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Password</label>
                  <div className="input-with-icon">
                    <i className="fa-solid fa-lock"></i>
                    <input 
                      type="password" 
                      name="password"
                      value={signUpData.password} 
                      onChange={handleSignUpChange} 
                      required 
                      placeholder="Create a password" 
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Confirm Password</label>
                  <div className="input-with-icon">
                    <i className="fa-solid fa-lock"></i>
                    <input 
                      type="password" 
                      name="confirmPassword"
                      value={signUpData.confirmPassword} 
                      onChange={handleSignUpChange} 
                      required 
                      placeholder="Confirm your password" 
                    />
                  </div>
                </div>

                <button type="submit" className="signin-btn signup-btn" disabled={signUpLoading}>
                  {signUpLoading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>

              <p className="auth-link">
                Already have an account?{' '}
                <span onClick={toggleForm} className="toggle-link">Sign In</span>
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;