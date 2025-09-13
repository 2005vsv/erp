const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  getSubjectCourses
} = require('../controllers/subject.controller');

// Protected routes
router.use(protect);

// Routes accessible by all authenticated users
router.get('/', getSubjects);
router.get('/:id', getSubjectById);
router.get('/:id/courses', getSubjectCourses);

// Admin only routes
router.use(authorize('admin'));

router.post('/', createSubject);
router.put('/:id', updateSubject);
router.delete('/:id', deleteSubject);

module.exports = router;