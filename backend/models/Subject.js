const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide subject name'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Please provide subject code'],
    unique: true,
    trim: true
  },
  description: {
    type: String
  },
  credits: {
    type: Number,
    required: [true, 'Please provide subject credits']
  },
  department: {
    type: String,
    required: [true, 'Please provide department']
  },
  faculty: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Subject', SubjectSchema);