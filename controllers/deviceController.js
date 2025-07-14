let deviceStates = [false, false, false, false]; // Channel 1-4

exports.getStatus = (req, res) => {
  res.json({ channels: deviceStates });
};

exports.toggleDevice = (req, res) => {
  const { channelIndex } = req.body;
  if (channelIndex >= 0 && channelIndex < 4) {
    deviceStates[channelIndex] = !deviceStates[channelIndex];
    return res.json({ status: deviceStates[channelIndex] });
  }
  res.status(400).json({ error: "Invalid channel index" });
};
