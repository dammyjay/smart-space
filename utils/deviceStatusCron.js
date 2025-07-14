const cron = require("node-cron");
const { pool } = require("./db");

function startDeviceStatusCron() {
  // Run every 1 minute
  cron.schedule("* * * * *", async () => {
    try {
      const res = await pool.query(`
        UPDATE devices
        SET online = FALSE
        WHERE last_seen IS NOT NULL
          AND last_seen < NOW() - INTERVAL '1 minute'
      `);
      console.log(`⏱️ Device status updated: ${res.rowCount} marked offline`);
    } catch (err) {
      console.error("❌ Cron job error:", err.message);
    }
  });
}

module.exports = startDeviceStatusCron;
