"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

let getFilter = (() => {
	var _ref = _asyncToGenerator(function* (filter) {
		let filters = new Set(["_id"]);
		if (filter instanceof Array) {
			filter = new Set(filter);
		}
		if (filter instanceof Set) {
			keyfield.map(function (f) {
				if (filter.has("$" + f)) {
					filters.add(f);filter.delete("$" + f);
				}
			});
			(yield this.filter([...filter])).map(function (x) {
				return filters.add(x);
			});
		}
		filter = {};
		[...filters].map(function (x) {
			return filter[x] = 1;
		});
		return filter;
	});

	return function getFilter(_x) {
		return _ref.apply(this, arguments);
	};
})();

/**
 * 信息整理
 */
let info = (() => {
	var _ref2 = _asyncToGenerator(function* (info) {
		if (info._id) {
			info.id = info._id;delete info._id;
		}
		if (info.category) {
			info.category = yield this.getCategory(info.category);
		}
		if (info.reviewer) {
			info.reviewer = yield this.getUser(info.reviewer);
		}
		if (info.author) {
			info.author = yield this.getUser(info.author);
		}
		return info;
	});

	return function info(_x2) {
		return _ref2.apply(this, arguments);
	};
})();

/**
 * 是否为字符串
 */


/**
 * 创建
 */
let create = (() => {
	var _ref3 = _asyncToGenerator(function* ({ title, category, image, description, keyword, label, order, content, hide, top, author, review }) {
		//标题，分类，图片，简介，顺序，隐藏，作者
		if (!isString(title, true)) {
			throw "标题必须为非空字符串";
		}
		category = yield this.getCategoryId(category);
		if (!isString(image)) {
			image = "";
		}
		if (!isString(description)) {
			description = "";
		}
		//keyword
		if (!(label = stringArray(label))) {
			label = [];
		}
		if (!isOrder(order)) {
			order = 10000;
		}
		content = yield this.getContent(content, category);
		hide = Boolean(hide);
		top = Boolean(top);
		author = yield this.getUserId(author);

		let value = {
			title, category, image, description, label, author,
			order, hide, top, content,
			delete: false, valid: true
		};

		value.updateDate = value.createDate = new Date();
		if (review && (review = yield this.getUserId(review))) {
			value.reviewDate = value.updateDate;
			if (review === null) {
				value.reviewer = author;
			} else {
				value.reviewer = review;
			}
		} else {
			value = {
				title: value.title,
				category: value.category,
				valid: false,
				delete: false,
				createDate: value.createDate,
				updateDate: value.updateDate,
				review: value
			};
		}
		//插入到库
		let { result, ops } = yield this.db.insert(value);
		if (result.ok && ops[0]) {
			return ops[0]._id;
		}
		throw new Error("添加失败");
	});

	return function create(_x3) {
		return _ref3.apply(this, arguments);
	};
})();

/**
 * 修改
 */


let set = (() => {
	var _ref4 = _asyncToGenerator(function* (id, { title, category, image, description, label, order, content, hide, top, author, review }) {
		if (!(id = getId(id))) {
			throw new Error("Id必须为24为16进制字符串");
		}

		let value = { _id: id };
		if (!review) {
			value.review = null;
		}
		let info = yield this.db.find(value).toArray();
		if (!info.length) {
			return false;
		}
		info = info[0];

		value = {};
		if (isString(title, true)) {
			value.title = title;
		}
		if ((category || category === null) && (category = yield this.getCategoryId(category))) {
			value.category = category;
		} else {
			category = info.category;
		}
		if (isString(image)) {
			value.image = image;
		}
		if (isString(description)) {
			value.description = description;
		}
		if (label = stringArray(label)) {
			value.label = label;
		}
		if (isOrder(order)) {
			value.order = parseInt(order);
		}
		if (content) {
			value.content = yield this.getContent(content, category);
		}
		if (typeof hide === "boolean") {
			value.hide = hide;
		}
		if (typeof top === "boolean") {
			value.top = top;
		}
		if (author) {
			value.author = yield this.getUserId(author);
		} else {
			author = info.author;
		}
		value.updateDate = new Date();
		value.valid = true;

		if (review && (review = yield this.getUserId(review))) {
			value.reviewDate = value.updateDate;
			if (review === null) {
				value.reviewer = author;
			} else {
				value.reviewer = review;
			}
		} else {
			value = {
				review: value
			};
		}
		let { result } = yield this.db.update({ _id: id, delete: { $ne: 2 } }, { $set: value });
		return Boolean(result.ok);
	});

	return function set(_x4, _x5) {
		return _ref4.apply(this, arguments);
	};
})();

