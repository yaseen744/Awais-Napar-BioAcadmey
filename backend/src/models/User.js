import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // never return password by default
    },
    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },
    points: {
      type: Number,
      default: 0,
    },
    // A newly registered student cannot log in until an admin approves them.
    // Admin accounts are approved automatically (see makeAdmin.js).
    isApproved: {
      type: Boolean,
      default: false,
    },
    // --- Login OTP gate ---
    // Even with the right email/password, a student can only finish logging
    // in with a one-time code that gets emailed to the admin(s), not to the
    // student. This is how "sir" controls who's actually logging in even if
    // credentials get shared.
    otpCode: {
      type: String,
      default: null,
      select: false,
    },
    otpExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },
    otpAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);
