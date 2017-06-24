#!/usr/bin/env node
'use strict';

let run = (() => {
	var _ref = _asyncToGenerator(function* () {
		let db = yield _mongodb.MongoClient.connect('mongodb://localhost:27017/cmk');
		const { create, set, remove, get, review, query } = yield (0, _2.default)(db.collection("list"));
		let c = [];
		for (let i = 0; i < 20; i++) {
			c[i] = yield create({ title: "测试" + i, author: "作者" + i });
			yield console.log(`c[${i}]:`, c[i]);
		}
		console.log((yield review(c[5])));
		console.log((yield review(c[10], 11111)));
		console.log((yield review(c[15])));
		console.log((yield remove(c[11])));
		console.log((yield remove(c[11], false)));
		console.log((yield get(c[11])));
		console.log((yield get(c[12])));
		console.log((yield set(c[10], { title: "新标题", review: 123456 })));
	});

	return function run() {
		return _ref.apply(this, arguments);
	};
})();

var _mongodb = require('mongodb');

var _ = require('../');

var _2 = _interopRequireDefault(_);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

run().catch(console.log).then(x => process.exit(0));