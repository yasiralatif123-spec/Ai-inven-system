const jwt = require("jsonwebtoken");

function authenticate(req, res, next) {
  try {
    const token =
      req.cookies?.accessToken ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = { id: decoded.sub, role: decoded.role };

    // Optional: also ensure session is present/valid depending on your auth strategy
    // if (!req.session?.userId) return res.status(401).json({ message: "Session expired" });

    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

module.exports = { authenticate };
