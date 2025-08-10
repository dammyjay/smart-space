const path = require("path");
const { pool } = require("../utils/db");
const { sendOtpEmail } = require("../utils/email");

const multer = require("multer");
const upload = multer(); // memory storage
exports.uploadForm = upload.none(); // no files, just text fields

exports.getLogin = (req, res) => {
  res.sendFile(path.join(__dirname, "../views/login.html"));
};

exports.postLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND password = $2",
      [email, password]
    );

    if (result.rows.length === 0) return res.send("Invalid credentials");

    req.session.user = result.rows[0];
    return res.redirect("/dashboard");
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Server error during login.");
  }
};

exports.getSignup = (req, res) => {
  res.sendFile(path.join(__dirname, "../views/signup.html"));
};

// exports.postSignup = async (req, res) => {
//   const { email, username, password } = req.body;
//   const otp = Math.floor(100000 + Math.random() * 900000).toString();
//   const role = "user";
//   const createdAt = new Date();

//   await pool.query(
//     `
//     INSERT INTO pending_users (email, full_name, password, otp, created_at)
//     VALUES ($1, $2, $3, $4, $5)
//     ON CONFLICT (email) DO UPDATE SET otp = $4, created_at = CURRENT_TIMESTAMP
//   `,
//     [email, username, password, otp, createdAt]
//   );

//   await sendOtpEmail(email, otp);
//   res.sendStatus(200);
// };

// exports.postSignup = async (req, res) => {
//   try {
//     const { email, full_name, password, device_id } = req.body;

//     if (!email || !full_name || !password || !device_id) {
//       return res.status(400).send("Missing required fields");
//     }

//     // Check if email is already in users
//     const emailExists = await pool.query(
//       "SELECT id FROM users WHERE email = $1",
//       [email]
//     );
//     if (emailExists.rows.length > 0) {
//       return res.status(400).send("Email already registered");
//     }

//     // Check if device_id is already in use
//     const deviceUsed = await pool.query(
//       "SELECT id FROM users WHERE device_id = $1",
//       [device_id]
//     );
//     if (deviceUsed.rows.length > 0) {
//       return res
//         .status(400)
//         .send("Device ID already linked to another account");
//     }

//     const otp = Math.floor(100000 + Math.random() * 900000).toString();
//     const createdAt = new Date();

//     await pool.query(
//       `
//       INSERT INTO pending_users (email, full_name, password, otp, created_at, device_id)
//       VALUES ($1, $2, $3, $4, $5, $6)
//       ON CONFLICT (email) DO UPDATE SET otp = $4, created_at = CURRENT_TIMESTAMP
//     `,
//       [email, full_name, password, otp, createdAt, device_id]
//     );

//     await sendOtpEmail(email, otp);
//     res.sendStatus(200);
//   } catch (err) {
//     console.error("❌ Signup Error:", err);
//     res.status(500).send("Server error during signup.");
//   }
// };

