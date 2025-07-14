const fetch = require("node-fetch"); // Make sure it's installed

async function sendToESP(device_id, channelIndex, status) {
  const espIp = device_id; // device_id is the ESP IP
  const url = `http://${espIp}/toggle?channel=${channelIndex}&state=${
    status ? 1 : 0
  }`;

  try {
    await fetch(url);
    console.log(`✅ Sent to ESP: ${url}`);
  } catch (err) {
    console.error("❌ Failed to send to ESP:", err.message);
  }
}

module.exports = sendToESP;
