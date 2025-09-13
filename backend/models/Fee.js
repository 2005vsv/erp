const mongoose = require('mongoose');

const FeeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  receiptNumber: {
    type: String,
    unique: true
  },
  feeType: {
    type: String,
    enum: ['Tuition', 'Hostel', 'Transport', 'Examination', 'Library', 'Laboratory', 'Admission', 'Other'],
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Please provide fee amount']
  },
  dueDate: {
    type: Date
  },
  paymentDate: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Cheque', 'Online Transfer', 'Credit/Debit Card', 'UPI', 'Other']
  },
  transactionId: {
    type: String
  },
  academicYear: {
    type: String,
    required: true
  },
  semester: {
    type: String
  },
  status: {
    type: String,
    enum: ['Pending', 'Partial', 'Paid', 'Overdue', 'Waived'],
    default: 'Pending'
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  remainingAmount: {
    type: Number
  },
  lateFeeFine: {
    type: Number,
    default: 0
  },
  remarks: {
    type: String
  },
  collectedBy: {
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

// Generate receipt number before saving
FeeSchema.pre('save', async function(next) {
  if (!this.receiptNumber) {
    const year = new Date().getFullYear().toString().substr(-2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const count = await this.constructor.countDocuments();
    this.receiptNumber = `FEE-${year}${month}-${(count + 1).toString().padStart(4, '0')}`;
  }
  
  // Calculate remaining amount
  if (this.amount && this.paidAmount !== undefined) {
    this.remainingAmount = this.amount - this.paidAmount;
  }
  
  next();
});

// Set updatedAt before update
FeeSchema.pre('findOneAndUpdate', function() {
  this.set({ updatedAt: Date.now() });
});

module.exports = mongoose.model('Fee', FeeSchema);