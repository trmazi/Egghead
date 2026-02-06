const path = require('path');
const { defaultData } = require('./default');
let db;

async function initDB() {
	if (db) return db;

	const { Low } = await import('lowdb');
	const { JSONFile } = await import('lowdb/node');

	const file = path.join(__dirname, '../db.json');
	const adapter = new JSONFile(file);

	db = new Low(adapter, defaultData);

	await db.read();

	db.data ||= {
		meta: {
			seeded: false,
			seededAt: null
		},
		totals: {
			eggs: 0,
			rotten: 0
		},
		users: {},
		milestones: {
			next: 100,
			reached: []
		}
	};

	await db.write();
	return db;
}

module.exports = { initDB };