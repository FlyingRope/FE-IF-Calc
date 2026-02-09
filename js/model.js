var Stat = function(HP, Str, Mag, Skl, Spd, Lck, Def, Res) {
	this.HP = HP;
	this.Str = Str;
	this.Mag = Mag;
	this.Skl = Skl;
	this.Spd = Spd;
	this.Lck = Lck;
	this.Def = Def;
	this.Res = Res;
}

var BaseStat = function(level, HP, Str, Mag, Skl, Spd, Lck, Def, Res) {
	this.level = level;
	this.stat = new Stat(HP, Str, Mag, Skl, Spd, Lck, Def, Res);
}

var Character = function(preset) {
	for (var attr in preset)
		this[attr] = preset[attr];
		
	this.base = this.base || {};
	this.growth = this.growth || {};
	this.cap = this.cap || {};
	
	if (this.gen == "child" || this.gen == "avatarChild") {
		this.base.Standard = {};
		this.base.Standard.level = this.childBase.level;
		this.base.Standard.stat = {};
		for (var attr in db.classes[this.baseClass].base) {
			this.base.Standard.stat[attr] = this.childBase.stat[attr] + db.classes[this.baseClass].base[attr];
		}
	}
}

Character.prototype.getParentList = function() {
	if (this.fixedParent) {
		var genFilter = {};
		var routeFilter = {};
		var parentGen = db.character[this.fixedParent].gen;
		var parentRoute = db.character[this.fixedParent].route;
		var ret = [];
		
		if (this.fixedParent == "kamui") {
			for (var ch in db.character)
				if (ch != "kamui" && ch != "kanna")
					ret.push(ch);
		}else {
			genFilter.avatar = true;
			routeFilter.All = true;
			
			if (parentGen == "father")
				genFilter.mother = true;
			if (parentGen == "mother")
				genFilter.father = true;
			
			if (parentRoute == "All") {
				routeFilter.Birthright = true;
				routeFilter.Conquest = true;
			}
			if (parentRoute == "Birthright")
				routeFilter.Birthright = true;
			if (parentRoute == "Conquest")
				routeFilter.Conquest = true;
			
			revFilter = {}
			if (this.revParent)
				for (var i=0; i<this.revParent.length; i++)
					revFilter[this.revParent[i]] = true;
					
			exceptionFilter = {}
			if (this.nonParent)
				for (var i=0; i<this.nonParent.length; i++)
					exceptionFilter[this.nonParent[i]] = true;
			
			for (var ch in db.character) {
				if ((genFilter[db.character[ch].gen] && routeFilter[db.character[ch].route] && !exceptionFilter[ch]) || revFilter[ch])
					ret.push(ch);
			}
		}
		
		
		return ret;
	}
}

Character.prototype.setParent = function(varParent) {
	if (this.gen == "child" || this.gen == "avatarChild") {
		this.varParent = varParent;
		this.evaluateChildStat();
	}
}

Character.prototype.evaluateChildStat = function() {
	var fixedParent = db.character[this.fixedParent];
	for (var attr in this.childGrowth) {
		this.growth[attr] = (this.varParent.growth[attr] + this.childGrowth[attr])/2;
		this.cap[attr] = this.varParent.cap[attr] + fixedParent.cap[attr];
		if (this.varParent.gen != "child")
			this.cap[attr]++;
	}
	
	this.classSet = [];
	this.classSet.push(this.baseClass);
	var secondClass = fixedParent.classSet[0];
	if (secondClass == "singer" || secondClass == this.baseClass) {
		secondClass = fixedParent.classSet[1];
		if (secondClass == this.baseClass && fixedParent.classSet[0] == "singer") {
			secondClass = db.classes[fixedParent.classSet[0]].parallel;
			if (secondClass == this.varParent.classSet[0])
				secondClass = db.classes[fixedParent.classSet[1]].parallel;
		}
	}
	var thirdClass = this.varParent.classSet[0];
	if (thirdClass == "singer" || thirdClass == this.baseClass || thirdClass == secondClass) {
		thirdClass = this.varParent.classSet[1];
		if (thirdClass == this.baseClass || thirdClass == secondClass)
			thirdClass = db.classes[this.varParent.classSet[0]].parallel;
	}
	if (secondClass)
		this.classSet.push(secondClass);
	if (thirdClass)
		this.classSet.push(thirdClass);
	
	return this;
}

var db = {};

