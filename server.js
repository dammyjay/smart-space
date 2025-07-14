const express = require("express");
const session = require("express-session");
const path = require("path");
const cors = require("cors");
const createTables = require("./utils/initTable");
const { Pool } = require("pg");
const http = require("http");
const { initWebSocket } = require("./utils/websocket");
const startDeviceStatusCron = require("./utils/deviceStatusCron");

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
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    },
  })
);

// Attach pool to req for global access
app.use((req, res, next) => {
  req.pool = pool;
  next();
});

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


// 🆕 Start WebSocket server
initWebSocket(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
