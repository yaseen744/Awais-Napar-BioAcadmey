import User from "../models/User.js";
import { generateToken } from "../config/generateToken.js";
import { sendLoginOtpEmail, isMailerConfigured } from "../config/mailer.js";

const OTP_TTL_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits, always
}

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

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password +otpCode +otpExpiresAt +otpAttempts"
    );
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

    // Admins log straight in -- the OTP gate exists to stop STUDENTS sharing
    // credentials with each other; it would be pointless for the admin to
    // have to email a code to themselves every time.
    if (user.role === "admin") {
      return res.json({
        token: generateToken(user._id),
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      });
    }

    // --- Student login OTP gate ---
    // Correct email/password only gets a student to here. The actual code
    // needed to finish logging in is emailed to the admin(s), not the
    // student -- so credentials alone (e.g. shared with a friend) aren't
    // enough to get in without the admin handing over the code in person.
    if (!isMailerConfigured()) {
      return res.status(500).json({
        message:
          "Login codes are not configured on the server yet. Ask your admin to set up SMTP_EMAIL / SMTP_APP_PASSWORD.",
      });
    }

    const admins = await User.find({ role: "admin" }).select("email");
    if (admins.length === 0) {
      return res.status(500).json({ message: "No admin account exists to send the login code to." });
    }

    const otp = generateOtp();
    user.otpCode = otp;
    user.otpExpiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
    user.otpAttempts = 0;
    await user.save({ validateBeforeSave: false });

    try {
      await sendLoginOtpEmail({
        toEmails: admins.map((a) => a.email),
        otp,
        studentName: user.name,
        studentEmail: user.email,
      });
    } catch (mailErr) {
      return res.status(502).json({ message: "Could not send the login code. Try again shortly." });
    }

    return res.json({
      otpRequired: true,
      userId: user._id,
      message: "A login code was sent to your admin. Ask them for it to finish logging in.",
    });
  } catch (err) {
    return res.status(500).json({ message: "Login failed.", error: err.message });
  }
}

// POST /api/auth/verify-otp  { userId, otp }
// Second step of student login -- exchanges the admin-relayed code for the
// actual session token.
export async function verifyLoginOtp(req, res) {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
      return res.status(400).json({ message: "userId and otp are required." });
    }

    const user = await User.findById(userId).select("+otpCode +otpExpiresAt +otpAttempts");
    if (!user || !user.otpCode) {
      return res.status(400).json({ message: "No pending login. Please log in again." });
    }

    if (user.otpExpiresAt < new Date()) {
      user.otpCode = null;
      user.otpExpiresAt = null;
      user.otpAttempts = 0;
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({ message: "This code has expired. Please log in again." });
    }

    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      user.otpCode = null;
      user.otpExpiresAt = null;
      user.otpAttempts = 0;
      await user.save({ validateBeforeSave: false });
      return res.status(429).json({ message: "Too many wrong attempts. Please log in again." });
    }

    if (String(otp).trim() !== user.otpCode) {
      user.otpAttempts += 1;
      await user.save({ validateBeforeSave: false });
      return res.status(401).json({ message: "Incorrect code. Please try again." });
    }

    // Success -- clear the OTP so it can't be reused, then issue the real session.
    user.otpCode = null;
    user.otpExpiresAt = null;
    user.otpAttempts = 0;
    await user.save({ validateBeforeSave: false });

    return res.json({
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    return res.status(500).json({ message: "Could not verify code.", error: err.message });
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
