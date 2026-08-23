import User from "../models/User.js";
import { generateToken } from "../config/generateToken.js";

export async function registerUser(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are all required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    // isApproved defaults to false — the account exists but can't log in
    // until an admin approves it from the Admin panel.
    const user = await User.create({ name, email, password });

    // No token here on purpose: registering does not grant access.
    return res.status(201).json({
      message: "Account created. An admin must approve you before you can log in.",
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    return res.status(500).json({ message: "Registration failed.", error: err.message });
  }
}

export async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (!user.isApproved) {
      return res.status(403).json({
        message: "Your account is waiting for admin approval. Please check back later.",
        pendingApproval: true,
      });
    }

    return res.json({
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    return res.status(500).json({ message: "Login failed.", error: err.message });
  }
}

export async function getMe(req, res) {
  // req.user is set by the `protect` middleware after verifying the JWT
  const { _id, name, email, role, createdAt } = req.user;
  return res.json({ id: _id, name, email, role, createdAt });
}

// GET /api/auth/pending (admin only) - students waiting for approval
export async function getPendingUsers(req, res) {
  try {
    const pending = await User.find({ isApproved: false, role: "student" })
      .select("name email createdAt")
      .sort({ createdAt: -1 });
    return res.json(pending);
  } catch (err) {
    return res.status(500).json({ message: "Could not fetch pending users.", error: err.message });
  }
}

// POST /api/auth/approve/:id (admin only)
export async function approveUser(req, res) {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    ).select("name email isApproved");
    if (!user) return res.status(404).json({ message: "User not found." });
    return res.json({ message: `${user.name} approved.`, user });
  } catch (err) {
    return res.status(500).json({ message: "Could not approve user.", error: err.message });
  }
}

// DELETE /api/auth/reject/:id (admin only) - removes the pending account entirely
export async function rejectUser(req, res) {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    return res.json({ message: `${user.name}'s registration was rejected.` });
  } catch (err) {
    return res.status(500).json({ message: "Could not reject user.", error: err.message });
  }
}
