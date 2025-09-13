const Hostel = require('../models/Hostel');
const Student = require('../models/Student');

// @desc    Get all hostels
// @route   GET /api/hostels
// @access  Private
const getHostels = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Filter options
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;
    
    // Search by name
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: 'i' };
    }

    const total = await Hostel.countDocuments(filter);
    
    const hostels = await Hostel.find(filter)
      .sort({ name: 1 })
      .skip(startIndex)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: hostels.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: hostels
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hostels',
      error: error.message
    });
  }
};

// @desc    Get single hostel
// @route   GET /api/hostels/:id
// @access  Private
const getHostelById = async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);

    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: 'Hostel not found'
      });
    }

    res.status(200).json({
      success: true,
      data: hostel
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hostel details',
      error: error.message
    });
  }
};

// @desc    Create new hostel
// @route   POST /api/hostels
// @access  Private/Admin
const createHostel = async (req, res) => {
  try {
    // Create hostel
    const hostel = await Hostel.create(req.body);

    res.status(201).json({
      success: true,
      data: hostel
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create hostel',
      error: error.message
    });
  }
};

// @desc    Update hostel
// @route   PUT /api/hostels/:id
// @access  Private/Admin
const updateHostel = async (req, res) => {
  try {
    let hostel = await Hostel.findById(req.params.id);

    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: 'Hostel not found'
      });
    }

    // Update hostel
    hostel = await Hostel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: hostel
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update hostel',
      error: error.message
    });
  }
};

