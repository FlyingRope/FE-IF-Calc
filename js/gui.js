const ANIMATION_SPEED = 100;

var calc = new StatCalculator();

// 多语言支持
var langData = null;
var currentLang = 'zh-CN';

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

function renderStaticUI() {
    // index.html所有h4
    $("#container h4").each(function(){
        var txt = $(this).text().trim();
        if(txt==="Unit Selection") $(this).text(tUI('unitSelect'));
        if(txt==="Parent Selection") $(this).text(tUI('parentSelect'));
        if(txt==="Avatar Customization") $(this).text(tUI('avatarCustomization'));
        if(txt==="Class Change Options") $(this).text(tUI('classChangeOptions'));
    });
    // 角色选择label
    $("label[for='unit-select']").text(tUI('unitSelect'));
    // 基础、父母、祖父母
    $("#base-select").prev('h4').text(tUI('baseSelect'));
    $("#parent-select").prev('h4').text(tUI('parentSelect'));
    $("#grandparent-select").prev('h4').text(tUI('grandparentSelect'));
    // 额外选项
    $("#extra-select option").each(function(i, opt){
        if(i===0) $(opt).text(tUI('extraSelect'));
        else {
            var val = $(opt).val();
            if(val && !isNaN(val)) $(opt).text(val/5 + " (+" + val + " " + tUI('level') + ")");
        }
    });
    // aptitude
    $("#aptitude-check label, #aptitude-check span").text(tUI('aptitude'));
    // Avatar Customization部分Boon/Bane文本
    var avatarP = $("#avatar-custom > p");
    if (avatarP.length) {
        var html = avatarP.html();
        html = html.replace(/Boon(\s*)/g, tUI('boon')+" ");
        html = html.replace(/Bane(\s*)/g, tUI('bane')+" ");
        avatarP.html(html);
    }
    // 下拉默认项
    $("#boon-select").prev().contents().filter(function(){return this.nodeType===3;}).first().replaceWith(tUI('boon')+" ");
    $("#bane-select").prev().contents().filter(function(){return this.nodeType===3;}).first().replaceWith(tUI('bane')+" ");
    // 按钮
    $("#add-seal").text(tUI('addSeal'));
    $("#reset").text(tUI('reset'));
    // 下拉默认项
    $("#level-change-select option").first().text(tUI('levelSelect'));
    $("#class-change-select option").first().text(tUI('classSelect'));
    // 量表切换
    $("#quantile-toggle-ui span").text(tUI('showQuantile'));
    $("#quantile-toggle-ui label").each(function(i,el){
        if(i===0) $(el).find('span').text(tUI('quantile50')||'50%');
        if(i===1) $(el).find('span').text(tUI('quantile25')||'25%');
        if(i===2) $(el).find('span').text(tUI('quantile75')||'75%');
    });
    // 量表表头
    $(".table-wrapper h4").each(function(i,el){
        var txt = $(el).text();
        if(txt.indexOf('Quantile')>-1) {
            if(txt.indexOf('50')>-1) $(el).text(tUI('quantile50')+" " + tUI('quantileTable'));
            if(txt.indexOf('25')>-1) $(el).text(tUI('quantile25')+" " + tUI('quantileTable'));
            if(txt.indexOf('75')>-1) $(el).text(tUI('quantile75')+" " + tUI('quantileTable'));
        }
    });
    // 热力图提示
    $("#heatmap-info-panel .info-content").each(function(){
        var txt = $(this).text();
        if(txt.indexOf('将鼠标移到热力图上查看详细信息')>-1) $(this).text(tUI('heatmapTip'));
        if(txt.indexOf('值:')>-1) $(this).html(tUI('value')+": "+$(this).html().split(':')[1]);
        if(txt.indexOf('概率:')>-1) $(this).html(tUI('probability')+": "+$(this).html().split(':')[1]);
        if(txt.indexOf('达到或超过此值的概率:')>-1) $(this).html(tUI('cumProbability')+": "+$(this).html().split(':')[1]);
    });
    $("#boon-label").text(tUI('boon'));
    $("#bane-label").text(tUI('bane'));
}

