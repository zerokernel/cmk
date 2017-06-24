import {ObjectId, Collection} from "mongodb";

/**
 * 获取ID
 * 
 */
function getId(id) {
	if (id instanceof ObjectId) {return id;}
	if (typeof id !== "string" || id.length!== 24 || id.search(/^[0-9a-f]{24}$/ig)) {return null;}
	return ObjectId(id);
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
	if (info.category) {info.category = await this.getCategory(info.category);}
	if (info.reviewer) {info.reviewer = await this.getUser(info.reviewer);}
	if (info.author) {info.author = await this.getUser(info.author);}
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
	if (order < -0xFFFFFF) {return false;}
	if (order > +0xFFFFFF) {return false;}
	return true;
}
/**
 * 创建
 */
async function create({title, category, image, description, keyword, label, order, content, hide, top, author, review}) {
	//标题，分类，图片，简介，顺序，隐藏，作者
	if (!isString(title, true)) {throw "标题必须为非空字符串";}
	category = await this.getCategoryId(category);
	if (!isString(image)) {image = "";}
	if (!isString(description)) {description = "";}
	//keyword
	//label
	if (!(label = stringArray(label))) {label = [];}
	if (!isOrder(order)) {order = 0;}
	content = await this.getContent(content, category);
	hide = Boolean(hide);
	top = Boolean(top);
	author = await this.getUserId(author);

	let value = {
		title, category, image, description, label, author,
		order, hide, top, content,
		delete: false, valid: true
	};

	value.updateDate = value.createDate = new Date();
	if (review && (review = await this.getUserId(review))) {
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
			review: value,
		}
	}
	//插入到库
	let {result,ops} = await this.db.insert(value);
	if (result.ok && ops[0]) {return ops[0]._id;}
	throw new Error("添加失败");

}

/**
 * 修改
 */
async function set(id, {title, category, image, description, label, order, content, hide, top, author, review}) {
	if (!(id = getId(id))) {throw new Error("Id必须为24为16进制字符串");}

	let value = {_id:id};
	if (!review) {value.review = null;}
	let info = await this.db.find(value).toArray();
	if (!info.length) {return false;}
	info = info[0];

	value = {};
	if (isString(title, true)) {value.title = title;}
	if ((category || category === null) && (category = await this.getCategoryId(category))) {value.category = category;} else {category = info.category;}
	if (isString(image)) {value.image = image;}
	if (isString(description)) {value.description = description;}
	if (label = stringArray(label)) {value.label = label;}
	if (isOrder(order)) {value.order = parseInt(order);}
	if (content) {value.content = await this.getContent(content, category);}
	if (typeof hide === "boolean") {value.hide = hide;}
	if (typeof top === "boolean") {value.top = top;}
	if (author) {value.author = await this.getUserId(author);} else {author = info.author;}
	value.updateDate = new Date();
	value.valid = true;


	if (review && (review = await this.getUserId(review))) {
		value.reviewDate = value.updateDate;
		if (review === null) {
			value.reviewer = author;
		} else {
			value.reviewer = review;
		}
	} else {
		value = {
			review: value,
		}
	}
	let {result} = this.db.update({_id:id, delete:{$ne:2}},{$set:value});
	return Boolean(result.ok);
}


/**
 * 删除
 */
async function remove(id, del = false) {
	if (!(id = getId(id))) {throw new Error("Id必须为24为16进制字符串");}

	if (del === "forever") {
		let {result} = await this.db.remove({_id: id});
		return Boolean(result.ok);
	} else {
		let {result} = await this.db.update({_id: id, delete: !del},{$set:{delete: Boolean(del), review:null}});
		return Boolean(result.ok);
	}
}
/**
 * 获取
 */
async function get(id) {
	if (!(id = getId(id))) {throw new Error("Id必须为24为16进制字符串");}
	let rs = await this.db.find({_id:id}).toArray();
	if (rs.length) {return await info.call(this, rs[0]);}
	return null;
}



/**
 * 审核
 */
async function review(id, review) {
	if (!(id = getId(id))) {throw new Error("Id必须为24为16进制字符串");}
	let value = await this.db.find({_id:id},{author:1, review:1}).toArray();
	if (!value.length) {return false;}
	value = value[0]
	let author = value.author;
	value = value.review;
	if (review && (review = await this.getUserId(review))) {
		value.reviewDate = new Date();
		if (review === null) {
			value.reviewer = author;
		} else {
			value.reviewer = review;
		}
		value.review = null;
	} else {
		value = {review: null};
	}
	let {result} = await this.db.update({_id:id, adopt:null, delete:false}, {$set:value});
	return Boolean(result.ok);
}

