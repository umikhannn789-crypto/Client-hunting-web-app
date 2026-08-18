import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './UserDashboard.css';

// ===== API BASE URL =====
const API_BASE = 'http://localhost:5002/api';

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [scraperResults, setScraperResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [scraperData, setScraperData] = useState({
    city: 'Lahore',
    country: 'Pakistan',
    businessType: 'IT Company',
    maxResults: 10
  });

  const { user, logout, token } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalLeads: 0,
    savedLeads: 0,
    cities: 0,
    emails: 0
  });

  // ===== EFFECTS =====
  useEffect(() => {
    fetchLeads();
  }, []);

  // ===== FETCH LEADS =====
  const fetchLeads = async () => {
    try {
      const response = await axios.get(`${API_BASE}/leads`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = response.data.data || [];
      setLeads(data);
      
      const saved = data.filter(l => l.isSaved);
      const cities = [...new Set(data.map(l => l.city).filter(Boolean))];
      const emails = data.filter(l => l.email).length;
      
      setStats({
        totalLeads: data.length,
        savedLeads: saved.length,
        cities: cities.length,
        emails: emails
      });
    } catch (error) {
      console.error('❌ Fetch Error:', error);
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  // ===== SCRAPER FUNCTIONS =====
  const handleScraperChange = (e) => {
    setScraperData({ ...scraperData, [e.target.name]: e.target.value });
  };

  const quickNiche = (niche) => {
    setScraperData({ ...scraperData, businessType: niche });
  };

  const runScraper = async () => {
    const { city, country, businessType, maxResults } = scraperData;
    
    if (!city || !businessType) {
      toast.error('City and Business Type are required');
      return;
    }

    setScraping(true);
    setScraperResults([]);
    toast.loading('🌐 Scraping Google Maps...');

    try {
      const response = await axios.post(`${API_BASE}/scraper/run`, {
        city,
        country,
        businessType,
        maxResults: parseInt(maxResults)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.dismiss();
        const scrapedLeads = response.data.leads || [];
        
        toast.loading(`💾 Saving ${scrapedLeads.length} leads...`);
        
        let savedCount = 0;
        for (let lead of scrapedLeads) {
          try {
            const saveRes = await axios.post(`${API_BASE}/leads`, lead, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (saveRes.data.success) savedCount++;
          } catch (e) {
            console.error("Save Error:", e);
          }
        }
        
        toast.dismiss();
        setScraperResults(scrapedLeads);
        toast.success(`✅ ${savedCount} leads saved to "My Leads"!`);
        fetchLeads();
        setActiveTab('leads');
      } else {
        toast.dismiss();
        toast.error(response.data.message || 'Scraper failed');
      }
    } catch (error) {
      toast.dismiss();
      console.error('❌ Scraper Error:', error);
      toast.error(error.response?.data?.message || 'Failed to scrape.');
    } finally {
      setScraping(false);
    }
  };

  // ===== LEAD FUNCTIONS =====
  const handleSaveLead = async (leadId) => {
    try {
      await axios.put(`${API_BASE}/leads/${leadId}/save`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('⭐ Lead saved!');
      fetchLeads();
    } catch (error) {
      toast.error('Failed to save');
    }
  };

  const handleUnsaveLead = async (leadId) => {
    try {
      await axios.put(`${API_BASE}/leads/${leadId}/unsave`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Lead unsaved');
      fetchLeads();
    } catch (error) {
      toast.error('Failed to unsave');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out');
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.body.classList.toggle('light-theme');
  };

  // ===== PASSWORD FUNCTIONS =====
  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      await axios.put(`${API_BASE}/auth/change-password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Password updated successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    }
  };

  // ===== DELETE ACCOUNT =====
  const handleDeleteAccount = async () => {
    if (!window.confirm('⚠️ Are you sure you want to delete your account? This action cannot be undone!')) {
      return;
    }
    if (!window.confirm('⚠️ All your leads and data will be permanently deleted. Are you sure?')) {
      return;
    }
    try {
      await axios.delete(`${API_BASE}/auth/delete-account`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Account deleted successfully');
      localStorage.removeItem('lh_token');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete account');
    }
  };

  // ===== FILTER & EXPORT =====
  const filteredLeads = leads.filter(lead =>
    lead.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportPDF = () => {
    if (leads.length === 0) {
      toast.error('No leads to export');
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('LeadHunter - Leads Report', 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total Leads: ${leads.length}`, 14, 36);

    const tableColumn = ["Company", "Industry", "City", "Phone", "Email"];
    const tableRows = [];

    leads.forEach(lead => {
      const leadData = [
        lead.companyName || 'N/A',
        lead.industry || 'N/A',
        lead.city || 'N/A',
        lead.phone || 'N/A',
        lead.email || 'N/A'
      ];
      tableRows.push(leadData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 42,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [124, 58, 237] }
    });

    doc.save('leads_export.pdf');
    toast.success(`📄 Exported ${leads.length} leads to PDF!`);
  };

  // ===== ANALYTICS DATA =====
  const getAnalyticsData = () => {
    const countryMap = {};
    leads.forEach(lead => {
      const country = lead.country || 'Unknown';
      countryMap[country] = (countryMap[country] || 0) + 1;
    });
    const countryData = Object.entries(countryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const industryMap = {};
    leads.forEach(lead => {
      const industry = lead.industry || 'Unknown';
      industryMap[industry] = (industryMap[industry] || 0) + 1;
    });
    const industryData = Object.entries(industryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const statusMap = {};
    leads.forEach(lead => {
      const status = lead.status || 'Unknown';
      statusMap[status] = (statusMap[status] || 0) + 1;
    });
    const statusData = Object.entries(statusMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const totalLeads = leads.length;
    const savedLeads = leads.filter(l => l.isSaved).length;

    return { countryData, industryData, statusData, totalLeads, savedLeads };
  };

  const analytics = getAnalyticsData();

  // ===== MODAL COMPONENT =====
  const LeadDetailModal = ({ lead, onClose }) => {
    if (!lead) return null;
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>×</button>
          <h2 className="modal-title"><i className="fa-solid fa-building"></i> {lead.companyName}</h2>
          <div className="modal-body">
            <div className="modal-row"><strong>Industry:</strong> {lead.industry || 'N/A'}</div>
            <div className="modal-row"><strong>Email:</strong> {lead.email || 'N/A'}</div>
            <div className="modal-row"><strong>Phone:</strong> {lead.phone || 'N/A'}</div>
            <div className="modal-row"><strong>Website:</strong> {lead.website ? <a href={lead.website} target="_blank" rel="noopener noreferrer">{lead.website}</a> : 'N/A'}</div>
            <div className="modal-row"><strong>Address:</strong> {lead.address || 'N/A'}</div>
            <div className="modal-row"><strong>City/Country:</strong> {lead.city || 'N/A'}, {lead.country || 'N/A'}</div>
            <div className="modal-row"><strong>Status:</strong> <span className={`status-badge ${lead.status}`}>{lead.status}</span></div>
          </div>
          <div className="modal-actions">
            {lead.isSaved ? (
              <button onClick={() => { handleUnsaveLead(lead._id); onClose(); }} className="unsave-btn">Unsave</button>
            ) : (
              <button onClick={() => { handleSaveLead(lead._id); onClose(); }} className="save-btn">Save</button>
            )}
            <button onClick={onClose} className="close-btn">Close</button>
          </div>
        </div>
      </div>
    );
  };

  // ===== NAV ITEMS (Without Badge) =====
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-solid fa-gauge-high' },
    { id: 'scraper', label: 'Lead Scraper', icon: 'fa-solid fa-magnifying-glass-location' },
    { id: 'leads', label: 'My Leads', icon: 'fa-solid fa-users' },
    { id: 'settings', label: 'Settings', icon: 'fa-solid fa-sliders' }
  ];

  // ===== RENDER =====
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className={`user-dashboard ${isDarkMode ? 'dark' : 'light'}`}>
      {selectedLead && <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} />}

      {/* ===== SIDEBAR ===== */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon"><i className="fa-solid fa-crosshairs"></i></div>
          <div className="brand-text"><h2>LeadHunter</h2><span>Pro</span></div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button 
              key={item.id} 
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`} 
              onClick={() => setActiveTab(item.id)}
            >
              <i className={item.icon}></i>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar">{user?.name?.charAt(0) || 'U'}</div>
            <div className="user-details">
              <p className="name">{user?.name || 'User'}</p>
              <p className="role">{user?.role || 'User'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn"><i className="fa-solid fa-power-off"></i></button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="main-content">
        <header className="main-header">
          <div className="header-left">
            <h1>{navItems.find(item => item.id === activeTab)?.label || 'Dashboard'}</h1>
            <p className="subtitle">
              {activeTab === 'dashboard' && `Welcome back, ${user?.name}!`}
              {activeTab === 'scraper' && '🌍 Find business leads from any country on Google Maps'}
              {activeTab === 'leads' && `📋 You have ${leads.filter(l => l.isSaved).length} saved leads`}
              {activeTab === 'settings' && '⚙️ Manage your account settings'}
            </p>
          </div>
          <div className="header-right">
            <button onClick={toggleTheme} className="theme-btn">
              <i className={`fa-solid ${isDarkMode ? 'fa-moon' : 'fa-sun'}`}></i>
            </button>
          </div>
        </header>

        {/* ===== DASHBOARD TAB ===== */}
        {activeTab === 'dashboard' && (
          <div className="tab-content">
            <div className="dashboard-hero">
              <div className="hero-content">
                <div className="hero-greeting">
                  <span className="status-dot"></span>
                  <h1>Welcome back, {user?.name || 'User'}! 👋</h1>
                </div>
                <p className="hero-subtitle">Here's what's happening with your lead generation today.</p>
                <div className="hero-actions">
                  <button className="hero-btn-primary" onClick={() => setActiveTab('scraper')}>
                    <i className="fa-solid fa-rocket"></i> Start Scraping
                  </button>
                </div>
              </div>
              <div className="hero-illustration">
                <div className="illustration-circle"><i className="fa-solid fa-chart-simple"></i></div>
              </div>
            </div>
            <div className="stats-grid">
              <div className="stat-card glass-effect gradient-purple">
                <div className="stat-icon"><i className="fa-solid fa-database"></i></div>
                <div className="stat-info">
                  <h3>{stats.totalLeads}</h3>
                  <p>Total Leads Found</p>
                </div>
              </div>
              <div className="stat-card glass-effect gradient-gold">
                <div className="stat-icon"><i className="fa-solid fa-bookmark"></i></div>
                <div className="stat-info">
                  <h3>{stats.savedLeads}</h3>
                  <p>Saved Leads</p>
                </div>
              </div>
              <div className="stat-card glass-effect gradient-teal">
                <div className="stat-icon"><i className="fa-solid fa-city"></i></div>
                <div className="stat-info">
                  <h3>{stats.cities}</h3>
                  <p>Cities Covered</p>
                </div>
              </div>
              <div className="stat-card glass-effect gradient-pink">
                <div className="stat-icon"><i className="fa-solid fa-envelope"></i></div>
                <div className="stat-info">
                  <h3>{stats.emails}</h3>
                  <p>Emails Harvested</p>
                </div>
              </div>
            </div>
            <div className="recent-section">
              <div className="section-header">
                <h2>📊 Recent Leads Activity</h2>
                <button className="view-all-btn" onClick={() => setActiveTab('leads')}>View All <i className="fa-solid fa-arrow-right"></i></button>
              </div>
              <div className="recent-grid">
                {leads.slice(0, 6).map(lead => (
                  <div key={lead._id} className="recent-card-modern" onClick={() => setSelectedLead(lead)}>
                    <div className="card-top">
                      <div className="company-icon-box"><i className="fa-solid fa-building"></i></div>
                      <span className={`status-badge ${lead.status}`}>{lead.status}</span>
                    </div>
                    <div className="card-body">
                      <h4>{lead.companyName}</h4>
                      <div className="card-meta">
                        <span><i className="fa-solid fa-tag"></i> {lead.industry || 'N/A'}</span>
                        <span><i className="fa-solid fa-location-dot"></i> {lead.city || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {leads.length === 0 && (
                  <div className="empty-state-wide">
                    <i className="fa-solid fa-inbox"></i>
                    <p>No leads yet. <span onClick={() => setActiveTab('scraper')} className="link-text">Run the scraper</span> to get started!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===== SCRAPER TAB ===== */}
        {activeTab === 'scraper' && (
          <div className="tab-content scraper-tab">
            <div className="scraper-container">
              <div className="scraper-config">
                <h3>🌍 Scraper Config</h3>
                <p className="config-subtitle">Enter any city and country to find business leads</p>
                <div className="form-group">
                  <label>City *</label>
                  <input type="text" name="city" value={scraperData.city} onChange={handleScraperChange} placeholder="e.g., Lahore, Dubai" />
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <input type="text" name="country" value={scraperData.country} onChange={handleScraperChange} placeholder="e.g., Pakistan, UK" />
                </div>
                <div className="form-group">
                  <label>Business Type *</label>
                  <input type="text" name="businessType" value={scraperData.businessType} onChange={handleScraperChange} placeholder="e.g., IT Company, Clinic" />
                </div>
                <div className="form-group">
                  <label>Max Results</label>
                  <input type="number" name="maxResults" value={scraperData.maxResults} onChange={handleScraperChange} min="5" max="50" />
                </div>
                <div className="quick-niches">
                  <span>Quick:</span>
                  {['Dental Clinic', 'IT Company', 'Restaurant', 'Law Firm', 'Hotel', 'Hospital'].map(niche => (
                    <button key={niche} onClick={() => quickNiche(niche)} className="niche-btn">{niche}</button>
                  ))}
                </div>
                <button onClick={runScraper} className="scraper-btn" disabled={scraping}>
                  {scraping ? <><i className="fa-solid fa-spinner fa-spin"></i> Scraping...</> : <><i className="fa-solid fa-play"></i> Run Scraper</>}
                </button>
              </div>
              <div className="scraper-results">
                <div className="results-header">
                  <h3><i className="fa-solid fa-list-ul"></i> Live Results</h3>
                  <span className="result-count">{scraperResults.length} leads found</span>
                </div>
                <div className="results-list">
                  {scraperResults.length === 0 ? (
                    <div className="empty-results">
                      <div className="empty-icon-wrapper"><i className="fa-solid fa-map-location-dot"></i></div>
                      <p>Ready to discover new opportunities!</p>
                      <p className="hint">Configure your search and hit <strong>"Run Scraper"</strong></p>
                    </div>
                  ) : (
                    scraperResults.map((lead, index) => (
                      <div key={index} className="result-item professional-card">
                        <div className="result-info">
                          <div className="card-title-row">
                            <div className="icon-box"><i className="fa-solid fa-building"></i></div>
                            <h4>{lead.companyName || 'Unknown Business'}{lead.rating && <span className="rating-tag">⭐ {lead.rating}</span>}</h4>
                          </div>
                          {(lead.address || lead.city) && (
                            <div className="data-row">
                              <i className="fa-solid fa-location-dot location-icon"></i>
                              <p className="address-text">{lead.address || ''}{lead.address && lead.city ? ', ' : ''}{lead.city || ''}{lead.country ? `, ${lead.country}` : ''}</p>
                            </div>
                          )}
                          <div className="contact-info-grid">
                            {lead.phone && (
                              <div className="data-row">
                                <i className="fa-solid fa-phone contact-icon"></i>
                                <span className="contact-text">{lead.phone}</span>
                              </div>
                            )}
                            {lead.website && (
                              <div className="data-row">
                                <i className="fa-solid fa-globe contact-icon"></i>
                                <a href={lead.website} target="_blank" rel="noopener noreferrer" className="website-link">{lead.website}</a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== MY LEADS TAB ===== */}
        {activeTab === 'leads' && (
          <div className="tab-content leads-tab">
            <div className="leads-header">
              <div className="leads-search">
                <i className="fa-solid fa-search"></i>
                <input 
                  type="text" 
                  placeholder="Search leads by name, industry, or city..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
              </div>
              <div className="leads-actions">
                <span className="leads-count">
                  <i className="fa-solid fa-users"></i> {leads.filter(l => l.isSaved).length} Saved Leads
                </span>
                <button onClick={exportPDF} className="export-btn">
                  <i className="fa-solid fa-file-pdf"></i> Export PDF
                </button>
              </div>
            </div>
            <div className="leads-grid">
              {filteredLeads.length === 0 ? (
                <div className="empty-state">
                  <i className="fa-solid fa-inbox"></i>
                  <p>No leads found</p>
                  <button onClick={() => setActiveTab('scraper')} className="primary-btn">
                    Go to Scraper
                  </button>
                </div>
              ) : (
                filteredLeads.map(lead => (
                  <div key={lead._id} className="lead-card clickable" onClick={() => setSelectedLead(lead)}>
                    <div className="lead-card-header">
                      <h3>
                        {lead.companyName || 'Unknown'}
                        {lead.rating && <span className="rating-badge">⭐ {lead.rating}</span>}
                      </h3>
                      <span className={`status-badge ${lead.status || 'new'}`}>
                        {lead.status || 'New'}
                      </span>
                    </div>
                    <div className="lead-card-body">
                      {lead.industry && <p><i className="fa-solid fa-tag"></i> {lead.industry}</p>}
                      {lead.address && <p><i className="fa-solid fa-location-dot"></i> {lead.address}</p>}
                      {lead.city && <p><i className="fa-solid fa-city"></i> {lead.city}{lead.country ? `, ${lead.country}` : ''}</p>}
                      {lead.phone && <p><i className="fa-solid fa-phone"></i> {lead.phone}</p>}
                      {lead.email && <p><i className="fa-solid fa-envelope"></i> {lead.email}</p>}
                      {lead.website && (
                        <p className="website-row">
                          <i className="fa-solid fa-globe"></i> 
                          <a href={lead.website} target="_blank" rel="noopener noreferrer" className="clean-link">
                            Visit Website
                          </a>
                        </p>
                      )}
                    </div>
                    <div className="lead-card-actions">
                      {lead.isSaved ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleUnsaveLead(lead._id); }} 
                          className="unsave-btn"
                        >
                          <i className="fa-solid fa-bookmark"></i> Saved
                        </button>
                      ) : (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleSaveLead(lead._id); }} 
                          className="save-btn"
                        >
                          <i className="fa-regular fa-bookmark"></i> Save
                        </button>
                      )}
                      <span className="click-hint">
                        <i className="fa-solid fa-arrow-up-right-from-square"></i> Click to view
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ===== SETTINGS TAB ===== */}
        {activeTab === 'settings' && (
          <div className="tab-content settings-tab">
            <div className="settings-container">
              <h2>⚙️ Account Settings</h2>
              <p className="settings-subtitle">Manage your account security</p>

              <div className="settings-grid">
                <div className="settings-card">
                  <h3><i className="fa-solid fa-user-circle"></i> Profile Information</h3>
                  <div className="settings-field">
                    <label>Full Name</label>
                    <input type="text" value={user?.name || 'User'} disabled className="disabled-input" />
                  </div>
                  <div className="settings-field">
                    <label>Email Address</label>
                    <input type="email" value={user?.email || 'user@example.com'} disabled className="disabled-input" />
                  </div>
                  <div className="settings-field">
                    <label>Account Role</label>
                    <input type="text" value={user?.role || 'User'} disabled className="disabled-input" />
                  </div>
                  <div className="settings-field">
                    <label>Account Status</label>
                    <span className="status-badge-active"><i className="fa-solid fa-circle-check"></i> Active</span>
                  </div>
                </div>

                <div className="settings-card">
                  <h3><i className="fa-solid fa-key"></i> Change Password</h3>
                  <form onSubmit={handleUpdatePassword}>
                    <div className="settings-field">
                      <label>Current Password</label>
                      <input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} placeholder="Enter current password" required />
                    </div>
                    <div className="settings-field">
                      <label>New Password</label>
                      <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} placeholder="Enter new password (min 6 chars)" required />
                    </div>
                    <div className="settings-field">
                      <label>Confirm New Password</label>
                      <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} placeholder="Confirm new password" required />
                    </div>
                    <button type="submit" className="settings-save-btn">
                      <i className="fa-solid fa-save"></i> Update Password
                    </button>
                  </form>
                </div>
              </div>

              <div className="settings-card danger-zone full-width">
                <h3><i className="fa-solid fa-triangle-exclamation"></i> Delete Account</h3>
                <p className="danger-text">⚠️ Permanently delete your account and all associated data. This action cannot be undone.</p>
                <button onClick={handleDeleteAccount} className="danger-btn">
                  <i className="fa-solid fa-trash-can"></i> Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default UserDashboard;