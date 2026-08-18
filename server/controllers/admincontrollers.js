const User = require('../models/Users');
const Lead = require('../models/Leads');
const SearchLog = require('../models/SearchLogs');

exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalLeads = await Lead.countDocuments();
    const totalSavedLeads = await Lead.countDocuments({ isSaved: true });
    const recentUsers = await User.find().sort('-createdAt').limit(5).select('-password');

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalLeads,
          totalSavedLeads
        },
        recentUsers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.toggleUserBlock = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.json({
      success: true,
      data: {
        isBlocked: user.isBlocked,
        message: 'User has been ' + (user.isBlocked ? 'blocked' : 'unblocked')
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAllLeads = async (req, res) => {
  try {
    const leads = await Lead.find().populate('createdBy', 'name email');
    res.json({
      success: true,
      data: leads
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.json({
      success: true,
      data: lead
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAdminOverview = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalLeads = await Lead.countDocuments();
    const totalSavedLeads = await Lead.countDocuments({ isSaved: true });
    const totalScrapingJobs = await SearchLog.countDocuments();

    const recentUsers = await User.find()
      .select('-password')
      .limit(5)
      .sort('-createdAt');

    const recentScrapingActivity = await SearchLog.find()
      .populate('user', 'name email')
      .limit(5)
      .sort('-createdAt');

    res.json({
      totalUsers,
      totalLeads,
      totalSavedLeads,
      totalScrapingJobs,
      recentUsers: recentUsers.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.isBlocked ? 'Blocked' : 'Active',
        joinedDate: new Date(u.createdAt).toLocaleDateString()
      })),
      recentScrapingActivity: recentScrapingActivity.map(s => ({
        user: s.user ? s.user.name : 'Unknown',
        query: s.query,
        leadsFound: s.results || 0,
        date: new Date(s.createdAt).toLocaleDateString()
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};