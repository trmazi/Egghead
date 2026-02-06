const { initDB } = require('./db');

async function recordEgg(userId) {
	const db = await initDB();

	db.data.totals.eggs++;

	if (!db.data.users[userId]) {
		db.data.users[userId] = { eggs: 0, rotten: 0 };
	}
	db.data.users[userId].eggs++;

	await db.write();
}

async function recordRotten(userId) {
	const db = await initDB();

	db.data.totals.rotten++;

	if (!db.data.users[userId]) {
		db.data.users[userId] = { eggs: 0, rotten: 0 };
	}
	db.data.users[userId].rotten++;

	await db.write();
}

async function checkMilestone(client) {
	const db = await initDB();

	const total = db.data.totals.eggs;
	const next = db.data.milestones.next;

	if (total >= next) {
		db.data.milestones.reached.push({
			count: next,
			at: Date.now()
		});
		db.data.milestones.next = Math.floor(next * 1.75);

		if (client) {
			const general = await client.channels.fetch(require('./config.json').generalChannel)
				.catch(() => null);

			if (general) {
				await general.send({
					content:
`<a:eggspin:1465219439871004829> **EGG MILESTONE REACHED** <a:eggspin:1465219439871004829>

<:egghead:1435894590623453237> The server has reached **${next} eggs**!
<:eggbond:1435895173593829417> Next milestone: **${db.data.milestones.next} eggs**`
				});
			}
		}
	}
}

module.exports = { recordEgg, recordRotten, checkMilestone };
