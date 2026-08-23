import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Blocks access unless a valid JWT is present.
// This is what enforces "register/login first, then access" site-wide.
export async function protect(req, res, next) {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized. Please log in." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "User no longer exists." });
    }
    // Safety net: if an admin revokes approval after a token was already
    // issued, block access on the very next request instead of waiting
    // for the token to expire.
    if (!user.isApproved) {
      return res.status(403).json({
        message: "Your account is waiting for admin approval.",
        pendingApproval: true,
      });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token. Please log in again." });
  }
}

// Restrict a route to admin accounts only (e.g. adding questions)
export function adminOnly(req, res, next) {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Admins only." });
}
