const Exam = require('../models/Exam');
const Student = require('../models/Student');
const Course = require('../models/Course');
const Subject = require('../models/Subject');

// @desc    Get all exams
// @route   GET /api/exams
// @access  Private
const getExams = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Filter options
    const filter = {};
    if (req.query.course) filter.course = req.query.course;
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.examType) filter.examType = req.query.examType;
    
    // Search by name
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: 'i' };
    }

    const total = await Exam.countDocuments(filter);
    
    const exams = await Exam.find(filter)
      .populate('course', 'name code')
      .populate('subject', 'name code')
      .sort({ examDate: -1 })
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: exams.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: exams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exams',
      error: error.message
    });
  }
};

// @desc    Get single exam
// @route   GET /api/exams/:id
// @access  Private
const getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('course', 'name code')
      .populate('subject', 'name code');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    res.status(200).json({
      success: true,
      data: exam
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exam details',
      error: error.message
    });
  }
};

// @desc    Create new exam
// @route   POST /api/exams
// @access  Private/Admin
const createExam = async (req, res) => {
  try {
    // Validate course and subject if provided
    if (req.body.course) {
      const course = await Course.findById(req.body.course);
      if (!course) {
        return res.status(400).json({
          success: false,
          message: 'Invalid course selected'
        });
      }
    }

    if (req.body.subject) {
      const subject = await Subject.findById(req.body.subject);
      if (!subject) {
        return res.status(400).json({
          success: false,
          message: 'Invalid subject selected'
        });
      }
    }

    // Create exam
    const exam = await Exam.create(req.body);

    res.status(201).json({
      success: true,
      data: exam
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create exam',
      error: error.message
    });
  }
};

// @desc    Update exam
// @route   PUT /api/exams/:id
// @access  Private/Admin
const updateExam = async (req, res) => {
  try {
    let exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Validate course and subject if provided
    if (req.body.course) {
      const course = await Course.findById(req.body.course);
      if (!course) {
        return res.status(400).json({
          success: false,
          message: 'Invalid course selected'
        });
      }
    }

    if (req.body.subject) {
      const subject = await Subject.findById(req.body.subject);
      if (!subject) {
        return res.status(400).json({
          success: false,
          message: 'Invalid subject selected'
        });
      }
    }

    // Update exam
    exam = await Exam.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: exam
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update exam',
      error: error.message
    });
  }
};

// @desc    Delete exam
// @route   DELETE /api/exams/:id
// @access  Private/Admin
const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check if results are already published
    if (exam.results && exam.results.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete exam with published results'
      });
    }

    // Delete exam
    await exam.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete exam',
      error: error.message
    });
  }
};

// @desc    Add exam results
// @route   POST /api/exams/:id/results
// @access  Private/Admin
const addExamResults = async (req, res) => {
  try {
    const { results } = req.body;
    
    if (!results || !Array.isArray(results) || results.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid results array'
      });
    }

    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Validate student IDs
    const studentIds = results.map(result => result.student);
    const students = await Student.find({ _id: { $in: studentIds } });
    
    if (students.length !== studentIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more student IDs are invalid'
      });
    }

    // Process each result
    for (const result of results) {
      // Check if student already has a result
      const existingIndex = exam.results.findIndex(
        r => r.student.toString() === result.student
      );

      if (existingIndex !== -1) {
        // Update existing result
        exam.results[existingIndex].marks = result.marks;
        // Grade will be calculated by pre-save hook
      } else {
        // Add new result
        exam.results.push({
          student: result.student,
          marks: result.marks
          // Grade will be calculated by pre-save hook
        });
      }
    }

    await exam.save();

    res.status(200).json({
      success: true,
      message: `Results added for ${results.length} students`,
      data: exam
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add exam results',
      error: error.message
    });
  }
};

// @desc    Get student exam results
// @route   GET /api/exams/student/:studentId
// @access  Private
const getStudentResults = async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId)
      .populate('course', 'name code');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check authorization - only admin, staff or the student themselves
    if (req.user.role === 'student' && student.user && student.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access these exam results'
      });
    }

    // Get all exams where this student has results
    const exams = await Exam.find({
      'results.student': req.params.studentId
    }).populate('subject', 'name code');

    // Extract and format results
    const results = exams.map(exam => {
      const studentResult = exam.results.find(
        r => r.student.toString() === req.params.studentId
      );

      return {
        examId: exam._id,
        examName: exam.name,
        examType: exam.examType,
        subject: exam.subject ? exam.subject.name : 'N/A',
        subjectCode: exam.subject ? exam.subject.code : 'N/A',
        examDate: exam.examDate,
        totalMarks: exam.totalMarks,
        obtainedMarks: studentResult.marks,
        grade: studentResult.grade,
        status: studentResult.status
      };
    });

    res.status(200).json({
      success: true,
      data: {
        student: {
          id: student._id,
          name: `${student.personalDetails.firstName} ${student.personalDetails.lastName}`,
          registrationNumber: student.registrationNumber,
          course: student.course ? student.course.name : 'N/A'
        },
        results
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student results',
      error: error.message
    });
  }
};

// @desc    Get exam statistics
// @route   GET /api/exams/stats
// @access  Private/Admin
const getExamStats = async (req, res) => {
  try {
    // Get total exams count
    const totalExams = await Exam.countDocuments();

    // Get exams by type
    const examsByType = await Exam.aggregate([
      { $group: {
          _id: '$examType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get performance statistics
    const performanceStats = await Exam.aggregate([
      { $unwind: '$results' },
      { $group: {
          _id: '$_id',
          examName: { $first: '$name' },
          totalStudents: { $sum: 1 },
          avgMarks: { $avg: '$results.marks' },
          passCount: {
            $sum: { $cond: [{ $eq: ['$results.status', 'pass'] }, 1, 0] }
          },
          failCount: {
            $sum: { $cond: [{ $eq: ['$results.status', 'fail'] }, 1, 0] }
          },
          gradeDistribution: {
            $push: '$results.grade'
          }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 10 }
    ]);

    // Process grade distribution
    performanceStats.forEach(stat => {
      const grades = {};
      stat.gradeDistribution.forEach(grade => {
        if (grades[grade]) {
          grades[grade]++;
        } else {
          grades[grade] = 1;
        }
      });
      stat.gradeDistribution = grades;
      stat.passPercentage = (stat.passCount / stat.totalStudents) * 100;
    });

    res.status(200).json({
      success: true,
      data: {
        totalExams,
        examsByType: examsByType.map(type => ({
          type: type._id,
          count: type.count
        })),
        recentPerformance: performanceStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch exam statistics',
      error: error.message
    });
  }
};

module.exports = {
  getExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  addExamResults,
  getStudentResults,
  getExamStats
};