/**
 * 删除
 */


let remove = (() => {
	var _ref5 = _asyncToGenerator(function* (id, del = true) {
		if (!(id = getId(id))) {
			throw new Error("Id必须为24为16进制字符串");
		}

		if (del === "forever") {
			let { result } = yield this.db.remove({ _id: id });
			return Boolean(result.ok);
		} else {
			let { result } = yield this.db.update({ _id: id, delete: !del }, { $set: { delete: Boolean(del), review: null } });
			return Boolean(result.ok);
		}
	});

	return function remove(_x6) {
		return _ref5.apply(this, arguments);
	};
})();
/**
 * 获取
 */


let get = (() => {
	var _ref6 = _asyncToGenerator(function* (id, filter) {
		if (!(id = getId(id))) {
			throw new Error("Id必须为24为16进制字符串");
		}
		if (filter) {
			filter = yield getFilter(filter);
		}
		let rs = yield this.db.find({ _id: id }, filter).toArray();
		if (rs.length) {
			return yield info.call(this, rs[0]);
		}
		return null;
	});

	return function get(_x7, _x8) {
		return _ref6.apply(this, arguments);
	};
})();

/**
 * 审核
 */


let review = (() => {
	var _ref7 = _asyncToGenerator(function* (id, review) {
		if (!(id = getId(id))) {
			throw new Error("Id必须为24为16进制字符串");
		}
		let value;
		if (review) {
			value = yield this.db.find({ _id: id }, { author: 1, review: 1 }).toArray();
			if (!value.length) {
				return false;
			}
			value = value[0];
			let author = value.author;
			value = value.review;
			value.reviewDate = new Date();
			if (review = yield this.getUserId(review)) {
				value.reviewer = review;
			} else {
				value.reviewer = author;
			}
		} else {
			value = {};
		}
		value.review = null;
		let { result } = yield this.db.update({ _id: id, delete: false }, { $set: value });
		return Boolean(result.ok);
	});

	return function review(_x9, _x10) {
		return _ref7.apply(this, arguments);
	};
})();

/**
 * 查询
 */


let query = (() => {
	var _ref8 = _asyncToGenerator(function* ({
		content, category, delete: del, review, top, hide, valid,
		filter, type = 3, sort, limit: [from = 0, length = 20] = []
	}) {
		var _this = this;

		let condition = yield this.condition(content);
		if (category instanceof Array) {
			condition.category = { $in: (yield Promise.all(category.map(function (c) {
					return _this.getCategoryId(c);
				}))).filter(function (x) {
					return x;
				}) };
		} else if (category && (category = yield this.getCategoryId(category))) {
			condition.category = category;
		}
		condition.delete = Boolean(del);
		condition.review = review ? { $ne: null } : null;
		if (typeof top === "boolean") {
			condition.top = top;
		}
		if (typeof hide === "boolean") {
			condition.hide = hide;
		}
		if (typeof valid === "boolean") {
			condition.valid = valid;
		}
		console.log(filter);
		filter = yield getFilter.call(this, filter);
		let cursor = this.db.find(condition, filter);
		console.log(filter);
		let ret = [];
		cursor.sort(getSort(sort));
		if (from < 0 || from !== parseInt(from) || isNaN(from) || from > 0xFFFFFFFF) {
			from = 0;
		}
		if (length <= 0 || length !== parseInt(length) || isNaN(length) || length > 1000) {
			length = 10;
		}
		cursor.skip(from).limit(length);
		let list = cursor.toArray().then(function (rs) {
			return Promise.all(rs.map(function (r) {
				return info.call(_this, r);
			}));
		});
		let total = cursor.count();
		[list, total] = yield Promise.all([list, total]);
		return { list, total };
	});

	return function query(_x11) {
		return _ref8.apply(this, arguments);
	};
})();

