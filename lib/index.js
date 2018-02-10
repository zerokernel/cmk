"use strict";
const {ObjectId} = require("mongodb");
/**
 * 获取ID
 * 
 */
function getId(id) {
	if (id instanceof ObjectId) {return id;}
	if (typeof id !== "string" || id.length!== 24 || id.search(/^[0-9a-f]{24}$/ig)) {return null;}
	return ObjectId(id);
}
const keyfield = ["title", "category", "image", "description", "keyword", "content",
	"order", "review", "hide", "top", "label",
	"createDate", "reviewDate", "updateDate", "reviewer", "author",
];

async function getFilter(filter) {
	let filters = {_id: 1};
	if (filter instanceof Array) {
		filter = new Set(filter);
	}
	if (filter instanceof Set) {
		keyfield.forEach(f => {
			if (filter.has("$" + f)) {
				filters[f] = 1;
				filter.delete("$" + f);
			}
		});
		filter = [...filter].filter(x => x[0] != "$");
		try {
			filter = await this.filter(filter);
			filter.forEach(x => filters["content." + x] = 1);
		} catch(e) {
			filters["content"] = 1
		}
	}
	return filters;
}
function getSort(order) {
	if (!(order instanceof Array && order.length)) {
		return {order:1, _id:1};
	}
	let sort = {};
	order.map(o => {
		let k = 1;
		//#表示降序排列
		if (o[0] === '#') {
			o = o.substr(1);
			k = -1;
		}
		//$为特殊字段
		if (o[0] === '$') {
			o = o.substr(1);
		} else {
			o = 'content.' + o;
		}
		sort[o] = k;
	})
	return sort;
}
/**
 * 字符串数组
 */
function stringArray(x, v) {
	if (typeof x === "string") {return [x];}
	if (!(x instanceof Array)) {return v ? [] : null;}
	return [...new Set(x.filter(x=>typeof x === "string"))];
}
/**
 * 信息整理
 */
async function info(info) {
	if (info._id) {info.id = info._id;delete info._id;}
	return info;
}

/**
 * 是否为字符串
 */
function isString(str,noNull) {
	if (noNull && !str) {return false;}
	return typeof str === "string";
}
/**
 * 是否为排序序号
 */
function isOrder(order) {
	if (order !== parseInt(order)) {return false;}
	if (order < -0xFFFFFFF) {return false;}
	if (order > +0xFFFFFFF) {return false;}
	return true;
}
/**
 * 创建
 */
async function create({title, category, image, description, keyword, label, order, format, content, hide, top, author, review}) {
	//标题，分类，图片，简介，顺序，隐藏，作者
	if (!isString(title, true)) {
		return null;
	}
	category = String(category);
	if (!isString(image)) {
		image = "";
	}
	if (!isString(description)) {
		description = "";
	}
	if (!(keyword = stringArray(keyword))) {
		keyword = [];
	}
	if (!(label = stringArray(label))) {
		label = [];
	}
	if (!isOrder(order)) {
		order = 10000;
	}
	format = String(format);
	content = await this.getContent(content, format, category);
	hide = Boolean(hide);
	top = Boolean(top);
	author = String(author);

	let value = {
		title, category, image, description, label, keyword, author,
		order, hide, top, content,
		delete: false, valid: true
	};

	value.updateDate = value.createDate = new Date();
	if (review != null) {
		value.reviewDate = value.updateDate;
		value.reviewer = review && String(review) || info.author;
	} else {
		value = {
			title: value.title,
			category: value.category,
			valid: false,
			delete: false,
			createDate: value.createDate,
			updateDate: value.updateDate,
			review: value,
		}
	}
	//插入到库
	const {result, insertedIds} = await this.db.insert(value);
	return result.ok && insertedIds && insertedIds[0] || null;
}

/**
 * 修改
 */
