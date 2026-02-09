/*
 * Constants
 */
const LEVEL_CAP_STANDARD = 20;
const LEVEL_CAP_SPECIAL = 40;
const SPECIAL_LEVEL_MODIFIER = 20;
const PROMOTED_NOT_RPOMOTED_EXTRA_CAP = 20;
const LEVEL_PROMOTION = 10;
const APTITUDE = 10;
const FIX = 10000;	// Hack-ish fix for floating point operation

/*
 *	LevelAttribute
 */
var LevelAttribute = function(unitClass, stat) {
	this.unitClass = unitClass;
	this.stat = stat;
	this.statCap = {};
	this.tier1Level = 0;
	this.tier2Level = 0;
}

LevelAttribute.prototype.setInitialLevel = function(tier1Level, tier2Level) {
	this.tier1Level = tier1Level;
	this.tier2Level = tier2Level;
	this.calculateDisplayedLevel();
}

// If level up in the same class, increase level irregardless of class tier
// Assumption: caller has to make sure that upon reaching tier 1 cap of a tier 1 class, this function will not be called
// If class tier go from 1 to 2, assume it is a promotion & increase level accordingly
// Otherwise assume that a parallel seal is used & level will not go up
LevelAttribute.prototype.increaseLevel = function(prev) {
	if (prev.unitClass == this.unitClass) {
		if (prev.tier2Level > 0) {
			this.tier1Level = prev.tier1Level;
			this.tier2Level = prev.tier2Level + 1;
		}else {
			this.tier1Level = prev.tier1Level + 1;
			if (this.tier1Level > LEVEL_CAP_STANDARD) {
				this.tier1Level = LEVEL_CAP_STANDARD;
				this.tier2Level = 1;
			}
		}
	}else if (this.unitClass.tier == "tier2" && prev.unitClass.tier == "tier1") {
		this.tier1Level = prev.tier1Level;
		this.tier2Level = 1;
	}else /*if (this.unitClass.tier == "special" || prev.unitClass.tier == "special")*/ {
		this.tier1Level = prev.tier1Level;
		this.tier2Level = prev.tier2Level;
	}
	this.calculateDisplayedLevel();
}

LevelAttribute.prototype.isAtCap = function(extraCap, specialExtraCap) {
	return ((this.tier1Level == LEVEL_CAP_STANDARD && this.tier2Level == 0 && this.unitClass.tier != "special") || this.tier2Level == (LEVEL_CAP_STANDARD + extraCap + specialExtraCap))
}

LevelAttribute.prototype.calculateDisplayedLevel = function() {
	this.displayedLevel = (this.tier2Level > 0 ? (this.unitClass.tier == "special" ? this.tier2Level + SPECIAL_LEVEL_MODIFIER : this.tier2Level) : this.tier1Level);
	return this.displayedLevel;
}


/*
 *	ClassChange
 */
var ClassChange = function(level, sourceClass, targetClass) {
	this.level = level;
	this.sourceClass = sourceClass;
	this.targetClass = targetClass;
	if (targetClass.tier == "tier2" && sourceClass.tier == "tier1")
		this.promotion = true;
}

/*
 *	StatCalculator
 */
var StatCalculator = function() {
	this.extraLevel = 0;
	this.classChanges = [];
}


StatCalculator.prototype.setCharacter = function(character, base) {
	this.character = db.character[character];
	this.specialExtraLevel = (this.character.promotedNotPromoted ? PROMOTED_NOT_RPOMOTED_EXTRA_CAP : 0);
	this.baseSet = base;
	this.resetClassChange();
	this.aptitude = 0;
	return this.character;
}

StatCalculator.prototype.setAptitude = function(val) {
	this.aptitude = (val ? APTITUDE : 0);
}

StatCalculator.prototype.addClassChange = function(level, targetClass) {
	var newClass = db.classes[targetClass];
	var latestClassChange = this.getLatestClassChange();
	var oldClass = (latestClassChange ? latestClassChange.targetClass : db.classes[this.character.baseClass]);
	var newClassChange = new ClassChange(level, oldClass, newClass);
	this.classChanges.push(newClassChange)
}

