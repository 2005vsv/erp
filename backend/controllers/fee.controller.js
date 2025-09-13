const Fee = require('../models/Fee');
const Student = require('../models/Student');
const Course = require('../models/Course');

// @desc    Get all fees
// @route   GET /api/fees
// @access  Private/Admin
const getFees = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Filter options
    const filter = {};
    if (req.query.student) filter.student = req.query.student;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.feeType) filter.feeType = req.query.feeType;
    if (req.query.academicYear) filter.academicYear = req.query.academicYear;
    
    // Search by receipt number or student name
    if (req.query.search) {
      // First find students matching the search
      const students = await Student.find({
        $or: [
          { 'personalDetails.firstName': { $regex: req.query.search, $options: 'i' } },
          { 'personalDetails.lastName': { $regex: req.query.search, $options: 'i' } },
          { registrationNumber: { $regex: req.query.search, $options: 'i' } }
        ]
      }).select('_id');
      
      const studentIds = students.map(student => student._id);
      
      filter.$or = [
        { receiptNumber: { $regex: req.query.search, $options: 'i' } },
        { student: { $in: studentIds } }
      ];
    }

    const total = await Fee.countDocuments(filter);
    
    const fees = await Fee.find(filter)
      .populate('student', 'registrationNumber personalDetails')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: fees.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: fees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fees',
      error: error.message
    });
  }
};

// @desc    Get single fee record
// @route   GET /api/fees/:id
// @access  Private
const getFeeById = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id)
      .populate('student', 'registrationNumber personalDetails contactDetails');

    if (!fee) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: fee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fee details',
      error: error.message
    });
  }
};

// @desc    Create new fee record
// @route   POST /api/fees
// @access  Private/Admin
const createFee = async (req, res) => {
  try {
    // Check if student exists
    const student = await Student.findById(req.body.student)
      .populate('course', 'totalFee');
      
    if (!student) {
      return res.status(400).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Calculate remaining amount if not provided
    let feeData = { ...req.body };
    if (!feeData.remainingAmount && feeData.amount) {
      // Get total fee amount for the student's course
      const totalFee = student.course ? student.course.totalFee : 0;
      
      // Get already paid amount
      const paidFees = await Fee.find({ 
        student: student._id,
        status: 'paid',
        academicYear: feeData.academicYear
      });
      
      const totalPaid = paidFees.reduce((sum, fee) => sum + fee.amount, 0);
      
      // Calculate remaining after this payment
      feeData.remainingAmount = totalFee - (totalPaid + feeData.amount);
    }

    // Create fee record
    const fee = await Fee.create(feeData);

    res.status(201).json({
      success: true,
      data: fee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create fee record',
      error: error.message
    });
  }
};

// @desc    Update fee record
// @route   PUT /api/fees/:id
// @access  Private/Admin
const updateFee = async (req, res) => {
  try {
    let fee = await Fee.findById(req.params.id);

    if (!fee) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found'
      });
    }

    // Check if student exists if being updated
    if (req.body.student) {
      const student = await Student.findById(req.body.student);
      if (!student) {
        return res.status(400).json({
          success: false,
          message: 'Student not found'
        });
      }
    }

    // Update fee record
    fee = await Fee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: fee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update fee record',
      error: error.message
    });
  }
};

// @desc    Delete fee record
// @route   DELETE /api/fees/:id
// @access  Private/Admin
const deleteFee = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id);

    if (!fee) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found'
      });
    }

    // Delete fee record
    await fee.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete fee record',
      error: error.message
    });
  }
};

// @desc    Get student fee summary
// @route   GET /api/fees/student/:studentId
// @access  Private
const getStudentFeeSummary = async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId)
      .populate('course', 'name code totalFee');

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
        message: 'Not authorized to access this fee information'
      });
    }

    // Get all fee records for the student
    const feeRecords = await Fee.find({ student: req.params.studentId })
      .sort({ paymentDate: -1 });

    // Calculate summary
    const totalFee = student.course ? student.course.totalFee : 0;
    const totalPaid = feeRecords
      .filter(fee => fee.status === 'paid')
      .reduce((sum, fee) => sum + fee.amount, 0);
    const totalDue = totalFee - totalPaid;

    // Get upcoming fee dues
    const upcomingDues = feeRecords
      .filter(fee => fee.status === 'pending' && new Date(fee.dueDate) > new Date())
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    res.status(200).json({
      success: true,
      data: {
        student: {
          id: student._id,
          name: `${student.personalDetails.firstName} ${student.personalDetails.lastName}`,
          registrationNumber: student.registrationNumber,
          course: student.course ? student.course.name : 'N/A'
        },
        feeSummary: {
          totalFee,
          totalPaid,
          totalDue,
          paymentHistory: feeRecords.map(record => ({
            id: record._id,
            receiptNumber: record.receiptNumber,
            amount: record.amount,
            feeType: record.feeType,
            paymentDate: record.paymentDate,
            paymentMethod: record.paymentMethod,
            status: record.status
          })),
          upcomingDue: upcomingDues.length > 0 ? {
            amount: upcomingDues[0].amount,
            dueDate: upcomingDues[0].dueDate,
            feeType: upcomingDues[0].feeType
          } : null
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fee summary',
      error: error.message
    });
  }
};

// @desc    Get fee statistics
// @route   GET /api/fees/stats
// @access  Private/Admin
const getFeeStats = async (req, res) => {
  try {
    const academicYear = req.query.academicYear || new Date().getFullYear().toString();
    
    // Get total collected and pending amounts
    const feeStats = await Fee.aggregate([
      { $match: { academicYear } },
      { $group: {
          _id: '$status',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get monthly collection stats
    const monthlyStats = await Fee.aggregate([
      { 
        $match: { 
          academicYear,
          status: 'paid',
          paymentDate: { $exists: true }
        } 
      },
      {
        $group: {
          _id: { $month: '$paymentDate' },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Format the stats
    const formattedStats = {};
    feeStats.forEach(stat => {
      formattedStats[stat._id] = {
        totalAmount: stat.totalAmount,
        count: stat.count
      };
    });

    // Format monthly data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = Array(12).fill(0).map((_, index) => {
      const monthStat = monthlyStats.find(stat => stat._id === index + 1);
      return {
        month: months[index],
        amount: monthStat ? monthStat.totalAmount : 0,
        count: monthStat ? monthStat.count : 0
      };
    });

    res.status(200).json({
      success: true,
      data: {
        totalCollected: formattedStats.paid ? formattedStats.paid.totalAmount : 0,
        totalPending: formattedStats.pending ? formattedStats.pending.totalAmount : 0,
        paidCount: formattedStats.paid ? formattedStats.paid.count : 0,
        pendingCount: formattedStats.pending ? formattedStats.pending.count : 0,
        monthlyCollection: monthlyData
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fee statistics',
      error: error.message
    });
  }
};

module.exports = {
  getFees,
  getFeeById,
  createFee,
  updateFee,
  deleteFee,
  getStudentFeeSummary,
  getFeeStats
};