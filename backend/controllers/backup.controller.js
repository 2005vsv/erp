const Backup = require('../models/Backup');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// @desc    Create a new backup
// @route   POST /api/backups
// @access  Private/Admin
const createBackup = async (req, res) => {
  try {
    const backupDir = process.env.BACKUP_DIR || path.join(__dirname, '../../backups');
    
    // Create backup directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupFileName = `erp_backup_${timestamp}.gz`;
    const backupPath = path.join(backupDir, backupFileName);
    
    // Get MongoDB URI from environment or use default
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp-student-management';
    
    // Create backup using mongodump
    const command = `mongodump --uri="${mongoURI}" --archive="${backupPath}" --gzip`;
    
    await execPromise(command);
    
    // Create backup record in database
    const backup = await Backup.create({
      fileName: backupFileName,
      filePath: backupPath,
      createdBy: req.user.id,
      size: fs.statSync(backupPath).size,
      description: req.body.description || 'Manual backup'
    });
    
    res.status(201).json({
      success: true,
      data: backup
    });
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create backup',
      error: error.message
    });
  }
};

// @desc    Get all backups
// @route   GET /api/backups
// @access  Private/Admin
const getBackups = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    const total = await Backup.countDocuments();
    
    const backups = await Backup.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
    
    res.status(200).json({
      success: true,
      count: backups.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: backups
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch backups',
      error: error.message
    });
  }
};

// @desc    Download a backup
// @route   GET /api/backups/:id/download
// @access  Private/Admin
const downloadBackup = async (req, res) => {
  try {
    const backup = await Backup.findById(req.params.id);
    
    if (!backup) {
      return res.status(404).json({
        success: false,
        message: 'Backup not found'
      });
    }
    
    // Check if file exists
    if (!fs.existsSync(backup.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Backup file not found on server'
      });
    }
    
    res.download(backup.filePath, backup.fileName);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to download backup',
      error: error.message
    });
  }
};

// @desc    Delete a backup
// @route   DELETE /api/backups/:id
// @access  Private/Admin
const deleteBackup = async (req, res) => {
  try {
    const backup = await Backup.findById(req.params.id);
    
    if (!backup) {
      return res.status(404).json({
        success: false,
        message: 'Backup not found'
      });
    }
    
    // Delete file if it exists
    if (fs.existsSync(backup.filePath)) {
      fs.unlinkSync(backup.filePath);
    }
    
    // Delete backup record
    await backup.remove();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete backup',
      error: error.message
    });
  }
};

// @desc    Restore from a backup
// @route   POST /api/backups/:id/restore
// @access  Private/Admin
const restoreBackup = async (req, res) => {
  try {
    const backup = await Backup.findById(req.params.id);
    
    if (!backup) {
      return res.status(404).json({
        success: false,
        message: 'Backup not found'
      });
    }
    
    // Check if file exists
    if (!fs.existsSync(backup.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Backup file not found on server'
      });
    }
    
    // Get MongoDB URI from environment or use default
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp-student-management';
    
    // Restore backup using mongorestore
    const command = `mongorestore --uri="${mongoURI}" --archive="${backup.filePath}" --gzip --drop`;
    
    await execPromise(command);
    
    // Update backup record
    backup.lastRestored = Date.now();
    await backup.save();
    
    res.status(200).json({
      success: true,
      message: 'Database restored successfully',
      data: backup
    });
  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore backup',
      error: error.message
    });
  }
};

// @desc    Schedule automatic backups
// @route   POST /api/backups/schedule
// @access  Private/Admin
const scheduleBackups = async (req, res) => {
  try {
    // Update backup schedule settings
    const { frequency, time, retention } = req.body;
    
    // Validate input
    if (!['daily', 'weekly', 'monthly'].includes(frequency)) {
      return res.status(400).json({
        success: false,
        message: 'Frequency must be daily, weekly, or monthly'
      });
    }
    
    // Save schedule settings to database or config file
    // This would typically be implemented with a scheduler like node-cron
    // For this example, we'll just return success
    
    res.status(200).json({
      success: true,
      message: 'Backup schedule updated successfully',
      data: { frequency, time, retention }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to schedule backups',
      error: error.message
    });
  }
};

module.exports = {
  createBackup,
  getBackups,
  downloadBackup,
  deleteBackup,
  restoreBackup,
  scheduleBackups
};