const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  addExamResults,
  getStudentResults,
  getExamStats
} = require('../controllers/exam.controller');

// Protected routes
router.use(protect);

// Student results - accessible by admin, staff, and the student themselves
router.get('/student/:studentId', getStudentResults);

// Admin and staff routes
router.use(authorize(['admin', 'staff']));

router.get('/', getExams);
router.get('/stats', getExamStats);
router.get('/:id', getExamById);

// Admin only routes
router.use(authorize('admin'));

router.post('/', createExam);
router.put('/:id', updateExam);
router.delete('/:id', deleteExam);
router.post('/:id/results', addExamResults);

module.exports = router;