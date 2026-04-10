const ANIMATION_SPEED = 100;

var calc = new StatCalculator();
var inheritanceState = null;

// 多语言支持
var langData = null;
var currentLang = 'zh-CN';
var LANG_STORAGE_KEY = 'fe-fates-calculator.lang';

function getPreferredLanguage() {
    try {
        var savedLang = window.localStorage ? window.localStorage.getItem(LANG_STORAGE_KEY) : null;
        if (savedLang == 'zh-CN' || savedLang == 'en-US')
            return savedLang;
    } catch (err) {}
    return 'zh-CN';
}

function savePreferredLanguage(lang) {
    try {
        if (window.localStorage)
            window.localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch (err) {}
}

function loadLang(lang, cb) {
    $.getJSON('data/lang.' + lang + '.json', function(data) {
        langData = data;
        currentLang = lang;
        if (cb) cb();
    });
}
function tStat(stat) {
    return langData && langData.stat[stat] ? langData.stat[stat] : stat;
}
function tClass(cls) {
    return langData && langData.class[cls] ? langData.class[cls] : cls;
}
function tChar(char) {
    return langData && langData.character[char] ? langData.character[char] : char;
}
function tUI(key) {
    return langData && langData.ui && langData.ui[key] ? langData.ui[key] : key;
}
function tRoute(route) {
    return langData && langData.route && langData.route[route] ? langData.route[route] : route;
}

function getTranslation(path) {
    if (!langData || !path)
        return null;
    var parts = path.split(".");
    var value = langData;
    for (var i=0; i<parts.length; i++) {
        if (value === undefined || value === null)
            return null;
        value = value[parts[i]];
    }
    return value;
}

function applyI18n(root) {
    var rootNode = root;
    if (root && root.nodeType === 9 && root.documentElement)
        rootNode = root.documentElement;
    $(rootNode).find("[data-i18n]").addBack("[data-i18n]").each(function() {
        var key = $(this).attr("data-i18n");
        var attr = $(this).attr("data-i18n-attr");
        var value = getTranslation(key);
        if (value === null || value === undefined)
            return;
        if (attr)
            $(this).attr(attr, value);
        else
            $(this).text(value);
    });
}

function renderExtraSelectOptions() {
    $("#extra-select option").each(function(i, opt){
        if(i===0) $(opt).text(tUI('extraSelect'));
        else {
            var val = $(opt).val();
            if(val && !isNaN(val)) $(opt).text(val/5 + " (+" + val + " " + tUI('level') + ")");
        }
    });
}

function renderLanguageSwitcher() {
    $(".lang-switcher-option").each(function() {
        var lang = $(this).attr("data-lang-option");
        var isActive = lang == currentLang;
        $(this).toggleClass("is-active", isActive);
        $(this).attr("aria-pressed", isActive ? "true" : "false");
    });
}

function renderStaticUI() {
    document.documentElement.lang = currentLang;
    applyI18n(document);
    document.title = tUI('pageTitle');
    renderLanguageSwitcher();
    renderExtraSelectOptions();
    renderBaseSelect();
    renderParentSelect();
    renderGrandparentSelect();
    renderBoonBaneSelect();
    renderLevelClassSelect();
}

function switchLanguage(lang) {
    if (!lang || lang == currentLang)
        return;
    savePreferredLanguage(lang);
    window.location.reload();
}

// 在语言切换和初始化后调用
$(document).on('click', '[data-lang-option]', function() {
    switchLanguage($(this).attr('data-lang-option'));
});

// 角色选择下拉多语言渲染
function renderUnitSelect() {
    var unitSelect = $('#unit-select');
    var prev = unitSelect.val();
    unitSelect.empty().append($('<option>').val('none').text(tUI('unitSelect')));
    var unitList = {};
    for (var unit in db.character) {
        if (!unitList[db.character[unit].route])
            unitList[db.character[unit].route] = [];
        unitList[db.character[unit].route].push(unit);
    }
    for (var route in unitList) {
        unitSelect.append($('<option>').text('---' + tRoute(route) + '---').prop('disabled', true));
        for (var i = 0; i < unitList[route].length; i++)
            unitSelect.append($('<option>').val(unitList[route][i]).text(tChar(db.character[unitList[route][i]].name)));
    }
    unitSelect.val(prev || 'none');
    // 重新渲染其他下拉框option
    renderBaseSelect();
    renderParentSelect();
    renderGrandparentSelect();
    renderBoonBaneSelect();
    renderLevelClassSelect();
}

function renderBaseSelect() {
    var baseSelect = $('#base-select');
    baseSelect.find('option').each(function(i, opt) {
        if (i === 0) $(opt).text(tUI('baseSelect'));
        else if ($(opt).val() == "Inheritance") $(opt).text(tUI('inheritanceBase'));
    });
}
function renderParentSelect() {
    var parentSelect = $('#parent-select');
    parentSelect.find('option').each(function(i, opt) {
        if ($(opt).val() == "none") {
            $(opt).text(tUI('parentSelect'));
        } else if (db.character[$(opt).val()]) {
            $(opt).text(tChar(db.character[$(opt).val()].name));
        }
    });
}
function renderGrandparentSelect() {
    var grandparentSelect = $('#grandparent-select');
    grandparentSelect.find('option').each(function(i, opt) {
        if ($(opt).val() == "none") {
            $(opt).text(tUI('grandparentSelect'));
        } else if (db.character[$(opt).val()]) {
            $(opt).text(tChar(db.character[$(opt).val()].name));
        }
    });
}
function renderBoonBaneSelect() {
    $('#boon-select').find('option').each(function(i, opt) {
        var val = $(opt).val();
        if (val && langData && langData.stat[val]) $(opt).text(tStat(val));
    });
    $('#bane-select').find('option').each(function(i, opt) {
        var val = $(opt).val();
        if (val && langData && langData.stat[val]) $(opt).text(tStat(val));
    });
}
function renderLevelClassSelect() {
    $('#level-change-select').find('option').each(function(i, opt) {
        if (i === 0) $(opt).text(tUI('levelSelect'));
    });
    $('#class-change-select').find('option').each(function(i, opt) {
        if (i === 0) $(opt).text(tUI('classSelect'));
    });
}

function getAllClassKeysSorted() {
    return Object.keys(db.classes).sort(function(a, b) {
        return tClass(db.classes[a].name).localeCompare(tClass(db.classes[b].name));
    });
}

function getBaseOptionLabel(baseKey) {
    if (baseKey == "Inheritance")
        return tUI("inheritanceBase");
    return baseKey;
}

function shouldUseAptitudeForUnit(unitId) {
    return unitId == "mozume" || (db.character[unitId] && (db.character[unitId].gen == "child" || db.character[unitId].gen == "avatarChild"));
}

function syncCalcAptitudeFromUI(unitId) {
    calc.setAptitude(shouldUseAptitudeForUnit(unitId) && $("input[name=aptitude]").prop("checked"));
}

$(document).ready(function() {
	
	calc = new StatCalculator();
	db.character.kamui.initialize($("#boon-select").val(), $("#bane-select").val());
	for (var i=1; i<=20; i++)
		$("#extra-select").append($("<option>").val(i*5).text(i + " (+" + i*5 + " levels)"));
	$("#base-select").prop("disabled", true).empty().append($("<option/>").text(tUI('baseSelect')));
	resetPanel();
	
	$("#boon-select").change(function() {
		$("option.bane").prop("disabled", false);
		$("select option.bane[value=" + this.value + "]").prop("disabled", true);
		db.character.kamui.initialize($("#boon-select").val(), $("#bane-select").val());
		updateTable();
		renderInheritancePanel();
	});
	
	$("#bane-select").change(function() {
		$("option.boon").prop("disabled", false);
		$("select option.boon[value=" + this.value + "]").prop("disabled", true);
		db.character.kamui.initialize($("#boon-select").val(), $("#bane-select").val());
		updateTable();
		renderInheritancePanel();
	});
	
	$("#extra-select").change(function() {
		calc.extraLevel = parseInt(this.value);
		calc.resetClassChange();
		updateLevelSelect();
		updateTable();
	});
	
	$("input[name=aptitude]").change(function() {
		syncCalcAptitudeFromUI($("#unit-select").val());
		if (getInheritanceContext())
			renderInheritancePanel();
		else
			updateTable();
	})
	
	$("#unit-select").change(function() {
		$("#table-div").empty();
		toggleAvatarCustomization();
		toggleAptitude();
		if (this.value != "none") {
			var base = updateBaseSelection(this.value);
			var parentList = db.character[this.value].getParentList();
			updateParentList(parentList);
			updateGrandparentList();
			if (!parentList) {
				calc.setCharacter(this.value, base);
				syncCalcAptitudeFromUI(this.value);
				updateLevelSelect();
				updateTable();
			}else
				resetPanel();
		}else {
			$("#base-select").prop("disabled", true).empty().append($("<option/>").text(tUI('baseSelect')));
			resetPanel();
		}
		renderInheritancePanel();
	});
	
	$("#parent-select").change(function() {
		$("#table-div").empty();
		toggleAvatarCustomization();
		if (this.value != "none") {
			var grandparentList = db.character[this.value].getParentList();
			updateGrandparentList(grandparentList);
			if (!grandparentList) {
				var unit = $("#unit-select").val();
				var base = $("#base-select").val();
				db.character[unit].setParent(db.character[this.value]);
				calc.setCharacter(unit, base);
				syncCalcAptitudeFromUI(unit);
				updateLevelSelect();
				updateTable();
			}
		}
		renderInheritancePanel();
	});
	
	$("#grandparent-select").change(function() {
		$("#table-div").empty();
		if (this.value != "none") {
			var unit = $("#unit-select").val();
			var parent = $("#parent-select").val();
			var base = $("#base-select").val();
			db.character[parent].setParent(db.character[this.value]);
			db.character[unit].setParent(db.character[parent]);
			calc.setCharacter(unit, base);
			syncCalcAptitudeFromUI(unit);
			updateLevelSelect();
			updateTable();
		}
		renderInheritancePanel();
	});
	
	$("#base-select").change(function() {
		$("#reset").attr("disabled", true);
		calc.baseSet = this.value;
		calc.resetClassChange();
		updateLevelSelect();
		updateTable();
	});

	$(document).on("input", ".inheritance-stat-input", function() {
		syncInheritanceStateFromDom();
		renderInheritanceResult();
	});

	$(document).on("change", "#inheritance-custom select, #inheritance-custom input[type=number], #inheritance-custom input[type=checkbox]", function() {
		syncInheritanceStateFromDom();
		renderInheritancePanel();
	});

	$(document).on("click", ".inheritance-add-route", function(evt) {
		evt.preventDefault();
		syncInheritanceStateFromDom();
		var parentKey = $(this).data("parentKey");
		var parentState = inheritanceState && inheritanceState.parents ? inheritanceState.parents[parentKey] : null;
		if (!parentState || parentState.mode != "route")
			return;
		if (!parentState.pendingLevel || !parentState.pendingClass)
			return;
		parentState.routeChanges.push({
			level : Number(parentState.pendingLevel),
			targetClass : parentState.pendingClass,
		});
		renderInheritancePanel();
	});

	$(document).on("click", ".inheritance-remove-route", function(evt) {
		evt.preventDefault();
		var parentKey = $(this).data("parentKey");
		var index = Number($(this).data("routeIndex"));
		var parentState = inheritanceState && inheritanceState.parents ? inheritanceState.parents[parentKey] : null;
		if (!parentState || isNaN(index))
			return;
		parentState.routeChanges.splice(index, 1);
		renderInheritancePanel();
	});
	
	$("#level-change-select").change(function() {
		$("#add-seal").attr("disabled", false);
		var classSelect = $("#class-change-select").prop("disabled", false).empty();
		var classSet = calc.getAvaiableClassChange(this.value);
		
		if (classSet.masterSeal) {
			classSelect.append($("<option/>").text("-----" + tUI('masterSeal') + "-----").prop("disabled", true));
			for (var c in classSet.masterSeal)
				classSelect.append($("<option/>", {
					text	: tClass(db.classes[c].name),
					value	: c,
				}))
		}
		
		classSelect.append($("<option/>").text("-----" + tUI('heartSeal') + "-----").prop("disabled", true));
			for (var c in classSet.heartSeal)
				classSelect.append($("<option/>", {
					text	: tClass(db.classes[c].name),
					value	: c,
				}))
				
		classSelect.append($("<option/>").text("---" + tUI('parallelSeal') + "---").prop("disabled", true));
			for (var c in classSet.parallelSeal)
				classSelect.append($("<option/>", {
					text	: tClass(db.classes[c].name),
					value	: c,
				}))
				
		classSelect.append($("<option/>").text("-----" + tUI('specialSeal') + "-----").prop("disabled", true));
			for (var c in classSet.specialSeal)
				classSelect.append($("<option/>", {
					text	: tClass(db.classes[c].name),
					value	: c,
				}))
	});
	
	$("#add-seal").click(function(evt) {
		$("#add-seal").attr("disabled", true);
		$("#reset").attr("disabled", false);
		calc.addClassChange($("#level-change-select").val(), $("#class-change-select").val());
		updateLevelSelect();
		updateTable();
	});
	
	$("#reset").click(function(evt) {
		$("#reset").attr("disabled", true);
		calc.resetClassChange();
		updateLevelSelect();
		updateTable();
	});
	
	function resetPanel() {
		$("#level-change-select").prop("disabled", true).empty().append($("<option/>").text(tUI('levelSelect')));
		$("#class-change-select").prop("disabled", true).empty().append($("<option/>").text(tUI('classSelect')));
		$("#add-seal").attr("disabled", true);
		$("#reset").attr("disabled", true);
	}
	
	function toggleAvatarCustomization() {
		if ($("#unit-select").val() == "kamui" || $("#unit-select").val() == "kanna" || $("#parent-select").val() == "kamui")
			$("#avatar-custom").show(ANIMATION_SPEED);
		else
			$("#avatar-custom").hide(ANIMATION_SPEED);
	}
	
	function toggleAptitude() {
		var unit = $("#unit-select").val();
		if (unit == "mozume" || (db.character[unit] && (db.character[unit].gen == "child" || db.character[unit].gen == "avatarChild")))
			$("#aptitude-check").show(ANIMATION_SPEED);
		else
			$("#aptitude-check").hide(ANIMATION_SPEED);
	}
	
	function updateBaseSelection(ch) {
		var baseSelection = $("#base-select").empty().prop("disabled", false);
		
		var character = db.character[ch];
		var baseList = [];
		for (var key in character.base)
			baseList.push(key);
		
		for (var i=0; i<baseList.length; i++) {
			baseSelection.append($("<option/>", {
				text	: getBaseOptionLabel(baseList[i]),
				value	: baseList[i],
			}))
		}
		
		// Assume there is at least 1 base
		return baseList[0];
	}
	
	function updateParentList(list) {
		if (list) {
			$("#child-custom").show(ANIMATION_SPEED);
			var parentSelect = $("#parent-select").empty().append($("<option>").text(tUI('parentSelect')).val("none").prop("disabled", true));
			for (var i=0; i<list.length; i++)
				parentSelect.append($("<option>").val(list[i]).text(tChar(db.character[list[i]].name)));
			parentSelect.val("none");
		}else
			$("#child-custom").hide(ANIMATION_SPEED);
	}
	
	function updateGrandparentList(list) {
		if (list) {
			var parentSelect = $("#grandparent-select").show(ANIMATION_SPEED).empty().append($("<option>").text(tUI('grandparentSelect')).val("none").prop("disabled", true));
			for (var i=0; i<list.length; i++)
				if (list[i] != "kamui")
					parentSelect.append($("<option>").val(list[i]).text(tChar(db.character[list[i]].name)));
			parentSelect.val("none");
		}else
			$("#grandparent-select").hide(ANIMATION_SPEED);
	}
	
	// 在updateLevelSelect等流程后调用renderLevelClassSelect，确保下拉默认项多语言
	function updateLevelSelect() {
		$("#class-change-select").prop("disabled", true).empty().append($("<option/>").text(tUI('classSelect')));
		var selectLevel = $("#level-change-select").prop("disabled", false).empty();
		selectLevel.append($("<option>").text(tUI('levelSelect')).val("none").prop("disabled", true));
		if ($("#unit-select").val() != "none") {
			var levelRange = calc.getAvailableLevelRange();
			for (var i=0; i<levelRange.length; i++)
				selectLevel.append($("<option>").text(levelRange[i]));
		}
		selectLevel.val("none");
		renderLevelClassSelect();
	}

	function isChildUnit(unitId) {
		return unitId != "none" && db.character[unitId] && (db.character[unitId].gen == "child" || db.character[unitId].gen == "avatarChild");
	}

	function getInheritanceContext() {
		var unitId = $("#unit-select").val();
		if (!isChildUnit(unitId))
			return null;

		var child = db.character[unitId];
		var selectedParent = $("#parent-select").val();
		if (selectedParent == "none")
			return null;
		if ($("#grandparent-select").is(":visible") && $("#grandparent-select").val() == "none")
			return null;
		if (!child.varParent)
			return null;

		return {
			unitId : unitId,
			child : child,
			fixedParent : db.character[child.fixedParent],
			variableParent : child.varParent,
		};
	}

	function createDefaultInheritanceParentState(characterId) {
		var character = db.character[characterId];
		var baseList = Object.keys(character.base || {});
	return {
		characterId : characterId,
		mode : "route",
		manualClass : character.baseClass,
		manualStats : {},
			routeBase : baseList[0] || "Standard",
			routeLevel : character.base && character.base.Standard ? character.base.Standard.level : 1,
			routeChanges : [],
			pendingLevel : null,
			pendingClass : null,
			aptitude : false,
		};
	}

	function ensureInheritanceState(context) {
		if (!context) {
			inheritanceState = null;
			return null;
		}

		var contextKey = [
			context.unitId,
			context.variableParent.name,
			context.fixedParent.name,
		].join(":");

		if (!inheritanceState || inheritanceState.contextKey != contextKey) {
			inheritanceState = {
				contextKey : contextKey,
				unitId : context.unitId,
				childClass : context.child.baseClass,
				childLevel : context.child.childBase.level,
				parents : {
					variableParent : createDefaultInheritanceParentState(context.variableParent.name.toLowerCase() == "corrin" ? "kamui" : $("#parent-select").val()),
					fixedParent : createDefaultInheritanceParentState(context.child.fixedParent),
				},
			};
		}

		return inheritanceState;
	}

	function getInheritanceParentConfig(parentKey, context) {
		if (parentKey == "variableParent")
			return {
				state : inheritanceState.parents.variableParent,
				character : context.variableParent,
			};
		return {
			state : inheritanceState.parents.fixedParent,
			character : context.fixedParent,
		};
	}

	function createClassSelect(selectId, selectedValue) {
		var select = $("<select/>", {
			id : selectId,
			class : "inheritance-class-select form-control input-sm",
		});
		var classKeys = getAllClassKeysSorted();
		for (var i=0; i<classKeys.length; i++) {
			select.append($("<option/>", {
				value : classKeys[i],
				text : tClass(db.classes[classKeys[i]].name),
			}));
		}
		if (selectedValue && db.classes[selectedValue])
			select.val(selectedValue);
		return select;
	}

	function createRestrictedClassSelect(selectId, classKeys, selectedValue) {
		var select = $("<select/>", {
			id : selectId,
			class : "inheritance-class-select form-control input-sm",
		});
		for (var i=0; i<classKeys.length; i++) {
			if (!db.classes[classKeys[i]])
				continue;
			select.append($("<option/>", {
				value : classKeys[i],
				text : tClass(db.classes[classKeys[i]].name),
			}));
		}
		if (selectedValue && classKeys.indexOf(selectedValue) >= 0)
			select.val(selectedValue);
		return select;
	}

	function getInheritanceChildClassOptions(child) {
		var options = [ child.baseClass ];
		var promoteTo = child.getInheritancePromoteTo();
		for (var i=0; i<promoteTo.length; i++)
			if (options.indexOf(promoteTo[i]) < 0)
				options.push(promoteTo[i]);
		return options;
	}

	function createStatInput(inputId) {
		return $("<input/>", {
			id : inputId,
			type : "number",
			min : "0",
			step : "1",
			class : "inheritance-stat-input form-control input-sm",
		});
	}

	function getParentLabel(key, character) {
		return tChar(character.name) + " (" + tUI(key) + ")";
	}

	function createModeSelect(selectId, selectedValue) {
		var select = $("<select/>", {
			id : selectId,
			class : "form-control input-sm inheritance-source-select",
		});
		select
			.append($("<option/>", { value : "manual", text : tUI("manualInput") }))
			.append($("<option/>", { value : "route", text : tUI("routeCalc") }));
		select.val(selectedValue || "manual");
		return select;
	}

	function createBaseSelect(selectId, character, selectedValue) {
		var select = $("<select/>", {
			id : selectId,
			class : "form-control input-sm inheritance-route-base",
		});
		for (var key in character.base) {
			select.append($("<option/>", {
				value : key,
				text : key,
			}));
		}
		select.val(selectedValue || "Standard");
		return select;
	}

	function createLevelSelect(selectId, levelList, selectedValue, className) {
		var select = $("<select/>", {
			id : selectId,
			class : className || "form-control input-sm",
		});
		for (var i=0; i<levelList.length; i++)
			select.append($("<option/>", {
				value : levelList[i],
				text : levelList[i],
			}));
		if (selectedValue != null && levelList.indexOf(Number(selectedValue)) >= 0)
			select.val(String(selectedValue));
		return select;
	}

	function getEvenLevelOptions(bounds) {
		if (!bounds)
			return [];
		var levels = [];
		for (var level = bounds.min; level <= bounds.max; level++) {
			if (level % 2 == 0)
				levels.push(level);
		}
		return levels;
	}

	function getInheritanceChildLevelBounds(child, classKey) {
		return calc.getDisplayedLevelBoundsForClass(child, classKey);
	}

	function getRouteCalc(parentState) {
		var routeCalc = new StatCalculator();
		routeCalc.setCharacter(parentState.characterId, parentState.routeBase);
		routeCalc.setAptitude(parentState.aptitude);
		for (var i=0; i<parentState.routeChanges.length; i++)
			routeCalc.addClassChange(parentState.routeChanges[i].level, parentState.routeChanges[i].targetClass);
		return routeCalc;
	}

	function getLevelStateByDisplayedLevel(levelChunk, displayedLevel) {
		for (var j=0; j<levelChunk.length; j++)
			if (levelChunk[j].displayedLevel == displayedLevel)
				return levelChunk[j];
	}

	function flattenClassChangeOptions(classSet) {
		var groups = [
			[ "masterSeal", tUI("masterSeal") ],
			[ "heartSeal", tUI("heartSeal") ],
			[ "parallelSeal", tUI("parallelSeal") ],
			[ "specialSeal", tUI("specialSeal") ],
		];
		var options = [];
		var seen = {};
		for (var i=0; i<groups.length; i++) {
			var groupKey = groups[i][0];
			var label = groups[i][1];
			if (!classSet[groupKey])
				continue;
			for (var classKey in classSet[groupKey]) {
				if (seen[classKey])
					continue;
				seen[classKey] = true;
				options.push({
					value : classKey,
					text : label + " | " + tClass(db.classes[classKey].name),
				});
			}
		}
		return options;
	}

	function getParentRouteCalculation(parentState) {
		var routeCalc = getRouteCalc(parentState);
		var availableLevels = routeCalc.getAvailableLevelRange();
		if (!availableLevels.length)
			return null;

		var routeLevel = Number(parentState.routeLevel);
		if (availableLevels.indexOf(routeLevel) < 0)
			routeLevel = availableLevels[0];
		parentState.routeLevel = routeLevel;

		var levelList = routeCalc.compute();
		var levelState = getLevelStateByDisplayedLevel(levelList[levelList.length-1], routeLevel);
		if (!levelState)
			return null;

		var latestClassChange = routeCalc.getLatestClassChange();
		var currentClassKey = latestClassChange ? latestClassChange.targetClass : db.classes[routeCalc.character.baseClass];
		var currentClassId = latestClassChange ? parentState.routeChanges[parentState.routeChanges.length-1].targetClass : routeCalc.character.baseClass;

		var addLevel = Number(parentState.pendingLevel);
		if (availableLevels.indexOf(addLevel) < 0)
			addLevel = availableLevels[0];
		parentState.pendingLevel = addLevel;

		var pendingOptions = flattenClassChangeOptions(routeCalc.getAvaiableClassChange(addLevel));
		if (pendingOptions.length) {
			var hasPending = false;
			for (var i=0; i<pendingOptions.length; i++)
				if (pendingOptions[i].value == parentState.pendingClass)
					hasPending = true;
			if (!hasPending)
				parentState.pendingClass = pendingOptions[0].value;
		} else {
			parentState.pendingClass = null;
		}

		return {
			calc : routeCalc,
			levelState : levelState,
			currentClass : currentClassKey,
			currentClassId : currentClassId,
			availableLevels : availableLevels,
			pendingOptions : pendingOptions,
		};
	}

	function renderParentRouteSection(parentKey, context) {
		var config = getInheritanceParentConfig(parentKey, context);
		var parentState = config.state;
		var character = config.character;
		var routeResult = getParentRouteCalculation(parentState);
		var section = $("<div/>").addClass("inheritance-route-section");
		section.append($("<h5/>").text(getParentLabel(parentKey, character) + " " + tUI("routeConfig")));

		if (!routeResult) {
			section.append($("<div/>").addClass("inheritance-note").text(tUI("inheritanceInvalid")));
			return section;
		}

		var controlRow = $("<div/>").addClass("row");
		controlRow
			.append($("<div/>").addClass("col-sm-3").append($("<label/>").text(tUI("baseSelect"))).append(createBaseSelect("inheritance-route-base-" + parentKey, character, parentState.routeBase)))
			.append($("<div/>").addClass("col-sm-3").append($("<label/>").text(tUI("targetLevel"))).append(createLevelSelect("inheritance-route-level-" + parentKey, routeResult.availableLevels, parentState.routeLevel, "form-control input-sm inheritance-route-level")));

		if (parentState.characterId == "mozume") {
			controlRow.append(
				$("<div/>").addClass("col-sm-3").append($("<label/>").text(tUI("aptitude"))).append(
					$("<div/>").append($("<label/>").append(
						$("<input/>", {
							id : "inheritance-route-aptitude-" + parentKey,
							type : "checkbox",
							class : "inheritance-route-aptitude",
							checked : parentState.aptitude,
						})
					).append(" " + tUI("aptitude")))
				)
			);
		}

		controlRow.append(
			$("<div/>").addClass("col-sm-3").append($("<label/>").text(tUI("currentClass"))).append(
				$("<div/>").addClass("form-control-static").text(tClass(routeResult.currentClass.name))
			)
		);
		section.append(controlRow);

		var addRow = $("<div/>").addClass("row").css("margin-top", "8px");
		addRow
			.append($("<div/>").addClass("col-sm-3").append($("<label/>").text(tUI("changeAtLevel"))).append(createLevelSelect("inheritance-route-add-level-" + parentKey, routeResult.availableLevels, parentState.pendingLevel, "form-control input-sm inheritance-add-level-select")))
			.append($("<div/>").addClass("col-sm-5").append($("<label/>").text(tUI("classChangeOptions"))).append((function() {
				var select = $("<select/>", {
					id : "inheritance-route-add-class-" + parentKey,
					class : "form-control input-sm inheritance-add-class-select",
				});
				if (!routeResult.pendingOptions.length)
					select.append($("<option/>", { value : "", text : tUI("noAvailableRoute") }));
				for (var i=0; i<routeResult.pendingOptions.length; i++)
					select.append($("<option/>", routeResult.pendingOptions[i]));
				if (parentState.pendingClass)
					select.val(parentState.pendingClass);
				return select;
			})()))
			.append($("<div/>").addClass("col-sm-2").append($("<label/>").html("&nbsp;")).append($("<button/>", {
				type : "button",
				class : "btn btn-default btn-sm inheritance-add-route",
				disabled : !routeResult.pendingOptions.length,
				"text" : tUI("addRoute"),
			}).attr("data-parent-key", parentKey)));
		section.append(addRow);

		var routeList = $("<div/>").addClass("inheritance-route-list").css("margin-top", "8px");
		if (!parentState.routeChanges.length) {
			routeList.append($("<div/>").addClass("inheritance-note").text(tUI("routeDefaultPath")));
		} else {
			for (var i=0; i<parentState.routeChanges.length; i++) {
				routeList.append(
					$("<div/>").append(
						$("<span/>").text(tUI("level") + " " + parentState.routeChanges[i].level + " -> " + tClass(db.classes[parentState.routeChanges[i].targetClass].name) + " "),
						$("<button/>", {
							type : "button",
							class : "btn btn-link btn-xs inheritance-remove-route",
							"text" : tUI("removeRoute"),
						}).attr("data-parent-key", parentKey).attr("data-route-index", i)
					)
				);
			}
		}
		section.append(routeList);
		return section;
	}

	function syncInheritanceStateFromDom() {
		var context = getInheritanceContext();
		if (!context)
			return null;
		ensureInheritanceState(context);

		if ($("#inheritance-child-class").length)
			inheritanceState.childClass = $("#inheritance-child-class").val();
		if ($("#inheritance-child-level").length)
			inheritanceState.childLevel = $("#inheritance-child-level").val();

		var parentKeys = [ "variableParent", "fixedParent" ];
		for (var i=0; i<parentKeys.length; i++) {
			var parentKey = parentKeys[i];
			var parentState = inheritanceState.parents[parentKey];
			var modeEl = $("#inheritance-source-" + parentKey);
			if (modeEl.length)
				parentState.mode = modeEl.val();
			var classEl = $("#inheritance-" + parentKey + "-class");
			if (classEl.length)
				parentState.manualClass = classEl.val();
			for (var j=0; j<STAT_KEYS.length; j++) {
				var attr = STAT_KEYS[j];
				var input = $("#inheritance-" + parentKey + "-" + attr);
				if (input.length)
					parentState.manualStats[attr] = input.val();
			}
			var routeBaseEl = $("#inheritance-route-base-" + parentKey);
			if (routeBaseEl.length)
				parentState.routeBase = routeBaseEl.val();
			var routeLevelEl = $("#inheritance-route-level-" + parentKey);
			if (routeLevelEl.length)
				parentState.routeLevel = routeLevelEl.val();
			var pendingLevelEl = $("#inheritance-route-add-level-" + parentKey);
			if (pendingLevelEl.length)
				parentState.pendingLevel = pendingLevelEl.val();
			var pendingClassEl = $("#inheritance-route-add-class-" + parentKey);
			if (pendingClassEl.length)
				parentState.pendingClass = pendingClassEl.val();
			var aptitudeEl = $("#inheritance-route-aptitude-" + parentKey);
			if (aptitudeEl.length)
				parentState.aptitude = aptitudeEl.prop("checked");
		}

		return inheritanceState;
	}

	function applyInheritanceBaseToMainCalc(result) {
		var unitId = result.childId;
		var child = result.child;
		var aptitudeActive = shouldUseAptitudeForUnit(unitId) && $("input[name=aptitude]").prop("checked");
		var stats = [];
		for (var i=0; i<STAT_KEYS.length; i++)
			stats.push(result.stats[STAT_KEYS[i]].calculatedStat);

		child.base.Inheritance = new BaseStat(Number(result.childLevel), stats[0], stats[1], stats[2], stats[3], stats[4], stats[5], stats[6], stats[7]);
		child.base.Inheritance.classKey = result.childClassKey;

		var signature = JSON.stringify({
			classKey : result.childClassKey,
			level : Number(result.childLevel),
			stats : stats,
			aptitude : aptitudeActive,
		});
		if (inheritanceState.appliedMainCalcSignature == signature && $("#base-select").val() == "Inheritance")
			return;

		inheritanceState.appliedMainCalcSignature = signature;
		updateBaseSelection(unitId);
		$("#base-select").val("Inheritance");
		calc.setCharacter(unitId, "Inheritance");
		syncCalcAptitudeFromUI(unitId);
		updateLevelSelect();
		updateTable();
	}

	function clearInheritanceBaseFromMainCalc(context) {
		if (!context || !context.child)
			return;

		delete context.child.base.Inheritance;
		if (inheritanceState)
			inheritanceState.appliedMainCalcSignature = null;

		if ($("#unit-select").val() != context.unitId)
			return;

		var currentBase = $("#base-select").val();
		updateBaseSelection(context.unitId);
		if (currentBase == "Inheritance" || !context.child.base[currentBase]) {
			$("#base-select").val("Standard");
			calc.setCharacter(context.unitId, "Standard");
			syncCalcAptitudeFromUI(context.unitId);
			updateLevelSelect();
			updateTable();
		}
	}

	function renderInheritancePanel() {
		var context = getInheritanceContext();
		var panel = $("#inheritance-custom");
		var inputContainer = $("#inheritance-inputs").empty();
		$("#inheritance-output").empty();

		if (!context) {
			if (inheritanceState && inheritanceState.unitId && db.character[inheritanceState.unitId])
				delete db.character[inheritanceState.unitId].base.Inheritance;
			inheritanceState = null;
			panel.hide();
			return;
		}

		ensureInheritanceState(context);
		panel.show(ANIMATION_SPEED);
		inputContainer.append($("<div/>").addClass("inheritance-note").text(tUI('inheritancePrompt')));

		var table = $("<table/>").addClass("table table-bordered table-condensed inheritance-table");
		var header = $("<tr/>")
			.append($("<th/>").addClass("inheritance-label").text(tUI('unit')))
			.append($("<th/>").text(tUI('statSource')))
			.append($("<th/>").text(tUI('currentClass')))
			.append($("<th/>").addClass("inheritance-level-cell").text(tUI('targetLevel')));

		for (var i=0; i<STAT_KEYS.length; i++)
			header.append($("<th/>").addClass("stat-" + STAT_KEYS[i]).text(tStat(STAT_KEYS[i])));

		function buildParentRow(parentKey, character) {
			var parentState = inheritanceState.parents[parentKey];
			var routeResult = parentState.mode == "route" ? getParentRouteCalculation(parentState) : null;
			var row = $("<tr/>")
				.append($("<td/>").addClass("inheritance-label").text(getParentLabel(parentKey, character)))
				.append($("<td/>").append(createModeSelect("inheritance-source-" + parentKey, parentState.mode)));

			if (parentState.mode == "route" && routeResult) {
				row.append($("<td/>").text(tClass(routeResult.currentClass.name)));
				row.append($("<td/>").text(routeResult.levelState.displayedLevel));
				for (var i=0; i<STAT_KEYS.length; i++) {
					var attr = STAT_KEYS[i];
					row.append($("<td/>").addClass("stat-" + attr).text(formatNumber(routeResult.levelState.stat[attr])));
				}
			} else {
				row.append($("<td/>").append(createClassSelect("inheritance-" + parentKey + "-class", parentState.manualClass || character.baseClass)));
				row.append($("<td/>").text(tUI('displayStats')));
				for (var i=0; i<STAT_KEYS.length; i++) {
					var attr = STAT_KEYS[i];
					var input = createStatInput("inheritance-" + parentKey + "-" + attr);
					if (parentState.manualStats[attr] !== undefined)
						input.val(parentState.manualStats[attr]);
					row.append($("<td/>").append(input));
				}
			}
			return row;
		}

		var childClassOptions = getInheritanceChildClassOptions(context.child);
		if (childClassOptions.indexOf(inheritanceState.childClass) < 0)
			inheritanceState.childClass = childClassOptions[0];

		var childLevelBounds = getInheritanceChildLevelBounds(context.child, inheritanceState.childClass || context.child.baseClass);
		var childLevelOptions = getEvenLevelOptions(childLevelBounds);
		if (childLevelOptions.length) {
			var currentChildLevel = Number(inheritanceState.childLevel);
			if (isNaN(currentChildLevel) || childLevelOptions.indexOf(currentChildLevel) < 0)
				inheritanceState.childLevel = childLevelOptions[0];
		}

		var childRow = $("<tr/>")
			.append($("<td/>").addClass("inheritance-label").text(tChar(context.child.name) + " (" + tUI('childCurrent') + ")"))
			.append($("<td/>").text("-"))
			.append($("<td/>").append(createRestrictedClassSelect("inheritance-child-class", childClassOptions, inheritanceState.childClass || context.child.baseClass)))
			.append($("<td/>").append(createLevelSelect("inheritance-child-level", childLevelOptions, inheritanceState.childLevel || context.child.childBase.level, "inheritance-level-input form-control input-sm")));
		for (var i=0; i<STAT_KEYS.length; i++)
			childRow.append($("<td/>").addClass("stat-" + STAT_KEYS[i]).text("-"));

		table.append($("<thead/>").append(header));
		table.append($("<tbody/>").append(buildParentRow("variableParent", context.variableParent)).append(buildParentRow("fixedParent", context.fixedParent)).append(childRow));
		inputContainer.append(table);

		for (var i=0; i<[ "variableParent", "fixedParent" ].length; i++) {
			var parentKey = [ "variableParent", "fixedParent" ][i];
			if (inheritanceState.parents[parentKey].mode == "route")
				inputContainer.append(renderParentRouteSection(parentKey, context));
		}

		renderInheritanceResult();
	}

	function renderInheritanceResult() {
		var context = getInheritanceContext();
		var output = $("#inheritance-output").empty();
		if (!context)
			return;

		syncInheritanceStateFromDom();
		ensureInheritanceState(context);

		var options = {
			child : context.unitId,
			childClass : inheritanceState.childClass,
			childLevel : inheritanceState.childLevel,
			variableParentStats : {},
			fixedParentStats : {},
		};

		var hasAllInput = true;
		var parentKeys = [ "variableParent", "fixedParent" ];
		for (var i=0; i<parentKeys.length; i++) {
			var parentKey = parentKeys[i];
			var parentState = inheritanceState.parents[parentKey];
			if (parentState.mode == "route") {
				var routeResult = getParentRouteCalculation(parentState);
				if (!routeResult) {
					hasAllInput = false;
					continue;
				}
				options[parentKey + "Class"] = routeResult.currentClassId;
				for (var j=0; j<STAT_KEYS.length; j++) {
					var attr = STAT_KEYS[j];
					options[parentKey + "Stats"][attr] = routeResult.levelState.stat[attr];
				}
			} else {
				options[parentKey + "Class"] = parentState.manualClass;
				for (var j=0; j<STAT_KEYS.length; j++) {
					var attr = STAT_KEYS[j];
					options[parentKey + "Stats"][attr] = parentState.manualStats[attr];
					if (parentState.manualStats[attr] === "" || parentState.manualStats[attr] === undefined)
						hasAllInput = false;
				}
			}
		}
		if (inheritanceState.childLevel === "")
			hasAllInput = false;

		var childLevelBounds = getInheritanceChildLevelBounds(context.child, inheritanceState.childClass);
		var childLevel = Number(inheritanceState.childLevel);
		var childLevelOptions = getEvenLevelOptions(childLevelBounds);
		if (!childLevelBounds || !childLevelOptions.length || isNaN(childLevel) || childLevelOptions.indexOf(childLevel) < 0)
			hasAllInput = false;

		if (!hasAllInput) {
			clearInheritanceBaseFromMainCalc(context);
			output.append($("<div/>").addClass("inheritance-note").text(tUI('inheritancePending')));
			return;
		}

		var result = calc.calculateChildInheritance(options);
		if (!result) {
			clearInheritanceBaseFromMainCalc(context);
			output.append($("<div/>").addClass("inheritance-note").text(tUI('inheritanceInvalid')));
			return;
		}

		applyInheritanceBaseToMainCalc(result);

		var summary = $("<div/>").addClass("inheritance-note").text(
			tUI('inheritanceSummary') + ": " +
			tClass(result.defaultPromotedClass.name)
		);
		output.append(summary);

		var table = $("<table/>").addClass("table table-bordered table-condensed inheritance-table");
		var header = $("<tr/>")
			.append($("<th/>").addClass("inheritance-label").text(tUI('statLabel')));
		var columns = [ "variableParentPersonal", "fixedParentPersonal", "hypotheticalBase", "inheritanceCap", "inheritanceValue", "calculatedStat" ];
		for (var i=0; i<columns.length; i++)
			header.append($("<th/>").text(tUI(columns[i])));
		table.append($("<thead/>").append(header));

		var body = $("<tbody/>");
		for (var i=0; i<STAT_KEYS.length; i++) {
			var attr = STAT_KEYS[i];
			var rowData = result.stats[attr];
			var row = $("<tr/>")
				.append($("<td/>").addClass("inheritance-label stat-" + attr).text(tStat(attr)))
				.append($("<td/>").text(formatNumber(rowData.variableParentPersonal)))
				.append($("<td/>").text(formatNumber(rowData.fixedParentPersonal)))
				.append($("<td/>").text(formatNumber(rowData.hypotheticalBase)))
				.append($("<td/>").text(formatNumber(rowData.inheritanceCap)))
				.append($("<td/>").text(formatNumber(rowData.inheritance)))
				.append($("<td/>").text(formatNumber(rowData.calculatedStat)));
			body.append(row);
		}
		table.append(body);
		output.append(table);
	}
	
	function createHeatmap(levelList) {
		// 属性颜色
		var statColors = {
			HP: { r: 26, g: 35, b: 126 },     // #1a237e
			Str: { r: 183, g: 28, b: 28 },    // #b71c1c
			Mag: { r: 13, g: 71, b: 161 },    // #0d47a1
			Skl: { r: 27, g: 94, b: 32 },     // #1b5e20
			Spd: { r: 230, g: 81, b: 0 },     // #e65100
			Lck: { r: 74, g: 20, b: 140 },    // #4a148c
			Def: { r: 245, g: 127, b: 23 },   // #f57f17
			Res: { r: 0, g: 77, b: 64 }       // #004d40
		};
	
		// 信息面板
		$("#heatmap-info-panel").remove();
		var infoPanel = $("<div/>")
			.attr("id", "heatmap-info-panel")
			.addClass("heatmap-info-panel")
			.hide()
			.appendTo($("body"));
	
		function erf(x) {
			var sign = x >= 0 ? 1 : -1;
			x = Math.abs(x);
			var t = 1 / (1 + 0.3275911 * x);
			var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
			return sign * y;
		}
		function phi(z) {
			return 0.5 * (1 + erf(z / Math.SQRT2));
		}
		function calculateProbability(val, mean, stdDev, base, classBase, baseClassBase) {
			// if (val < base) return 0;
			if (stdDev === 0) return (Math.round(mean) === val ? 1 : 0);
			var zLow = (val - 0.5 - mean) / stdDev;
			var zHigh = (val + 0.5 - mean) / stdDev;
			return Math.max(0, phi(zHigh) - phi(zLow));
		}
		function formatProbability(prob) {
			return (prob * 100).toFixed(2) + "%";
		}
		function updateInfoPanel(attr, level, className, value, probability, mean, stdDev) {
			if (!level) {
				infoPanel.hide();
				return;
			}
			var cumProb = stdDev > 0
				? formatProbability(1 - phi((value - mean) / stdDev))
				: (value <= mean ? "100.00%" : "0.00%");
			infoPanel.html(`
				<div class="info-title ${attr ? 'stat-' + attr : ''}">
					${attr ? tStat(attr) : ''} - ${tUI('level')} ${level} (${className})
				</div>
				<div class="info-content">
					<div>${tUI('value')}: ${value}</div>
					<div>${tUI('probability')}: ${formatProbability(probability)}</div>
					<div>${tUI('cumProbability')}: ${cumProb}</div>
				</div>
			`);
			infoPanel.show();
		}
	
		var heatmapContainer = $("<div/>").addClass("heatmap-container");
		
		// 更新CSS样式
		var styleElement = $("#heatmap-styles");
		if (styleElement.length === 0) {
			styleElement = $("<style/>")
				.attr("id", "heatmap-styles")
				.appendTo("head");
		}
		
		styleElement.text(`
			.heatmap-container {
				display: flex;
				flex-direction: column;
				gap: 20px;
				padding: 20px;
				background: white;
				margin-top: 20px;
			}
			.heatmap-wrapper {
				width: 100%;
				margin-bottom: 30px;
			}
			.heatmap-layout {
				display: flex;
				gap: 5px;
				margin-top: 20px;
				width: 100%;
			}
			.heatmap-y-axis {
				display: flex;
				flex-direction: column;
				gap: 1px;
				padding-top: 60px;
				min-width: 150px;
				flex-shrink: 0;
			}
			.heatmap-grid-container {
				flex: 1;
				overflow-x: auto;
				min-width: 0;
			}
			.heatmap-x-axis {
				display: flex;
				gap: 1px;
				margin-bottom: 5px;
				height: 60px;
				min-width: fit-content;
			}
			.heatmap-grid {
				display: grid;
				gap: 1px;
				background: #eee;
				padding: 1px;
				min-width: fit-content;
			}
			.heatmap-header {
				width: 20px;
				writing-mode: vertical-rl;
				transform: rotate(180deg);
				text-align: center;
				font-size: 12px;
				white-space: nowrap;
				height: 60px;
				display: flex;
				align-items: center;
				justify-content: center;
			}
			.heatmap-level {
				height: 20px;
				line-height: 20px;
				text-align: right;
				padding-right: 5px;
				font-size: 12px;
				display: flex;
				align-items: center;
				justify-content: flex-end;
				background: white;
				gap: 5px;
			}
			.class-indicator {
				font-size: 10px;
				color: #666;
				white-space: nowrap;
			}
			.heatmap-cell {
				width: 20px;
				height: 20px;
				background: white;
				transition: all 0.15s ease;
				position: relative;
				cursor: pointer;
			}
			.heatmap-cell:hover {
				transform: scale(1.2);
				z-index: 2;
				box-shadow: 0 0 5px rgba(0,0,0,0.3);
			}
			.heatmap-cell.highlight {
				box-shadow: inset 0 0 0 1px rgba(255,255,255,0.5);
				z-index: 1;
			}
			.heatmap-info-panel {
				position: fixed;
				left: 20px;
				bottom: 20px;
				background: rgba(0,0,0,0.85);
				color: white;
				padding: 12px 16px;
				border-radius: 6px;
				font-size: 13px;
				z-index: 9999;
				box-shadow: 0 4px 12px rgba(0,0,0,0.3);
				min-width: 250px;
				backdrop-filter: blur(8px);
				border: 1px solid rgba(255,255,255,0.1);
				transform: translateZ(0);
				will-change: transform;
				pointer-events: none;
			}
			.info-title {
				font-weight: bold;
				margin-bottom: 8px;
				padding-bottom: 6px;
				border-bottom: 1px solid rgba(255,255,255,0.2);
			}
			.info-content {
				line-height: 1.6;
			}
			.info-content > div {
				white-space: nowrap;
			}
			/* Stat-specific colors */
			.stat-HP { color: #1a237e; }
			.stat-Str { color: #b71c1c; }
			.stat-Mag { color: #0d47a1; }
			.stat-Skl { color: #1b5e20; }
			.stat-Spd { color: #e65100; }
			.stat-Lck { color: #4a148c; }
			.stat-Def { color: #f57f17; }
			.stat-Res { color: #004d40; }
		`);

		for (var attr in levelList[0][0].stat) {
			var wrapper = $("<div/>").addClass("heatmap-wrapper");
			wrapper.append($("<h4/>")
				.text(tStat(attr) + " " + tUI('growthDistribution'))
				.addClass("stat-" + attr));
			
			var minVal = Infinity;
			var maxVal = 0;
			var maxLevel = 0;
			var initialTier1Level = levelList[0][0].tier1Level;
			var initialTier2Level = levelList[0][0].tier2Level || 0;
			var allLevelData = [];
			var classChangePoints = new Set(); // 记录转职点

			// 首先收集所有数据和转职点
			for (var i = 0; i < levelList.length; i++) {
				if (!levelList[i] || !levelList[i].length || !levelList[i][0].unitClass) {
					continue;
				}

				// 如果不是第一个职业，记录转职点
				if (i > 0) {
					var classChangeLevel = levelList[i][0];
					var levelKey = JSON.stringify({
						tier1: classChangeLevel.tier1Level,
						tier2: classChangeLevel.tier2Level || 0
					});
					classChangePoints.add(levelKey);
				}

				for (var j = 0; j < levelList[i].length; j++) {
					var val = levelList[i][j].stat[attr];
					var cap = levelList[i][j].statCap[attr];
					var tier1Level = levelList[i][j].tier1Level;
					var tier2Level = levelList[i][j].tier2Level || 0;
					
					minVal = Math.min(minVal, Math.floor(val * 0.75));
					maxVal = Math.min(Math.max(maxVal, Math.ceil(val * 1.25)), cap);
					maxLevel = Math.max(maxLevel, tier1Level);
					
					allLevelData.push({
						tier1Level: tier1Level,
						tier2Level: tier2Level,
						stat: val,
						cap: cap,
						className: levelList[i][0].unitClass.name,
						growthRate: levelList[i][j].growthRate ? levelList[i][j].growthRate[attr] / 100 : 0,
						classIndex: i
					});
				}
			}

			var heatmapLayout = $("<div/>").addClass("heatmap-layout");
			
			var yAxis = $("<div/>").addClass("heatmap-y-axis");
			var gridContainer = $("<div/>").addClass("heatmap-grid-container");
			var xAxis = $("<div/>").addClass("heatmap-x-axis");
			var grid = $("<div/>").addClass("heatmap-grid");
			
			// 创建x轴标签
			for (var val = minVal; val <= maxVal; val++) {
				xAxis.append($("<div/>")
					.addClass("heatmap-header")
					.addClass("stat-" + attr)
					.text(val));
			}

			// 遍历所有等级数据
			var processedLevels = new Set();
			var sortedLevelData = allLevelData.sort((a, b) => {
				// 首先按tier1Level排序
				if (a.tier1Level !== b.tier1Level) return a.tier1Level - b.tier1Level;
				// 然后按tier2Level排序
				if (a.tier2Level !== b.tier2Level) return a.tier2Level - b.tier2Level;
				// 最后按职业索引排序
				return a.classIndex - b.classIndex;
			});

			var rowData = [];
			var totalRows = 0;

			sortedLevelData.forEach(data => {
				var levelKey = JSON.stringify({
					tier1: data.tier1Level,
					tier2: data.tier2Level
				});

				if (!processedLevels.has(levelKey)) {
					processedLevels.add(levelKey);
					var levelDataList = allLevelData.filter(d => 
						d.tier1Level === data.tier1Level && 
						d.tier2Level === data.tier2Level
					);

					if (levelDataList.length > 0) {
						// 检查是否是转职点
						var isClassChange = classChangePoints.has(levelKey);

						if (isClassChange) {
							var sortedClassData = levelDataList.slice().sort((a, b) => a.classIndex - b.classIndex);
							// 添加转职前的数据
							var prevClassData = sortedClassData[0];
							if (prevClassData) {
								rowData.push({
									tier1Level: prevClassData.tier1Level,
									tier2Level: prevClassData.tier2Level,
									className: tClass(prevClassData.className) + " (" + tUI('beforeChange') + ")",
									data: prevClassData
								});
								totalRows++;
							}
							
							// 添加转职后的数据
							var nextClassData = sortedClassData[sortedClassData.length - 1];
							if (nextClassData) {
								rowData.push({
									tier1Level: nextClassData.tier1Level,
									tier2Level: nextClassData.tier2Level,
									className: tClass(nextClassData.className) + " (" + tUI('afterChange') + ")",
									data: nextClassData
								});
								totalRows++;
							}
						} else {
							// 普通等级只显示当前职业的数据
							var currentClassIndex = Math.max(...levelDataList.map(d => d.classIndex));
							var currentData = levelDataList.find(d => d.classIndex === currentClassIndex);
							if (currentData) {
								rowData.push({
									tier1Level: currentData.tier1Level,
									tier2Level: currentData.tier2Level,
									className: tClass(currentData.className),
									data: currentData
								});
								totalRows++;
							}
						}
					}
				}
			});

			// 更新网格样式以适应新的行数
			grid.css({
				'grid-template-columns': `repeat(${maxVal - minVal + 1}, 20px)`,
				'grid-template-rows': `repeat(${totalRows}, 20px)`,
				'gap': '1px'
			});

			// 创建y轴标签和网格单元格
			rowData.forEach((row, rowIndex) => {
				// 添加y轴标签
				var levelDiv = $("<div/>")
					.addClass("heatmap-level")
					.addClass("stat-" + attr);
				
				var displayLevel = row.tier2Level > 0 ? 
					row.tier1Level + "/" + row.tier2Level :
					row.tier1Level;
				
				levelDiv.append($("<span/>").text(displayLevel))
					.append($("<span/>").addClass("class-indicator").text(" (" + row.className + ")"));
				yAxis.append(levelDiv);

				// 创建该行的单元格
				if (row.data) {
					var n = (row.tier1Level - initialTier1Level) + (row.tier2Level - initialTier2Level);
					var g = row.data.growthRate;
					var mean = row.data.stat;
					var stdDev = Math.sqrt(n * g * (1 - g));
					var base = levelList[0][0].stat[attr];
					var classBase = levelList[levelList.length - 1][0].unitClass.base[attr];
					var baseClassBase = levelList[0][0].unitClass.base[attr];

					for (var val = minVal; val <= maxVal; val++) {
						var probability = calculateProbability(val, mean, stdDev, base, classBase, baseClassBase);
						var displayProb = Math.sqrt(probability);
						var color = statColors[attr];
						var cell = $("<div/>")
							.addClass("heatmap-cell")
							.attr({
								'data-tier1-level': row.tier1Level,
								'data-tier2-level': row.tier2Level,
								'data-value': val,
								'data-probability': probability,
								'data-class-name': row.className,
								'data-mean': mean.toFixed(2),
								'data-std-dev': stdDev.toFixed(2),
								'data-stat-type': attr
							})
							.css({
								'background-color': `rgba(${color.r}, ${color.g}, ${color.b}, ${displayProb})`
							});

						(function(currentAttr) {
							cell.on({
								mouseenter: function(e) {
									var $this = $(this);
									var tier1Level = $this.data('tier1-level');
									var tier2Level = $this.data('tier2-level');
									var displayLevel = tier2Level > 0 ? 
										tier1Level + "/" + tier2Level :
										tier1Level;
									var value = $this.data('value');
									var probability = $this.data('probability');
									var className = $this.data('className');
									var mean = parseFloat($this.data('mean'));
									var stdDev = parseFloat($this.data('stdDev'));
									
									updateInfoPanel(currentAttr, displayLevel, className, value, probability, mean, stdDev);
								},
								mouseleave: function() {
									updateInfoPanel();
								}
							});
						})(attr);
						
						grid.append(cell);
					}
				} else {
					// 填充空单元格
					for (var val = minVal; val <= maxVal; val++) {
						grid.append($("<div/>").addClass("heatmap-cell"));
					}
				}
			});

			gridContainer.append(xAxis).append(grid);
			heatmapLayout.append(yAxis).append(gridContainer);
			wrapper.append(heatmapLayout);
			heatmapContainer.append(wrapper);
		}
		
		// 鼠标移入单元格时显示tip，移出时隐藏
		$(document).off('mouseleave.heatmap').on('mouseleave.heatmap', '.heatmap-container', function(){
			infoPanel.hide();
		});

		return heatmapContainer;
	}	
	
	function formatNumber(num) {
		// 先转换为最多2位小数
		let str = Number(num).toFixed(2);
		// 去掉末尾的0和不必要的小数点
		return str.replace(/\.?0+$/, '');
	}
	
	function renderGrowthBarChart() {
    // 获取当前角色
    var unit = $("#unit-select").val();
    if (!unit || unit === "none" || !db.character[unit]) {
        $("#growth-bar-chart").remove();
        return;
    }
    var growth = db.character[unit].growth;
    if (!growth) {
        $("#growth-bar-chart").remove();
        return;
    }
    // 获取当前class对象
    var curClass = (calc.getLatestClassChange() ? calc.getLatestClassChange().targetClass : db.classes[db.character[unit].baseClass]);
    var classGrowth = curClass.growth;
    var className = tClass(curClass.name);
    var statOrder = ["HP", "Str", "Mag", "Skl", "Spd", "Lck", "Def", "Res"];
    var statColors = {
        HP: "#1a237e",
        Str: "#b71c1c",
        Mag: "#0d47a1",
        Skl: "#f57c00",      // 技巧 橙色（深）
        Spd: "#388e3c",      // 速度 深绿色
        Lck: "#fbc02d",      // 幸运 深黄色
        Def: "#1976d2",      // 防御 深蓝色
        Res: "#8e24aa"       // 魔抗 紫色
    };
    var statLightColors = {
        HP: "#c5cae9",
        Str: "#ffcdd2",
        Mag: "#bbdefb",
        Skl: "#ffb74d",      // 技巧 橙色（浅）
        Spd: "#81c784",      // 速度 浅绿色
        Lck: "#ffe082",      // 幸运 浅黄色
        Def: "#64b5f6",      // 防御 浅蓝色
        Res: "#e1bee7"       // 魔抗 紫色（浅）
    };
    var aptitudeColor = "#e0e0e0";
    // 判断Aptitude
    var aptitude = 0;
    var isChild = db.character[unit].gen === "child" || db.character[unit].gen === "avatarChild";
    if ((unit === "mozume" || isChild) && $("input[name=aptitude]").prop("checked")) {
        aptitude = 10;
    }
    var chart = $("<div/>").attr("id", "growth-bar-chart").css({
        "margin": "20px 0 10px 0",
        "padding": "16px 20px 10px 20px",
        "background": "#fff",
        "border-radius": "8px",
        "box-shadow": "0 2px 8px rgba(0,0,0,0.06)",
        "max-width": "520px"
    });
    var unitName = unit && db.character[unit] ? tChar(db.character[unit].name) : '';
    var titleBox = $("<div/>").css({marginBottom:'18px'});
    titleBox.append($('<div/>').text(unitName).css({textAlign:'center',fontWeight:'bold',fontSize:'18px',lineHeight:'1.2'}));
    titleBox.append($('<div/>').text(className).css({textAlign:'center',fontSize:'15px',color:'#666',lineHeight:'1.2'}));
    chart.append(titleBox);
    statOrder.forEach(function(stat) {
        var value = growth[stat];
        var classVal = classGrowth[stat];
        if (typeof value !== "number" || typeof classVal !== "number") return;
        var barWrapper = $("<div/>").css({ display: "flex", alignItems: "center", marginBottom: "8px" });
        var label = $("<span/>").text(tStat(stat)).addClass("stat-" + stat).css({ width: "48px", fontWeight: "bold", color: statColors[stat], fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "center", height: "18px" });
        var barBg = $("<div/>").css({ flex: 1, height: "18px", background: "#f0f0f0", borderRadius: "9px", margin: "0 10px", position: "relative", display: "flex", alignItems: "center" });
        // 角色成长条
        var bar = $("<div/>").css({
            width: Math.max(0, Math.min(100, value)) + "%",
            height: "100%",
            background: statColors[stat],
            borderRadius: "9px 0 0 9px",
            transition: "width 0.5s",
            minWidth: value > 0 ? "8px" : "0"
        });
        // class成长条
        var barClass = $("<div/>").css({
            width: Math.max(0, Math.min(100, classVal)) + "%",
            height: "100%",
            background: statLightColors[stat],
            borderRadius: "0 9px 9px 0",
            marginLeft: "-2px",
            opacity: 0.7,
            minWidth: classVal > 0 ? "8px" : "0"
        });
        // aptitude条
        var barApt = null;
        if (aptitude) {
            barApt = $("<div/>").css({
                width: aptitude + "%",
                height: "100%",
                background: aptitudeColor,
                borderRadius: "0 9px 9px 0",
                marginLeft: "-2px",
                opacity: 0.8,
                minWidth: "8px"
            });
        }
        // 右侧数值分两列
        var valText = $("<span/>").css({ display: "flex", minWidth: "90px", textAlign: "right", color: statColors[stat], fontWeight: "bold", fontSize: "14px", gap: "8px", justifyContent: "flex-end" });
        var charVal = $("<span/>").text(value + "%").css({ color: statColors[stat], minWidth: "38px", display: "inline-block" });
        var classValSpan = $("<span/>").text("+" + classVal + "%").css({ color: "#666", minWidth: "38px", display: "inline-block" });
        if (aptitude) {
            var aptVal = $("<span/>").html("+<span style='color:#666'>10%</span>").css({ color: "#888", minWidth: "32px", display: "inline-block" });
            valText.append(charVal, classValSpan, aptVal);
        } else {
            valText.append(charVal, classValSpan);
        }
        barBg.append(bar).append(barClass);
        if (barApt) barBg.append(barApt);
        barWrapper.append(label, barBg, valText);
        chart.append(barWrapper);
    });
    // 在renderGrowthBarChart末尾添加导出按钮
    var exportBtn = $("<button/>").attr("id", "export-growth-png").text(tUI('exportPNG')||'导出PNG').css({margin:'10px 0 0 0',float:'right'});
    exportBtn.on('click', function() {
        if (window.html2canvas) {
            var chartEl = $("#growth-bar-chart");
            var oldBg = chartEl.css('background');
            chartEl.css('background', 'transparent');
            // 获取当前角色和职业名
            var unit = $("#unit-select").val();
            var charName = unit && db.character[unit] ? tChar(db.character[unit].name) : '';
            var curClass = (calc.getLatestClassChange() ? calc.getLatestClassChange().targetClass : db.classes[db.character[unit].baseClass]);
            var className = curClass ? tClass(curClass.name) : '';
            var fileName = (charName + '_' + className + '_成长率.png').replace(/\s+/g, '_');
            html2canvas(chartEl[0], {backgroundColor: null}).then(function(canvas) {
                chartEl.css('background', oldBg);
                var link = document.createElement('a');
                link.download = fileName;
                link.href = canvas.toDataURL();
                link.click();
            });
        } else {
            alert('请先引入html2canvas库');
        }
    });
    // 先移除旧的chart和导出按钮
    $("#growth-bar-chart-wrapper").remove();
    $("#export-growth-png").parent().remove();
    // 渲染chart内容
    var chartWrapper = $("<div/>").attr("id", "growth-bar-chart-wrapper").css({display:'block'}).append(chart);
    $("#class-change-list").after(chartWrapper);
    // 按钮单独放在下方div，整体下移并居右
    var exportBtnWrapper = $("<div/>").css({width:'100%',textAlign:'right',margin:'36px 0 0 0'}).append(exportBtn);
    chartWrapper.after(exportBtnWrapper);
}
	
	function renderQuantileToggleUI() {
    // 插入在#table-div上方
    var toggleDiv = $("<div/>").attr("id", "quantile-toggle-ui").css({
        display: "flex", gap: "16px", alignItems: "center", margin: "10px 0 8px 0"
    });
    toggleDiv.append($('<span style="font-weight:bold;">' + tUI('showQuantile') + '：</span>'));
    var q50 = $('<label style="margin-right:10px;"><input type="checkbox" id="toggle-q50" checked> ' + tUI('quantile50') + '</label>');
    var q25 = $('<label style="margin-right:10px;"><input type="checkbox" id="toggle-q25"> ' + tUI('quantile25') + '</label>');
    var q75 = $('<label><input type="checkbox" id="toggle-q75"> ' + tUI('quantile75') + '</label>');
    toggleDiv.append(q50, q25, q75);
    $("#quantile-toggle-ui").remove();
    $("#table-div").before(toggleDiv);
}

function updateTable() {
    renderGrowthBarChart();
    var levelList = calc.compute();
    $("#table-div").empty();
    renderQuantileToggleUI();
    
    if (!levelList || !levelList.length || !levelList[0] || !levelList[0].length || 
        !levelList[0][0].stat || !levelList[0][0].statCap) {
        console.log("Invalid or missing data structure");
        return;
    }
    
    var tableContainer = $("<div/>").addClass("table-container");
    
    var quantiles = [
        { value: 0.75, label: tUI('quantile75')||"75%" },
        { value: 0.50, label: tUI('quantile50')||"50%" },
        { value: 0.25, label: tUI('quantile25')||"25%" }
    ];
    
    var statList = Object.keys(levelList[0][0].stat);
    
    if (!statList.length) {
        console.log("No stats found in data");
        return;
    }

    // Store the last level's adjusted values for each quantile
    var lastLevelValues = {};
    
    quantiles.forEach(function(quantile) {
        var tableWrapper = $("<div/>").addClass("table-wrapper quantile-table-wrapper").attr("data-quantile", quantile.value);
        if (quantile.value !== 0.5) tableWrapper.hide(); // 默认只显示50%
        var table = $("<table/>").addClass("table table-striped table-hover table-condensed stat-table");
        
        var headerRow = $("<tr/>");
        headerRow.append($("<th/>").text(tUI('level')||"Level"));
        statList.forEach(function(attr) {
            headerRow.append($("<th/>")
                .addClass("stat-" + attr)
                .text(tStat(attr)));
        });
        table.append($("<thead/>").append(headerRow));
        
        var tableBody = $("<tbody/>");
        for (var i = 0; i < levelList.length; i++) {
            if (!levelList[i] || !levelList[i].length || !levelList[i][0].unitClass) {
                continue;
            }
            
            var header = $("<tr/>").append($("<th/>")
                .text(tClass(levelList[i][0].unitClass.name))
                .attr("colspan", statList.length + 1));
            tableBody.append(header);
            
            var initialStats = {};
            var initialTier1Level = levelList[i][0].tier1Level;
            var initialTier2Level = levelList[i][0].tier2Level || 0;

            // For the first class, use base stats
            if (i === 0) {
                statList.forEach(function(attr) {
                    initialStats[attr] = levelList[i][0].stat[attr];
                });
            } else {
                // For subsequent classes, calculate new base stats
                var prevClassLastLevel = levelList[i-1][levelList[i-1].length - 1];
                var currentClassFirstLevel = levelList[i][0];
                
                statList.forEach(function(attr) {
                    // Get the last level's adjusted value from previous class
                    var prevValue = lastLevelValues[quantile.value][attr];
                    
                    // Calculate the difference between new class base and old class final
                    var baseChange = currentClassFirstLevel.stat[attr] - prevClassLastLevel.stat[attr];
                    
                    // Apply the same base change to the adjusted value
                    initialStats[attr] = prevValue + baseChange;
                });
            }
            
            // Reset lastLevelValues for this class
            lastLevelValues[quantile.value] = {};
            
            for (var j = 0; j < levelList[i].length; j++) {
                var currentLevel = levelList[i][j];
                if (!currentLevel || !currentLevel.stat || !currentLevel.statCap) {
                    continue;
                }
                
                var row = $("<tr/>");
                var displayLevel = currentLevel.tier2Level > 0 ? 
                    currentLevel.tier1Level + "/" + currentLevel.tier2Level :
                    currentLevel.tier1Level;
                row.append($("<td/>").text(displayLevel));
                
                var levelDelta = 
                    (currentLevel.tier1Level - initialTier1Level) +
                    (currentLevel.tier2Level - initialTier2Level);
                
                statList.forEach(function(attr) {
                    try {
                        var val = currentLevel.stat[attr];
                        var cap = currentLevel.statCap[attr];
                        var growthRate = currentLevel.growthRate ? currentLevel.growthRate[attr] / 100 : 0;
                        
                        var adjustedVal;
                        if (quantile.value === 0.5) {
                            adjustedVal = val;
                        } else {
                            var z = (quantile.value === 0.75) ? -0.6745 : 0.6745;
                            var stdDev = Math.sqrt(levelDelta * growthRate * (1 - growthRate));
                            adjustedVal = val + z * stdDev;
                        }
                        
                        // Use initialStats for the first level of each class
                        if (j === 0 && i > 0 && initialStats[attr] !== undefined) {
                            adjustedVal = initialStats[attr];
                        }
                        
                        // Clamp to [initial, cap]
                        adjustedVal = Math.max(Math.min(adjustedVal, cap), initialStats[attr] || adjustedVal);
                        
                        // Store the adjusted values for the last level
                        if (j === levelList[i].length - 1) {
                            lastLevelValues[quantile.value][attr] = adjustedVal;
                        }
                        
                        var cell = $("<td/>")
                            .addClass("stat-" + attr)
                            .text(formatNumber(adjustedVal));
                        
                        if (adjustedVal >= cap) {
                            cell.css('font-weight', 'bold');
                        }
                        
                        row.append(cell);
                    } catch (e) {
                        console.error("Error processing stat", attr, "at level", i, j, e);
                        row.append($("<td/>").addClass("stat-" + attr).text("-"));
                    }
                });
                tableBody.append(row);
            }
            
            var capRow = $("<tr/>");
            capRow.append($("<td/>").append($("<span/>").addClass("cap-td").text(tUI('cap')||"Cap")));
            statList.forEach(function(attr) {
                capRow.append($("<td/>")
                    .append($("<span/>").addClass("cap-td").text(formatNumber(levelList[i][0].statCap[attr])))
                    .addClass("stat-" + attr));
            });
            tableBody.append(capRow);
        }
        
        table.append(tableBody);
        tableWrapper.append($("<h4/>").text(quantile.label + " " + tUI('quantileTable'))).append(table);
        tableContainer.append(tableWrapper);
    });
    $("#table-div").append(tableContainer);
    
    // Add the heatmaps
    var heatmapContainer = createHeatmap(levelList);
    $("#table-div").append(heatmapContainer);
    
    // 绑定切换事件
    $("#toggle-q25").off("change").on("change", function() {
        if (this.checked) {
            $('.quantile-table-wrapper[data-quantile="0.25"]').show();
        } else {
            $('.quantile-table-wrapper[data-quantile="0.25"]').hide();
        }
    });
    $("#toggle-q75").off("change").on("change", function() {
        if (this.checked) {
            $('.quantile-table-wrapper[data-quantile="0.75"]').show();
        } else {
            $('.quantile-table-wrapper[data-quantile="0.75"]').hide();
        }
    });
    $("#toggle-q50").off("change").on("change", function() {
        if (this.checked) {
            $('.quantile-table-wrapper[data-quantile="0.5"]').show();
        } else {
            $('.quantile-table-wrapper[data-quantile="0.5"]').hide();
        }
    });
}
});

// 页面初始化加载默认中文
$(function() {
    loadLang(getPreferredLanguage(), function() {
        renderStaticUI();
        renderUnitSelect();
        renderInheritancePanel();
        updateTable();
    });
});

window.updateTable = updateTable;
window.renderStaticUI = renderStaticUI;
window.renderUnitSelect = renderUnitSelect;
window.renderInheritancePanel = renderInheritancePanel;
