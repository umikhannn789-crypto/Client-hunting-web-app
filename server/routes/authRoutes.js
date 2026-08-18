const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  changePassword,
  deleteAccount  // ← Make sure this is imported
} = require('../controllers/authControllers');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.delete('/delete-account', protect, deleteAccount);  // ← This route

module.exports = router;