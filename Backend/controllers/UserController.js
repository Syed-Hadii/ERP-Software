const mongoose = require('mongoose');
const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

// @desc    Create a new user
// @route   POST /api/users
// @access  Admin
const createUser = asyncHandler(async (req, res) => {
  const { name, role, email, password, phone, initialSalary, basicSalary } = req.body;
  // console.log(req.body)

  // Validate required fields
  if (!name || !role || !email || !password) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = await User.create({
    name,
    role,
    email,
    password: hashedPassword,
    phone,
    ...(role !== 'Admin' && { initialSalary: initialSalary || 0 }), // Only add salary for non-Admins
    ...(role !== 'Admin' && { basicSalary: initialSalary || 0 }) // Set basicSalary for non-Admins
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      role: user.role,
      email: user.email,
      phone: user.phone,
      ...(role !== 'Admin' && { initialSalary: user.initialSalary }), // Only include salary for non-Admins
      ...(role !== 'Admin' && { basicSalary: user.basicSalary })
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// Add these functions in the controller
const generateTokens = (userId, role, name, email) => {
  const accessToken = jwt.sign(
    { userId, role, name, email },
    process.env.JWT_SECRET_KEY,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, role, name, email },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// @desc    Login user and get token
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    const { accessToken, refreshToken } = generateTokens(user._id, user.role, user.name,
      user.email);

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      role: user.role,
      email: user.email,
      accessToken,
      refreshToken,
      ...(user.role !== 'Admin' && { initialSalary: user.initialSalary }), // Only include salary for non-Admins
      ...(user.role !== 'Admin' && { basicSalary: user.basicSalary })

    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// Add these new controller functions
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      res.status(401);
      throw new Error('Invalid refresh token');
    }

    const tokens = generateTokens(user._id, user.role);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    res.json(tokens);
  } catch (error) {
    res.status(401);
    throw new Error('Invalid refresh token');
  }
});

const logout = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    user.refreshToken = null;
    await user.save();
  }
  res.json({ message: 'Logged out successfully' });
});

// @desc    Get all users
// @route   GET /api/users
// @access  Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password');
  // const users = await User.find({});
  res.json(users);
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.role = req.body.role || user.role;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      role: updatedUser.role,
      email: updatedUser.email,
      phone: updatedUser.phone,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Admin
const deleteUser = asyncHandler(async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser)
      return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
const deleteMultipleUsers = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: "Field 'ids' is required and must be an array" });
    }
    const result = await User.deleteMany({ _id: { $in: ids } });
    res.json({ message: `${result.deletedCount} User(s) deleted successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// @desc    Change user password
// @route   PUT /api/users/change-password
// @access  Private (Authenticated users)
const changePassword = asyncHandler(async (req, res) => {
  console.log("🔐 [Password Change] Request Received");
  console.log("🧾 Request Body:", req.body);
  console.log("👤 req.user:", req.user);

  const { oldPassword, newPassword } = req.body;

  // 1. Check for missing fields
  if (!oldPassword || !newPassword) {
    console.error("❌ Missing old or new password in request body");
    res.status(400);
    throw new Error("Both old and new passwords are required");
  }

  // 2. Get user ID from middleware
  const userId = req.user?._id;
  console.log("👤 Authenticated User ID:", userId);

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    console.error("❌ Invalid or missing user ID in req.user");
    res.status(401);
    throw new Error("Unauthorized access - invalid user ID");
  }

  // 3. Find user in DB
  const user = await User.findById(userId);
  if (!user) {
    console.error("❌ No user found with ID:", userId);
    res.status(404);
    throw new Error("User not found");
  }

  // 4. Compare old password
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  console.log("🔍 Password match status:", isMatch);

  if (!isMatch) {
    console.warn("⚠️ Incorrect old password for user:", user.email);
    res.status(400);
    throw new Error("Old password is incorrect");
  }

  // 5. Validate new password
  if (newPassword.length < 6) {
    console.warn("⚠️ New password too short");
    res.status(400);
    throw new Error("New password must be at least 6 characters");
  }

  // 6. Update password
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();

  console.log(`✅ Password updated successfully for user: ${user.email}`);

  res.json({ message: "Password updated successfully" });
});

module.exports = {
  createUser,
  loginUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  deleteMultipleUsers,
  refreshToken,
  logout,
  changePassword,
};