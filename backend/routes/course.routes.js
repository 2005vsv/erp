const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  addSubjectToCourse,
  removeSubjectFromCourse,
  getCourseStats
} = require('../controllers/course.controller');

// Protected routes
router.use(protect);

// Routes accessible by all authenticated users
router.get('/', getCourses);
router.get('/:id', getCourseById);

// Admin and staff routes
router.use(authorize(['admin', 'staff']));

router.get('/stats/all', getCourseStats);

// Admin only routes
router.use(authorize('admin'));

router.post('/', createCourse);
router.put('/:id', updateCourse);
router.delete('/:id', deleteCourse);
router.post('/:id/subjects', addSubjectToCourse);
router.delete('/:id/subjects', removeSubjectFromCourse);

module.exports = router;