StatCalculator.prototype.resetClassChange = function() {
	this.classChanges = [];
}

StatCalculator.prototype.getAvailableLevelRange = function() {
	var curClass, baseLevel;
	var latestClassChange = this.getLatestClassChange();
	if (latestClassChange) {
		curClass = latestClassChange.targetClass;
		baseLevel = (latestClassChange.promotion ? 1 : latestClassChange.level);
		
		// base level conversion between special & tier 2
		if (curClass.tier == "special" && latestClassChange.sourceClass.tier == "tier2")
			baseLevel = parseInt(baseLevel) + parseInt(SPECIAL_LEVEL_MODIFIER);	// Weird bug resulting in string concat
		if (curClass.tier == "tier2" && latestClassChange.sourceClass.tier == "special")
			baseLevel -= SPECIAL_LEVEL_MODIFIER;
		
	}else {
		curClass = db.classes[this.character.baseClass];
		baseLevel = this.character.base[this.baseSet].level;
	}
	
	var cap = (curClass.tier == "special" ? LEVEL_CAP_SPECIAL : LEVEL_CAP_STANDARD);
	
	if (curClass.tier != "tier1")
		cap = parseInt(cap) + parseInt(this.extraLevel) + parseInt(this.specialExtraLevel);
	
	var ret = [];
	for (var i=baseLevel; i<=cap; i++)
		ret.push(i);
		
	return ret;
}

StatCalculator.prototype.getAvaiableClassChange = function(level) {
	var latestClassChange = this.getLatestClassChange();
	var curClass = (latestClassChange ? latestClassChange.targetClass : db.classes[this.character.baseClass]);
	
	var altClass = [];
	for (var i=0; i<this.character.classSet.length; i++) {
		var newAltClass = this.character.classSet[i];
		altClass.push(newAltClass);
		for (var j=0; db.classes[newAltClass].promoteTo && j<db.classes[newAltClass].promoteTo.length; j++) {
			altClass.push(db.classes[newAltClass].promoteTo[j]);
		}
	}
	
	var ret = {};
	ret.heartSeal = {};
	ret.parallelSeal = {};
	ret.specialSeal = {};
	if (curClass.tier == "tier1" ) {
		if (level >= LEVEL_PROMOTION) {
			ret.masterSeal = {};
			for (var i=0; i<curClass.promoteTo.length; i++)
				ret.masterSeal[curClass.promoteTo[i]] = db.classes[curClass.promoteTo[i]];
		}
		
		this.filterClassByTier(curClass, ret.parallelSeal, "tier1");
		this.filterClassByTier(curClass, ret.specialSeal, "special");
		this.populateAltClassSet(curClass, altClass, "tier2", ret.heartSeal, [ ret.parallelSeal, ret.specialSeal ]);
	
	}else if (curClass.tier == "tier2") {
		this.filterClassByTier(curClass, ret.parallelSeal, "tier2");
		this.filterClassByTier(curClass, ret.specialSeal, "special");
		this.populateAltClassSet(curClass, altClass, "tier1", ret.heartSeal, [ ret.parallelSeal, ret.specialSeal ]);
	
	}else if (curClass.tier == "special") {
		if (level <= LEVEL_CAP_STANDARD)
			this.filterClassByTier(curClass, ret.parallelSeal, "tier1");
		else
			this.filterClassByTier(curClass, ret.parallelSeal, "tier2");
		this.filterClassByTier(curClass, ret.specialSeal, "special");
		
		if (level <= LEVEL_CAP_STANDARD)
			this.populateAltClassSet(curClass, altClass, "tier2", ret.heartSeal, [ ret.parallelSeal, ret.specialSeal ]);
		else
			this.populateAltClassSet(curClass, altClass, "tier1", ret.heartSeal, [ ret.parallelSeal, ret.specialSeal ]);
	}
	
	return ret;
}

