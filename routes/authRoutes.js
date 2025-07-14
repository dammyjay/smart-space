const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const multer = require("multer");
const upload = multer(); // you can also configure it to save profile pics later


// Routes
router.get("/login", authController.getLogin);
router.post("/login", authController.postLogin);

router.get("/signup", authController.getSignup);
// router.post("/signup", authController.postSignup);
router.post("/signup", upload.none(), authController.postSignup);

router.post("/verify-otp", authController.verifyOtp);
router.get("/logout", authController.logout);

function requireLogin(req, res, next) {
  if (!req.session.user) return res.status(401).send("Unauthorized");
  next();
}

router.get("/profile", authController.getProfile); 

router.post("/profile", authController.uploadForm, authController.postProfile); 

module.exports = router;
