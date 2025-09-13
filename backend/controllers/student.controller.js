const Student = require('../models/Student');
const User = require('../models/User');
const Course = require('../models/Course');
const Hostel = require('../models/Hostel');

// @desc    Get all students
// @route   GET /api/students
// @access  Private/Admin
const getStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Filter options
    const filter = {};
    if (req.query.course) filter.course = req.query.course;
    if (req.query.batch) filter.batch = req.query.batch;
    if (req.query.status) filter.status = req.query.status;
    
    // Search by name or registration number
    if (req.query.search) {
      filter.$or = [
        { registrationNumber: { $regex: req.query.search, $options: 'i' } },
        { 'personalDetails.firstName': { $regex: req.query.search, $options: 'i' } },
        { 'personalDetails.lastName': { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const total = await Student.countDocuments(filter);
    
    const students = await Student.find(filter)
      .populate('user', 'name email')
      .populate('course', 'name code')
      .populate('hostel', 'name roomNumber')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: students.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students',
      error: error.message
    });
  }
};

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Private
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('user', 'name email')
      .populate('course', 'name code department duration semesters')
      .populate('hostel', 'name roomNumber type');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student',
      error: error.message
    });
  }
};

// @desc    Create new student
// @route   POST /api/students
// @access  Private/Admin
const createStudent = async (req, res) => {
  try {
    // Check if course exists
    const course = await Course.findById(req.body.course);
    if (!course) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course selected'
      });
    }

    // Check if hostel exists if provided
    if (req.body.hostel) {
      const hostel = await Hostel.findById(req.body.hostel);
      if (!hostel) {
        return res.status(400).json({
          success: false,
          message: 'Invalid hostel selected'
        });
      }
    }

    // Create user account if not already linked
    let user = null;
    if (req.body.user) {
      user = await User.findById(req.body.user);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user account'
        });
      }
    } else if (req.body.email) {
      // Check if user with email already exists
      user = await User.findOne({ email: req.body.email });
      
      if (!user) {
        // Create new user
        user = await User.create({
          name: `${req.body.personalDetails.firstName} ${req.body.personalDetails.lastName}`,
          email: req.body.email,
          password: req.body.password || 'password123', // Default password or provided
          role: 'student',
          contactNumber: req.body.contactDetails?.phoneNumber
        });
      }
    }

    // Create student record
    const student = await Student.create({
      ...req.body,
      user: user ? user._id : null
    });

    res.status(201).json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create student',
      error: error.message
    });
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private/Admin
const updateStudent = async (req, res) => {
  try {
    let student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if course exists if being updated
    if (req.body.course) {
      const course = await Course.findById(req.body.course);
      if (!course) {
        return res.status(400).json({
          success: false,
          message: 'Invalid course selected'
        });
      }
    }

    // Check if hostel exists if being updated
    if (req.body.hostel) {
      const hostel = await Hostel.findById(req.body.hostel);
      if (!hostel) {
        return res.status(400).json({
          success: false,
          message: 'Invalid hostel selected'
        });
      }
    }

    // Update student
    student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // Update associated user if needed
    if (student.user && (req.body.email || req.body.personalDetails)) {
      const user = await User.findById(student.user);
      if (user) {
        if (req.body.email) {
          user.email = req.body.email;
        }
        if (req.body.personalDetails) {
          user.name = `${req.body.personalDetails.firstName} ${req.body.personalDetails.lastName}`;
        }
        if (req.body.contactDetails?.phoneNumber) {
          user.contactNumber = req.body.contactDetails.phoneNumber;
        }
        await user.save();
      }
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update student',
      error: error.message
    });
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private/Admin
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Delete student record
    await student.remove();

    // Optionally delete associated user account
    if (req.query.deleteUser === 'true' && student.user) {
      await User.findByIdAndDelete(student.user);
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete student',
      error: error.message
    });
  }
};

// @desc    Get student dashboard data
// @route   GET /api/students/dashboard
// @access  Private/Student
const getStudentDashboard = async (req, res) => {
  try {
    // Get student record for the logged-in user
    const student = await Student.findOne({ user: req.user.id })
      .populate('course', 'name code department duration semesters')
      .populate('hostel', 'name roomNumber type');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found'
      });
    }

    // Get fee payment status
    const feeStatus = await getFeeStatus(student._id);

    // Get exam results
    const examResults = await getExamResults(student._id);

    res.status(200).json({
      success: true,
      data: {
        student,
        feeStatus,
        examResults
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
};

// Helper function to get fee status
const getFeeStatus = async (studentId) => {
  // This would be implemented to fetch from Fee model
  // For now returning placeholder data
  return {
    totalFee: 50000,
    paidAmount: 30000,
    dueAmount: 20000,
    nextDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    status: 'Partially Paid'
  };
};

// Helper function to get exam results
const getExamResults = async (studentId) => {
  // This would be implemented to fetch from Exam model
  // For now returning placeholder data
  return [
    {
      examName: 'Mid Semester Exam',
      totalMarks: 100,
      obtainedMarks: 78,
      grade: 'B+',
      status: 'Passed'
    }
  ];
};

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentDashboard
};