const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getLeads,
  saveLead,
  unsaveLead,
  searchLeads,
  deleteLead
} = require('../controllers/leadControllers');

router.use(protect);

router.get('/', getLeads);
router.post('/search', searchLeads);
router.put('/:id/save', saveLead);
router.put('/:id/unsave', unsaveLead);
router.delete('/:id', deleteLead);

module.exports = router;