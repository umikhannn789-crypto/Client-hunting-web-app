const Lead = require('../models/Leads');
const SearchLog = require('../models/SearchLogs');

exports.getLeads = async (req, res) => {
  try {
    const leads = await Lead.find({
      $or: [{ createdBy: req.user.id }, { savedBy: req.user.id }]
    });
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

exports.saveLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    if (!lead.savedBy.includes(req.user.id)) {
      lead.savedBy.push(req.user.id);
      lead.isSaved = true;
      await lead.save();
    }

    res.json({
      success: true,
      message: 'Lead saved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.unsaveLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    lead.savedBy = lead.savedBy.filter(id => id.toString() !== req.user.id);
    lead.isSaved = lead.savedBy.length > 0;
    await lead.save();

    res.json({
      success: true,
      message: 'Lead unsaved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.searchLeads = async (req, res) => {
  try {
    const { query } = req.body;

    await SearchLog.create({
      user: req.user.id,
      query,
      ipAddress: req.ip
    });

    const leads = await Lead.find({
      $or: [
        { companyName: { $regex: query, $options: 'i' } },
        { industry: { $regex: query, $options: 'i' } }
      ]
    });

    res.json({
      success: true,
      data: leads,
      message: `Found ${leads.length} leads`
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
    const lead = await Lead.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found or you do not have permission'
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