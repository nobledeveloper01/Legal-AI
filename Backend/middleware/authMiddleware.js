// authMiddleware.js
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

export const userAccessMap = new Map();
const TWO_HOURS_IN_MS = 2 * 60 * 60 * 1000;
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;
const ONE_HOUR_IN_MS = 60 * 60 * 1000;

const checkAndResetAccess = (userData, timeWindow) => {
  const currentTime = Date.now();
  if (currentTime - userData.timestamp >= timeWindow) {
    userData.count = 0;
    userData.timestamp = currentTime;
  }
  return userData;
};
// Middleware to verify token and enforce access limits
export const verifyToken = (req, res, next) => {
  const ip = req.ip;
  const authHeader = req.headers.authorization;
  const currentTime = Date.now();

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // Anonymous user handling
    let userData = userAccessMap.get(ip) || {
      count: 0,
      loggedIn: false,
      tempId: uuidv4(),
      timestamp: currentTime,
    };

    userData = checkAndResetAccess(userData, TWO_HOURS_IN_MS);

    // Only enforce limit for POST requests (uploads)
    if (req.method === "POST" && userData.count >= 3) {
      const timeLeft = TWO_HOURS_IN_MS - (currentTime - userData.timestamp);
      return res.status(429).json({
        error: "Upload limit reached for anonymous users (3 every 2 hours). Please log in or wait.",
        waitTime: Math.ceil(timeLeft / 60000),
      });
    }

    userAccessMap.set(ip, userData);
    req.user = { id: userData.tempId, isAnonymous: true, count: userData.count };
    return next();
  }

  // Authenticated user handling
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;
    let userData = userAccessMap.get(userId) || {
      count: 0,
      loggedIn: true,
      timestamp: currentTime,
    };

    userData = checkAndResetAccess(userData, ONE_DAY_IN_MS);

    // Only enforce limit for POST requests (uploads)
    if (req.method === "POST" && userData.count >= 10) {
      const timeLeft = ONE_DAY_IN_MS - (currentTime - userData.timestamp);
      return res.status(429).json({
        error: "Upload limit reached for authorized users (10 per day). Please wait until tomorrow.",
        waitTime: Math.ceil(timeLeft / 3600000),
      });
    }

    userAccessMap.set(userId, userData);
    req.user = { id: userId, isAnonymous: false, count: userData.count };
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token", details: error.message });
  }
};

const cleanupOldEntries = () => {
  const currentTime = Date.now();
  for (const [key, value] of userAccessMap.entries()) {
    const timeWindow = value.loggedIn ? ONE_DAY_IN_MS : TWO_HOURS_IN_MS;
    if (currentTime - value.timestamp >= timeWindow * 2) {
      userAccessMap.delete(key);
    }
  }
};
setInterval(cleanupOldEntries, ONE_HOUR_IN_MS);

export {  checkAndResetAccess, cleanupOldEntries };





