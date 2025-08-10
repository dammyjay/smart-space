const { pool } = require("./db");

async function createTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pending_users (
          id SERIAL PRIMARY KEY,
          full_name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          profile_picture TEXT,
          otp TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          device_id TEXT
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          full_name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          profile_picture TEXT,
          device_id TEXT UNIQUE,
          created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS devices (
          id SERIAL PRIMARY KEY,
          device_id TEXT UNIQUE NOT NULL,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          name TEXT,
          last_seen TIMESTAMP,
          online BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW(),
          is_default BOOLEAN DEFAULT FALSE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS device_status (
          id SERIAL PRIMARY KEY,
          device_id TEXT REFERENCES devices(device_id) ON DELETE CASCADE,
          channel_index INTEGER NOT NULL CHECK (channel_index >= 0 AND channel_index < 4),
          status BOOLEAN DEFAULT FALSE,
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE (device_id, channel_index)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS channel_status (
          id SERIAL PRIMARY KEY,
          device_id TEXT NOT NULL,
          channel_index INTEGER NOT NULL CHECK (channel_index >= 0 AND channel_index < 4),
          status BOOLEAN DEFAULT FALSE,
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE (device_id, channel_index)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          type TEXT,
          message TEXT,
          created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS occupancy_logs (
          id SERIAL PRIMARY KEY,
          device_id TEXT,
          event_type TEXT CHECK (event_type IN ('entry', 'exit')),
          timestamp TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS session (
          sid varchar NOT NULL PRIMARY KEY,
          sess json NOT NULL,
          expire timestamp(6) NOT NULL
      );
    `);

    console.log("✅ All tables are ready now.");
  } catch (err) {
    console.error("❌ Error creating tables:", err.message);
  }
}

module.exports = createTables;
