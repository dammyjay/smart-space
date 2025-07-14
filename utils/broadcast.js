// utils/broadcast.js
const { wss } = require("./websocket"); // this should be your initialized WebSocketServer

function broadcast(data) {
  const message = JSON.stringify(data);

  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(message);
    }
  });
}

module.exports = broadcast;
