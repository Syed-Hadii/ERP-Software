const express = require('express');
const userRouter = express.Router();
const {
  createUser,
  loginUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  deleteMultipleUsers,
  refreshToken,
  logout,
  changePassword
} = require('../controllers/userController');
const { protect, admin } = require('../middlewares/authMiddleware');

userRouter.post('/change-password', protect, changePassword);
userRouter.route('/').post(protect, admin, createUser).get(protect, admin, getUsers).delete(protect, admin, deleteMultipleUsers);
userRouter.post('/login', loginUser);
userRouter
  .route('/:id')
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUser)
  .delete(protect, admin, deleteUser);
userRouter.post('/refresh-token', refreshToken);
userRouter.post('/logout', protect, logout); 

module.exports = userRouter;