db.classes = {
	
	nohrPrince : {
		name	: "Nohr Prince(ss)",
		tier	: "tier1",
		promoteTo : [ "hoshidoNoble", "nohrNoble" ],
		base	: new Stat(17, 7, 3, 4, 5, 2, 5, 2),
		growth	: new Stat(15, 15, 10, 10, 10, 10, 10, 5),
		maxStat	: new Stat(40, 23, 17, 19, 21, 22, 21, 19),
		restriction : [ "kamui" ],
	},
	
	hoshidoNoble : {
		name	: "Hoshido Noble",
		tier	: "tier2",
		base	: new Stat(19, 10, 4, 5, 6, 4, 7, 3),
		growth	: new Stat(15, 15, 10, 10, 10, 10, 15, 0),
		maxStat	: new Stat(60, 34, 28, 29, 30, 33, 31, 28),
		restriction : [ "kamui" ],
	},
	
	nohrNoble : {
		name	: "Nohr Noble",
		tier	: "tier2",
		base	: new Stat(18, 8, 6, 4, 7, 2, 6, 6),
		growth	: new Stat(15, 10, 15, 5, 15, 5, 5, 15),
		maxStat	: new Stat(60, 32, 31, 28, 32, 27, 29, 32),
		restriction : [ "kamui" ],
	},
	
	samurai : {
		name	: "Samurai",
		tier	: "tier1",
		promoteTo : [ "swordSaint", "weaponMaster" ],
		parallel: "mercenary",
		base	: new Stat(17, 4, 0, 5, 8, 3, 3, 3),
		growth	: new Stat(10, 10, 0, 15, 20, 15, 0, 10),
		maxStat	: new Stat(40, 20, 16, 23, 25, 24, 18, 20),
	},
	
	swordSaint : {
		name	: "Swordmaster",
		tier	: "tier2",
		base	: new Stat(18, 6, 2, 7, 11, 4, 5, 5),
		growth	: new Stat(10, 10, 5, 15, 20, 15, 0, 10),
		maxStat	: new Stat(55, 30, 28, 32, 35, 33, 27, 31),
	},
	
	weaponMaster : {
		name	: "Master of Arms",
		tier	: "tier2",
		base	: new Stat(20, 8, 0, 6, 9, 3, 7, 3),
		growth	: new Stat(20, 15, 0, 10, 10, 10, 10, 0),
		maxStat	: new Stat(65, 33, 25, 30, 30, 31, 31, 28),
	},
	
	villager : {
		name	: "Villager",
		tier	: "tier1",
		promoteTo : [ "weaponMaster", "merchant" ],
		parallel: "apoth",
		base	: new Stat(17, 5, 0, 4, 5, 3, 4, 0),
		growth	: new Stat(10, 10, 0, 10, 10, 20, 10, 0),
		maxStat	: new Stat(35, 19, 15, 19, 19, 22, 18, 15),
		restriction : [ "mozume" ],
	},
	
	merchant : {
		name	: "Merchant",
		tier	: "tier2",
		base	: new Stat(20, 8, 0, 6, 5, 4, 8, 5),
		growth	: new Stat(20, 20, 0, 10, 5, 15, 10, 5),
		maxStat	: new Stat(65, 33, 25, 29, 28, 32, 33, 30),
	},
	
	apoth : {
		name	: "Apothecary",
		tier	: "tier1",
		promoteTo : [ "merchant", "mechanist" ],
		base	: new Stat(18, 6, 0, 4, 4, 2, 6, 2),
		growth	: new Stat(20, 20, 0, 10, 10, 5, 10, 5),
		maxStat	: new Stat(45, 24, 15, 19, 19, 21, 23, 20),
	},
	
	oni : {
		name	: "Oni Savage",
		tier	: "tier1",
		promoteTo : [ "shura", "blacksmith" ],
		parallel: "fighter",
		base	: new Stat(18, 6, 1, 2, 5, 0, 7, 1),
		growth	: new Stat(20, 20, 10, 0, 10, 0, 20, 0),
		maxStat	: new Stat(45, 24, 19, 16, 20, 17, 23, 18),
	},
	
	shura : {
		name	: "Oni Chieftain",
		tier	: "tier2",
		base	: new Stat(19, 9, 5, 2, 7, 0, 10, 5),
		growth	: new Stat(10, 20, 15, 0, 10, 0, 20, 5),
		maxStat	: new Stat(60, 34, 28, 25, 30, 25, 36, 31),
	},
	
	blacksmith : {
		name	: "Blacksmith",
		tier	: "tier2",
		base	: new Stat(21, 8, 0, 9, 8, 3, 8, 2),
		growth	: new Stat(20, 15, 0, 15, 10, 5, 15, 0),
		maxStat	: new Stat(65, 33, 25, 32, 31, 30, 32, 27),
	},
	
	lancer : {
		name	: "Spear Fighter",
		tier	: "tier1",
		promoteTo : [ "sentinel", "basara" ],
		parallel: "knight",
		base	: new Stat(17, 6, 0, 6, 6, 2, 5, 2),
		growth	: new Stat(15, 15, 0, 15, 15, 5, 10, 5),
		maxStat	: new Stat(40, 22, 15, 23, 22, 21, 22, 21),
	},
	
	sentinel : {
		name	: "Spear Master",
		tier	: "tier2",
		base	: new Stat(18, 9, 0, 8, 8, 3, 7, 3),
		growth	: new Stat(15, 15, 0, 15, 15, 5, 10, 5),
		maxStat	: new Stat(60, 34, 25, 33, 32, 29, 30, 29),
	},
	
	basara : {
		name	: "Basara",
		tier	: "tier2",
		base	: new Stat(20, 7, 5, 7, 7, 5, 7, 6),
		growth	: new Stat(20, 10, 10, 10, 10, 15, 5, 10),
		maxStat	: new Stat(65, 31, 30, 30, 31, 35, 30, 32),
	},
	
	diviner : {
		name	: "Diviner",
		tier	: "tier1",
		promoteTo : [ "exorcist", "basara" ],
		parallel: "mage",
		base	: new Stat(15, 0, 4, 5, 6, 1, 1, 3),
		growth	: new Stat(0, 5, 15, 10, 10, 5, 0, 10),
		maxStat	: new Stat(35, 17, 22, 20, 23, 19, 16, 20),
	},
	
	exorcist : {
		name	: "Onmyoji",
		tier	: "tier2",
		base	: new Stat(16, 0, 7, 6, 7, 2, 3, 6),
		growth	: new Stat(0, 0, 20, 10, 15, 0, 0, 15),
		maxStat	: new Stat(45, 25, 33, 31, 32, 27, 25, 31),
	},
	
	monk : {
		name	: "Monk",
		tier	: "tier1",
		promoteTo : [ "exorcist", "greatMaster" ],
		base	: new Stat(16, 0, 3, 5, 5, 4, 2, 5),
		growth	: new Stat(0, 5, 10, 10, 15, 15, 0, 20),
		maxStat	: new Stat(35, 18, 21, 20, 22, 23, 17, 24),
	},
	
	miko : {
		name	: "Shrine Maiden",
		tier	: "tier1",
		promoteTo : [ "exorcist", "priestess" ],
		base	: new Stat(16, 0, 3, 5, 5, 4, 2, 5),
		growth	: new Stat(0, 5, 10, 10, 15, 15, 0, 20),
		maxStat	: new Stat(35, 18, 21, 20, 22, 23, 17, 24),
	},
	
	greatMaster : {
		name	: "Great Master",
		tier	: "tier2",
		base	: new Stat(19, 8, 6, 6, 8, 5, 6, 7),
		growth	: new Stat(10, 15, 5, 5, 15, 15, 10, 10),
		maxStat	: new Stat(55, 32, 30, 31, 33, 32, 28, 32),
	},
	
	priestess : {
		name	: "Priestess",
		tier	: "tier2",
		base	: new Stat(19, 6, 7, 6, 9, 5, 5, 8),
		growth	: new Stat(10, 10, 10, 5, 15, 15, 0, 20),
		maxStat	: new Stat(50, 29, 32, 30, 33, 34, 26, 34),
	},
	
	pegKnight : {
		name	: "Sky Knight",
		tier	: "tier1",
		promoteTo : [ "falcoKnight", "kinshiKnight" ],
		parallel: "wyvernRider",
		base	: new Stat(16, 3, 0, 5, 7, 4, 2, 6),
		growth	: new Stat(0, 10, 0, 10, 15, 20, 0, 20),
		maxStat	: new Stat(35, 19, 16, 21, 23, 25, 18, 25),
	},
	
	falcoKnight : {
		name	: "Falcon Knight",
		tier	: "tier2",
		base	: new Stat(18, 5, 4, 6, 10, 5, 5, 9),
		growth	: new Stat(0, 10, 10, 10, 15, 20, 0, 20),
		maxStat	: new Stat(55, 28, 27, 30, 34, 35, 27, 35),
	},
	
	kinshiKnight : {
		name	: "Kinshi Knight",
		tier	: "tier2",
		base	: new Stat(17, 4, 1, 9, 8, 5, 4, 7),
		growth	: new Stat(0, 5, 0, 15, 15, 15, 0, 15),
		maxStat	: new Stat(50, 27, 26, 33, 31, 34, 25, 31),
	},
	
	archer : {
		name	: "Archer",
		tier	: "tier1",
		promoteTo : [ "sniper", "kinshiKnight" ],
		parallel: "outlaw",
		base	: new Stat(17, 5, 0, 7, 5, 2, 4, 1),
		growth	: new Stat(10, 15, 0, 15, 15, 5, 10, 0),
		maxStat	: new Stat(40, 21, 15, 23, 21, 20, 20, 17),
	},
	
	sniper : {
		name	: "Sniper",
		tier	: "tier2",
		base	: new Stat(19, 7, 0, 10, 9, 3, 6, 2),
		growth	: new Stat(10, 15, 0, 20, 15, 5, 10, 0),
		maxStat	: new Stat(55, 31, 25, 35, 33, 30, 31, 28),
	},

	ninja : {
		name 	: "Ninja",
		tier	: "tier1",
		promoteTo : [ "jounin", "mechanist" ],
		parallel: "cavalier",
		base 	: new Stat(16, 3, 0, 8, 8, 1, 3, 3),
		growth 	: new Stat(5, 5, 0, 20, 20, 0, 5, 15),
		maxStat : new Stat(35, 17, 15, 25, 25, 18, 19, 20),
	},
	
	jounin : {
		name 	: "Master Ninja",
		tier	: "tier2",
		base 	: new Stat(17, 5, 0, 10, 11, 2, 4, 8),
		growth 	: new Stat(5, 5, 0, 20, 20, 0, 5, 20),
		maxStat : new Stat(55, 27, 25, 35, 35, 28, 26, 34),
	},
	
	mechanist : {
		name	: "Mechanist",
		tier	: "tier2",
		base	: new Stat(18, 7, 0, 9, 7, 2, 6, 6),
		growth	: new Stat(10, 10, 0, 15, 10, 5, 5, 15),
		maxStat	: new Stat(60, 30, 25, 33, 30, 30, 31, 31),
	},
	
	kitsune : {
		name	: "Kitsune",
		tier	: "tier1",
		promoteTo : [ "nineTails" ],
		parallel: "apoth",
		base	: new Stat(16, 5, 1, 6, 8, 4, 1, 4),
		growth	: new Stat(10, 10, 0, 15, 20, 10, 0, 20),
		maxStat	: new Stat(40, 20, 18, 23, 24, 24, 18, 23),
		restriction : [ "kaden" ],
	},

	nineTails : {
		name	: "Nine-Tails",
		tier	: "tier2",
		base	: new Stat(19, 6, 2, 9, 10, 5, 2, 8),
		growth	: new Stat(10, 10, 0, 15, 20, 10, 0, 20),
		maxStat	: new Stat(55, 29, 29, 33, 34, 33, 27, 34),
		restriction : [ "kaden" ],
	},
	
	cavalier : {
		name	: "Cavalier",
		tier	: "tier1",
		promoteTo : [ "paladin", "greatKnight" ],
		parallel: "ninja",
		base	: new Stat(17, 6, 0, 5, 5, 3, 5, 3),
		growth	: new Stat(10, 15, 0, 10, 10, 15, 10, 5),
		maxStat	: new Stat(40, 22, 15, 21, 20, 24, 22, 21),
	},
	
	paladin : {
		name	: "Paladin",
		tier	: "tier2",
		base	: new Stat(19, 8, 1, 7, 7, 4, 7, 6),
		growth	: new Stat(10, 15, 0, 10, 10, 15, 10, 10),
		maxStat	: new Stat(60, 31, 26, 30, 30, 32, 32, 32),
	},
	
	greatKnight : {
		name	: "Great Knight",
		tier	: "tier2",
		base	: new Stat(21, 10, 0, 6, 6, 3, 10, 2),
		growth	: new Stat(20, 20, 0, 10, 5, 5, 20, 0),
		maxStat	: new Stat(65, 35, 25, 29, 27, 28, 37, 28),
	},
	
	knight : {
		name	: "Knight",
		tier	: "tier1",
		promoteTo : [ "greatKnight", "general" ],
		parallel: "lancer",
		base	: new Stat(19, 8, 0, 5, 3, 3, 8, 1),
		growth	: new Stat(20, 20, 0, 15, 5, 10, 20, 0),
		maxStat	: new Stat(45, 24, 15, 22, 17, 22, 26, 18),
	},
	
	general : {
		name	: "General",
		tier	: "tier2",
		base	: new Stat(22, 11, 0, 7, 3, 4, 12, 3),
		growth	: new Stat(25, 20, 0, 15, 0, 10, 20, 5),
		maxStat	: new Stat(70, 38, 25, 32, 25, 32, 40, 30),
	},
	
	fighter : {
		name	: "Fighter",
		tier	: "tier1",
		promoteTo : [ "berserker", "hero" ],
		parallel: "oni",
		base	: new Stat(19, 7, 0, 6, 6, 2, 4, 1),
		growth	: new Stat(20, 20, 0, 15, 15, 5, 5, 0),
		maxStat	: new Stat(45, 25, 15, 23, 22, 21, 19, 18),
	},
	
	berserker : {
		name	: "Berserker",
		tier	: "tier2",
		base	: new Stat(24, 12, 0, 8, 9, 0, 5, 0),
		growth	: new Stat(30, 25, 0, 15, 15, 0, 0, 0),
		maxStat	: new Stat(70, 40, 25, 32, 33, 25, 27, 25),
	},
	
	mercenary : {
		name	: "Mercenary",
		tier	: "tier1",
		promoteTo : [ "hero", "bowKnight" ],
		parallel: "samurai",
		base	: new Stat(17, 5, 0, 7, 6, 2, 5, 2),
		growth	: new Stat(10, 15, 0, 20, 15, 5, 10, 5),
		maxStat	: new Stat(40, 22, 15, 24, 22, 20, 21, 19),
	},
	
	hero : {
		name	: "Hero",
		tier	: "tier2",
		base	: new Stat(20, 8, 0, 10, 8, 3, 7, 2),
		growth	: new Stat(20, 15, 0, 20, 15, 5, 10, 0),
		maxStat	: new Stat(60, 32, 25, 35, 32, 31, 30, 27),
	},
	
	bowKnight : {
		name	: "Bow Knight",
		tier	: "tier2",
		base	: new Stat(18, 6, 0, 8, 9, 3, 5, 6),
		growth	: new Stat(10, 10, 0, 15, 15, 10, 0, 10),
		maxStat	: new Stat(55, 29, 25, 32, 33, 30, 27, 32),
	},
	
	outlaw : {
		name	: "Outlaw",
		tier	: "tier1",
		promoteTo : [ "bowKnight", "adventurer" ],
		parallel: "archer",
		base	: new Stat(16, 3, 1, 4, 8, 1, 2, 4),
		growth	: new Stat(0, 10, 5, 10, 20, 0, 0, 20),
		maxStat	: new Stat(35, 19, 18, 20, 24, 18, 17, 22),
	},
	
	adventurer : {
		name	: "Adventurer",
		tier	: "tier2",
		base	: new Stat(17, 4, 6, 6, 10, 2, 3, 8),
		growth	: new Stat(0, 5, 15, 5, 20, 0, 0, 20),
		maxStat	: new Stat(50, 27, 31, 27, 34, 27, 25, 34),
	},
	
	wyvernRider : {
		name	: "Wyvern Rider",
		tier	: "tier1",
		promoteTo : [ "wyvernLord", "maligKnight" ],
		parallel: "pegKnight",
		base	: new Stat(17, 6, 0, 5, 4, 2, 7, 0),
		growth	: new Stat(10, 15, 5, 10, 10, 5, 20, 0),
		maxStat	: new Stat(40, 22, 17, 21, 20, 19, 24, 15),
	},
	
	wyvernLord : {
		name	: "Wyvern Lord",
		tier	: "tier2",
		base	: new Stat(19, 8, 0, 9, 6, 3, 10, 1),
		growth	: new Stat(10, 15, 0, 15, 10, 5, 20, 0),
		maxStat	: new Stat(60, 33, 25, 33, 29, 28, 35, 26),
	},
	
	maligKnight : {
		name	: "Malig Knight",
		tier	: "tier2",
		base	: new Stat(18, 7, 6, 6, 5, 0, 8, 6),
		growth	: new Stat(0, 15, 15, 10, 5, 0, 10, 15),
		maxStat	: new Stat(55, 31, 30, 28, 27, 25, 31, 31),
	},
	
	mage : {
		name	: "Dark Mage",
		tier	: "tier1",
		promoteTo : [ "sorcerer", "darkKnight" ],
		parallel: "diviner",
		base	: new Stat(16, 0, 6, 3, 3, 1, 3, 5),
		growth	: new Stat(0, 10, 20, 0, 10, 0, 5, 10),
		maxStat	: new Stat(35, 19, 24, 16, 19, 18, 19, 22),
	},
	
	sorcerer : {
		name	: "Sorcerer",
		tier	: "tier2",
		base	: new Stat(17, 0, 9, 4, 6, 1, 5, 8),
		growth	: new Stat(0, 0, 25, 0, 10, 0, 5, 15),
		maxStat	: new Stat(50, 25, 35, 26, 29, 26, 29, 33),
	},
	
	darkKnight : {
		name	: "Dark Knight",
		tier	: "tier2",
		base	: new Stat(19, 8, 6, 6, 5, 3, 8, 6),
		growth	: new Stat(15, 20, 10, 5, 5, 5, 15, 5),
		maxStat	: new Stat(55, 32, 31, 28, 27, 31, 34, 30),
	},
	
	troubadour : {
		name	: "Troubadour",
		tier	: "tier1",
		promoteTo : [ "strategist", "maid" ],
		base	: new Stat(15, 0, 3, 7, 5, 4, 1, 4),
		growth	: new Stat(0, 0, 10, 20, 10, 15, 0, 15),
		maxStat	: new Stat(35, 16, 19, 24, 20, 23, 16, 21),
	},
	
	strategist : {
		name	: "Strategist",
		tier	: "tier2",
		base	: new Stat(16, 0, 7, 6, 7, 5, 2, 7),
		growth	: new Stat(0, 0, 15, 5, 10, 20, 0, 15),
		maxStat	: new Stat(45, 25, 33, 28, 31, 33, 25, 32),
	},
	
	maid : {
		name	: "Maid/Butler",
		tier	: "tier2",
		base	: new Stat(18, 4, 5, 9, 8, 4, 5, 4),
		growth	: new Stat(0, 10, 10, 15, 15, 10, 5, 10),
		maxStat	: new Stat(50, 28, 31, 33, 33, 32, 29, 29),
	},
	
	wolfskin : {
		name	: "Wolfskin",
		tier	: "tier1",
		promoteTo : [ "wolfssegner" ],
		parallel: "outlaw",
		base	: new Stat(19, 8, 0, 4, 6, 0, 4, 0),
		growth	: new Stat(20, 20, 0, 5, 15, 5, 10, 0),
		maxStat	: new Stat(45, 24, 15, 18, 22, 17, 21, 15),
		restriction : [ "keaton" ],
	},
	
	wolfssegner : {
		name	: "Wolfssegner",
		tier	: "tier2",
		base	: new Stat(22, 11, 0, 6, 7, 1, 7, 1),
		growth	: new Stat(20, 20, 0, 5, 15, 5, 10, 0),
		maxStat	: new Stat(65, 36, 25, 29, 31, 26, 32, 26),
		restriction : [ "keaton" ],
	},

	singer : {
		name	: "Songstress",
		tier	: "special",
		parallel: "troubadour",
		base	: new Stat(16, 3, 0, 6, 5, 3, 2, 3),
		growth	: new Stat(0, 10, 0, 20, 20, 20, 0, 0),
		maxStat	: new Stat(45, 28, 27, 31, 31, 35, 27, 28),
		restriction : [ "azura" ],
	},
	
	darkFalcon : {
		name	: "Dark Falcon",
		tier	: "special",
		base	: new Stat(17, 4, 7, 5, 9, 4, 3, 9),
		growth	: new Stat(0, 10, 15, 5, 15, 15, 0, 20),
		maxStat	: new Stat(45, 27, 32, 28, 33, 32, 26, 34),
		special	: true,
	},
	
	dreadFighter : {
		name	: "Dread Fighter",
		tier	: "special",
		base	: new Stat(19, 8, 3, 6, 8, 1, 6, 9),
		growth	: new Stat(15, 15, 5, 5, 15, 0, 5, 20),
		maxStat	: new Stat(55, 32, 28, 29, 31, 26, 29, 34),
	},
	
	lodestar : {
		name	: "Lodestar",
		tier	: "special",
		base	: new Stat(19, 7, 0, 10, 9, 7, 7, 2),
		growth	: new Stat(15, 10, 0, 20, 10, 25, 5, 5),
		maxStat	: new Stat(60, 29, 26, 35, 33, 40, 30, 29),
		genderLock : "M",
	},
	
	greatLord : {
		name	: "Great Lord",
		tier	: "special",
		base	: new Stat(18, 8, 1, 8, 9, 5, 7, 3),
		growth	: new Stat(15, 15, 0, 10, 10, 15, 10, 5),
		maxStat	: new Stat(60, 30, 25, 32, 34, 35, 29, 31),
		genderLock : "F",
	},
	
	vanguard : {
		name	: "Vanguard",
		tier	: "special",
		base	: new Stat(21, 10, 0, 6, 7, 3, 9, 1),
		growth	: new Stat(20, 20, 0, 5, 5, 10, 15, 0),
		maxStat	: new Stat(65, 36, 25, 29, 30, 30, 32, 27),
		genderLock : "M",
	},
	
	grandmaster : {
		name	: "Grandmaster",
		tier	: "special",
		base	: new Stat(18, 7, 6, 8, 7, 2, 6, 8),
		growth	: new Stat(10, 15, 15, 15, 5, 0, 5, 15),
		maxStat	: new Stat(55, 31, 33, 33, 29, 26, 28, 33),
		genderLock : "M",
	},

	witch : {
		name	: "Witch",
		tier	: "special",
		base	: new Stat(17, 0, 10, 5, 9, 3, 4, 5),
		growth	: new Stat(5, 0, 25, 5, 20, 5, 0, 10),
		maxStat	: new Stat(50, 25, 36, 27, 34, 28, 26, 29),
		genderLock : "F",
	},
	
	ballistician : {
		name	: "Ballistician",
		tier	: "special",
		base	: new Stat(18, 10, 0, 7, 2, 4, 3, 1),
		growth	: new Stat(5, 25, 0, 15, 0, 10, 5, 5),
		maxStat	: new Stat(50, 39, 25, 31, 25, 32, 27, 26),
		genderLock : "M",
	},
}

