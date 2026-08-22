const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'lost'],
    default: 'new'
  },
  notes: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true
  },
  rating: {
    type: String,
    default: ''
  },
  source: {
    type: String,
    default: 'google_maps'
  },
  sourceUrl: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isSaved: {
    type: Boolean,
    default: false
  },
  savedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// ===== INDEXES FOR BETTER PERFORMANCE =====
LeadSchema.index({ companyName: 1, city: 1 }, { unique: false });
LeadSchema.index({ createdBy: 1, createdAt: -1 });
LeadSchema.index({ industry: 1 });
LeadSchema.index({ city: 1, country: 1 });

module.exports = mongoose.model('Lead', LeadSchema);