StatCalculator.prototype.filterClassByTier = function(currentClass, set, tier) {
	for (var parClass in db.classes) {
		var cl = db.classes[parClass];
		if (cl.tier == tier && cl != currentClass) {
			if (cl.restriction || cl.genderLock) {
				// Since a class is either genderlock or has character restriction, we can check the 2 conditions separately
				for (var i=0; cl.restriction && i<cl.restriction.length; i++)
					if (this.character == db.character[cl.restriction[i]])
						set[parClass] = db.classes[parClass];
				
				if (cl.genderLock && (this.character.gender == cl.genderLock || this.character.gender == "either"))
					set[parClass] = db.classes[parClass];
			}else
				set[parClass] = db.classes[parClass];
		}
	}
}

StatCalculator.prototype.populateAltClassSet = function(currentClass, altClassList, tierException, heartSet, otherSetList) {
	for (var i=0; i<altClassList.length; i++) {
		var altClass = altClassList[i];
		if (db.classes[altClass].tier != tierException && db.classes[altClass] != currentClass) {
			heartSet[altClass] = db.classes[altClass];
			for (var j=0; j<otherSetList.length; j++)
				delete otherSetList[j][altClass];
		}
	}
}

// Return latest class change, or undefined
StatCalculator.prototype.getLatestClassChange = function() {
	if (this.classChanges.length > 0)
		return this.classChanges[this.classChanges.length-1];
}

StatCalculator.prototype.compute = function() {
	var averageStats = [[]];
	
	// Starting level is defined by character base
	var baseStat = this.character.base[this.baseSet];
	var startingLevel = new LevelAttribute(db.classes[this.character.baseClass], baseStat.stat);
	if (db.classes[this.character.baseClass].tier != "tier2")
		startingLevel.setInitialLevel(baseStat.level, 0);
	else
		startingLevel.setInitialLevel(0, baseStat.level);
	for (var attr in startingLevel.stat)
		startingLevel.statCap[attr] = db.classes[this.character.baseClass].maxStat[attr] + this.character.cap[attr];
	averageStats[0].push(startingLevel);
	var prev = startingLevel;
	
	// Loop until there are no more class changes and character has reached level cap
	for (var i=0; i<this.classChanges.length || !prev.isAtCap(this.extraLevel, this.specialExtraLevel); ) {
		if (this.classChanges[i] && prev.displayedLevel == this.classChanges[i].level) {
			// Class changed, adjust the stat using class base stat
			var newClass = this.classChanges[i].targetClass;
			var oldClass = prev.unitClass;
			var thisLevel = new LevelAttribute(newClass, {});
			thisLevel.increaseLevel(prev);
			
			for (var attr in newClass.base) {
				thisLevel.statCap[attr] = newClass.maxStat[attr] + this.character.cap[attr];
				// 职业变更时的属性调整：新职业基础值 - 旧职业基础值
				var baseStatDiff = newClass.base[attr] - oldClass.base[attr];
				thisLevel.stat[attr] = Math.min(Number(prev.stat[attr]) + baseStatDiff, thisLevel.statCap[attr]);
			}
			averageStats[++i] = [];
		} else {
			// No change, calculate growth as per normal
			var thisLevel = new LevelAttribute(prev.unitClass, {});
			thisLevel.increaseLevel(prev);
			thisLevel.growthRate = {};
			
			for (var attr in this.character.growth) {
				// 计算总成长率
				var totalGrowth = this.character.growth[attr] + prev.unitClass.growth[attr] + this.aptitude;
				thisLevel.growthRate[attr] = totalGrowth;
				
				// 如果已经达到属性上限，则不再增长
				thisLevel.statCap[attr] = prev.statCap[attr];
				if (Number(prev.stat[attr]) >= thisLevel.statCap[attr]) {
					thisLevel.stat[attr] = prev.stat[attr];
					continue;
				}
				
				// 计算期望值增长
				var expectedGrowth = totalGrowth / 100;
				thisLevel.stat[attr] = Math.min(Number(prev.stat[attr]) + expectedGrowth, thisLevel.statCap[attr]);
			}
		}
		prev = thisLevel;
		averageStats[i].push(thisLevel);
	}
	
	return averageStats;
}