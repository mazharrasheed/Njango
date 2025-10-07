import jwt from "jsonwebtoken";

export function authenticate(req, res, next) {
    console.log('i m authenticate middleware')
    // console.log("JWT_SECRET:", process.env.JWT_SECRET);
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // ✅ Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Attach decoded user to request
    req.user = decoded;

    next(); // continue to controller
  } catch (err) {
    console.error("JWT error:", err);
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
