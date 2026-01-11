import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import db from './database.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// Get all holes
app.get('/api/holes', (req, res) => {
    const sql = "SELECT * FROM holes ORDER BY number ASC";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        })
    });
});

// Update hole coordinates
app.put('/api/holes/:number', (req, res) => {
    const { lat, lng } = req.body;
    const holeNumber = req.params.number;

    // We assume 1 course for now
    const sql = `UPDATE holes SET lat = ?, lng = ? WHERE number = ?`;
    db.run(sql, [lat, lng, holeNumber], function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            message: "success",
            data: { number: holeNumber, lat, lng },
            changes: this.changes
        });
    });
});

// Calibration Log
app.post('/api/calibrate', (req, res) => {
    const { hole_number, type, lat, lng, accuracy } = req.body;
    const sql = `INSERT INTO calibration (hole_number, type, lat, lng, accuracy) VALUES (?,?,?,?,?)`;
    db.run(sql, [hole_number, type, lat, lng, accuracy], function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }

        // Auto update hole if accuracy is good? Let's just log for now, or update if it's explicitly 'GREEN'
        if (type === 'GREEN') {
            const updateSql = `UPDATE holes SET lat = ?, lng = ? WHERE number = ?`;
            db.run(updateSql, [lat, lng, hole_number], (updateErr) => {
                if (updateErr) console.error("Auto-update failed", updateErr);
            });
        }

        res.json({
            message: "Calibration saved",
            id: this.lastID
        });
    });
});

// --- PLAYERS API ---

app.get('/api/players', (req, res) => {
    const sql = "SELECT * FROM players";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success", "data": rows });
    });
});

app.post('/api/players', (req, res) => {
    const { name, handicap, type } = req.body;
    const sql = "INSERT INTO players (name, handicap, type) VALUES (?,?,?)";
    db.run(sql, [name, handicap, type], function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success", "id": this.lastID });
    });
});

// --- GAMES API ---

app.get('/api/games', (req, res) => {
    const sql = "SELECT * FROM games ORDER BY date DESC";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success", "data": rows });
    });
});

app.post('/api/games', (req, res) => {
    const { course_id, scores } = req.body;
    const sql = "INSERT INTO games (course_id, scores) VALUES (?,?)";
    db.run(sql, [course_id, JSON.stringify(scores)], function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "success", "id": this.lastID });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
