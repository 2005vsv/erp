const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Student = require('../models/Student');
const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentDashboard
} = require('../controllers/student.controller');

// Protected routes
router.use(protect);

// Student dashboard route - accessible by students
router.get('/dashboard', getStudentDashboard);

// Routes accessible by admin and staff
router.use(authorize(['admin', 'staff']));

// Get student by ID - accessible by admin, staff, and the student themselves
router.get('/:id', async (req, res, next) => {
  // Allow students to access their own record
  const student = await Student.findById(req.params.id).select('user');
  if (req.user.role === 'student' && (!student || student.user.toString() !== req.user.id)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this student record'
    });
  }
  next();
}, getStudentById);

// Admin only routes
router.use(authorize('admin'));

router.route('/')
  .get(getStudents)
  .post(createStudent);

router.route('/:id')
  .put(updateStudent)
  .delete(deleteStudent);

module.exports = router;