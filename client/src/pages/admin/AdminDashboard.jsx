import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const { logout, token, user } = useAuth();
  const navigate = useNavigate();

  // ===== STATE FOR LIVE DATA =====
  const [stats, setStats] = useState({ 
    totalUsers: 0, 
    totalLeads: 0, 
    totalSavedLeads: 0,
    totalCountries: 0,
    totalIndustries: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [recentLeads, setRecentLeads] = useState([]);
  
  const [users, setUsers] = useState([]);
  const [usersSearch, setUsersSearch] = useState('');
  
  const [leads, setLeads] = useState([]);
  const [leadsSearch, setLeadsSearch] = useState('');
  
  const [settings, setSettings] = useState({ 
    currentPassword: '', 
    newPassword: '', 
    confirmPassword: '' 
  });

  // ===== API BASE URL =====
  const API_BASE = 'http://localhost:5002/api';

  // ===== FETCH ALL DATA =====
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchDashboardData(),
      fetchUsers(),
      fetchLeads()
    ]);
    setLoading(false);
  };

  // ===== FETCH DASHBOARD STATS (LIVE DATA) =====
  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = response.data.data;
      setStats({
        totalUsers: data.stats.totalUsers || 0,
        totalLeads: data.stats.totalLeads || 0,
        totalSavedLeads: data.stats.totalSavedLeads || 0,
        totalCountries: data.stats.totalCountries || 0,
        totalIndustries: data.stats.totalIndustries || 0
      });
      
      setRecentUsers(data.recentUsers || []);
      setRecentActivity(data.recentActivity || []);
      setRecentLeads(data.recentLeads || []);
      
    } catch (error) {
      console.error('Dashboard Error:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  // ===== FETCH USERS (LIVE DATA) =====
  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Users Error:', error);
      toast.error('Failed to load users');
    }
  };

  // ===== FETCH LEADS (LIVE DATA) =====
  const fetchLeads = async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/leads`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeads(response.data.data || []);
    } catch (error) {
      console.error('Leads Error:', error);
      toast.error('Failed to load leads');
    }
  };

  // ===== USER ACTIONS (LIVE) =====
  const handleToggleBlock = async (userId, currentStatus) => {
    try {
      const response = await axios.put(`${API_BASE}/admin/users/${userId}/block`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(response.data.data.message || `User ${currentStatus ? 'Unblocked' : 'Blocked'}`);
      await fetchUsers();
      await fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('⚠️ Are you sure you want to delete this user? All their leads will also be deleted.')) return;
    try {
      await axios.delete(`${API_BASE}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User deleted successfully');
      await fetchUsers();
      await fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  // ===== LEAD ACTIONS (LIVE) =====
  const handleDeleteLead = async (leadId) => {
    if (!window.confirm('⚠️ Are you sure you want to delete this lead?')) return;
    try {
      await axios.delete(`${API_BASE}/admin/leads/${leadId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Lead deleted successfully');
      await fetchLeads();
      await fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete lead');
    }
  };

  // ===== PASSWORD CHANGE =====
  const handleSettingsChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleUpdatePassword = async () => {
    if (settings.newPassword !== settings.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (settings.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      await axios.put(`${API_BASE}/auth/change-password`, {
        currentPassword: settings.currentPassword,
        newPassword: settings.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Password updated successfully');
      setSettings({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    }
  };

  // ===== LOGOUT =====
  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out');
  };

  // ===== FILTERED LISTS =====
  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(usersSearch.toLowerCase()) || 
    u.email?.toLowerCase().includes(usersSearch.toLowerCase())
  );
  
  const filteredLeads = leads.filter(l => 
    l.companyName?.toLowerCase().includes(leadsSearch.toLowerCase()) ||
    l.industry?.toLowerCase().includes(leadsSearch.toLowerCase()) ||
    l.city?.toLowerCase().includes(leadsSearch.toLowerCase())
  );

  // ===== NAV ITEMS =====
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-solid fa-gauge-high' },
    { id: 'users', label: 'Users', icon: 'fa-solid fa-users-gear' },
    { id: 'leads', label: 'Leads', icon: 'fa-solid fa-database' },
    { id: 'settings', label: 'Settings', icon: 'fa-solid fa-sliders' }
  ];

  if (loading) return (
    <div className="admin-loading-container">
      <div className="admin-loader"></div>
      <p>Loading Admin Panel...</p>
    </div>
  );

  return (
    <div className="admin-dashboard dark">
      {/* ===== SIDEBAR ===== */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <div className="admin-brand-icon"><i className="fa-solid fa-crosshairs"></i></div>
          <div className="admin-brand-text">
            <h2>LeadHunter</h2>
            <span>Admin Pro</span>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`admin-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <i className={item.icon}></i>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-avatar">{user?.name?.charAt(0) || 'A'}</div>
            <div className="admin-user-details">
              <p className="admin-name">{user?.name || 'Admin'}</p>
              <p className="admin-role">{user?.role || 'Administrator'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="admin-logout-btn">
            <i className="fa-solid fa-power-off"></i>
          </button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="admin-main-content">
        <header className="admin-main-header">
          <div className="admin-header-left">
            <h1>{navItems.find(item => item.id === activeTab)?.label}</h1>
            <p className="admin-subtitle">
              {activeTab === 'dashboard' && '📊 Live platform statistics and activity'}
              {activeTab === 'users' && `👤 ${users.length} registered users`}
              {activeTab === 'leads' && `💼 ${leads.length} total leads in database`}
              {activeTab === 'settings' && '⚙️ Manage your admin account settings'}
            </p>
          </div>
        </header>

        {/* ===========================================
            TAB: DASHBOARD (LIVE DATA)
           =========================================== */}
        {activeTab === 'dashboard' && (
          <div className="admin-tab-content">
            {/* Stats Grid */}
            <div className="admin-stats-grid">
              <div className="admin-stat-card glass-purple">
                <div className="admin-stat-icon"><i className="fa-solid fa-users"></i></div>
                <div className="admin-stat-info">
                  <h3>{stats.totalUsers}</h3>
                  <p>Total Users</p>
                </div>
              </div>
              <div className="admin-stat-card glass-blue">
                <div className="admin-stat-icon"><i className="fa-solid fa-database"></i></div>
                <div className="admin-stat-info">
                  <h3>{stats.totalLeads}</h3>
                  <p>Total Leads</p>
                </div>
              </div>
              <div className="admin-stat-card glass-cyan">
                <div className="admin-stat-icon"><i className="fa-solid fa-bookmark"></i></div>
                <div className="admin-stat-info">
                  <h3>{stats.totalSavedLeads}</h3>
                  <p>Saved Leads</p>
                </div>
              </div>
              <div className="admin-stat-card glass-gold">
                <div className="admin-stat-icon"><i className="fa-solid fa-globe"></i></div>
                <div className="admin-stat-info">
                  <h3>{stats.totalCountries}</h3>
                  <p>Countries</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="admin-recent-grid">
              <div className="admin-recent-card">
                <h2><i className="fa-solid fa-user-plus"></i> Recent Users</h2>
                <div className="admin-list">
                  {recentUsers.length > 0 ? (
                    recentUsers.slice(0, 5).map(u => (
                      <div key={u._id} className="admin-list-item">
                        <div className="admin-list-avatar">{u.name?.charAt(0) || 'U'}</div>
                        <div>
                          <p className="admin-list-title">{u.name}</p>
                          <p className="admin-list-sub">{u.email}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="admin-empty">No recent users</p>
                  )}
                </div>
              </div>

              <div className="admin-recent-card">
                <h2><i className="fa-solid fa-clock"></i> Recent Activity</h2>
                <div className="admin-list">
                  {recentActivity.length > 0 ? (
                    recentActivity.slice(0, 5).map((act, i) => (
                      <div key={i} className="admin-list-item">
                        <i className="fa-solid fa-circle activity-dot"></i>
                        <div>
                          <p className="admin-list-title">{act.action || 'Activity'}</p>
                          <p className="admin-list-sub">{act.user || 'User'} • {act.date ? new Date(act.date).toLocaleString() : 'Recently'}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="admin-empty">No recent activity</p>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Leads */}
            <div className="admin-recent-leads">
              <h2><i className="fa-solid fa-building"></i> Recent Leads</h2>
              <div className="admin-recent-leads-grid">
                {recentLeads.length > 0 ? (
                  recentLeads.slice(0, 4).map(lead => (
                    <div key={lead._id} className="admin-recent-lead-card">
                      <h4>{lead.companyName || 'Unknown'}</h4>
                      <p>{lead.industry || 'N/A'} • {lead.city || 'N/A'}</p>
                      <span className={`lead-status-badge ${lead.status || 'new'}`}>{lead.status || 'New'}</span>
                    </div>
                  ))
                ) : (
                  <p className="admin-empty">No recent leads</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ===========================================
            TAB: USERS (LIVE DATA)
           =========================================== */}
        {activeTab === 'users' && (
          <div className="admin-tab-content">
            <div className="admin-toolbar">
              <div className="admin-search-box">
                <i className="fa-solid fa-search"></i>
                <input 
                  type="text" 
                  placeholder="Search users by name or email..." 
                  value={usersSearch} 
                  onChange={(e) => setUsersSearch(e.target.value)} 
                />
              </div>
              <span className="admin-count">{filteredUsers.length} Users Found</span>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u._id}>
                      <td>
                        <div className="admin-td-user">
                          <span className="td-avatar">{u.name?.charAt(0) || 'U'}</span> 
                          {u.name}
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td><span className={`role-badge ${u.role === 'admin' ? 'admin' : 'user'}`}>{u.role || 'User'}</span></td>
                      <td>
                        <span className={`status-badge ${u.isBlocked ? 'blocked' : 'active'}`}>
                          {u.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td>
                        <div className="admin-actions">
                          <button 
                            onClick={() => handleToggleBlock(u._id, u.isBlocked)} 
                            className={`action-btn ${u.isBlocked ? 'unblock' : 'block'}`}
                            title={u.isBlocked ? 'Unblock User' : 'Block User'}
                          >
                            {u.isBlocked ? <i className="fa-solid fa-check"></i> : <i className="fa-solid fa-ban"></i>}
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(u._id)} 
                            className="action-btn delete"
                            title="Delete User"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && <p className="admin-empty-table">No users found matching your search.</p>}
            </div>
          </div>
        )}

        {/* ===========================================
            TAB: LEADS (LIVE DATA)
           =========================================== */}
        {activeTab === 'leads' && (
          <div className="admin-tab-content">
            <div className="admin-toolbar">
              <div className="admin-search-box">
                <i className="fa-solid fa-search"></i>
                <input 
                  type="text" 
                  placeholder="Search leads by company, industry or city..." 
                  value={leadsSearch} 
                  onChange={(e) => setLeadsSearch(e.target.value)} 
                />
              </div>
              <span className="admin-count">{filteredLeads.length} Leads Found</span>
            </div>

            <div className="admin-leads-grid">
              {filteredLeads.length > 0 ? (
                filteredLeads.map(lead => (
                  <div key={lead._id} className="admin-lead-card">
                    <div className="admin-lead-header">
                      <h3><i className="fa-solid fa-building"></i> {lead.companyName || 'Unknown'}</h3>
                      <span className={`lead-status ${lead.status || 'new'}`}>{lead.status || 'New'}</span>
                    </div>
                    <div className="admin-lead-body">
                      <p><i className="fa-solid fa-tag"></i> {lead.industry || 'N/A'}</p>
                      <p><i className="fa-solid fa-location-dot"></i> {lead.city || 'N/A'}, {lead.country || 'N/A'}</p>
                      {lead.email && <p><i className="fa-solid fa-envelope"></i> {lead.email}</p>}
                      {lead.phone && <p><i className="fa-solid fa-phone"></i> {lead.phone}</p>}
                      {lead.website && <p><i className="fa-solid fa-globe"></i> <a href={lead.website} target="_blank" rel="noopener noreferrer">{lead.website}</a></p>}
                    </div>
                    <div className="admin-lead-actions">
                      <button onClick={() => handleDeleteLead(lead._id)} className="action-btn delete">
                        <i className="fa-solid fa-trash"></i> Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="admin-empty-table">No leads found matching your search.</p>
              )}
            </div>
          </div>
        )}

        {/* ===========================================
            TAB: SETTINGS
           =========================================== */}
        {activeTab === 'settings' && (
          <div className="admin-tab-content">
            <div className="admin-settings-card">
              <h2>⚙️ Admin Settings</h2>
              
              <div className="admin-settings-section">
                <h3>Profile Information</h3>
                <div className="admin-settings-field">
                  <label>Name</label>
                  <input type="text" value={user?.name || ''} disabled className="admin-disabled-input" />
                </div>
                <div className="admin-settings-field">
                  <label>Email</label>
                  <input type="email" value={user?.email || ''} disabled className="admin-disabled-input" />
                </div>
                <div className="admin-settings-field">
                  <label>Role</label>
                  <input type="text" value={user?.role || 'Admin'} disabled className="admin-disabled-input" />
                </div>
              </div>

              <div className="admin-settings-section">
                <h3>Change Password</h3>
                <div className="admin-settings-field">
                  <label>Current Password</label>
                  <input 
                    type="password" 
                    name="currentPassword" 
                    value={settings.currentPassword} 
                    onChange={handleSettingsChange} 
                    placeholder="Enter current password" 
                  />
                </div>
                <div className="admin-settings-field">
                  <label>New Password</label>
                  <input 
                    type="password" 
                    name="newPassword" 
                    value={settings.newPassword} 
                    onChange={handleSettingsChange} 
                    placeholder="Enter new password (min 6 chars)" 
                  />
                </div>
                <div className="admin-settings-field">
                  <label>Confirm Password</label>
                  <input 
                    type="password" 
                    name="confirmPassword" 
                    value={settings.confirmPassword} 
                    onChange={handleSettingsChange} 
                    placeholder="Confirm new password" 
                  />
                </div>
                <button onClick={handleUpdatePassword} className="admin-primary-btn">
                  <i className="fa-solid fa-save"></i> Update Password
                </button>
              </div>

              <div className="admin-settings-divider"></div>

              <div className="admin-settings-section admin-danger-zone">
                <h3 style={{ color: '#ef4444' }}><i className="fa-solid fa-triangle-exclamation"></i> Danger Zone</h3>
                <p className="admin-danger-text">⚠️ Logout from admin account</p>
                <button onClick={handleLogout} className="admin-danger-btn">
                  <i className="fa-solid fa-power-off"></i> Logout
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminDashboard;