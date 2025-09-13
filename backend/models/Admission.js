const mongoose = require('mongoose');

const AdmissionSchema = new mongoose.Schema({
  applicationNumber: {
    type: String,
    required: true,
    unique: true
  },
  applicantName: {
    type: String,
    required: [true, 'Please provide applicant name'],
    trim: true
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
  dateOfBirth: {
    type: Date,
    required: [true, 'Please provide date of birth']
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: [true, 'Please specify gender']
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
    email: String
  },
  previousEducation: [
    {
      institutionName: String,
      degree: String,
      fieldOfStudy: String,
      yearOfCompletion: Number,
      percentage: Number
    }
  ],
  appliedCourse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Please specify applied course']
  },
  applicationDate: {
    type: Date,
    default: Date.now
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
  status: {
    type: String,
    enum: ['Pending', 'Under Review', 'Approved', 'Rejected', 'Waitlisted', 'Enrolled'],
    default: 'Pending'
  },
  remarks: {
    type: String
  },
  interviewDate: {
    type: Date
  },
  interviewScore: {
    type: Number
  },
  admissionFee: {
    amount: Number,
    paid: {
      type: Boolean,
      default: false
    },
    transactionDetails: {
      transactionId: String,
      paymentDate: Date,
      paymentMethod: String
    }
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
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

// Generate application number before saving
AdmissionSchema.pre('save', async function(next) {
  if (!this.applicationNumber) {
    const year = new Date().getFullYear().toString().substr(-2);
    const count = await this.constructor.countDocuments();
    this.applicationNumber = `ADM-${year}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

// Set updatedAt before update
AdmissionSchema.pre('findOneAndUpdate', function() {
  this.set({ updatedAt: Date.now() });
});

module.exports = mongoose.model('Admission', AdmissionSchema);