let Condition = (() => {
	var _ref9 = _asyncToGenerator(function* (condition) {
		if (!condition) {
			return {};
		}
		try {
			condition = yield this(condition);
			let ret = {};
			for (let k in condition) {
				ret["content." + k] = condition[k];
			}
			return ret;
		} catch (e) {
			return {};
		}
	});

	return function Condition(_x12) {
		return _ref9.apply(this, arguments);
	};
})();

let Filter = (() => {
	var _ref10 = _asyncToGenerator(function* (filter) {
		try {
			return (yield this(filter.filter(function (x) {
				return x[0] != "$";
			}))).map(function (x) {
				return "content." + x;
			});
		} catch (e) {
			return [];
		}
	});

	return function Filter(_x13) {
		return _ref10.apply(this, arguments);
	};
})();

exports.default = cmk;

var _mongodb = require("mongodb");

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

/**
 * 获取ID
 * 
 */
function getId(id) {
	if (id instanceof _mongodb.ObjectId) {
		return id;
	}
	if (typeof id !== "string" || id.length !== 24 || id.search(/^[0-9a-f]{24}$/ig)) {
		return null;
	}
	return (0, _mongodb.ObjectId)(id);
}
const keyfield = ["title", "category", "image", "description", "keyword", "content", "order", "review", "hide", "top", "label", "createDate", "reviewDate", "updateDate", "reviewer", "author"];

function getSort(order) {
	if (!(order instanceof Array && order.length)) {
		return { order: 1, _id: 1 };
	}
	let sort = {};
	order.map(o => {
		let k = 1;
		if (o[0] === '#') {
			o = o.substr(1);
			k = -1;
		}
		if (o[0] === '$') {
			o = o.substr(1);
		} else {
			o = 'content.' + o;
		}
		sort[o] = k;
	});
	return sort;
}
/**
 * 字符串数组
 */
function stringArray(x, v) {
	if (typeof x === "string") {
		return [x];
	}
	if (!(x instanceof Array)) {
		return v ? [] : null;
	}
	return [...new Set(x.filter(x => typeof x === "string"))];
}function isString(str, noNull) {
	if (noNull && !str) {
		return false;
	}
	return typeof str === "string";
}
/**
 * 是否为排序序号
 */
function isOrder(order) {
	if (order !== parseInt(order)) {
		return false;
	}
	if (order < -0xFFFFFFF) {
		return false;
	}
	if (order > +0xFFFFFFF) {
		return false;
	}
	return true;
}function cmk(db, { getCategoryId, getCategory, getContent, getUserId, getUser, condition, filter } = {}) {
	if (!(db instanceof _mongodb.Collection)) {
		throw "不是有效的Mongodb Collection";
	}
	if (typeof getCategoryId !== "function") {
		getCategoryId = x => x;
	}
	if (typeof getCategory !== "function") {
		getCategory = x => x;
	}
	if (typeof getContent !== "function") {
		getContent = x => x;
	}
	if (typeof getUserId !== "function") {
		getUserId = x => x;
	}
	if (typeof getUser !== "function") {
		getUser = x => x;
	}

	let ret = {};
	let cfg = Object.create(ret);
	cfg.db = db;
	cfg.getCategoryId = getCategoryId.bind(ret);
	cfg.getCategory = getCategory.bind(ret);
	cfg.getContent = getContent.bind(ret);
	cfg.getUserId = getUserId.bind(ret);
	cfg.getUser = getUser.bind(ret);
	cfg.condition = Condition.bind(condition);
	cfg.filter = Filter.bind(filter);

	ret.create = create.bind(cfg);
	ret.set = set.bind(cfg);
	ret.remove = remove.bind(cfg);
	ret.get = get.bind(cfg);
	ret.review = review.bind(cfg);
	ret.query = query.bind(cfg);
	return ret;
}