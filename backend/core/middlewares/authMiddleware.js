// backend/middleware/auth.js
import jwt from "jsonwebtoken";
import { User } from "../../apps/auth/models/user.js"; // adjust path


export async function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userData = await User.objects.get({ id: decoded.id });

    if (userData) {
      // Force it into a proper User model instance
      req.user = Object.assign(new User(), userData);
    }
  } catch (err) {
    console.error("Auth error:", err);
  }

  next();
}