/**
 * 查询
 */
async function query({
	category, delete:del, review, hide, top, content, 
	filter, type = 3, order, limit:[from = 0, length = 20] = [],
}) {
	let condition = this.condition(content);
	if (category instanceof Array) {
		for(let i = 0, l = category.length; i < l; i++) {
			category[i] = this.getCategoryId(category[i]);
		}
		condition.category = {$in:category.filter(x=>x)};
	}else if (category) {
		condition.category = getId(category);
	}
	condition.delete = Boolean(del);
	condition.review = review ? {$ne:null} : null;
	if (typeof top === "boolean") {condition.top = top;}
	if (typeof hide === "boolean") {condition.hide = hide;}

	{
		let filters = new Set(["_id"]);
		if (filter) {
			filter = new Set(filter);
			if (filter.has("$title")) {filters.add("title"); filter.delete("$title");}
			if (filter.has("$category")) {filters.add("category"); filter.delete("$category");}
			if (filter.has("$image")) {filters.add("image"); filter.delete("$image");}
			if (filter.has("$description")) {filters.add("description"); filter.delete("$description");}
			if (filter.has("$keyword")) {filters.add("keyword"); filter.delete("$keyword");}
			if (filter.has("$content")) {filters.add("content"); filter.delete("$content");}
			if (filter.has("$order")) {filters.add("order"); filter.delete("$order");}
			if (filter.has("$review")) {filters.add("review"); filter.delete("$review");}
			if (filter.has("$hide")) {filters.add("hide"); filter.delete("$hide");}
			if (filter.has("$top")) {filters.add("top"); filter.delete("$top");}
			if (filter.has("$label")) {filters.add("label"); filter.delete("$label");}
			this.filter([...filter]).map(x=>filters.add(x));
		}
		filter = {};
		[...filters].map(x=>filter[x] = 1);
	}
	let cursor = this.db.find(condition, filter);
	let ret = [];
	if (type & 1) {
		if (from < 0 || from !== parseInt(from) || isNaN(from) || from >0xFFFFFFFF) {from = 0;}
		if (length <= 0 || length !== parseInt(length) || isNaN(length) || length > 100) {length = 10;}
		if (order) {cursor.sort(order);}
		cursor.skip(from).limit(length);
		ret.push(cursor.toArray().then(rs=>Promise.all(rs.map(r=>info.call(this,r)))));
	} else {
		ret.push(null);
	}
	if (type & 2) {
		ret.push(cursor.count());
	} else {
		ret.push(null);
	}
	let [list, num] = await Promise.all(ret);
	return {list, num};
}

async function Condition(condition) {
	if (!condition) {return {};}
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

async function Filter(filter) {
	try {
		return (await this(filter)).map(x=>"content." + x);
	} catch(e) {
		return [];
	}
}

export default function cmk(db, {getCategoryId, getCategory, getContent, getUserId, getUser, condition, filter,}) {
	if (typeof getCategoryId !== "function") {getCategoryId = x=>x;}
	if (typeof getCategory !== "function") {getCategory = x=>x;}
	if (typeof getContent !== "function") {getContent = x=>x;}
	if (typeof getUserId !== "function") {getUserId = x=>x;}
	if (typeof getUser !== "function") {getUser = x=>x;}

	let ret = {};
	let cfg = Object.create(ret);
	if (!(db instanceof Collection)) {throw "不是有效的Mongodb Collection";}
	cfg.db				= db;
	cfg.getCategoryId	= getCategoryId;
	cfg.getCategory		= getCategory;
	cfg.getContent		= getContent;
	cfg.getUserId		= getUserId;
	cfg.getUser			= getUser;
	cfg.condition		= Condition.bind(condition);
	cfg.filter			= Filter.bind(filter);

	ret.create	= create.bind(cfg);
	ret.set		= set.bind(cfg);
	ret.remove	= remove.bind(cfg);
	ret.get		= get.bind(cfg);
	ret.review	= review.bind(cfg);
	ret.query	= query.bind(cfg);
	return ret;
}