// 在语言切换和初始化后调用
$(document).on('change', '#lang-select', function() {
    var lang = $(this).val();
    loadLang(lang, function() {
        renderStaticUI();
        updateTable();
        renderUnitSelect();
    });
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
        unitSelect.append($('<option>').text('---' + route + '---').prop('disabled', true));
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
    });
}
function renderParentSelect() {
    var parentSelect = $('#parent-select');
    parentSelect.find('option').each(function(i, opt) {
        if (i === 0) $(opt).text(tUI('parentSelect'));
    });
}
function renderGrandparentSelect() {
    var grandparentSelect = $('#grandparent-select');
    grandparentSelect.find('option').each(function(i, opt) {
        if (i === 0) $(opt).text(tUI('grandparentSelect'));
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

$(document).ready(function() {
	
	calc = new StatCalculator();
	db.character.kamui.initialize($("#boon-select").val(), $("#bane-select").val());
	for (var i=1; i<=20; i++)
		$("#extra-select").append($("<option>").val(i*5).text(i + " (+" + i*5 + " levels)"));
	$("#base-select").prop("disabled", true).empty().append($("<option/>").text("Select a base"));
	resetPanel();
	
	var unitList = {};
	for (var unit in db.character) {
		if (!unitList[db.character[unit].route])
			unitList[db.character[unit].route] = [];
		unitList[db.character[unit].route].push(unit);
	}
	
	for (var route in unitList) {
		var unitSelect = $("#unit-select");
		unitSelect.append($("<option>").text("---" + route + "---").prop("disabled", true));
		for (var i=0; i<unitList[route].length; i++)
			unitSelect.append($("<option>").val(unitList[route][i]).text(db.character[unitList[route][i]].name));
	}
	
	$("#boon-select").change(function() {
		$("option.bane").prop("disabled", false);
		$("select option.bane[value=" + this.value + "]").prop("disabled", true);
		db.character.kamui.initialize($("#boon-select").val(), $("#bane-select").val());
		updateTable();
	});
	
	$("#bane-select").change(function() {
		$("option.boon").prop("disabled", false);
		$("select option.boon[value=" + this.value + "]").prop("disabled", true);
		db.character.kamui.initialize($("#boon-select").val(), $("#bane-select").val());
		updateTable();
	});
	
	$("#extra-select").change(function() {
		calc.extraLevel = parseInt(this.value);
		calc.resetClassChange();
		updateLevelSelect();
		updateTable();
	});
	
	$("input[name=aptitude]").change(function() {
		calc.setAptitude($("input[name=aptitude]").prop("checked"));
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
				updateLevelSelect();
				updateTable();
			}else
				resetPanel();
		}else {
			$("#base-select").prop("disabled", true).empty().append($("<option/>").text("Select a base"));
			resetPanel();
		}
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
				updateLevelSelect();
				updateTable();
			}
		}
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
			updateLevelSelect();
			updateTable();
		}
	});
	
	$("#base-select").change(function() {
		$("#reset").attr("disabled", true);
		calc.baseSet = this.value;
		calc.resetClassChange();
		updateLevelSelect();
		updateTable();
	});
	
	$("#level-change-select").change(function() {
		$("#add-seal").attr("disabled", false);
		var classSelect = $("#class-change-select").prop("disabled", false).empty();
		var classSet = calc.getAvaiableClassChange(this.value);
		
		if (classSet.masterSeal) {
			classSelect.append($("<option/>").text("-----Master Seal-----").prop("disabled", true));
			for (var c in classSet.masterSeal)
				classSelect.append($("<option/>", {
					text	: tClass(db.classes[c].name),
					value	: c,
				}))
		}
		
		classSelect.append($("<option/>").text("-----Heart Seal-----").prop("disabled", true));
			for (var c in classSet.heartSeal)
				classSelect.append($("<option/>", {
					text	: tClass(db.classes[c].name),
					value	: c,
				}))
				
		classSelect.append($("<option/>").text("---Friendship/Partner Seal---").prop("disabled", true));
			for (var c in classSet.parallelSeal)
				classSelect.append($("<option/>", {
					text	: tClass(db.classes[c].name),
					value	: c,
				}))
				
		classSelect.append($("<option/>").text("-----Special Seal-----").prop("disabled", true));
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
		$("#level-change-select").prop("disabled", true).empty().append($("<option/>").text("Select a level"));
		$("#class-change-select").prop("disabled", true).empty().append($("<option/>").text("Select a class"));
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
				text	: baseList[i],
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
					${attr || ''} - Lv.${level} (${className})
				</div>
				<div class="info-content">
					<div>${tUI('value')||'值'}: ${value}</div>
					<div>${tUI('probability')||'概率'}: ${formatProbability(probability)}</div>
					<div>${tUI('cumProbability')||'达到或超过此值的概率'}: ${cumProb}</div>
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
				.text(tStat(attr) + " Growth Distribution")
				.addClass("stat-" + attr));
			
			var minVal = Infinity;
			var maxVal = 0;
			var maxLevel = 0;
			var initialLevel = levelList[0][0].displayedLevel;
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
						tier2: classChangeLevel.tier2Level || 0,
						classIndex: i  // 添加职业索引以区分同一等级的不同转职
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
					tier2: data.tier2Level,
					classIndex: data.classIndex
				});

				if (!processedLevels.has(levelKey)) {
					processedLevels.add(levelKey);
					var levelDataList = allLevelData.filter(d => 
						d.tier1Level === data.tier1Level && 
						d.tier2Level === data.tier2Level
					);

					if (levelDataList.length > 0) {
						// 检查是否是转职点
						var isClassChange = Array.from(classChangePoints).some(point => {
							var p = JSON.parse(point);
							return p.tier1 === data.tier1Level && 
								   p.tier2 === data.tier2Level && 
								   p.classIndex === data.classIndex;
						});

						if (isClassChange) {
							// 添加转职前的数据
							var prevClassData = levelDataList.find(d => d.classIndex === data.classIndex - 1);
							if (prevClassData) {
								rowData.push({
									tier1Level: prevClassData.tier1Level,
									tier2Level: prevClassData.tier2Level,
									className: prevClassData.className + " (pre)",
									data: prevClassData
								});
								totalRows++;
							}
							
							// 添加转职后的数据
							var nextClassData = levelDataList.find(d => d.classIndex === data.classIndex);
							if (nextClassData) {
								rowData.push({
									tier1Level: nextClassData.tier1Level,
									tier2Level: nextClassData.tier2Level,
									className: nextClassData.className + " (post)",
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
									className: currentData.className,
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
					var n = row.tier1Level - initialLevel;
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
    loadLang('zh-CN', function() {
        renderStaticUI();
        renderUnitSelect();
        updateTable();
    });
});

window.updateTable = updateTable;
window.renderStaticUI = renderStaticUI;
window.renderUnitSelect = renderUnitSelect;

