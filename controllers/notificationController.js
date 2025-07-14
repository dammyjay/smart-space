let notifications = [];

exports.getNotifications = (req, res) => {
  res.json(notifications);
};

exports.addNotification = (type, message) => {
  notifications.push({ type, message, time: new Date() });
  if (notifications.length > 20) notifications.shift(); // Keep only 20 recent
};
