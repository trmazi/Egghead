const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const path = require('path');
const defaultData = require('./default')

const file = path.join(process.cwd(), 'db.json');
const adapter = new JSONFile(file);
const db = new Low(adapter, defaultData.defaultData);

async function initDB() {
	await db.read();
	db.data ||= {
		meta: { seeded: false, seededAt: null },
		totals: { eggs: 0, rotten: 0 },
		users: {},
		milestones: { next: 100, reached: [] }
	};
	await db.write();
}

module.exports = { db, initDB };
