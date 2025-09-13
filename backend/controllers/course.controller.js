const Course = require('../models/Course');
const Student = require('../models/Student');
const Subject = require('../models/Subject');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Private
const getCourses = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Filter options
    const filter = {};
    if (req.query.department) filter.department = req.query.department;
    if (req.query.active !== undefined) filter.active = req.query.active === 'true';
    
    // Search by name or code
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { code: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const total = await Course.countDocuments(filter);
    
    const courses = await Course.find(filter)
      .sort({ name: 1 })
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: courses.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses',
      error: error.message
    });
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Private
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course details',
      error: error.message
    });
  }
};

// @desc    Create new course
// @route   POST /api/courses
// @access  Private/Admin
const createCourse = async (req, res) => {
  try {
    // Validate subjects if provided
    if (req.body.semesters) {
      for (const semester of req.body.semesters) {
        if (semester.subjects && semester.subjects.length > 0) {
          for (const subjectId of semester.subjects) {
            const subject = await Subject.findById(subjectId);
            if (!subject) {
              return res.status(400).json({
                success: false,
                message: `Invalid subject ID: ${subjectId}`
              });
            }
          }
        }
      }
    }

    // Create course
    const course = await Course.create(req.body);

    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create course',
      error: error.message
    });
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Admin
const updateCourse = async (req, res) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Validate subjects if provided
    if (req.body.semesters) {
      for (const semester of req.body.semesters) {
        if (semester.subjects && semester.subjects.length > 0) {
          for (const subjectId of semester.subjects) {
            const subject = await Subject.findById(subjectId);
            if (!subject) {
              return res.status(400).json({
                success: false,
                message: `Invalid subject ID: ${subjectId}`
              });
            }
          }
        }
      }
    }

    // Update course
    course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update course',
      error: error.message
    });
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Admin
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if any students are enrolled in this course
    const studentsEnrolled = await Student.countDocuments({ course: req.params.id });
    
    if (studentsEnrolled > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete course. ${studentsEnrolled} students are currently enrolled in this course.`
      });
    }

    // Delete course
    await course.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete course',
      error: error.message
    });
  }
};

// @desc    Add subject to course semester
// @route   POST /api/courses/:id/subjects
// @access  Private/Admin
const addSubjectToCourse = async (req, res) => {
  try {
    const { semesterNumber, subjectId } = req.body;
    
    if (!semesterNumber || !subjectId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide semester number and subject ID'
      });
    }

    // Check if course exists
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Check if semester exists in course
    const semesterIndex = course.semesters.findIndex(
      sem => sem.semesterNumber === semesterNumber
    );

    if (semesterIndex === -1) {
      // Create new semester if it doesn't exist
      course.semesters.push({
        semesterNumber,
        subjects: [subjectId]
      });
    } else {
      // Check if subject already exists in semester
      if (course.semesters[semesterIndex].subjects.includes(subjectId)) {
        return res.status(400).json({
          success: false,
          message: 'Subject already exists in this semester'
        });
      }

      // Add subject to existing semester
      course.semesters[semesterIndex].subjects.push(subjectId);
    }

    // Save course
    await course.save();

    res.status(200).json({
      success: true,
      message: 'Subject added to course semester successfully',
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add subject to course',
      error: error.message
    });
  }
};

// @desc    Remove subject from course semester
// @route   DELETE /api/courses/:id/subjects
// @access  Private/Admin
const removeSubjectFromCourse = async (req, res) => {
  try {
    const { semesterNumber, subjectId } = req.body;
    
    if (!semesterNumber || !subjectId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide semester number and subject ID'
      });
    }

    // Check if course exists
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if semester exists in course
    const semesterIndex = course.semesters.findIndex(
      sem => sem.semesterNumber === semesterNumber
    );

    if (semesterIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Semester not found in this course'
      });
    }

    // Check if subject exists in semester
    const subjectIndex = course.semesters[semesterIndex].subjects.indexOf(subjectId);
    if (subjectIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found in this semester'
      });
    }

    // Remove subject from semester
    course.semesters[semesterIndex].subjects.splice(subjectIndex, 1);

    // Remove semester if no subjects left
    if (course.semesters[semesterIndex].subjects.length === 0) {
      course.semesters.splice(semesterIndex, 1);
    }

    // Save course
    await course.save();

    res.status(200).json({
      success: true,
      message: 'Subject removed from course semester successfully',
      data: course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to remove subject from course',
      error: error.message
    });
  }
};

// @desc    Get course statistics
// @route   GET /api/courses/stats
// @access  Private/Admin
const getCourseStats = async (req, res) => {
  try {
    // Get total courses count
    const totalCourses = await Course.countDocuments();

    // Get courses by department
    const coursesByDepartment = await Course.aggregate([
      { $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get student enrollment by course
    const studentsByCourse = await Student.aggregate([
      { $group: {
          _id: '$course',
          count: { $sum: 1 }
        }
      },
      { $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'courseDetails'
        }
      },
      { $unwind: '$courseDetails' },
      { $project: {
          courseName: '$courseDetails.name',
          courseCode: '$courseDetails.code',
          department: '$courseDetails.department',
          studentCount: '$count'
        }
      },
      { $sort: { studentCount: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalCourses,
        coursesByDepartment: coursesByDepartment.map(dept => ({
          department: dept._id || 'Unspecified',
          count: dept.count
        })),
        studentEnrollment: studentsByCourse
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course statistics',
      error: error.message
    });
  }
};

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  addSubjectToCourse,
  removeSubjectFromCourse,
  getCourseStats
};