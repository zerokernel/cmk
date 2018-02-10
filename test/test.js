#!/usr/bin/env node
'use strict';
const {MongoClient} = require("mongodb");
const cmk = require('../');
async function run () {
	const {create, set, remove, get, review, list} = await cmk((await MongoClient.connect('mongodb://localhost:27017/cmk')).db("cmk").collection("list"));
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
	console.log(await get(c[10]));
}
run().catch(console.log).then(x=>process.exit(0))
