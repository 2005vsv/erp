const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  createBackup,
  getBackups,
  downloadBackup,
  deleteBackup,
  restoreBackup,
  scheduleBackups
} = require('../controllers/backup.controller');

// All backup routes are protected and admin-only
router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(getBackups)
  .post(createBackup);

router.post('/schedule', scheduleBackups);

router.route('/:id')
  .delete(deleteBackup);

router.get('/:id/download', downloadBackup);
router.post('/:id/restore', restoreBackup);

module.exports = router;