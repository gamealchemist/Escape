
// instrument by jscoverage, do not modifly this file
(function (file, lines, conds, source) {
  var BASE;
  if (typeof global === 'object') {
    BASE = global;
  } else if (typeof window === 'object') {
    BASE = window;
  } else {
    throw new Error('[jscoverage] unknow ENV!');
  }
  if (BASE._$jscoverage) {
    BASE._$jscmd(file, 'init', lines, conds, source);
    return;
  }
  var cov = {};
  /**
   * jsc(file, 'init', lines, condtions)
   * jsc(file, 'line', lineNum)
   * jsc(file, 'cond', lineNum, expr, start, offset)
   */
  function jscmd(file, type, line, express, start, offset) {
    var storage;
    switch (type) {
      case 'init':
        if(cov[file]){
          storage = cov[file];
        } else {
          storage = [];
          for (var i = 0; i < line.length; i ++) {
            storage[line[i]] = 0;
          }
          var condition = express;
          var source = start;
          storage.condition = condition;
          storage.source = source;
        }
        cov[file] = storage;
        break;
      case 'line':
        storage = cov[file];
        storage[line] ++;
        break;
      case 'cond':
        storage = cov[file];
        storage.condition[line] ++;
        return express;
    }
  }

  BASE._$jscoverage = cov;
  BASE._$jscmd = jscmd;
  jscmd(file, 'init', lines, conds, source);
})('index.js', [9,10,11,12,13,14,15,17,19,20,21,117,24,25,26,27,29,30,37,44,52,45,46,47,56,58,66,72,80,82,88,68,69,77,85,92,93,101,106,97,111,112,113,118,120,132,138,139,144,145,146,147,149,150,151,153,155,157,141,159,163,167,169], {"28_10_44":0,"28_10_19":0,"28_33_21":0,"52_9_8":0,"67_6_6":0,"76_6_17":0,"84_6_10":0,"96_8_77":0,"96_8_22":0,"96_34_51":0,"120_22_6":0,"120_32_2":0,"140_6_13":0,"141_85_13":0,"141_101_15":0,"144_50_13":0,"144_67_2":0,"145_51_14":0,"145_69_2":0,"146_52_15":0,"146_71_2":0,"155_54_19":0,"155_76_27":0,"158_8_13":0,"162_8_15":0}, ["/*"," * gulp-jsbeautifier"," * https://github.com/tarunc/gulp-jsbeautifier"," * Copyright (c) 2015 Tarun Chaudhry"," * Licensed under the MIT license."," */","","","var es = require('event-stream');","var ansidiff = require('ansidiff');","var prettify = require('js-beautify');","var gutil = require('gulp-util');","var _ = require('lodash');","var fs = require('fs');","var path = require('path');","","var stringUtils = require('underscore.string');","","var jsbeautifier = prettify.js;","var cssbeautifier = prettify.css;","var htmlbeautifier = prettify.html;","","function convertCamelCaseToUnderScore(config) {","  var underscoreKey;","  _.forEach([config.js, config.css, config.html], function(conf) {","    _.forEach(conf, function(value, key) {","      underscoreKey = stringUtils.underscored(key);","      if ('fileTypes' !== key && key !== underscoreKey) {","        conf[underscoreKey] = value;","        delete conf[key];","      }","    });","  });","}","","function getFileType(file, config) {","  var fileType = null,","      fileMapping = {","      'js': config.js.fileTypes,","      'css': config.css.fileTypes,","      'html': config.html.fileTypes","      };","","  _.forEach(fileMapping, function(extensions, type) {","    fileType = type;","    return -1 === _.findIndex(extensions, function(ext) {","      return stringUtils.endsWith(file.relative, ext);","    });","  });","","  // Default fileType is js","  return fileType || 'js';","}","","function getBeautifierSetup(file, config) {","  var fileType = getFileType(file, config);","","  return {","    js: [jsbeautifier, config.js, true],","    css: [cssbeautifier, config.css],","    html: [htmlbeautifier, config.html]","  }[fileType];","}","","function beautify(file, config, actionHandler) {","  var setup = getBeautifierSetup(file, config);","  if (!setup) {","    gutil.log('Cannot beautify ' + file.relative + ' (only js, css and html files can be beautified)');","    return;","  }","","  var beautifier = setup[0],","      beautifyConfig = setup[1],","      addNewLine = setup[2];","","  if (config.logSuccess) {","    gutil.log('Beautifying', file.relative);","  }","","  var original = file.contents.toString('utf8');","","  var result = beautifier(original, beautifyConfig);","  // jsbeautifier would skip the line terminator for js files","  if (addNewLine) {","    result += '\\n';","  }","","  return actionHandler(file, result);","}","","function verifyActionHandler(cb) {","  return function verifyOnly(file, result) {","    var fileContents = file.contents.toString('utf8');","","    /*jshint eqeqeq: false */","    if (fileContents == result || fileContents == result.substr(0, result.length - 1)) {","      return cb(null, file);","    }","","    // return cb(null, file);","    var errOpts = {","      message: 'Beautify failed for: ' + file.relative + '\\n\\n' + ansidiff.chars(fileContents, result),","      showStack: false","    };","","    return cb(new gutil.PluginError('gulp-jsbeautifier', errOpts, { showStack: false }), file);","  };","}","","function verifyAndWriteActionHandler(cb) {","  return function verifyAndWrite(file, result) {","    file.contents = new Buffer(result, 'utf8');","    return cb(null, file);","  };","}","","module.exports = function prettify(params) {","  'use strict';","","  params = _.defaults(params || {}, {","    mode: 'VERIFY_AND_WRITE',","    js: {},","    css: {},","    html: {},","    logSuccess: true,","    showStack: false","  });","","  // Try to get rcLoader working","  // var rcLoader = new RcFinder('.jsbeautifyrc', params.config);","","  var config = {","    js: {},","    css: {},","    html: {}","  };","","  var baseConfig = {};","  var baseConfigRoot = _.omit(params, 'js', 'css', 'html');","  if (params.config) {","    baseConfig = JSON.parse(fs.readFileSync(path.resolve(_.isString(params.config) ? params.config : '.jsbeautifyrc')));","  }","","  _.extend(config.js, baseConfigRoot, baseConfig, baseConfig.js || {}, params.js);","  _.extend(config.css, baseConfigRoot, baseConfig, baseConfig.css || {}, params.css);","  _.extend(config.html, baseConfigRoot, baseConfig, baseConfig.html || {}, params.html);","  _.extend(config, _.omit(params, 'js', 'css', 'html'));","","  config.js.fileTypes = _.union(config.js.fileTypes, ['.js', '.json']);","  config.css.fileTypes = _.union(config.css.fileTypes, ['.css']);","  config.html.fileTypes = _.union(config.html.fileTypes, ['.html']);","","  convertCamelCaseToUnderScore(config);","","  var actionHandler = 'VERIFY_ONLY' === config.mode ? verifyActionHandler : verifyAndWriteActionHandler;","","  return es.map(function(file, cb) {","    if (file.isNull()) {","      return cb(null, file); // pass along","    }","","    if (file.isStream()) {","      return cb(new gutil.PluginError('gulp-jsbeautifier', 'Streaming not supported'));","    }","","    try {","      return beautify(file, config, actionHandler(cb, params));","    } catch (err) {","      return cb(new gutil.PluginError('gulp-jsbeautifier', err, params));","    }","  });","};",""]);
/*
 * gulp-jsbeautifier
 * https://github.com/tarunc/gulp-jsbeautifier
 * Copyright (c) 2015 Tarun Chaudhry
 * Licensed under the MIT license.
 */
