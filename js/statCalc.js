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
const STAT_KEYS = [ "HP", "Str", "Mag", "Skl", "Spd", "Lck", "Def", "Res" ];

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
	return ((this.tier1Level >= LEVEL_CAP_STANDARD && this.tier2Level == 0 && this.unitClass.tier != "special") || this.tier2Level >= (LEVEL_CAP_STANDARD + extraCap + specialExtraCap))
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

StatCalculator.prototype.getBaseStat = function() {
	return this.character.base[this.baseSet];
}

StatCalculator.prototype.getBaseClassKey = function() {
	var baseStat = this.getBaseStat();
	return (baseStat && baseStat.classKey) ? baseStat.classKey : this.character.baseClass;
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
	var oldClass = (latestClassChange ? latestClassChange.targetClass : db.classes[this.getBaseClassKey()]);
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
		curClass = db.classes[this.getBaseClassKey()];
		baseLevel = this.getBaseStat().level;
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
	var curClass = (latestClassChange ? latestClassChange.targetClass : db.classes[this.getBaseClassKey()]);
	
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
	var baseStat = this.getBaseStat();
	var startingClass = db.classes[this.getBaseClassKey()];
	var startingLevel = new LevelAttribute(startingClass, baseStat.stat);
	if (startingClass.tier != "tier2")
		startingLevel.setInitialLevel(baseStat.level, 0);
	else
		startingLevel.setInitialLevel(0, baseStat.level);
	for (var attr in startingLevel.stat)
		startingLevel.statCap[attr] = startingClass.maxStat[attr] + this.character.cap[attr];
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

StatCalculator.prototype.calculateChildInheritance = function(options) {
	if (!options || !options.child)
		return null;

	var child = db.character[options.child];
	if (!child || (child.gen != "child" && child.gen != "avatarChild") || !child.varParent)
		return null;

	var childClass = db.classes[options.childClass];
	var variableParentClass = db.classes[options.variableParentClass];
	var fixedParentClass = db.classes[options.fixedParentClass];
	if (!childClass || !variableParentClass || !fixedParentClass)
		return null;

	var childLevel = Number(options.childLevel);
	if (isNaN(childLevel))
		return null;
	if (childLevel % 2 != 0)
		return null;

	var childLevelBounds = this.getDisplayedLevelBoundsForClass(child, options.childClass);
	if (!childLevelBounds || childLevel < childLevelBounds.min || childLevel > childLevelBounds.max)
		return null;

	var baseClass = db.classes[child.baseClass];
	var inheritancePromoteTo = child.getInheritancePromoteTo();
	var defaultPromotedClass = db.classes[inheritancePromoteTo[0]] || childClass;
	var promotedClassFilter = {};
	for (var i=0; i<inheritancePromoteTo.length; i++)
		promotedClassFilter[inheritancePromoteTo[i]] = true;

	var parsedVariableParentStats = {};
	var parsedFixedParentStats = {};
	for (var i=0; i<STAT_KEYS.length; i++) {
		var attr = STAT_KEYS[i];
		parsedVariableParentStats[attr] = Number(options.variableParentStats[attr]);
		parsedFixedParentStats[attr] = Number(options.fixedParentStats[attr]);
		if (isNaN(parsedVariableParentStats[attr]) || isNaN(parsedFixedParentStats[attr]))
			return null;
	}

	var result = {
		childId : options.child,
		child : child,
		childLevel : childLevel,
		childClassKey : options.childClass,
		childClass : childClass,
		fixedParent : db.character[child.fixedParent],
		fixedParentClass : fixedParentClass,
		fixedParentStats : parsedFixedParentStats,
		variableParent : child.varParent,
		variableParentClass : variableParentClass,
		variableParentStats : parsedVariableParentStats,
		defaultPromotedClass : defaultPromotedClass,
		inheritancePromoteTo : inheritancePromoteTo,
		stats : {},
	};

	for (var i=0; i<STAT_KEYS.length; i++) {
		var attr = STAT_KEYS[i];
		var derivedGrowth = Math.floor((child.varParent.growth[attr] + child.childGrowth[attr]) / 2);
		var baseGrowth = derivedGrowth + baseClass.growth[attr];
		var autolevelLevels = (options.childClass == child.baseClass ? childLevel - child.childBase.level : LEVEL_CAP_STANDARD - child.childBase.level);
		var autolevelGain = (baseGrowth * autolevelLevels) / 100;
		var unpromotedCap = baseClass.maxStat[attr] + child.cap[attr];
		var personalCap = unpromotedCap - baseClass.base[attr];
		var basePlusLevels = Math.min(Math.round(child.childBase.stat[attr] + autolevelGain), personalCap);
		var promotedAptitude = (childClass.tier == "tier2" ? this.aptitude : 0);
		var promotedGrowth = childClass.growth[attr] + derivedGrowth;
		var promotedAutolevel = (promotedClassFilter[options.childClass] ? (promotedGrowth * (childLevel - 1)) / 100 : 0);
		var promotedAutolevelRaw = promotedAutolevel;
		var promotedAptitudeRaw = 0;
		if (promotedAptitude > 0 && promotedClassFilter[options.childClass]) {
			promotedAptitudeRaw = (promotedAptitude * (childLevel - 1)) / 100;
			promotedAutolevelRaw += promotedAptitudeRaw;
		}
		var promotedAutolevelApplied = promotedAutolevelRaw;
		var promotedPersonalBase = Math.round(basePlusLevels + promotedAutolevelApplied);
		var hypotheticalGrowth = defaultPromotedClass.growth[attr] + derivedGrowth;
		// Excel row 33 always uses (C4 - 1); the tier split happens earlier in row 22 / row 24.
		var hypotheticalAutolevelLevels = childLevel - 1;
		var hypotheticalAutolevel = (hypotheticalGrowth * hypotheticalAutolevelLevels) / 100;
		var hypotheticalBase = Math.round(basePlusLevels + hypotheticalAutolevel);
		var variableParentPersonal = parsedVariableParentStats[attr] - variableParentClass.base[attr];
		var fixedParentPersonal = parsedFixedParentStats[attr] - fixedParentClass.base[attr];
		var variableParentGap = Math.max(0, variableParentPersonal - hypotheticalBase);
		var fixedParentGap = Math.max(0, fixedParentPersonal - hypotheticalBase);
		var inheritanceCap = Math.floor(hypotheticalBase / 10) + 2;
		var inheritance = Math.floor((variableParentGap + fixedParentGap) / 4);
		var appliedInheritance = Math.min(inheritance, inheritanceCap);
		var finalCap = childClass.maxStat[attr] + child.cap[attr];
		var calculatedStat = Math.min(childClass.base[attr] + promotedPersonalBase + appliedInheritance, finalCap);

		result.stats[attr] = {
			derivedGrowth : derivedGrowth,
			baseGrowth : baseGrowth,
			autolevelGain : autolevelGain,
			basePlusLevels : basePlusLevels,
			promotedGrowth : promotedGrowth,
			promotedAptitude : promotedAptitude,
			promotedAptitudeRaw : promotedAptitudeRaw,
			promotedAutolevel : promotedAutolevelRaw,
			promotedAutolevelApplied : promotedAutolevelApplied,
			promotedPersonalBase : promotedPersonalBase,
			hypotheticalGrowth : hypotheticalGrowth,
			hypotheticalAutolevelLevels : hypotheticalAutolevelLevels,
			hypotheticalAutolevel : hypotheticalAutolevel,
			hypotheticalBase : hypotheticalBase,
			variableParentPersonal : variableParentPersonal,
			fixedParentPersonal : fixedParentPersonal,
			variableParentGap : variableParentGap,
			fixedParentGap : fixedParentGap,
			inheritanceCap : inheritanceCap,
			inheritance : inheritance,
			appliedInheritance : appliedInheritance,
			finalCap : finalCap,
			calculatedStat : calculatedStat,
		};
	}

	return result;
}

StatCalculator.prototype.getDisplayedLevelBoundsForClass = function(character, classKey) {
	var unitClass = db.classes[classKey];
	if (!character || !unitClass)
		return null;

	var extraCap = parseInt(this.extraLevel || 0);
	var specialExtra = (character.promotedNotPromoted ? PROMOTED_NOT_RPOMOTED_EXTRA_CAP : 0);

	if (unitClass.tier == "tier1") {
		return {
			min : character.childBase ? character.childBase.level : 1,
			max : LEVEL_CAP_STANDARD,
		};
	}

	if (unitClass.tier == "special") {
		return {
			min : SPECIAL_LEVEL_MODIFIER + 1,
			max : LEVEL_CAP_SPECIAL + extraCap + specialExtra,
		};
	}

	return {
		min : 1,
		max : LEVEL_CAP_STANDARD + extraCap + specialExtra,
	};
}
