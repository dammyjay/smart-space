const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // use TLS instead of SSL
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendOtpEmail = (to, otp) => {
  return transporter.sendMail({
    to,
    subject: "Your OTP Code",
    text: `Your OTP is: ${otp}`,
  });
};