_$jscmd("index.js", "line", 9);

var es = require("event-stream");

_$jscmd("index.js", "line", 10);

var ansidiff = require("ansidiff");

_$jscmd("index.js", "line", 11);

var prettify = require("js-beautify");

_$jscmd("index.js", "line", 12);

var gutil = require("gulp-util");

_$jscmd("index.js", "line", 13);

var _ = require("lodash");

_$jscmd("index.js", "line", 14);

var fs = require("fs");

_$jscmd("index.js", "line", 15);

var path = require("path");

_$jscmd("index.js", "line", 17);

var stringUtils = require("underscore.string");

_$jscmd("index.js", "line", 19);

var jsbeautifier = prettify.js;

_$jscmd("index.js", "line", 20);

var cssbeautifier = prettify.css;

_$jscmd("index.js", "line", 21);

var htmlbeautifier = prettify.html;

function convertCamelCaseToUnderScore(config) {
    _$jscmd("index.js", "line", 24);
    var underscoreKey;
    _$jscmd("index.js", "line", 25);
    _.forEach([ config.js, config.css, config.html ], function(conf) {
        _$jscmd("index.js", "line", 26);
        _.forEach(conf, function(value, key) {
            _$jscmd("index.js", "line", 27);
            underscoreKey = stringUtils.underscored(key);
            if (_$jscmd("index.js", "cond", "28_10_44", _$jscmd("index.js", "cond", "28_10_19", "fileTypes" !== key) && _$jscmd("index.js", "cond", "28_33_21", key !== underscoreKey))) {
                _$jscmd("index.js", "line", 29);
                conf[underscoreKey] = value;
                _$jscmd("index.js", "line", 30);
                delete conf[key];
            }
        });
    });
}

