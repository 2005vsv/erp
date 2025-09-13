const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getHostels,
  getHostelById,
  createHostel,
  updateHostel,
  deleteHostel,
  getHostelRooms,
  assignRoom,
  removeFromRoom,
  getHostelStats
} = require('../controllers/hostel.controller');

// Protected routes
router.use(protect);

// Routes accessible by all authenticated users
router.get('/', getHostels);
router.get('/:id', getHostelById);
router.get('/:id/rooms', getHostelRooms);

// Admin and staff routes
router.use(authorize(['admin', 'staff']));

router.get('/stats/all', getHostelStats);

// Admin only routes
router.use(authorize('admin'));

router.post('/', createHostel);
router.put('/:id', updateHostel);
router.delete('/:id', deleteHostel);
router.post('/:id/assign', assignRoom);
router.post('/:id/remove', removeFromRoom);

module.exports = router;