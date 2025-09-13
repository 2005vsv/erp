const mongoose = require('mongoose');

const HostelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide hostel name'],
    trim: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['Boys', 'Girls', 'Co-ed'],
    required: true
  },
  capacity: {
    type: Number,
    required: [true, 'Please provide hostel capacity']
  },
  occupiedCount: {
    type: Number,
    default: 0
  },
  warden: {
    name: String,
    contactNumber: String,
    email: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String
  },
  rooms: [
    {
      roomNumber: {
        type: String,
        required: true
      },
      floor: Number,
      capacity: {
        type: Number,
        required: true
      },
      occupiedCount: {
        type: Number,
        default: 0
      },
      occupants: [
        {
          student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student'
          },
          allocationDate: {
            type: Date,
            default: Date.now
          },
          status: {
            type: String,
            enum: ['Active', 'Vacated'],
            default: 'Active'
          }
        }
      ],
      roomType: {
        type: String,
        enum: ['Single', 'Double', 'Triple', 'Dormitory'],
        default: 'Double'
      },
      amenities: [String],
      status: {
        type: String,
        enum: ['Available', 'Partially Occupied', 'Fully Occupied', 'Under Maintenance'],
        default: 'Available'
      }
    }
  ],
  facilities: [String],
  feePerSemester: {
    type: Number,
    required: true
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update room status based on occupancy
HostelSchema.pre('save', function(next) {
  if (this.isModified('rooms')) {
    let totalOccupied = 0;
    
    this.rooms.forEach(room => {
      const activeOccupants = room.occupants.filter(occupant => occupant.status === 'Active').length;
      room.occupiedCount = activeOccupants;
      totalOccupied += activeOccupants;
      
      // Update room status based on occupancy
      if (activeOccupants === 0) {
        room.status = 'Available';
      } else if (activeOccupants < room.capacity) {
        room.status = 'Partially Occupied';
      } else if (activeOccupants === room.capacity) {
        room.status = 'Fully Occupied';
      }
    });
    
    this.occupiedCount = totalOccupied;
  }
  
  next();
});

// Set updatedAt before update
HostelSchema.pre('findOneAndUpdate', function() {
  this.set({ updatedAt: Date.now() });
});

module.exports = mongoose.model('Hostel', HostelSchema);