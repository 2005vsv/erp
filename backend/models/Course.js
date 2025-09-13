const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide course name'],
    trim: true,
    unique: true
  },
  code: {
    type: String,
    required: [true, 'Please provide course code'],
    unique: true,
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Please provide department']
  },
  duration: {
    type: Number,
    required: [true, 'Please provide course duration in years']
  },
  description: {
    type: String
  },
  semesters: [
    {
      semesterNumber: Number,
      subjects: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Subject'
        }
      ]
    }
  ],
  totalFee: {
    type: Number,
    required: [true, 'Please provide total course fee']
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Course', CourseSchema);