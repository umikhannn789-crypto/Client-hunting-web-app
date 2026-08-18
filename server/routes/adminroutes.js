const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
  getDashboardStats,
  getUsers,
  toggleUserBlock,
  deleteUser,
  getAllLeads,
  updateLead,
  deleteLead,
  getAdminOverview
} = require('../controllers/adminControllers');

router.use(protect);
router.use(admin);

router.get('/dashboard', getDashboardStats);
router.get('/overview', getAdminOverview);
router.get('/users', getUsers);
router.put('/users/:id/block', toggleUserBlock);
router.delete('/users/:id', deleteUser);
router.get('/leads', getAllLeads);
router.put('/leads/:id', updateLead);
router.delete('/leads/:id', deleteLead);



// adminRoutes.js
router.get('/dashboard', protect, admin, getDashboardStats);
router.get('/users', protect, admin, getUsers);
router.put('/users/:id/block', protect, admin, toggleUserBlock);
router.delete('/users/:id', protect, admin, deleteUser);
router.get('/leads', protect, admin, getAllLeads);
router.delete('/leads/:id', protect, admin, deleteLead);

module.exports = router;