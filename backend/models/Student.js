const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  registrationNumber: {
    type: String,
    required: [true, 'Please provide a registration number'],
    unique: true,
    trim: true
  },
  firstName: {
    type: String,
    required: [true, 'Please provide first name'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Please provide last name'],
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Please provide date of birth']
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: [true, 'Please specify gender']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ],
    lowercase: true
  },
  contactNumber: {
    type: String,
    required: [true, 'Please provide contact number']
  },
  alternateContactNumber: {
    type: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  guardianDetails: {
    name: String,
    relationship: String,
    contactNumber: String,
    email: String,
    address: String
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Please specify course']
  },
  batch: {
    type: String,
    required: [true, 'Please specify batch year']
  },
  section: {
    type: String
  },
  admissionDate: {
    type: Date,
    default: Date.now
  },
  academicStatus: {
    type: String,
    enum: ['Active', 'Inactive', 'Graduated', 'Suspended', 'Withdrawn'],
    default: 'Active'
  },
  hostelResident: {
    type: Boolean,
    default: false
  },
  hostelDetails: {
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel'
    },
    roomNumber: String,
    allocationDate: Date
  },
  profileImage: {
    type: String
  },
  documents: [
    {
      name: String,
      documentType: String,
      fileUrl: String,
      uploadDate: {
        type: Date,
        default: Date.now
      }
    }
  ],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Create a virtual for full name
StudentSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Set updatedAt before update
StudentSchema.pre('findOneAndUpdate', function() {
  this.set({ updatedAt: Date.now() });
});

module.exports = mongoose.model('Student', StudentSchema);