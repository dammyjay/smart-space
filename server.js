const express = require("express");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const path = require("path");
const cors = require("cors");
const createTables = require("./utils/initTable");
const { Pool } = require("pg");
const http = require("http");
const { initWebSocket } = require("./utils/websocket");
const startDeviceStatusCron = require("./utils/deviceStatusCron");
const { createProxyMiddleware } = require("http-proxy-middleware");

require("dotenv").config();

const app = express();
const server = http.createServer(app); // 🆕 wrap express in HTTP server

// PostgreSQL Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false,
//     cookie: {
//       sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
//       secure: process.env.NODE_ENV === "production",
//     },
//   })
// );

app.use(
  session({
    store: new pgSession({ pool }), // make sure pool is from pg
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    // cookie: {
    //   secure: false, // true in HTTPS
    //   maxAge: 24 * 60 * 60 * 1000,
    // },

    cookie: {
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production", // ✅ must be true for HTTPS
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);


// Attach pool to req for global access
app.use((req, res, next) => {
  req.pool = pool;
  next();
});

app.set("trust proxy", 1);

// Routes
app.use("/", require("./routes/authRoutes"));
app.use("/devices", require("./routes/deviceRoutes"));
app.use("/notifications", require("./routes/notificationRoutes"));

// Views
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "views", "welcome.html"))
);
app.get("/dashboard", (req, res) =>
  res.sendFile(path.join(__dirname, "views", "dashboard.html"))
);

// Run table creation at startup
createTables();

startDeviceStatusCron(); // ⏱️ Start checking devices every 1 min

// Route to get camera stream URL
// app.get("/camera-url", (req, res) => {
//   res.json({
//     url: process.env.CAMERA_URL || "http://192.168.0.101:8081/?action=stream"
//   });
// });

// Function to check if camera stream is online
async function isCameraOnline(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3s timeout

    const res = await fetch(url, { method: "HEAD", signal: controller.signal });
    clearTimeout(timeout);

    return res.ok;
  } catch (err) {
    return false;
  }
}

// Camera URL endpoint
// app.get("/camera-url", async (req, res) => {
//   const cameraUrl = process.env.CAMERA_STREAM_URL;

//   if (!cameraUrl) {
//     return res.status(500).json({ error: "Camera URL not set" });
//   }

//   const online = await isCameraOnline(cameraUrl);

//   if (online) {
//     res.json({ url: cameraUrl });
//   } else {
//     res.json({ url: null });
//   }
// });

// Poll the database for camera_url changes and cache the latest value per user
const cameraUrlCache = new Map();

async function pollCameraUrls() {
  try {
    const result = await pool.query("SELECT id, camera_url FROM users");
    result.rows.forEach(row => {
      cameraUrlCache.set(row.id, row.camera_url);
    });
  } catch (err) {
    console.error("❌ Error polling camera URLs:", err);
  }
}

// Poll every 10 seconds (adjust as needed)
setInterval(pollCameraUrls, 10000);
pollCameraUrls(); // Initial load

app.get("/camera-url", async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Use cached value if available, fallback to env
    let cameraUrl = cameraUrlCache.get(userId) || process.env.CAMERA_STREAM_URL;
    if (!cameraUrl) return res.json({ url: null });

    res.json({ url: cameraUrl });
  } catch (err) {
    console.error("❌ Camera URL fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// 🆕 Start WebSocket server
initWebSocket(server);



// Proxy camera stream
app.use(
  "/proxy-stream",
  createProxyMiddleware({
    target: process.env.CAMERA_STREAM_URL || "http://192.168.0.101:8080",
    changeOrigin: true,
    pathRewrite: { "^/proxy-stream": "" },
  })
);


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
