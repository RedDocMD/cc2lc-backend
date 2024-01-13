require('dotenv').config();
const express = require('express');
const http = require('node:http');
const sqlite3 = require('sqlite3').verbose();
const sqlite = require('sqlite');
const asyncHandler = require('express-async-handler');

async function openDb() {
    const dbPath = process.env['DB_PATH'];
    const db = await sqlite.open({
        filename: dbPath,
        driver: sqlite3.Database,
        mode: sqlite3.OPEN_READONLY,
    });
    return db;
}

async function getMonths(db) {
    const res = await db.all('SELECT * FROM months');
    const months = res.map((row) => {
        return { month: row.month, year: row.year };
    }, res);
    return months;
}

async function getGamesOfMonth(db, month, year) {
    return await db.all(
        `SELECT g.*
        FROM games g, month_games mg, months m
        WHERE m.month = ? AND m.year = ?
        AND m.id = mg.month_id
        AND g.id = mg.game_id
        `,
        [month, year]
    );
}

async function main() {
    const app = express();
    const db = await openDb();

    app.get('/months', asyncHandler(async (req, res, next) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        const months = await getMonths(db);
        res.send(months);
    }));

    app.get('/games/:year/:month', asyncHandler(async (req, res, next) => {
        res.setHeader("Access-Control-Allow-Origin", "*");
        const month = req.params['month'];
        const year = req.params['year'];
        const games = await getGamesOfMonth(db, month, year);
        res.send(games);
    }));

    const host = '127.0.0.1';
    const port = 8080;
    const server = http.createServer(app);
    server.listen(port, host, () => { console.log(`Listening on ${host}:${port}`) });
}

main()
    .then(() => { })
    .catch((err) => {
        console.log(`Caught error: ${err}`);
    });
