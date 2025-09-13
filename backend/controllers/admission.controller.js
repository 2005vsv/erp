const Admission = require('../models/Admission');
const Student = require('../models/Student');
const Course = require('../models/Course');
const User = require('../models/User');

// @desc    Get all admissions
// @route   GET /api/admissions
// @access  Private/Admin
const getAdmissions = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Filter options
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.course) filter.appliedCourse = req.query.course;
    if (req.query.academicYear) filter.academicYear = req.query.academicYear;
    
    // Search by name or application number
    if (req.query.search) {
      filter.$or = [
        { applicationNumber: { $regex: req.query.search, $options: 'i' } },
        { 'applicantDetails.firstName': { $regex: req.query.search, $options: 'i' } },
        { 'applicantDetails.lastName': { $regex: req.query.search, $options: 'i' } },
        { 'contactDetails.email': { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const total = await Admission.countDocuments(filter);
    
    const admissions = await Admission.find(filter)
      .populate('appliedCourse', 'name code')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: admissions.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: admissions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admissions',
      error: error.message
    });
  }
};

// @desc    Get single admission
// @route   GET /api/admissions/:id
// @access  Private
const getAdmissionById = async (req, res) => {
  try {
    const admission = await Admission.findById(req.params.id)
      .populate('appliedCourse', 'name code department duration')
      .populate('createdBy', 'name')
      .populate('student', 'registrationNumber');

    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'Admission application not found'
      });
    }

    res.status(200).json({
      success: true,
      data: admission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admission details',
      error: error.message
    });
  }
};

// @desc    Create new admission application
// @route   POST /api/admissions
// @access  Public/Private
const createAdmission = async (req, res) => {
  try {
    // Check if course exists
    const course = await Course.findById(req.body.appliedCourse);
    if (!course) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course selected'
      });
    }

    // Create admission application
    const admission = await Admission.create({
      ...req.body,
      status: 'pending',
      createdBy: req.user ? req.user.id : null
    });

    res.status(201).json({
      success: true,
      data: admission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create admission application',
      error: error.message
    });
  }
};

// @desc    Update admission application
// @route   PUT /api/admissions/:id
// @access  Private/Admin
const updateAdmission = async (req, res) => {
  try {
    let admission = await Admission.findById(req.params.id);

    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'Admission application not found'
      });
    }

    // Check if course exists if being updated
    if (req.body.appliedCourse) {
      const course = await Course.findById(req.body.appliedCourse);
      if (!course) {
        return res.status(400).json({
          success: false,
          message: 'Invalid course selected'
        });
      }
    }

    // Update admission
    admission = await Admission.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: admission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update admission application',
      error: error.message
    });
  }
};

// @desc    Delete admission application
// @route   DELETE /api/admissions/:id
// @access  Private/Admin
const deleteAdmission = async (req, res) => {
  try {
    const admission = await Admission.findById(req.params.id);

    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'Admission application not found'
      });
    }

    // Check if admission is already approved and student created
    if (admission.status === 'approved' && admission.student) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an approved admission with student record'
      });
    }

    // Delete admission record
    await admission.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete admission application',
      error: error.message
    });
  }
};

// @desc    Process admission (approve/reject)
// @route   PUT /api/admissions/:id/process
// @access  Private/Admin
const processAdmission = async (req, res) => {
  try {
    const { status, remarks, interviewDetails, admissionFee } = req.body;
    
    if (!['approved', 'rejected', 'pending', 'interview_scheduled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status provided'
      });
    }

    const admission = await Admission.findById(req.params.id);

    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'Admission application not found'
      });
    }

    // Update admission status
    admission.status = status;
    if (remarks) admission.remarks = remarks;
    if (interviewDetails) admission.interviewDetails = interviewDetails;
    if (admissionFee) admission.admissionFee = admissionFee;
    
    // If approved, create student record
    if (status === 'approved' && !admission.student) {
      // Create user account if email provided
      let user = null;
      if (admission.contactDetails && admission.contactDetails.email) {
        // Check if user already exists
        user = await User.findOne({ email: admission.contactDetails.email });
        
        if (!user) {
          // Create new user
          user = await User.create({
            name: `${admission.applicantDetails.firstName} ${admission.applicantDetails.lastName}`,
            email: admission.contactDetails.email,
            password: 'password123', // Default password
            role: 'student',
            contactNumber: admission.contactDetails.phoneNumber
          });
        }
      }

      // Create student record
      const student = await Student.create({
        personalDetails: {
          firstName: admission.applicantDetails.firstName,
          lastName: admission.applicantDetails.lastName,
          dateOfBirth: admission.applicantDetails.dateOfBirth,
          gender: admission.applicantDetails.gender,
          bloodGroup: admission.applicantDetails.bloodGroup
        },
        contactDetails: admission.contactDetails,
        address: admission.address,
        guardianDetails: admission.guardianDetails,
        course: admission.appliedCourse,
        batch: admission.academicYear,
        previousEducation: admission.previousEducation,
        documents: admission.documents,
        user: user ? user._id : null,
        status: 'active'
      });

      // Link student to admission
      admission.student = student._id;
    }

    await admission.save();

    res.status(200).json({
      success: true,
      data: admission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process admission',
      error: error.message
    });
  }
};

// @desc    Get admission statistics
// @route   GET /api/admissions/stats
// @access  Private/Admin
const getAdmissionStats = async (req, res) => {
  try {
    const academicYear = req.query.academicYear || new Date().getFullYear().toString();
    
    // Get total counts by status
    const totalStats = await Admission.aggregate([
      { $match: { academicYear } },
      { $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get counts by course
    const courseStats = await Admission.aggregate([
      { $match: { academicYear } },
      { $group: {
          _id: '$appliedCourse',
          count: { $sum: 1 },
          approved: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          }
        }
      },
      { $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: '$course' },
      { $project: {
          courseName: '$course.name',
          courseCode: '$course.code',
          totalApplications: '$count',
          approvedApplications: '$approved'
        }
      }
    ]);

    // Format the status counts
    const statusCounts = {};
    totalStats.forEach(stat => {
      statusCounts[stat._id] = stat.count;
    });

    res.status(200).json({
      success: true,
      data: {
        totalApplications: statusCounts.approved + statusCounts.rejected + statusCounts.pending + (statusCounts.interview_scheduled || 0) || 0,
        statusCounts,
        courseStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admission statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAdmissions,
  getAdmissionById,
  createAdmission,
  updateAdmission,
  deleteAdmission,
  processAdmission,
  getAdmissionStats
};