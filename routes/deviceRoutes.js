const express = require("express");
const router = express.Router();
const deviceController = require("../controllers/deviceController");
const getDeviceChannelStates = require("../utils/getDeviceChannelStates");
const sendToESP = require("../utils/sendToESP"); // if using real ESP
const { pool } = require("../utils/db"); // or wherever your db.js is
// const broadcast = require("../utils/broadcast");
const { broadcast } = require("../utils/websocket");

router.get("/status", deviceController.getStatus);
// router.post("/toggle", deviceController.toggleDevice);

router.post("/toggle", async (req, res) => {
  const userId = req.session.user?.id;
  const { channelIndex } = req.body;

  try {
    // Get device_id for this user
    const userResult = await pool.query(
      "SELECT device_id FROM users WHERE id = $1",
      [userId]
    );
    const device_id = userResult.rows[0]?.device_id;
    if (!device_id) return res.status(400).send("No device assigned");

    // Get current status
    const statusResult = await pool.query(
      `SELECT status FROM channel_status WHERE device_id = $1 AND channel_index = $2`,
      [device_id, channelIndex]
    );

    const currentStatus = statusResult.rows[0]?.status ?? false;
    const newStatus = !currentStatus;

    // Insert or update device_status
    await pool.query(
      `INSERT INTO channel_status (device_id, channel_index, status)
       VALUES ($1, $2, $3)
       ON CONFLICT (device_id, channel_index)
       DO UPDATE SET status = $3, updated_at = CURRENT_TIMESTAMP`,
      [device_id, channelIndex, newStatus]
    );

    // Insert notification
    await pool.query(
      `INSERT INTO notifications (user_id, type, message)
       VALUES ($1, $2, $3)`,
      [
        userId,
        "toggle",
        `Channel ${channelIndex + 1} turned ${newStatus ? "ON" : "OFF"}`,
      ]
    );

    // Broadcast updated state to WebSocket clients
    // broadcast({ channels: await getDeviceChannelStates(device_id) });
    const updatedStates = await getDeviceChannelStates(device_id);
    broadcast({ channels: updatedStates });
    await sendToESP(device_id, channelIndex, newStatus); // only if using ESP

    // Send to ESP here if needed
    // sendToESP(device_id, channelIndex, newStatus);

    res.json({ status: newStatus });
  } catch (err) {
    console.error("Toggle error:", err.message);
    res.status(500).send("Error toggling device.");
  }
});

// In routes/deviceRoutes.js or a dedicated espRoutes.js
router.post("/heartbeat", async (req, res) => {
  const { device_id } = req.body;

  if (!device_id) return res.status(400).send("Missing device_id");

  try {
    await pool.query(
      `UPDATE devices
       SET last_seen = CURRENT_TIMESTAMP, online = TRUE
       WHERE device_id = $1`,
      [device_id]
    );

    res.send("✅ Heartbeat received");
  } catch (err) {
    console.error("❌ Heartbeat error:", err.message);
    res.status(500).send("Server error");
  }
});

router.get("/my-status", async (req, res) => {
  const userId = req.session.user?.id;
  if (!userId) return res.status(401).send("Unauthorized");

  try {
    const result = await pool.query(
      `SELECT device_id, online, last_seen FROM devices WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0)
      return res.status(404).send("Device not found");

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error fetching device status:", err.message);
    res.status(500).send("Server error");
  }
});




module.exports = router;
