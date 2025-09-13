const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateProfile
} = require('../controllers/user.controller');

// Protected routes
router.use(protect);

// User profile route
router.put('/profile', updateProfile);

// Admin only routes
router.use(authorize('admin'));
router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .get(getUserById)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;