exports.postSignup = async (req, res) => {
  try {
    const { email, full_name, password, device_id } = req.body;

    if (!email || !full_name || !password || !device_id) {
      return res.status(400).send("Missing required fields");
    }

    // Check if email already exists in users
    const emailExists = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    if (emailExists.rows.length > 0) {
      return res.status(400).send("Email already registered");
    }

    // ✅ Check if device_id is already linked to a user
    const deviceExists = await pool.query(
      "SELECT id FROM users WHERE device_id = $1",
      [device_id]
    );
    if (deviceExists.rows.length > 0) {
      return res
        .status(400)
        .send("Device ID already linked to another account");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const createdAt = new Date();

    await pool.query(
      `
      INSERT INTO pending_users (email, full_name, password, otp, device_id, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (email) DO UPDATE SET otp = $4, device_id = $5, created_at = CURRENT_TIMESTAMP
      `,
      [email, full_name, password, otp, device_id, createdAt]
    );

    await sendOtpEmail(email, otp);
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Signup Error:", err);
    res.status(500).send("Server error during signup.");
  }
};


// exports.verifyOtp = async (req, res) => {
//   const { email, otp } = req.body;
//   const result = await pool.query(
//     "SELECT * FROM pending_users WHERE email = $1 AND otp = $2",
//     [email, otp]
//   );

//   if (result.rows.length === 0) return res.send("Invalid OTP");

//   const user = result.rows[0];
//   await pool.query(
//     `
//     INSERT INTO users (email, full_name, password, profile_picture, device_id, created_at)
//     VALUES ($1, $2, $3, $4, $5, $6)
//   `,
//     [
//       user.email,
//       user.full_name,
//       user.password,
//       user.device_id || null,
//       user.profile_picture || null,
//       new Date(),
//     ]
//   );

//   const userId = insertUser.rows[0].id;

//   // Insert device if provided
//   if (user.device_id) {
//     await pool.query(
//       `INSERT INTO devices (device_id, user_id)
//        VALUES ($1, $2)
//        ON CONFLICT (device_id) DO NOTHING`,
//       [user.device_id, userId]
//     );
//   }

//   await pool.query("DELETE FROM pending_users WHERE email = $1", [email]);
//   res.send("Verification successful. You can now login.");
// };

exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM pending_users WHERE email = $1 AND otp = $2",
      [email, otp]
    );

    if (result.rows.length === 0) return res.send("Invalid OTP");

    const user = result.rows[0];

    // ✅ Insert user and return new user ID
    const insertUser = await pool.query(
      `INSERT INTO users (email, full_name, password, profile_picture, device_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        user.email,
        user.full_name,
        user.password,
        user.profile_picture || null,
        user.device_id || null,
        new Date(),
      ]
    );

    const userId = insertUser.rows[0].id;

    // ✅ Insert device if it exists
    if (user.device_id) {
      await pool.query(
        `INSERT INTO devices (device_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT (device_id) DO NOTHING`,
        [user.device_id, userId]
      );
    }

    // ✅ Cleanup
    await pool.query("DELETE FROM pending_users WHERE email = $1", [email]);

    res.send("Verification successful. You can now login.");
  } catch (err) {
    console.error("❌ OTP Verification Error:", err);
    res.status(500).send("Server error during OTP verification.");
  }
};


exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect("/login");
};

// Get current user's profile info
exports.getProfile = async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) return res.status(401).send("Unauthorized");

    const result = await pool.query(
      "SELECT full_name, email, device_id FROM users WHERE id = $1",
      [userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Get profile error:", err);
    res.status(500).send("Server error retrieving profile.");
  }
};

// Update current user's profile info
// exports.postProfile = async (req, res) => {
//   try {
//     const userId = req.session.user?.id;
//     if (!userId) return res.status(401).send("Unauthorized");

//     const { full_name, email, device_id } = req.body;

//     // Update user info
//     await pool.query(
//       `UPDATE users SET full_name = $1, email = $2, device_id = $3 WHERE id = $4`,
//       [full_name, email, device_id, userId]
//     );

//     // Update device_id for this user in devices table (not insert new row)
//     await pool.query(
//       `UPDATE devices SET device_id = $1 WHERE user_id = $2`,
//       [device_id, userId]
//     );

//     // Update session so changes reflect without re-login
//     req.session.user.full_name = full_name;
//     req.session.user.email = email;
//     req.session.user.device_id = device_id;

//     res.sendStatus(200);
//     // res.redirect("/dashboard");
//   } catch (err) {
//     console.error("❌ Update profile error:", err);
//     res.status(500).send("Server error updating profile.");
//   }
// };

exports.postProfile = async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) return res.status(401).send("Unauthorized");

    const { full_name, email, device_id } = req.body;

    // Update user info
    await pool.query(
      `UPDATE users 
       SET full_name = $1, email = $2, device_id = $3 
       WHERE id = $4`,
      [full_name, email, device_id, userId]
    );

    // Ensure device entry is linked to user
    await pool.query(
      `INSERT INTO devices (device_id, user_id, is_default)
       VALUES ($1, $2, true)
       ON CONFLICT (device_id) 
       DO UPDATE SET user_id = EXCLUDED.user_id`,
      [device_id, userId]
    );

    // Update session values
    req.session.user.full_name = full_name;
    req.session.user.email = email;
    req.session.user.device_id = device_id;

    // If it's an AJAX request (modal form via fetch)
    if (req.xhr || req.headers["content-type"]?.includes("application/json")) {
      return res.status(200).json({ success: true });
    }

    // Otherwise (normal form POST)
    return res.redirect("/dashboard");
  } catch (err) {
    console.error("❌ Update profile error:", err);
    if (req.xhr || req.headers["content-type"]?.includes("application/json")) {
      return res
        .status(500)
        .json({ success: false, error: "Server error updating profile." });
    }
    res.status(500).send("Server error updating profile.");
  }
};

