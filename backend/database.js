const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.resolve(__dirname, 'golf.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS holes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id TEXT,
      number INTEGER,
      par INTEGER,
      handicap INTEGER,
      yards INTEGER,
      lat REAL,
      lng REAL,
      image TEXT
    )`, (err) => {
            if (err) {
                console.error(err);
            }
        });

        db.run(`CREATE TABLE IF NOT EXISTS calibration (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       hole_number INTEGER,
       type TEXT, -- 'TEE' or 'GREEN'
       lat REAL,
       lng REAL,
       accuracy REAL,
       timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    }
});

module.exports = db;
