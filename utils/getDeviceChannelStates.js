// const { pool } = require("./db");

// async function getDeviceChannelStates(device_id) {
//   const result = await pool.query(
//     `SELECT channel_index, status FROM device_status WHERE device_id = $1`,
//     [device_id]
//   );

//   const states = [false, false, false, false]; // default
//   result.rows.forEach(({ channel_index, status }) => {
//     states[channel_index] = status;
//   });

//   return states;
// }

// module.exports = getDeviceChannelStates;



// utils/getDeviceChannelStates.js
const { pool } = require("./db");

async function getDeviceChannelStates(device_id) {
  const result = await pool.query(
    `SELECT channel_index, status FROM channel_status WHERE device_id = $1 ORDER BY channel_index ASC`,
    [device_id]
  );

  const states = [false, false, false, false];
  result.rows.forEach(({ channel_index, status }) => {
    states[channel_index] = status;
  });

  return states;
}

module.exports = getDeviceChannelStates;