function getFileType(file, config) {
    _$jscmd("index.js", "line", 37);
    var fileType = null, fileMapping = {
        js: config.js.fileTypes,
        css: config.css.fileTypes,
        html: config.html.fileTypes
    };
    _$jscmd("index.js", "line", 44);
    _.forEach(fileMapping, function(extensions, type) {
        _$jscmd("index.js", "line", 45);
        fileType = type;
        _$jscmd("index.js", "line", 46);
        return -1 === _.findIndex(extensions, function(ext) {
            _$jscmd("index.js", "line", 47);
            return stringUtils.endsWith(file.relative, ext);
        });
    });
    _$jscmd("index.js", "line", 52);
    // Default fileType is js
    return _$jscmd("index.js", "cond", "52_9_8", fileType) || "js";
}

function getBeautifierSetup(file, config) {
    _$jscmd("index.js", "line", 56);
    var fileType = getFileType(file, config);
    _$jscmd("index.js", "line", 58);
    return {
        js: [ jsbeautifier, config.js, true ],
        css: [ cssbeautifier, config.css ],
        html: [ htmlbeautifier, config.html ]
    }[fileType];
}

function beautify(file, config, actionHandler) {
    _$jscmd("index.js", "line", 66);
    var setup = getBeautifierSetup(file, config);
    if (_$jscmd("index.js", "cond", "67_6_6", !setup)) {
        _$jscmd("index.js", "line", 68);
        gutil.log("Cannot beautify " + file.relative + " (only js, css and html files can be beautified)");
        _$jscmd("index.js", "line", 69);
        return;
    }
    _$jscmd("index.js", "line", 72);
    var beautifier = setup[0], beautifyConfig = setup[1], addNewLine = setup[2];
    if (_$jscmd("index.js", "cond", "76_6_17", config.logSuccess)) {
        _$jscmd("index.js", "line", 77);
        gutil.log("Beautifying", file.relative);
    }
    _$jscmd("index.js", "line", 80);
    var original = file.contents.toString("utf8");
    _$jscmd("index.js", "line", 82);
    var result = beautifier(original, beautifyConfig);
    // jsbeautifier would skip the line terminator for js files
    if (_$jscmd("index.js", "cond", "84_6_10", addNewLine)) {
        _$jscmd("index.js", "line", 85);
        result += "\n";
    }
    _$jscmd("index.js", "line", 88);
    return actionHandler(file, result);
}

function verifyActionHandler(cb) {
    _$jscmd("index.js", "line", 92);
    return function verifyOnly(file, result) {
        _$jscmd("index.js", "line", 93);
        var fileContents = file.contents.toString("utf8");
        /*jshint eqeqeq: false */
        if (_$jscmd("index.js", "cond", "96_8_77", _$jscmd("index.js", "cond", "96_8_22", fileContents == result) || _$jscmd("index.js", "cond", "96_34_51", fileContents == result.substr(0, result.length - 1)))) {
            _$jscmd("index.js", "line", 97);
            return cb(null, file);
        }
        _$jscmd("index.js", "line", 101);
        // return cb(null, file);
        var errOpts = {
            message: "Beautify failed for: " + file.relative + "\n\n" + ansidiff.chars(fileContents, result),
            showStack: false
        };
        _$jscmd("index.js", "line", 106);
        return cb(new gutil.PluginError("gulp-jsbeautifier", errOpts, {
            showStack: false
        }), file);
    };
}

