const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAdmissions,
  getAdmissionById,
  createAdmission,
  updateAdmission,
  deleteAdmission,
  processAdmission,
  getAdmissionStats
} = require('../controllers/admission.controller');

// Public route for creating admission applications
router.post('/', createAdmission);

// Protected routes
router.use(protect);

// Admin and staff routes
router.use(authorize(['admin', 'staff']));

router.get('/', getAdmissions);
router.get('/stats', getAdmissionStats);
router.get('/:id', getAdmissionById);

// Admin only routes
router.use(authorize('admin'));

router.route('/:id')
  .put(updateAdmission)
  .delete(deleteAdmission);

router.put('/:id/process', processAdmission);

module.exports = router;