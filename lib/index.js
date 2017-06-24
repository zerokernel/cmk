"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

/**
 * 信息整理
 */
let info = (() => {
	var _ref = _asyncToGenerator(function* (info) {
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

	return function info(_x) {
		return _ref.apply(this, arguments);
	};
})();

/**
 * 是否为字符串
 */


/**
 * 创建
 */
let create = (() => {
	var _ref2 = _asyncToGenerator(function* ({ title, category, image, description, keyword, label, order, content, hide, top, author, review }) {
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
		//label
		if (!(label = stringArray(label))) {
			label = [];
		}
		if (!isOrder(order)) {
			order = 0;
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

	return function create(_x2) {
		return _ref2.apply(this, arguments);
	};
})();

/**
 * 修改
 */


let set = (() => {
	var _ref3 = _asyncToGenerator(function* (id, { title, category, image, description, label, order, content, hide, top, author, review }) {
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
		let { result } = this.db.update({ _id: id, delete: { $ne: 2 } }, { $set: value });
		return Boolean(result.ok);
	});

	return function set(_x3, _x4) {
		return _ref3.apply(this, arguments);
	};
})();

/**
 * 删除
 */


let remove = (() => {
	var _ref4 = _asyncToGenerator(function* (id, del = false) {
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

	return function remove(_x5) {
		return _ref4.apply(this, arguments);
	};
})();
/**
 * 获取
 */


let get = (() => {
	var _ref5 = _asyncToGenerator(function* (id) {
		if (!(id = getId(id))) {
			throw new Error("Id必须为24为16进制字符串");
		}
		let rs = yield this.db.find({ _id: id }).toArray();
		if (rs.length) {
			return yield info.call(this, rs[0]);
		}
		return null;
	});

	return function get(_x6) {
		return _ref5.apply(this, arguments);
	};
})();

/**
 * 审核
 */


let review = (() => {
	var _ref6 = _asyncToGenerator(function* (id, review) {
		if (!(id = getId(id))) {
			throw new Error("Id必须为24为16进制字符串");
		}
		let value = yield this.db.find({ _id: id }, { author: 1, review: 1 }).toArray();
		if (!value.length) {
			return false;
		}
		value = value[0];
		let author = value.author;
		value = value.review;
		if (review && (review = yield this.getUserId(review))) {
			value.reviewDate = new Date();
			if (review === null) {
				value.reviewer = author;
			} else {
				value.reviewer = review;
			}
			value.review = null;
		} else {
			value = { review: null };
		}
		let { result } = yield this.db.update({ _id: id, adopt: null, delete: false }, { $set: value });
		return Boolean(result.ok);
	});

	return function review(_x7, _x8) {
		return _ref6.apply(this, arguments);
	};
})();

/**
 * 查询
 */


let query = (() => {
	var _ref7 = _asyncToGenerator(function* ({
		category, delete: del, review, hide, top, content,
		filter, type = 3, order, limit: [from = 0, length = 20] = []
	}) {
		var _this = this;

		let condition = this.condition(content);
		if (category instanceof Array) {
			for (let i = 0, l = category.length; i < l; i++) {
				category[i] = this.getCategoryId(category[i]);
			}
			condition.category = { $in: category.filter(function (x) {
					return x;
				}) };
		} else if (category) {
			condition.category = getId(category);
		}
		condition.delete = Boolean(del);
		condition.review = review ? { $ne: null } : null;
		if (typeof top === "boolean") {
			condition.top = top;
		}
		if (typeof hide === "boolean") {
			condition.hide = hide;
		}

		{
			let filters = new Set(["_id"]);
			if (filter) {
				filter = new Set(filter);
				if (filter.has("$title")) {
					filters.add("title");filter.delete("$title");
				}
				if (filter.has("$category")) {
					filters.add("category");filter.delete("$category");
				}
				if (filter.has("$image")) {
					filters.add("image");filter.delete("$image");
				}
				if (filter.has("$description")) {
					filters.add("description");filter.delete("$description");
				}
				if (filter.has("$keyword")) {
					filters.add("keyword");filter.delete("$keyword");
				}
				if (filter.has("$content")) {
					filters.add("content");filter.delete("$content");
				}
				if (filter.has("$order")) {
					filters.add("order");filter.delete("$order");
				}
				if (filter.has("$review")) {
					filters.add("review");filter.delete("$review");
				}
				if (filter.has("$hide")) {
					filters.add("hide");filter.delete("$hide");
				}
				if (filter.has("$top")) {
					filters.add("top");filter.delete("$top");
				}
				if (filter.has("$label")) {
					filters.add("label");filter.delete("$label");
				}
				this.filter([...filter]).map(function (x) {
					return filters.add(x);
				});
			}
			filter = {};
			[...filters].map(function (x) {
				return filter[x] = 1;
			});
		}
		let cursor = this.db.find(condition, filter);
		let ret = [];
		if (type & 1) {
			if (from < 0 || from !== parseInt(from) || isNaN(from) || from > 0xFFFFFFFF) {
				from = 0;
			}
			if (length <= 0 || length !== parseInt(length) || isNaN(length) || length > 100) {
				length = 10;
			}
			if (order) {
				cursor.sort(order);
			}
			cursor.skip(from).limit(length);
			ret.push(cursor.toArray().then(function (rs) {
				return Promise.all(rs.map(function (r) {
					return info.call(_this, r);
				}));
			}));
		} else {
			ret.push(null);
		}
		if (type & 2) {
			ret.push(cursor.count());
		} else {
			ret.push(null);
		}
		let [list, num] = yield Promise.all(ret);
		return { list, num };
	});

	return function query(_x9) {
		return _ref7.apply(this, arguments);
	};
})();

let Condition = (() => {
	var _ref8 = _asyncToGenerator(function* (condition) {
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

	return function Condition(_x10) {
		return _ref8.apply(this, arguments);
	};
})();

let Filter = (() => {
	var _ref9 = _asyncToGenerator(function* (filter) {
		try {
			return (yield this(filter)).map(function (x) {
				return "content." + x;
			});
		} catch (e) {
			return [];
		}
	});

	return function Filter(_x11) {
		return _ref9.apply(this, arguments);
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
	if (order < -0xFFFFFF) {
		return false;
	}
	if (order > +0xFFFFFF) {
		return false;
	}
	return true;
}function cmk(db, { getCategoryId, getCategory, getContent, getUserId, getUser, condition, filter }) {
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
	if (!(db instanceof _mongodb.Collection)) {
		throw "不是有效的Mongodb Collection";
	}
	cfg.db = db;
	cfg.getCategoryId = getCategoryId;
	cfg.getCategory = getCategory;
	cfg.getContent = getContent;
	cfg.getUserId = getUserId;
	cfg.getUser = getUser;
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