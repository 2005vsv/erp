const mongoose = require('mongoose');

const ExamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide exam name'],
    trim: true
  },
  examType: {
    type: String,
    enum: ['Mid Semester', 'End Semester', 'Quiz', 'Assignment', 'Project', 'Practical', 'Other'],
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  semester: {
    type: String,
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },
  examDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  totalMarks: {
    type: Number,
    required: true
  },
  passingMarks: {
    type: Number,
    required: true
  },
  venue: {
    type: String
  },
  invigilators: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  status: {
    type: String,
    enum: ['Scheduled', 'Ongoing', 'Completed', 'Cancelled', 'Postponed'],
    default: 'Scheduled'
  },
  results: [
    {
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
      },
      marksObtained: {
        type: Number,
        required: true
      },
      grade: {
        type: String
      },
      status: {
        type: String,
        enum: ['Pass', 'Fail', 'Absent', 'Incomplete'],
        required: true
      },
      remarks: String,
      evaluatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      evaluationDate: {
        type: Date,
        default: Date.now
      }
    }
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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

// Calculate grades based on marks obtained
ExamSchema.pre('save', function(next) {
  if (this.isModified('results')) {
    this.results.forEach(result => {
      if (result.marksObtained !== undefined && !result.grade) {
        const percentage = (result.marksObtained / this.totalMarks) * 100;
        
        // Assign grade based on percentage
        if (percentage >= 90) {
          result.grade = 'A+';
        } else if (percentage >= 80) {
          result.grade = 'A';
        } else if (percentage >= 70) {
          result.grade = 'B+';
        } else if (percentage >= 60) {
          result.grade = 'B';
        } else if (percentage >= 50) {
          result.grade = 'C';
        } else if (percentage >= 40) {
          result.grade = 'D';
        } else {
          result.grade = 'F';
        }
        
        // Update status based on passing marks
        if (result.marksObtained >= this.passingMarks) {
          result.status = 'Pass';
        } else {
          result.status = 'Fail';
        }
      }
    });
  }
  
  next();
});

// Set updatedAt before update
ExamSchema.pre('findOneAndUpdate', function() {
  this.set({ updatedAt: Date.now() });
});

module.exports = mongoose.model('Exam', ExamSchema);