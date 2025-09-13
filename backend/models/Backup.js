const mongoose = require('mongoose');

const BackupSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  backupType: {
    type: String,
    enum: ['Full', 'Incremental', 'Differential', 'Manual'],
    default: 'Full'
  },
  status: {
    type: String,
    enum: ['Success', 'Failed', 'In Progress'],
    default: 'Success'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Backup', BackupSchema);