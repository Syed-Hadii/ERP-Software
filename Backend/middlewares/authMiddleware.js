const jwt = require('jsonwebtoken');
const User = require('../models/userModel.js');
const asyncHandler = require('express-async-handler')

const verifyToken = async (req, res, next) => {
    try {
        const accessToken = req.header("Authorization")?.replace("Bearer ", "");
        const refreshToken = req.header("x-refresh-token");

        if (!accessToken && !refreshToken) {
            return res.status(401).json({ message: "Access denied. No tokens provided." });
        }

        try {
            // First try to verify access token
            const decoded = jwt.verify(accessToken, process.env.JWT_SECRET_KEY);
            const user = await User.findById(decoded.id);
            if (!user) {
                return res.status(401).json({ message: "User not found" });
            }
            req.user = user;
            next();
        } catch (error) {
            // If access token fails, try refresh token
            if (!refreshToken) {
                return res.status(401).json({ message: "Access token expired and no refresh token" });
            }

            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            const user = await User.findById(decoded.id);

            if (!user) {
                return res.status(401).json({ message: "User not found" });
            }

            // Generate new access token
            const newAccessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
                expiresIn: "24h"
            });

            // Send new access token in response header
            res.setHeader("x-new-access-token", newAccessToken);

            req.user = user;
            next();
        }
    } catch (error) {
        console.log(error);
        return res.status(400).json({ message: "Invalid tokens" });
    }
};

const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            // console.log("🔑 Token received:", token);  

            const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
            // console.log("🧾 Decoded JWT payload:", decoded);  

            if (!decoded.userId) {
                console.error("❌ JWT payload missing userId");
                res.status(401);
                throw new Error('Not authorized, invalid token payload');
            }

            const user = await User.findById(decoded.userId).select('-password');
            if (!user) {
                console.error("❌ No user found for ID:", decoded.userId);
                res.status(401);
                throw new Error('Not authorized, user not found');
            }

            req.user = user;
            // console.log("👤 req.user set:", req.user);  
            next();
        } catch (error) {
            console.error("❌ Token verification failed:", error.message);
            res.status(401);
            throw new Error('Not authorized, token failed');
        }
    } else {
        console.error("❌ No token provided in Authorization header");
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

const admin = asyncHandler(async (req, res, next) => {
    if (req.user && req.user.role === 'Admin' || req.user.role === 'HR Manager') {
        next();
    } else {
        res.status(403);
        throw new Error('Not authorized as admin');
    }
});

// Role-based middleware for notifications
const notificationAccess = asyncHandler(async (req, res, next) => {
    if (!req.user) {
        res.status(401);
        throw new Error('Not authorized, no user');
    }

    // Apply role-based filters to the query
    if (req.user.role === 'Admin') {
        // Admin can see all notifications
        next();
    } else if (req.user.role === 'Crop Manager') {
        // Crop manager can only see agriculture domain notifications
        req.notificationFilter = { domain: 'agriculture' };
        next();
    } else if (req.user.role === 'Inventory Manager') {
        // Inventory manager can only see inventory domain notifications
        req.notificationFilter = { domain: 'inventory' };
        next();
    } else if (req.user.role === 'Dairy Manager') {
        // Dairy manager can only see cattle domain notifications
        req.notificationFilter = { domain: 'cattle' };
        next();
    } else {
        // Other roles can see general notifications
        req.notificationFilter = {};
        next();
    }
});

module.exports = { protect, admin, notificationAccess };