db.character = {
	
	kamui : new Character({
		name	: "Corrin",
		gender	: "either",
		gen		: "avatar",
		baseClass : "nohrPrince",
		classSet  : [ "nohrPrince" ],
		
		route	: "All",
		
		baseMod	: {
			none : new Stat(19, 7, 4, 7, 6, 5, 6, 2, 5),
			boon : new Stat(3, 2, 3, 3, 2, 3, 1, 1),
			bane : new Stat(-2, -1, -2, -2, -1, -2, -1, -1),
		},
		
		growthMod : {
			none : new Stat(45, 45, 30, 40, 45, 45, 35, 25),
			boon : {
				HP	: new Stat(15, 0, 0, 0, 0, 0, 5, 5),
				Str	: new Stat(0, 15, 0, 5, 0, 0, 5, 0),
				Mag	: new Stat(0, 0, 20, 0, 5, 0, 0, 5),
				Skl	: new Stat(0, 5, 0, 25, 0, 0, 5, 0),
				Spd	: new Stat(0, 0, 0, 5, 15, 5, 0, 0),
				Lck	: new Stat(0, 5, 5, 0, 0, 25, 0, 0),
				Def	: new Stat(0, 0, 0, 0, 0, 5, 10, 5),
				Res	: new Stat(0, 0, 5, 0, 5, 0, 0, 10),
			},
			bane : {
				HP	: new Stat(-10, 0, 0, 0, 0, 0, -5, -5),
				Str	: new Stat(0, -10, 0, -5, 0, 0, -5, 0),
				Mag	: new Stat(0, 0, -15, 0, -5, 0, 0, -5),
				Skl	: new Stat(0, -5, 0, -20, 0, 0, -5, 0),
				Spd	: new Stat(0, 0, 0, -5, -10, -5, 0, 0),
				Lck	: new Stat(0, -5, -5, 0, 0, -20, 0, 0),
				Def	: new Stat(0, 0, 0, 0, 0, -5, -10, -5),
				Res	: new Stat(0, 0, -5, 0, -5, 0, 0, -10),
			},
		},
		
		capMod : {
			boon : {
				HP	: new Stat(0, 1, 1, 0, 0, 2, 2, 2),
				Str	: new Stat(0, 4, 0, 2, 0, 0, 2, 0),
				Mag	: new Stat(0, 0, 4, 0, 2, 0, 0, 2),
				Skl	: new Stat(0, 2, 0, 4, 0, 0, 2, 0),
				Spd	: new Stat(0, 0, 0, 2, 4, 2, 0, 0),
				Lck	: new Stat(0, 2, 2, 0, 0, 4, 0, 0),
				Def	: new Stat(0, 0, 0, 0, 0, 2, 4, 2),
				Res	: new Stat(0, 0, 2, 0, 2, 0, 0, 4),
			},
			bane : {
				HP	: new Stat(0, -1, -1, 0, 0, -1, -1, -1),
				Str	: new Stat(0, -3, 0, -1, 0, 0, -1, 0),
				Mag	: new Stat(0, 0, -3, 0, -1, 0, 0, -1),
				Skl	: new Stat(0, -1, 0, -3, 0, 0, -1, 0),
				Spd	: new Stat(0, 0, 0, -1, -3, -1, 0, 0),
				Lck	: new Stat(0, -1, -1, 0, 0, -3, 0, 0),
				Def	: new Stat(0, 0, 0, 0, 0, -1, -3, -1),
				Res	: new Stat(0, 0, -1, 0, -1, 0, 0, -3),
			},
		},
		
		initialize : function(boon, bane) {
			var keySet = new Stat(0, 0, 0, 0, 0, 0, 0, 0);
			this.base.Standard = {};
			this.base.Standard.level = 1;
			this.base.Standard.stat = {};
			for (var attr in keySet) {
				if (attr == boon)
					this.base.Standard.stat[attr] = this.baseMod.none[attr] + this.baseMod.boon[attr];
				else if (attr == bane)
					this.base.Standard.stat[attr] = this.baseMod.none[attr] + this.baseMod.bane[attr];
				else
					this.base.Standard.stat[attr] = this.baseMod.none[attr];
				this.growth[attr] = this.growthMod.none[attr] + this.growthMod.boon[boon][attr] + this.growthMod.bane[bane][attr];
				this.cap[attr] = this.capMod.boon[boon][attr] + this.capMod.bane[bane][attr];
			}
			
			for (var unit in db.character)
				if (db.character[unit].varParent)
					if (db.character[unit].varParent == this || unit == "kanna")
						db.character[unit].evaluateChildStat();
		},
	}),

	azura : new Character({
		name	: "Azura",
		gender	: "F",
		gen		: "mother",
		baseClass : "singer",
		classSet  : [ "singer", "pegKnight" ],
		base 	: {
			Standard : new BaseStat(1, 16, 5, 2, 8, 8, 6, 4, 7),
		},
		growth	: new Stat(25, 50, 25, 60, 60, 40, 15, 35),
		cap		: new Stat(0, 0, 0, 1, 3, 0, -3, 0),
		route	: "All",
	}),
	
	kaze : new Character({
		name	: "Kaze",
		gender	: "M",
		gen		: "father",
		baseClass : "ninja",
		classSet  : [ "ninja", "samurai" ],
		base: {
			Standard : new BaseStat(3, 19, 7, 0, 9, 12, 4, 5, 10),
			Conquest : new BaseStat(9, 22, 9, 0, 12, 16, 6, 7, 13),
		},
		growth	: new Stat(55, 40, 0, 45, 65, 20, 20, 35),
		cap		: new Stat(0, -2, 0, 2, 3, -2, -1, 0),
		route	: "All",
	}),
	
	gunter : new Character({
		name	: "Gunter",
		gender	: "M",
		gen		: "exclusive",
		baseClass : "greatKnight",
		classSet  : [ "cavalier", "mercenary", "wyvernRider" ],
		base	: {
			Standard : new BaseStat(3, 24, 10, 0, 15, 8, 9, 10, 4),
			Conquest : new BaseStat(10, 34, 17, 0, 24, 10, 13, 20, 6),
		},
		growth	: new Stat(15, 5, 0, 5, 0, 15, 5, 5),
		cap		: new Stat(0, 2, 0, 1, -2, 0, 2, -2),
		route	: "All",
	}),

	felicia : new Character({
		name	: "Felicia",
		gender	: "F",
		gen		: "mother",
		baseClass : "maid",
		classSet  : [ "troubadour", "mercenary" ],
		base	: {
			"First Joining" : new BaseStat(1, 19, 5, 9, 10, 10, 12, 5, 9),
			"Second Joining" : new BaseStat(13, 24, 7, 14, 15, 17, 20, 7, 14),
		},
		growth	: new Stat(40, 10, 35, 30, 40, 55, 15, 35),
		cap		: new Stat(0, -2, 2, 0, 1, 0, -1, 1),
		route	: "All",
		promotedNotPromoted : true,
	}),

	jakob : new Character({
		name	: "Jakob",
		gender	: "M",
		gen		: "father",
		baseClass : "maid",
		classSet  : [ "troubadour", "cavalier" ],
		base	: {
			"First Joining" : new BaseStat(1, 21, 8, 6, 12, 9, 10, 7, 6),
			"Second Joining" : new BaseStat(13, 27, 13, 9, 19, 15, 17, 11, 10),
		},
		growth	: new Stat(50, 35, 15, 40, 35, 45, 25, 25),
		cap		: new Stat(0, 2, -2, 2, 0, -1, 0, -1),
		route	: "All",
		promotedNotPromoted : true,
	}),

	silas : new Character({
		name	: "Silas",
		gender	: "M",
		gen		: "father",
		baseClass : "cavalier",
		classSet  : [ "cavalier", "mercenary" ],
		base	: {
			Standard : new BaseStat(6, 22, 11, 0, 9, 8, 7, 10, 5),
		},
		growth	: new Stat(40, 45, 5, 50, 40, 40, 40, 25),
		cap		: new Stat(0, 1, 0, 2, 0, -1, 0, -1),
		route	: "All",
	}),

	mozume : new Character({
		name	: "Mozu",
		gender	: "F",
		gen		: "mother",
		baseClass : "villager",
		classSet  : [ "villager", "archer" ],
		base	: {
			Standard : new BaseStat(1, 16, 6, 0, 5, 7, 3, 4, 1),
		},
		growth	: new Stat(30, 40, 5, 50, 55, 45, 35, 30),
		cap		: new Stat(0, 0, 0, 1, 1, 1, 0, -2),
		route	: "All",
	}),

	rinkah : new Character({
		name	: "Rinkah",
		gender	: "F",
		gen		: "mother",
		baseClass : "oni",
		classSet  : [ "oni", "ninja" ],
		base	: {
			Standard : new BaseStat(4, 20, 8, 2, 6, 8, 5, 10, 3),
		},
		growth	: new Stat(20, 25, 15, 50, 45, 35, 45, 20),
		cap		: new Stat(0, -1, 0, -2, 1, 0, 2, 0),
		route	: "Birthright",
	}),

	sakura : new Character({
		name	: "Sakura",
		gender	: "F",
		gen		: "mother",
		baseClass : "miko",
		classSet  : [ "miko", "pegKnight" ],
		base	: {
			Standard : new BaseStat(1, 16, 3, 6, 5, 7, 9, 5, 7),
			Revelation : new BaseStat(4, 19, 4, 8, 6, 10, 11, 7, 8),
		},
		growth	: new Stat(45, 30, 50, 40, 40, 55, 30, 20),
		cap		: new Stat(0, 0, 2, -1, 1, 0, -1, 0),
		route	: "Birthright",
	}),

	hana : new Character({
		name	: "Hana",
		gender	: "F",
		gen		: "mother",
		baseClass : "samurai",
		classSet  : [ "samurai", "miko" ],
		base	: {
			Standard : new BaseStat(4, 20, 9, 0, 11, 11, 5, 6, 9),
			Revelation : new BaseStat(4, 20, 7, 0, 9, 11, 5, 6, 9),
		},
		growth	: new Stat(25, 55, 10, 45, 55, 25, 20, 30),
		cap		: new Stat(0, 1, 0, 1, 2, -1, -3, 1),
		route	: "Birthright",
	}),

	tsubaki : new Character({
		name	: "Subaki",
		gender	: "M",
		gen		: "father",
		baseClass : "pegKnight",
		classSet  : [ "pegKnight", "samurai" ],
		base	: {
			Standard : new BaseStat(5, 22, 8, 0, 13, 10, 7, 9, 10),
		},
		growth	: new Stat(55, 30, 20, 50, 20, 25, 45, 5),
		cap		: new Stat(0, -1, 0, 2, -2, -1, 3, -1),
		route	: "Birthright",
	}),

	saizou : new Character({
		name	: "Saizo",
		gender	: "M",
		gen		: "father",
		baseClass : "ninja",
		classSet  : [ "ninja", "samurai" ],
		base	: {
			Standard : new BaseStat(7, 23, 11, 3, 14, 11, 9, 9, 7),
			Revelation : new BaseStat(9, 23, 11, 3, 15, 12, 9, 9, 8),
		},
		growth	: new Stat(40, 50, 45, 60, 30, 55, 45, 10),
		cap		: new Stat(0, 1, 0, 3, -2, 0, 1, -2),
		route	: "Birthright",
	}),

	orochi : new Character({
		name	: "Orochi",
		gender	: "F",
		gen		: "mother",
		baseClass : "diviner",
		classSet  : [ "diviner", "apoth" ],
		base	: {
			Standard : new BaseStat(5, 20, 0, 9, 11, 7, 6, 5, 10),
			Revelation : new BaseStat(7, 20, 1, 10, 12, 7, 6, 5, 10),
		},
		growth	: new Stat(35, 5, 65, 50, 15, 35, 25, 45),
		cap		: new Stat(0, 0, 3, 2, -2, -1, -2, 1),
		route	: "Birthright",
	}),

	hinoka : new Character({
		name	: "Hinoka",
		gender	: "F",
		gen		: "mother",
		baseClass : "pegKnight",
		classSet  : [ "pegKnight", "lancer" ],
		base	: {
			Standard : new BaseStat(8, 23, 9, 4, 13, 16, 12, 9, 15),
			Revelation : new BaseStat(17, 24, 14, 5, 18, 23, 16, 12, 23),
		},
		growth	: new Stat(45, 45, 15, 40, 45, 40, 35, 40),
		cap		: new Stat(0, 1, -1, -1, 1, 0, -1, 2),
		route	: "Birthright",
	}),

	azama : new Character({
		name	: "Azama",
		gender	: "M",
		gen		: "father",
		baseClass : "monk",
		classSet  : [ "monk", "apoth" ],
		base	: {
			Standard : new BaseStat(7, 24, 9, 7, 9, 10, 12, 10, 8),
			Revelation : new BaseStat(13, 28, 10, 8, 11, 13, 16, 14, 10),
		},
		growth	: new Stat(55, 50, 20, 40, 45, 40, 40, 20),
		cap		: new Stat(0, 2, -3, 0, 1, 0, 1, 0),
		route	: "Birthright",
	}),

	setsuna : new Character({
		name	: "Setsuna",
		gender	: "F",
		gen		: "mother",
		baseClass : "archer",
		classSet  : [ "archer", "ninja" ],
		base	: {
			Standard : new BaseStat(3, 19, 8, 0, 9, 10, 6, 5, 3),
			Revelation : new BaseStat(11, 25, 12, 0, 15, 17, 11, 8, 10),
		},
		growth	: new Stat(30, 20, 0, 30, 60, 30, 15, 40),
		cap		: new Stat(0, 0, 0, 1, 3, -1, -1, -1),
		route	: "Birthright",
	}),

	hayato : new Character({
		name	: "Hayato",
		gender	: "M",
		gen		: "father",
		baseClass : "diviner",
		classSet  : [ "diviner", "oni" ],
		base	: {
			Standard : new BaseStat(1, 16, 1, 4, 5, 7, 8, 4, 5),
			Revelation : new BaseStat(9, 22, 2, 9, 9, 13, 11, 5, 7),
		},
		growth	: new Stat(50, 30, 40, 30, 45, 60, 40, 20),
		cap		: new Stat(0, 0, 1, -1, 2, 1, -1, -1),
		route	: "Birthright",
	}),

	oboro : new Character({
		name	: "Oboro",
		gender	: "F",
		gen		: "mother",
		baseClass : "lancer",
		classSet  : [ "lancer", "apoth" ],
		base	: {
			Standard : new BaseStat(10, 25, 13, 0, 11, 12, 11, 13, 8),
		},
		growth	: new Stat(30, 40, 20, 40, 40, 40, 40, 30),
		cap		: new Stat(0, 1, -1, 1, 1, -1, 1, -1),
		route	: "Birthright",
	}),

	hinata : new Character({
		name	: "Hinata",
		gender	: "M",
		gen		: "father",
		baseClass : "samurai",
		classSet  : [ "samurai", "oni" ],
		base	: {
			Standard : new BaseStat(10, 26, 11, 0, 9, 14, 10, 12, 4),
		},
		growth	: new Stat(55, 35, 0, 25, 15, 45, 45, 15),
		cap		: new Stat(0, 1, 0, -1, -2, 0, 2, 0),
		route	: "Birthright",
	}),

	takumi : new Character({
		name	: "Takumi",
		gender	: "M",
		gen		: "father",
		baseClass : "archer",
		classSet  : [ "archer", "lancer" ],
		base	: {
			Standard : new BaseStat(11, 26, 13, 0, 17, 11, 13, 10, 4),
		},
		growth	: new Stat(50, 35, 0, 60, 40, 45, 35, 20),
		cap		: new Stat(0, 1, 0, 3, -2, 1, 0, -2),
		route	: "Birthright",
	}),

	kagero : new Character({
		name	: "Kagero",
		gender	: "F",
		gen		: "mother",
		baseClass : "ninja",
		classSet  : [ "ninja", "diviner" ],
		base	: {
			Standard : new BaseStat(10, 22, 15, 0, 10, 12, 7, 9, 10),
		},
		growth	: new Stat(30, 65, 0, 20, 50, 30, 25, 40),
		cap		: new Stat(0, 3, 0, -1, -1, 0, -1, 1),
		route	: "Birthright",
	}),

	kaden : new Character({
		name	: "Kaden",
		gender	: "M",
		gen		: "father",
		baseClass : "kitsune",
		classSet  : [ "kitsune", "diviner" ],
		base	: {
			Standard : new BaseStat(14, 30, 15, 1, 12, 19, 14, 9, 14),
		},
		growth	: new Stat(45, 40, 10, 25, 45, 50, 35, 40),
		cap		: new Stat(0, 1, 0, -3, 2, 1, -2, 2),
		route	: "Birthright",
	}),

	ryoma : new Character({
		name	: "Ryoma",
		gender	: "M",
		gen		: "father",
		baseClass : "swordSaint",
		classSet  : [ "samurai", "pegKnight" ],
		base	: {
			Standard : new BaseStat(4, 36, 20, 2, 18, 24, 20, 16, 13),
		},
		growth	: new Stat(50, 45, 0, 50, 45, 40, 35, 25),
		cap		: new Stat(0, 1, 0, 2, 1, 1, -2, -2),
		route	: "Birthright",
	}),

	elise : new Character({
		name	: "Elise",
		gender	: "F",
		gen		: "mother",
		baseClass : "troubadour",
		classSet  : [ "troubadour", "wyvernRider" ],
		base	: {
			Standard : new BaseStat(5, 19, 2, 11, 5, 10, 14, 4, 11),
			Revelation : new BaseStat(7, 20, 2, 13, 7, 11, 16, 4, 13),
		},
		growth	: new Stat(30, 5, 65, 25, 55, 70, 15, 40),
		cap		: new Stat(0, -1, 3, -2, 1, 1, -3, 1),
		route	: "Conquest",
	}),

	effie : new Character({
		name	: "Effie",
		gender	: "F",
		gen		: "mother",
		baseClass : "knight",
		classSet  : [ "knight", "troubadour" ],
		base	: {
			Standard : new BaseStat(6, 23, 13, 0, 8, 5, 10, 12, 4),
			Revelation : new BaseStat(8, 24, 14, 0, 9, 5, 11, 13, 4),
		},
		growth	: new Stat(35, 60, 0, 35, 50, 50, 35, 30),
		cap		: new Stat(0, 3, 0, -1, 1, 0, -1, -1),
		route	: "Conquest",
	}),

	arthur : new Character({
		name	: "Arthur",
		gender	: "M",
		gen		: "father",
		baseClass : "fighter",
		classSet  : [ "fighter", "cavalier" ],
		base	: {
			Standard : new BaseStat(7, 24, 12, 0, 9, 8, 1, 9, 4),
			Revelation : new BaseStat(9, 26, 13, 0, 10, 9, 1, 9, 4),
		},
		growth	: new Stat(50, 45, 0, 55, 35, 5, 45, 20),
		cap		: new Stat(0, 1, 0, 3, 0, -3, 1, -1),
		route	: "Conquest",
	}),

	odin : new Character({
		name	: "Odin",
		gender	: "M",
		gen		: "father",
		baseClass : "mage",
		classSet  : [ "mage", "samurai" ],
		base	: {
			Standard : new BaseStat(5, 21, 5, 8, 10, 7, 9, 6, 7),
			Revelation : new BaseStat(12, 24, 8, 12, 12, 10, 12, 7, 10),
		},
		growth	: new Stat(55, 35, 30, 55, 35, 60, 40, 20),
		cap		: new Stat(0, 0, 1, 1, -1, 1, 0, -1),
		route	: "Conquest",
	}),

	niles : new Character({
		name	: "Niles",
		gender	: "M",
		gen		: "father",
		baseClass : "outlaw",
		classSet  : [ "outlaw", "mage" ],
		base	: {
			Standard : new BaseStat(8, 22, 9, 5, 9, 15, 6, 7, 12),
			Revelation : new BaseStat(14, 24, 11, 6, 11, 17, 7, 10, 16),
		},
		growth	: new Stat(40, 35, 20, 40, 50, 30, 30, 40),
		cap		: new Stat(0, -2, 0, -1, 3, 0, 0, 1),
		route	: "Conquest",
	}),

	nyx : new Character({
		name	: "Nyx",
		gender	: "F",
		gen		: "mother",
		baseClass : "mage",
		classSet  : [ "mage", "outlaw" ],
		base	: {
			Standard : new BaseStat(9, 20, 1, 12, 5, 11, 3, 4, 8),
		},
		growth	: new Stat(30, 5, 50, 35, 50, 20, 15, 30),
		cap		: new Stat(0, 0, 3, -2, 2, -1, -2, 1),
		route	: "Conquest",
	}),

	camilla : new Character({
		name	: "Camilla",
		gender	: "F",
		gen		: "mother",
		baseClass : "maligKnight",
		classSet  : [ "wyvernRider", "mage" ],
		base	: {
			Standard : new BaseStat(1, 30, 19, 11, 15, 19, 12, 18, 15),
		},
		growth	: new Stat(40, 50, 25, 50, 55, 25, 35, 45),
		cap		: new Stat(0, 1, -1, 1, 1, -2, 1, 0),
		route	: "Conquest",
	}),

	selena : new Character({
		name	: "Selena",
		gender	: "F",
		gen		: "mother",
		baseClass : "mercenary",
		classSet  : [ "mercenary", "pegKnight" ],
		base	: {
			Standard : new BaseStat(10, 24, 12, 3, 12, 15, 9, 11, 8),
		},
		growth	: new Stat(40, 30, 5, 25, 45, 30, 45, 30),
		cap		: new Stat(0, -1, 0, -1, 2, 0, 1, 0),
		route	: "Conquest",
	}),

	beruka : new Character({
		name	: "Beruka",
		gender	: "F",
		gen		: "mother",
		baseClass : "wyvernRider",
		classSet  : [ "wyvernRider", "fighter" ],
		base	: {
			Standard : new BaseStat(9, 23, 13, 0, 14, 9, 10, 14, 7),
		},
		growth	: new Stat(45, 30, 10, 55, 30, 45, 40, 25),
		cap		: new Stat(0, -1, 0, 2, -2, 0, 2, -1),
		route	: "Conquest",
	}),

	laslow : new Character({
		name	: "Laslow",
		gender	: "M",
		gen		: "father",
		baseClass : "mercenary",
		classSet  : [ "mercenary", "ninja" ],
		base	: {
			Standard : new BaseStat(12, 28, 15, 0, 16, 13, 14, 10, 7),
			Revelation : new BaseStat(16, 30, 17, 0, 19, 16, 16, 12, 8),
		},
		growth	: new Stat(50, 45, 0, 45, 30, 55, 35, 25),
		cap		: new Stat(0, 1, 0, 2, -1, 1, -1, -1),
		route	: "Conquest",
	}),

	peri : new Character({
		name	: "Peri",
		gender	: "F",
		gen		: "mother",
		baseClass : "cavalier",
		classSet  : [ "cavalier", "mage" ],
		base	: {
			Standard : new BaseStat(10, 25, 13, 0, 9, 13, 9, 10, 10),
			Revelation : new BaseStat(16, 27, 16, 0, 10, 15, 12, 12, 11),
		},
		growth	: new Stat(30, 50, 5, 30, 50, 35, 25, 45),
		cap		: new Stat(0, 1, 0, -1, 1, 0, -2, 2),
		route	: "Conquest",
	}),

	charlotte : new Character({
		name	: "Charlotte",
		gender	: "F",
		gen		: "mother",
		baseClass : "fighter",
		classSet  : [ "fighter", "troubadour" ],
		base	: {
			Standard : new BaseStat(10, 28, 15, 0, 10, 13, 9, 8, 2),
		},
		growth	: new Stat(65, 55, 0, 35, 50, 45, 20, 5),
		cap		: new Stat(0, 3, 0, 0, 2, 0, -2, -2),
		route	: "Conquest",
	}),

	benny : new Character({
		name	: "Benny",
		gender	: "M",
		gen		: "father",
		baseClass : "knight",
		classSet  : [ "knight", "fighter" ],
		base	: {
			Standard : new BaseStat(15, 31, 15, 0, 15, 6, 12, 19, 10),
		},
		growth	: new Stat(50, 40, 0, 50, 10, 35, 55, 45),
		cap		: new Stat(0, 0, 0, 0, -3, 0, 3, 1),
		route	: "Conquest",
	}),

	leo : new Character({
		name	: "Leo",
		gender	: "M",
		gen		: "father",
		baseClass : "darkKnight",
		classSet  : [ "mage", "troubadour" ],
		base	: {
			Standard : new BaseStat(2, 34, 14, 20, 14, 15, 15, 16, 20),
		},
		growth	: new Stat(45, 25, 55, 35, 45, 45, 30, 45),
		cap		: new Stat(0, -2, 2, 0, -2, 0, 0, 2),
		route	: "Conquest",
	}),

	keaton : new Character({
		name	: "Keaton",
		gender	: "M",
		gen		: "father",
		baseClass : "wolfskin",
		classSet  : [ "wolfskin", "fighter" ],
		base	: {
			Standard : new BaseStat(15, 35, 19, 0, 10, 13, 9, 16, 7),
		},
		growth	: new Stat(60, 60, 0, 20, 35, 30, 50, 25),
		cap		: new Stat(0, 3, 0, -2, -1, 0, 2, -1),
		route	: "Conquest",
	}),

	xander : new Character({
		name	: "Xander",
		gender	: "M",
		gen		: "father",
		baseClass : "paladin",
		classSet  : [ "cavalier", "wyvernRider" ],
		base	: {
			Standard : new BaseStat(4, 38, 23, 4, 18, 15, 20, 23, 11),
		},
		growth	: new Stat(45, 50, 5, 40, 35, 60, 40, 15),
		cap		: new Stat(0, 2, -1, -1, -1, 2, 1, -2),
		route	: "Conquest",
	}),

	reina : new Character({
		name	: "Reina",
		gender	: "F",
		gen		: "exclusive",
		baseClass : "kinshiKnight",
		classSet  : [ "pegKnight", "diviner", "ninja" ],
		base	: {
			Standard : new BaseStat(1, 28, 17, 5, 14, 20, 14, 10, 13),
			Revelation : new BaseStat(1, 28, 18, 4, 16, 21, 15, 10, 13),
		},
		growth	: new Stat(40, 45, 5, 20, 45, 10, 20, 10),
		cap		: new Stat(0, 2, 0, 0, 2, -1, -2, -1),
		route	: "Birthright",
	}),

	scarlet : new Character({
		name	: "Scarlet",
		gender	: "F",
		gen		: "exclusive",
		baseClass : "wyvernLord",
		classSet  : [ "wyvernRider", "outlaw", "knight" ],
		base	: {
			Standard : new BaseStat(1, 30, 23, 4, 17, 19, 14, 22, 6),
			Revelation : new BaseStat(3, 32, 22, 4, 18, 19, 14, 23, 7),
		},
		growth	: new Stat(30, 45, 20, 40, 50, 40, 25, 20),
		cap		: new Stat(0, 2, 0, 0, 1, -1, 0, -2),
		route	: "Birthright",
	}),

	flora : new Character({
		name	: "Flora",
		gender	: "F",
		gen		: "exclusive",
		baseClass : "maid",
		classSet  : [ "troubadour", "mage", "mercenary" ],
		base	: {
			Standard : new BaseStat(5, 29, 18, 16, 25, 15, 11, 14, 23),
		},
		growth	: new Stat(35, 40, 20, 45, 30, 35, 30, 30),
		cap		: new Stat(0, 1, -1, 2, 0, -1, 1, -1),
		route	: "Conquest",
	}),

	shura : new Character({
		name	: "Shura",
		gender	: "M",
		gen		: "exclusive",
		baseClass : "adventurer",
		classSet  : [ "outlaw", "ninja", "fighter" ],
		base	: {
			Standard : new BaseStat(10, 34, 20, 11, 23, 27, 15, 14, 24),
			Conquest : new BaseStat(2, 31, 18, 10, 21, 24, 13, 13, 21),
		},
		growth	: new Stat(30, 25, 10, 20, 35, 30, 15, 35),
		cap		: new Stat(0, -1, 0, -1, 3, -1, -2, 2),
		route	: "All",
	}),

	izana : new Character({
		name	: "Izana",
		gender	: "M",
		gen		: "exclusive",
		baseClass : "exorcist",
		classSet  : [ "monk", "samurai", "apoth" ],
		base	: {
			Standard : new BaseStat(5, 31, 8, 23, 25, 18, 17, 14, 24),
		},
		growth	: new Stat(45, 15, 35, 55, 30, 45, 35, 35),
		cap		: new Stat(0, 0, 1, 1, -2, 0, 0, 1),
		route	: "All",
	}),

	yukimura : new Character({
		name	: "Yukimura",
		gender	: "M",
		gen		: "exclusive",
		baseClass : "mechanist",
		classSet  : [ "apoth", "samurai", "monk" ],
		base	: {
			Standard : new BaseStat(10, 38, 25, 3, 29, 23, 18, 21, 22),
		},
		growth	: new Stat(25, 25, 5, 40, 15, 30, 25, 30),
		cap		: new Stat(0, -1, 0, 3, -1, 0, -1, 0),
		route	: "Birthright",
	}),

	fuuga : new Character({
		name	: "Fuga",
		gender	: "M",
		gen		: "exclusive",
		baseClass : "weaponMaster",
		classSet  : [ "samurai", "oni", "monk" ],
		base	: {
			Standard : new BaseStat(10, 41, 29, 0, 27, 25, 18, 29, 15),
		},
		growth	: new Stat(20, 20, 0, 15, 5, 20, 10, 10),
		cap		: new Stat(0, 2, -1, 1, 0, -1, 2, -2),
		route	: "Revelation",
	}),

	anna : new Character({
		name	: "Anna",
		gender	: "F",
		gen		: "exclusive",
		baseClass : "outlaw",
		classSet  : [ "outlaw", "troubadour", "apoth" ],
		base	: {
			Standard : new BaseStat(10, 23, 9, 11, 10, 14, 15, 6, 15),
		},
		growth	: new Stat(35, 30, 55, 30, 40, 70, 20, 45),
		cap		: new Stat(0, -1, 1, 0, -1, 2, -2, 2),
		route	: "Others",
	}),
	
	kanna : new Character({
		name	: "Kanna",
		gender	: "either",
		gen		: "avatarChild",
		baseClass : "nohrPrince",
		route	: "Children",
		
		fixedParent	: "kamui",
		childBase	: new BaseStat(10, 7, 3, 6, 8, 8, 9, 5, 5),
		childGrowth	: new Stat(30, 35, 30, 40, 45, 45, 25, 25),
	}),
	
	shigure : new Character({
		name	: "Shigure",
		gender	: "M",
		gen		: "child",
		baseClass : "pegKnight",
		route	: "Children",
		
		fixedParent	: "azura",
		childBase	: new BaseStat(10, 9, 6, 1, 7, 7, 5, 8, 7),
		childGrowth	: new Stat(35, 45, 5, 45, 35, 25, 35, 25),
	}),
	
	dwyer : new Character({
		name	: "Dwyer",
		gender	: "M",
		gen		: "child",
		baseClass : "troubadour",
		route	: "Children",
		
		fixedParent	: "jakob",
		childBase	: new BaseStat(10, 8, 7, 7, 2, 6, 4, 6, 7),
		childGrowth	: new Stat(45, 45, 30, 20, 30, 30, 30, 35),
	}),
	
	sophie : new Character({
		name	: "Sophie",
		gender	: "F",
		gen		: "child",
		baseClass : "cavalier",
		route	: "Children",
		
		fixedParent : "silas",
		childBase	: new BaseStat(10, 8, 6, 2, 7, 6, 7, 4, 6),
		childGrowth : new Stat(35, 35, 10, 55, 50, 35, 25, 35),
	}),
	
	midori : new Character({
		name	: "Midori",
		gender	: "F",
		gen		: "child",
		baseClass : "apoth",
		route	: "Children",
		
		fixedParent : "kaze",
		childBase	: new BaseStat(10, 8, 6, 2, 10, 4, 10, 4, 2),
		childGrowth : new Stat(45, 35, 5, 55, 35, 50, 30, 20),
	}),
	
	shiro : new Character({
		name	: "Shiro",
		gender	: "M",
		gen		: "child",
		baseClass : "lancer",
		route	: "Children",
		
		fixedParent : "ryoma",
		childBase	: new BaseStat(10, 8, 7, 0, 5, 3, 6, 8, 5),
		childGrowth	: new Stat(50, 50, 0, 40, 35, 35, 45, 30),
		revParent	: [ "camilla", "elise" ],
		nonParent	: [ "hinoka", "sakura" ],
	}),
	
	kiragi : new Character({
		name	: "Kiragi",
		gender	: "M",
		gen		: "child",
		baseClass : "archer",
		route	: "Children",
		
		fixedParent	: "takumi",
		childBase	: new BaseStat(10, 7, 6, 0, 5, 6, 8, 4, 1),
		childGrowth	: new Stat(45, 40, 0, 45, 50, 45, 40, 15),
		revParent	: [ "camilla", "elise" ],
		nonParent	: [ "hinoka", "sakura" ],
	}),
	
	asugi : new Character({
		name	: "Asugi",
		gender	: "M",
		gen		: "child",
		baseClass : "ninja",
		route	: "Children",
		
		fixedParent	: "saizou",
		childBase	: new BaseStat(10, 6, 7, 4, 7, 6, 9, 4, 9),
		childGrowth	: new Stat(40, 45, 50, 55, 45, 50, 30, 20),
		revParent	: [ "charlotte", "beruka" ],
	}),
	
	selkie : new Character({
		name	: "Selkie",
		gender	: "F",
		gen		: "child",
		baseClass : "kitsune",
		route	: "Children",
		
		fixedParent	: "kaden",
		childBase	: new BaseStat(10, 7, 4, 3, 6, 7, 10, 6, 11),
		childGrowth	: new Stat(35, 30, 15, 35, 55, 60, 30, 50),
		revParent	: [ "charlotte", "peri" ],
	}),
	
	hisame : new Character({
		name	: "Hisame",
		gender	: "M",
		gen		: "child",
		baseClass : "samurai",
		route	: "Children",
		
		fixedParent	: "hinata",
		childBase	: new BaseStat(10, 6, 6, 1, 7, 5, 4, 5, 4),
		childGrowth	: new Stat(50, 40, 0, 40, 40, 25, 30, 20),
		revParent	: [ "peri", "selena" ],
	}),
	
	mitama : new Character({
		name	: "Mitama",
		gender	: "F",
		gen		: "child",
		baseClass : "miko",
		route	: "Children",
		
		fixedParent	: "azama",
		childBase	: new BaseStat(10, 6, 7, 6, 6, 8, 10, 3, 5),
		childGrowth	: new Stat(45, 40, 35, 45, 50, 50, 30, 20),
		revParent	: [ "effie", "beruka" ],
	}),
	
	matoi : new Character({
		name	: "Caeldori",
		gender	: "F",
		gen		: "child",
		baseClass : "pegKnight",
		route	: "Children",
		
		fixedParent	: "tsubaki",
		childBase	: new BaseStat(10, 8, 8, 3, 5, 6, 9, 5, 6),
		childGrowth	: new Stat(55, 35, 15, 40, 40, 45, 35, 20),
		revParent	: [ "selena", "nyx" ],
	}),
	
	rhajat : new Character({
		name	: "Rhajat",
		gender	: "F",
		gen		: "child",
		baseClass : "diviner",
		route	: "Children",
		
		fixedParent	: "hayato",
		childBase	: new BaseStat(10, 8, 1, 10, 0, 7, 6, 5, 12),
		childGrowth	: new Stat(40, 15, 60, 10, 50, 30, 25, 35),
		revParent	: [ "effie", "nyx" ],
	}),
	
	siegbert : new Character({
		name 	: "Siegbert",
		gender	: "M",
		gen		: "child",
		baseClass : "cavalier",
		route	: "Children",
		
		fixedParent : "xander",
		childBase	: new BaseStat(10, 7, 5, 2, 7, 6, 7, 6, 3),
		childGrowth	: new Stat(40, 45, 5, 45, 45, 45, 35, 20),
		revParent	: [ "hinoka", "sakura" ],
		nonParent	: [ "camilla", "elise" ],
	}),
	
	foleo : new Character({
		name	: "Forrest",
		gender	: "M",
		gen		: "child",
		baseClass : "troubadour",
		route	: "Children",
		
		fixedParent	: "leo",
		childBase	: new BaseStat(10, 8, 5, 9, 1, 4, 5, 6, 13),
		childGrowth	: new Stat(55, 15, 65, 20, 35, 25, 25, 55),
		revParent	: [ "hinoka", "sakura" ],
		nonParent	: [ "camilla", "elise" ],
	}),
	
	ignatius : new Character({
		name	: "Ignatius",
		gender	: "M",
		gen		: "child",
		baseClass : "knight",
		route	: "Children",
		
		fixedParent	: "benny",
		childBase	: new BaseStat(10, 8, 7, 0, 6, 4, 7, 6, 7, 4),
		childGrowth	: new Stat(40, 50, 0, 40, 30, 55, 45, 35),
		revParent	: [ "rinkah", "oboro" ],
	}),
	
	velouria : new Character({
		name	: "Velouria",
		gender	: "F",
		gen		: "child",
		baseClass : "wolfskin",
		route	: "Children",
		
		fixedParent	: "keaton",
		childBase	: new BaseStat(10, 7, 6, 0, 6, 6, 11, 9, 8),
		childGrowth	: new Stat(50, 50, 0, 40, 40, 35, 45, 30),
		revParent	: [ "rinkah", "hana" ],
	}),
	
	percy : new Character({
		name	: "Percy",
		gender	: "M",
		gen		: "child",
		baseClass : "wyvernRider",
		route	: "Children",
		
		fixedParent	: "arthur",
		childBase	: new BaseStat(10, 6, 4, 0, 6, 6, 15, 8, 4, 7),
		childGrowth	: new Stat(30, 30, 5, 45, 40, 75, 55, 15),
		revParent	: [ "kagero", "setsuna" ],
	}),
	
	ophelia : new Character({
		name	: "Ophelia",
		gender	: "F",
		gen		: "child",
		baseClass : "mage",
		route	: "Children",
		
		fixedParent	: "odin",
		childBase	: new BaseStat(10, 7, 3, 6, 6, 7, 12, 2, 5),
		childGrowth	: new Stat(45, 15, 45, 40, 45, 65, 20, 30),
		revParent	: [ "orochi", "kagero" ],
	}),
	
	soleil : new Character({
		name	: "Soleil",
		gender	: "F",
		gen		: "child",
		baseClass : "mercenary",
		route	: "Children",
		
		fixedParent	: "laslow",
		childBase	: new BaseStat(10, 6, 7, 1, 3, 6, 7, 5, 6),
		childGrowth	: new Stat(25, 60, 0, 35, 35, 45, 35, 40),
		revParent	: [ "orochi", "hana" ],
	}),
	
	nina : new Character({
		name	: "Nina",
		gender	: "F",
		gen		: "child",
		baseClass : "outlaw",
		route	: "Children",
		
		fixedParent	: "niles",
		childBase	: new BaseStat(10, 5, 8, 5, 5, 5, 11, 3, 10),
		childGrowth	: new Stat(30, 45, 30, 35, 40, 50, 25, 45),
		revParent	: [ "setsuna", "oboro" ],
	}),
}
