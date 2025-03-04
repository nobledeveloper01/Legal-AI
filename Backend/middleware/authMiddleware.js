import jwt from "jsonwebtoken";

const userAccessMap = new Map(); // Tracks user access count

export const verifyToken = (req, res, next) => {
  const ip = req.ip; // Get user IP (for guests)
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // Handle guest access (limit to 2 requests)
    if (!userAccessMap.has(ip)) {
      userAccessMap.set(ip, { count: 1, loggedIn: false });
    } else {
      let userData = userAccessMap.get(ip);
      if (userData.count >= 2) {
        return res.status(403).json({ error: "Please log in to continue." });
      }
      userData.count += 1;
      userAccessMap.set(ip, userData);
    }
    return next();
  }

  // If logged in, extract token
  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Track authenticated user access
    if (!userAccessMap.has(userId)) {
      userAccessMap.set(userId, { count: 1, loggedIn: true });
    } else {
      let userData = userAccessMap.get(userId);
      if (userData.count >= 3) {
        return res.status(403).json({ error: "Limit reached. Please purchase additional access." });
      }
      userData.count += 1;
      userAccessMap.set(userId, userData);
    }

    req.user = { id: userId };
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token", details: error.message });
  }
};