function verifyAndWriteActionHandler(cb) {
    _$jscmd("index.js", "line", 111);
    return function verifyAndWrite(file, result) {
        _$jscmd("index.js", "line", 112);
        file.contents = new Buffer(result, "utf8");
        _$jscmd("index.js", "line", 113);
        return cb(null, file);
    };
}

_$jscmd("index.js", "line", 117);

module.exports = function prettify(params) {
    _$jscmd("index.js", "line", 118);
    "use strict";
    _$jscmd("index.js", "line", 120);
    params = _.defaults(_$jscmd("index.js", "cond", "120_22_6", params) || _$jscmd("index.js", "cond", "120_32_2", {}), {
        mode: "VERIFY_AND_WRITE",
        js: {},
        css: {},
        html: {},
        logSuccess: true,
        showStack: false
    });
    _$jscmd("index.js", "line", 132);
    // Try to get rcLoader working
    // var rcLoader = new RcFinder('.jsbeautifyrc', params.config);
    var config = {
        js: {},
        css: {},
        html: {}
    };
    _$jscmd("index.js", "line", 138);
    var baseConfig = {};
    _$jscmd("index.js", "line", 139);
    var baseConfigRoot = _.omit(params, "js", "css", "html");
    if (_$jscmd("index.js", "cond", "140_6_13", params.config)) {
        _$jscmd("index.js", "line", 141);
        baseConfig = JSON.parse(fs.readFileSync(path.resolve(_.isString(params.config) ? _$jscmd("index.js", "cond", "141_85_13", params.config) : _$jscmd("index.js", "cond", "141_101_15", ".jsbeautifyrc"))));
    }
    _$jscmd("index.js", "line", 144);
    _.extend(config.js, baseConfigRoot, baseConfig, _$jscmd("index.js", "cond", "144_50_13", baseConfig.js) || _$jscmd("index.js", "cond", "144_67_2", {}), params.js);
    _$jscmd("index.js", "line", 145);
    _.extend(config.css, baseConfigRoot, baseConfig, _$jscmd("index.js", "cond", "145_51_14", baseConfig.css) || _$jscmd("index.js", "cond", "145_69_2", {}), params.css);
    _$jscmd("index.js", "line", 146);
    _.extend(config.html, baseConfigRoot, baseConfig, _$jscmd("index.js", "cond", "146_52_15", baseConfig.html) || _$jscmd("index.js", "cond", "146_71_2", {}), params.html);
    _$jscmd("index.js", "line", 147);
    _.extend(config, _.omit(params, "js", "css", "html"));
    _$jscmd("index.js", "line", 149);
    config.js.fileTypes = _.union(config.js.fileTypes, [ ".js", ".json" ]);
    _$jscmd("index.js", "line", 150);
    config.css.fileTypes = _.union(config.css.fileTypes, [ ".css" ]);
    _$jscmd("index.js", "line", 151);
    config.html.fileTypes = _.union(config.html.fileTypes, [ ".html" ]);
    _$jscmd("index.js", "line", 153);
    convertCamelCaseToUnderScore(config);
    _$jscmd("index.js", "line", 155);
    var actionHandler = "VERIFY_ONLY" === config.mode ? _$jscmd("index.js", "cond", "155_54_19", verifyActionHandler) : _$jscmd("index.js", "cond", "155_76_27", verifyAndWriteActionHandler);
    _$jscmd("index.js", "line", 157);
    return es.map(function(file, cb) {
        if (_$jscmd("index.js", "cond", "158_8_13", file.isNull())) {
            _$jscmd("index.js", "line", 159);
            return cb(null, file);
        }
        if (_$jscmd("index.js", "cond", "162_8_15", file.isStream())) {
            _$jscmd("index.js", "line", 163);
            return cb(new gutil.PluginError("gulp-jsbeautifier", "Streaming not supported"));
        }
        try {
            _$jscmd("index.js", "line", 167);
            return beautify(file, config, actionHandler(cb, params));
        } catch (err) {
            _$jscmd("index.js", "line", 169);
            return cb(new gutil.PluginError("gulp-jsbeautifier", err, params));
        }
    });
};