async function set(id, {title, category, image, description, keyword, label, order, format, content, hide, top, author, review}) {
	if (!(id = getId(id))) {
		return false;
	}
	//首先获取信息，判断是否符合要求
	let value = {_id:id};
	//不设置审核人，则只能修改不在审核中的项目
	if (review == null || !(review && (review = String(review)))) {
		value.review = null;
	}
	let info = await this.db.findOne(value);
	if (!info) {
		return false;
	}

	//要更新内容
	let $set = {};
	if (isString(title, true)) {
		$set.title = title;
	}
	if (isString(category)) {
		$set.category = category;
	} else {
		category = info.category;
	}
	if (isString(image)) {
		$set.image = image;
	}
	if (isString(description)) {
		$set.description = description;
	}
	if (label = stringArray(label)) {
		$set.label = label;
	}
	if (keyword = stringArray(keyword)) {
		$set.keyword = keyword;
	}
	if (isOrder(order)) {
		$set.order = parseInt(order);
	}
	if (content) {
		if (typeof format === "string") {
			$set.format = format;
		} else {
			format = info.format;
		}
		$set.content = await this.getContent(content, format, category);
	}
	if (typeof hide === "boolean") {
		$set.hide = hide;
	}
	if (typeof top === "boolean") {
		$set.top = top;
	}
	if (author) {
		$set.author = author;
	} else {
		author = info.author;
	}
	$set.updateDate = new Date();
	$set.valid = true;

	if (review != null) {
		$set.reviewDate = $set.updateDate;
		$set.reviewer = review || author;
	} else {
		$set = {
			review: $set,
		}
	}
	let {result} = await this.db.update({_id:id, delete:{$ne:2}},{$set:$set});
	return Boolean(result.ok);
}


/**
 * 删除
 */
async function remove(id, del = true) {
	if (!(id = getId(id))) {
		return false;
	}
	if (typeof del !== "boolean") {
		let {result} = await this.db.remove({_id: id});
		return Boolean(result.ok);
	} else {
		let {result} = await this.db.update({_id: id, delete: !del},{$set: {delete: Boolean(del), review: null}});
		return Boolean(result.ok);
	}
}
/**
 * 获取
 */
async function get(id, filter) {
	if (!(id = getId(id))) {
		return null;
	}
	if (filter) {
		filter = await getFilter.call(this, filter);
	}
	const info = await this.db.findOne({_id:id}, filter);
	if (!info) {
		return null;
	}
	if (info._id) {
		info.id = info._id;
		delete info._id;
	}
	return info;
}

/**
 * 审核
 * @param {Id}		id		文字Id
 * @param {String | null}	review	审核者Id，如果未审核通过应为null
 */
async function review(id, review) {
	if (!(id = getId(id))) {
		return false;
	}
	if (review === true) {
		review = "";
	} else if (review === false) {
		review = null;
	}
	let $set;
	if (review == null) {
		$set = {};
	} else {
		const info = await this.db.findOne({_id: id}, {author:1, review:1});
		if (!info) {
			return false;
		}
		$set = info.review;
		$set.reviewDate = new Date();
		$set.reviewer = review && String(review) || info.author;
	}
	$set.review = null;
	let {result} = await this.db.update({_id:id, delete:false}, {$set});
	return Boolean(result.ok);
}

/**
 * 查询
 */
async function list({
	content, category, delete:del, review, top, hide, valid,
	filter, type = 3, sort, skip = 0, limit = 30,
}) {
	//根据正文获取条件
	let condition = await this.condition(content);
	//分类
	if (category instanceof Array) {
		condition.category = {$in: category.filter(x => x || typeof x === "string")};
	}else if (category && typeof category  === "string") {
		condition.category = category;
	}
	//删除标记
	if (typeof del === "boolean") {
		condition.delete = del;
	}
	//待审核状态
	if (typeof review === "boolean") {
		condition.review = review ? {$ne:null} : null;
	}
	//置顶状态
	if (typeof top === "boolean") {
		condition.top = top;
	}
	//隐藏状态
	if (typeof hide === "boolean") {
		condition.hide = hide;
	}
	//有效状态
	if (typeof valid === "boolean") {
		condition.valid = valid;
	}
	//返回的字段
	filter = await getFilter.call(this, filter);
	//排序
	sort = getSort(sort);
	let cursor = this.db.find(condition, filter).sort(sort).skip(skip).limit(limit);
	const [list, total] = await Promise.all([cursor.toArray(), cursor.count()]);
	list.forEach(info => {
		info.id = info._id;
		delete info._id;
	});
	return {total, list};
}

async function Condition(condition) {
	if (!condition) {
		return {};
	}
	try {
		condition = await this(condition);
		let ret = {};
		for(let k in condition) {
			ret["content." + k] = condition[k];
		}
		return ret;
	} catch(e) {
		return {};
	}
}


module.exports = async function cmk(db, {getContent, condition, filter} = {}) {
	if (typeof getContent !== "function") {
		getContent = x => x;
	}

	let ret = {};
	let cfg = Object.create(ret);
	cfg.db				= db;
	cfg.getContent		= getContent.bind(ret);
	cfg.condition		= Condition.bind(condition);
	cfg.filter			= filter;

	ret.create	= create.bind(cfg);
	ret.set		= set.bind(cfg);
	ret.remove	= remove.bind(cfg);
	ret.get		= get.bind(cfg);
	ret.review	= review.bind(cfg);
	ret.list	= list.bind(cfg);
	return ret;
}