// @desc    Delete hostel
// @route   DELETE /api/hostels/:id
// @access  Private/Admin
const deleteHostel = async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);

    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: 'Hostel not found'
      });
    }

    // Check if any students are assigned to this hostel
    const studentsAssigned = await Student.countDocuments({ hostel: req.params.id });
    
    if (studentsAssigned > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete hostel. ${studentsAssigned} students are currently assigned to this hostel.`
      });
    }

    // Delete hostel
    await hostel.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete hostel',
      error: error.message
    });
  }
};

// @desc    Get hostel room availability
// @route   GET /api/hostels/:id/rooms
// @access  Private
const getHostelRooms = async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);

    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: 'Hostel not found'
      });
    }

    // Get room availability
    const rooms = hostel.rooms.map(room => ({
      roomNumber: room.roomNumber,
      capacity: room.capacity,
      occupiedCount: room.occupants.length,
      availableCount: room.capacity - room.occupants.length,
      status: room.status
    }));

    res.status(200).json({
      success: true,
      data: {
        hostelId: hostel._id,
        hostelName: hostel.name,
        totalCapacity: hostel.capacity,
        totalOccupied: hostel.rooms.reduce((sum, room) => sum + room.occupants.length, 0),
        rooms
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hostel rooms',
      error: error.message
    });
  }
};

// @desc    Assign student to hostel room
// @route   POST /api/hostels/:id/assign
// @access  Private/Admin
const assignRoom = async (req, res) => {
  try {
    const { studentId, roomNumber } = req.body;
    
    if (!studentId || !roomNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide student ID and room number'
      });
    }

    // Check if hostel exists
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: 'Hostel not found'
      });
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if room exists
    const room = hostel.rooms.find(r => r.roomNumber === roomNumber);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found in this hostel'
      });
    }

    // Check if room is full
    if (room.occupants.length >= room.capacity) {
      return res.status(400).json({
        success: false,
        message: 'Room is already at full capacity'
      });
    }

    // Check if student is already assigned to a room in this hostel
    const alreadyAssigned = hostel.rooms.some(r => 
      r.occupants.some(o => o.student.toString() === studentId)
    );

    if (alreadyAssigned) {
      return res.status(400).json({
        success: false,
        message: 'Student is already assigned to a room in this hostel'
      });
    }

    // Check if student is assigned to another hostel
    if (student.hostel && student.hostel.toString() !== req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Student is already assigned to another hostel'
      });
    }

    // Add student to room
    room.occupants.push({
      student: studentId,
      assignedDate: new Date()
    });

    // Update room status if full
    if (room.occupants.length >= room.capacity) {
      room.status = 'full';
    } else {
      room.status = 'partially_occupied';
    }

    // Save hostel
    await hostel.save();

    // Update student record
    student.hostel = hostel._id;
    student.hostelRoom = roomNumber;
    await student.save();

    res.status(200).json({
      success: true,
      message: 'Student assigned to hostel room successfully',
      data: {
        hostel: hostel.name,
        room: roomNumber,
        student: `${student.personalDetails.firstName} ${student.personalDetails.lastName}`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to assign room',
      error: error.message
    });
  }
};

// @desc    Remove student from hostel room
// @route   POST /api/hostels/:id/remove
// @access  Private/Admin
const removeFromRoom = async (req, res) => {
  try {
    const { studentId } = req.body;
    
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide student ID'
      });
    }

    // Check if hostel exists
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: 'Hostel not found'
      });
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Find which room the student is in
    let roomFound = false;
    let roomNumber = '';

    hostel.rooms.forEach(room => {
      const studentIndex = room.occupants.findIndex(
        o => o.student.toString() === studentId
      );

      if (studentIndex !== -1) {
        // Remove student from room
        room.occupants.splice(studentIndex, 1);
        roomFound = true;
        roomNumber = room.roomNumber;

        // Update room status
        if (room.occupants.length === 0) {
          room.status = 'vacant';
        } else {
          room.status = 'partially_occupied';
        }
      }
    });

    if (!roomFound) {
      return res.status(404).json({
        success: false,
        message: 'Student not found in any room in this hostel'
      });
    }

    // Save hostel
    await hostel.save();

    // Update student record
    student.hostel = null;
    student.hostelRoom = null;
    await student.save();

    res.status(200).json({
      success: true,
      message: 'Student removed from hostel room successfully',
      data: {
        hostel: hostel.name,
        room: roomNumber,
        student: `${student.personalDetails.firstName} ${student.personalDetails.lastName}`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to remove student from room',
      error: error.message
    });
  }
};

// @desc    Get hostel statistics
// @route   GET /api/hostels/stats
// @access  Private/Admin
const getHostelStats = async (req, res) => {
  try {
    // Get all hostels
    const hostels = await Hostel.find();

    // Calculate statistics
    const stats = {
      totalHostels: hostels.length,
      totalCapacity: 0,
      totalOccupied: 0,
      occupancyRate: 0,
      hostelTypeDistribution: {},
      hostelWiseOccupancy: []
    };

    // Process each hostel
    hostels.forEach(hostel => {
      const occupiedCount = hostel.rooms.reduce((sum, room) => sum + room.occupants.length, 0);
      
      stats.totalCapacity += hostel.capacity;
      stats.totalOccupied += occupiedCount;
      
      // Hostel type distribution
      if (stats.hostelTypeDistribution[hostel.type]) {
        stats.hostelTypeDistribution[hostel.type]++;
      } else {
        stats.hostelTypeDistribution[hostel.type] = 1;
      }

      // Hostel-wise occupancy
      stats.hostelWiseOccupancy.push({
        hostelId: hostel._id,
        hostelName: hostel.name,
        type: hostel.type,
        capacity: hostel.capacity,
        occupied: occupiedCount,
        occupancyRate: (occupiedCount / hostel.capacity) * 100
      });
    });

    // Calculate overall occupancy rate
    stats.occupancyRate = stats.totalCapacity > 0 
      ? (stats.totalOccupied / stats.totalCapacity) * 100 
      : 0;

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hostel statistics',
      error: error.message
    });
  }
};

module.exports = {
  getHostels,
  getHostelById,
  createHostel,
  updateHostel,
  deleteHostel,
  getHostelRooms,
  assignRoom,
  removeFromRoom,
  getHostelStats
};