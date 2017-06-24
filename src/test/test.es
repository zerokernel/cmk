#!/usr/bin/env node
import {MongoClient} from 'mongodb';
import cmk from '../';
async function run () {
	let db = await MongoClient.connect('mongodb://localhost:27017/cmk');
	const {create, set, remove, get, review, query} = await cmk(db.collection("list"));
	let c = [];
	for(let i = 0; i < 20; i++) {
		c[i] = await create({title:"测试" + i,author:"作者" + i});
		await console.log(`c[${i}]:`, c[i]);
	}
	console.log(await review(c[5]));
	console.log(await review(c[10],11111));
	console.log(await review(c[15]));
	console.log(await remove(c[11]));
	console.log(await remove(c[11],false));
	console.log(await get(c[11]));
	console.log(await get(c[12]));
	console.log(await set(c[10],{title:"新标题",review:123456}));
}
run().catch(console.log).then(x=>process.exit(0))

