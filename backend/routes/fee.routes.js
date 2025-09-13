const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getFees,
  getFeeById,
  createFee,
  updateFee,
  deleteFee,
  getStudentFeeSummary,
  getFeeStats
} = require('../controllers/fee.controller');

// Protected routes
router.use(protect);

// Student fee summary - accessible by admin, staff, and the student themselves
router.get('/student/:studentId', getStudentFeeSummary);

// Admin and staff routes
router.use(authorize(['admin', 'staff']));

router.get('/', getFees);
router.get('/stats', getFeeStats);
router.get('/:id', getFeeById);
router.post('/', createFee);

// Admin only routes
router.use(authorize('admin'));

router.route('/:id')
  .put(updateFee)
  .delete(deleteFee);

module.exports = router;