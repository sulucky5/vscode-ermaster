"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/fast-xml-parser/src/util.js
var require_util = __commonJS({
  "node_modules/fast-xml-parser/src/util.js"(exports2) {
    "use strict";
    var nameStartChar = ":A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
    var nameChar = nameStartChar + "\\-.\\d\\u00B7\\u0300-\\u036F\\u203F-\\u2040";
    var nameRegexp = "[" + nameStartChar + "][" + nameChar + "]*";
    var regexName = new RegExp("^" + nameRegexp + "$");
    var getAllMatches = function(string, regex) {
      const matches = [];
      let match = regex.exec(string);
      while (match) {
        const allmatches = [];
        allmatches.startIndex = regex.lastIndex - match[0].length;
        const len = match.length;
        for (let index = 0; index < len; index++) {
          allmatches.push(match[index]);
        }
        matches.push(allmatches);
        match = regex.exec(string);
      }
      return matches;
    };
    var isName = function(string) {
      const match = regexName.exec(string);
      return !(match === null || typeof match === "undefined");
    };
    exports2.isExist = function(v) {
      return typeof v !== "undefined";
    };
    exports2.isEmptyObject = function(obj) {
      return Object.keys(obj).length === 0;
    };
    exports2.merge = function(target, a, arrayMode) {
      if (a) {
        const keys = Object.keys(a);
        const len = keys.length;
        for (let i = 0; i < len; i++) {
          if (arrayMode === "strict") {
            target[keys[i]] = [a[keys[i]]];
          } else {
            target[keys[i]] = a[keys[i]];
          }
        }
      }
    };
    exports2.getValue = function(v) {
      if (exports2.isExist(v)) {
        return v;
      } else {
        return "";
      }
    };
    var DANGEROUS_PROPERTY_NAMES = [
      // '__proto__',
      // 'constructor',
      // 'prototype',
      "hasOwnProperty",
      "toString",
      "valueOf",
      "__defineGetter__",
      "__defineSetter__",
      "__lookupGetter__",
      "__lookupSetter__"
    ];
    var criticalProperties = ["__proto__", "constructor", "prototype"];
    exports2.isName = isName;
    exports2.getAllMatches = getAllMatches;
    exports2.nameRegexp = nameRegexp;
    exports2.DANGEROUS_PROPERTY_NAMES = DANGEROUS_PROPERTY_NAMES;
    exports2.criticalProperties = criticalProperties;
  }
});

// node_modules/fast-xml-parser/src/validator.js
var require_validator = __commonJS({
  "node_modules/fast-xml-parser/src/validator.js"(exports2) {
    "use strict";
    var util = require_util();
    var defaultOptions = {
      allowBooleanAttributes: false,
      //A tag can have attributes without any value
      unpairedTags: []
    };
    exports2.validate = function(xmlData, options) {
      options = Object.assign({}, defaultOptions, options);
      const tags = [];
      let tagFound = false;
      let reachedRoot = false;
      if (xmlData[0] === "\uFEFF") {
        xmlData = xmlData.substr(1);
      }
      for (let i = 0; i < xmlData.length; i++) {
        if (xmlData[i] === "<" && xmlData[i + 1] === "?") {
          i += 2;
          i = readPI(xmlData, i);
          if (i.err)
            return i;
        } else if (xmlData[i] === "<") {
          let tagStartPos = i;
          i++;
          if (xmlData[i] === "!") {
            i = readCommentAndCDATA(xmlData, i);
            continue;
          } else {
            let closingTag = false;
            if (xmlData[i] === "/") {
              closingTag = true;
              i++;
            }
            let tagName = "";
            for (; i < xmlData.length && xmlData[i] !== ">" && xmlData[i] !== " " && xmlData[i] !== "	" && xmlData[i] !== "\n" && xmlData[i] !== "\r"; i++) {
              tagName += xmlData[i];
            }
            tagName = tagName.trim();
            if (tagName[tagName.length - 1] === "/") {
              tagName = tagName.substring(0, tagName.length - 1);
              i--;
            }
            if (!validateTagName(tagName)) {
              let msg;
              if (tagName.trim().length === 0) {
                msg = "Invalid space after '<'.";
              } else {
                msg = "Tag '" + tagName + "' is an invalid name.";
              }
              return getErrorObject("InvalidTag", msg, getLineNumberForPosition(xmlData, i));
            }
            const result = readAttributeStr(xmlData, i);
            if (result === false) {
              return getErrorObject("InvalidAttr", "Attributes for '" + tagName + "' have open quote.", getLineNumberForPosition(xmlData, i));
            }
            let attrStr = result.value;
            i = result.index;
            if (attrStr[attrStr.length - 1] === "/") {
              const attrStrStart = i - attrStr.length;
              attrStr = attrStr.substring(0, attrStr.length - 1);
              const isValid = validateAttributeString(attrStr, options);
              if (isValid === true) {
                tagFound = true;
              } else {
                return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, attrStrStart + isValid.err.line));
              }
            } else if (closingTag) {
              if (!result.tagClosed) {
                return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' doesn't have proper closing.", getLineNumberForPosition(xmlData, i));
              } else if (attrStr.trim().length > 0) {
                return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' can't have attributes or invalid starting.", getLineNumberForPosition(xmlData, tagStartPos));
              } else if (tags.length === 0) {
                return getErrorObject("InvalidTag", "Closing tag '" + tagName + "' has not been opened.", getLineNumberForPosition(xmlData, tagStartPos));
              } else {
                const otg = tags.pop();
                if (tagName !== otg.tagName) {
                  let openPos = getLineNumberForPosition(xmlData, otg.tagStartPos);
                  return getErrorObject(
                    "InvalidTag",
                    "Expected closing tag '" + otg.tagName + "' (opened in line " + openPos.line + ", col " + openPos.col + ") instead of closing tag '" + tagName + "'.",
                    getLineNumberForPosition(xmlData, tagStartPos)
                  );
                }
                if (tags.length == 0) {
                  reachedRoot = true;
                }
              }
            } else {
              const isValid = validateAttributeString(attrStr, options);
              if (isValid !== true) {
                return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, i - attrStr.length + isValid.err.line));
              }
              if (reachedRoot === true) {
                return getErrorObject("InvalidXml", "Multiple possible root nodes found.", getLineNumberForPosition(xmlData, i));
              } else if (options.unpairedTags.indexOf(tagName) !== -1) {
              } else {
                tags.push({ tagName, tagStartPos });
              }
              tagFound = true;
            }
            for (i++; i < xmlData.length; i++) {
              if (xmlData[i] === "<") {
                if (xmlData[i + 1] === "!") {
                  i++;
                  i = readCommentAndCDATA(xmlData, i);
                  continue;
                } else if (xmlData[i + 1] === "?") {
                  i = readPI(xmlData, ++i);
                  if (i.err)
                    return i;
                } else {
                  break;
                }
              } else if (xmlData[i] === "&") {
                const afterAmp = validateAmpersand(xmlData, i);
                if (afterAmp == -1)
                  return getErrorObject("InvalidChar", "char '&' is not expected.", getLineNumberForPosition(xmlData, i));
                i = afterAmp;
              } else {
                if (reachedRoot === true && !isWhiteSpace(xmlData[i])) {
                  return getErrorObject("InvalidXml", "Extra text at the end", getLineNumberForPosition(xmlData, i));
                }
              }
            }
            if (xmlData[i] === "<") {
              i--;
            }
          }
        } else {
          if (isWhiteSpace(xmlData[i])) {
            continue;
          }
          return getErrorObject("InvalidChar", "char '" + xmlData[i] + "' is not expected.", getLineNumberForPosition(xmlData, i));
        }
      }
      if (!tagFound) {
        return getErrorObject("InvalidXml", "Start tag expected.", 1);
      } else if (tags.length == 1) {
        return getErrorObject("InvalidTag", "Unclosed tag '" + tags[0].tagName + "'.", getLineNumberForPosition(xmlData, tags[0].tagStartPos));
      } else if (tags.length > 0) {
        return getErrorObject("InvalidXml", "Invalid '" + JSON.stringify(tags.map((t) => t.tagName), null, 4).replace(/\r?\n/g, "") + "' found.", { line: 1, col: 1 });
      }
      return true;
    };
    function isWhiteSpace(char) {
      return char === " " || char === "	" || char === "\n" || char === "\r";
    }
    function readPI(xmlData, i) {
      const start = i;
      for (; i < xmlData.length; i++) {
        if (xmlData[i] == "?" || xmlData[i] == " ") {
          const tagname = xmlData.substr(start, i - start);
          if (i > 5 && tagname === "xml") {
            return getErrorObject("InvalidXml", "XML declaration allowed only at the start of the document.", getLineNumberForPosition(xmlData, i));
          } else if (xmlData[i] == "?" && xmlData[i + 1] == ">") {
            i++;
            break;
          } else {
            continue;
          }
        }
      }
      return i;
    }
    function readCommentAndCDATA(xmlData, i) {
      if (xmlData.length > i + 5 && xmlData[i + 1] === "-" && xmlData[i + 2] === "-") {
        for (i += 3; i < xmlData.length; i++) {
          if (xmlData[i] === "-" && xmlData[i + 1] === "-" && xmlData[i + 2] === ">") {
            i += 2;
            break;
          }
        }
      } else if (xmlData.length > i + 8 && xmlData[i + 1] === "D" && xmlData[i + 2] === "O" && xmlData[i + 3] === "C" && xmlData[i + 4] === "T" && xmlData[i + 5] === "Y" && xmlData[i + 6] === "P" && xmlData[i + 7] === "E") {
        let angleBracketsCount = 1;
        for (i += 8; i < xmlData.length; i++) {
          if (xmlData[i] === "<") {
            angleBracketsCount++;
          } else if (xmlData[i] === ">") {
            angleBracketsCount--;
            if (angleBracketsCount === 0) {
              break;
            }
          }
        }
      } else if (xmlData.length > i + 9 && xmlData[i + 1] === "[" && xmlData[i + 2] === "C" && xmlData[i + 3] === "D" && xmlData[i + 4] === "A" && xmlData[i + 5] === "T" && xmlData[i + 6] === "A" && xmlData[i + 7] === "[") {
        for (i += 8; i < xmlData.length; i++) {
          if (xmlData[i] === "]" && xmlData[i + 1] === "]" && xmlData[i + 2] === ">") {
            i += 2;
            break;
          }
        }
      }
      return i;
    }
    var doubleQuote = '"';
    var singleQuote = "'";
    function readAttributeStr(xmlData, i) {
      let attrStr = "";
      let startChar = "";
      let tagClosed = false;
      for (; i < xmlData.length; i++) {
        if (xmlData[i] === doubleQuote || xmlData[i] === singleQuote) {
          if (startChar === "") {
            startChar = xmlData[i];
          } else if (startChar !== xmlData[i]) {
          } else {
            startChar = "";
          }
        } else if (xmlData[i] === ">") {
          if (startChar === "") {
            tagClosed = true;
            break;
          }
        }
        attrStr += xmlData[i];
      }
      if (startChar !== "") {
        return false;
      }
      return {
        value: attrStr,
        index: i,
        tagClosed
      };
    }
    var validAttrStrRegxp = new RegExp(`(\\s*)([^\\s=]+)(\\s*=)?(\\s*(['"])(([\\s\\S])*?)\\5)?`, "g");
    function validateAttributeString(attrStr, options) {
      const matches = util.getAllMatches(attrStr, validAttrStrRegxp);
      const attrNames = {};
      for (let i = 0; i < matches.length; i++) {
        if (matches[i][1].length === 0) {
          return getErrorObject("InvalidAttr", "Attribute '" + matches[i][2] + "' has no space in starting.", getPositionFromMatch(matches[i]));
        } else if (matches[i][3] !== void 0 && matches[i][4] === void 0) {
          return getErrorObject("InvalidAttr", "Attribute '" + matches[i][2] + "' is without value.", getPositionFromMatch(matches[i]));
        } else if (matches[i][3] === void 0 && !options.allowBooleanAttributes) {
          return getErrorObject("InvalidAttr", "boolean attribute '" + matches[i][2] + "' is not allowed.", getPositionFromMatch(matches[i]));
        }
        const attrName = matches[i][2];
        if (!validateAttrName(attrName)) {
          return getErrorObject("InvalidAttr", "Attribute '" + attrName + "' is an invalid name.", getPositionFromMatch(matches[i]));
        }
        if (!attrNames.hasOwnProperty(attrName)) {
          attrNames[attrName] = 1;
        } else {
          return getErrorObject("InvalidAttr", "Attribute '" + attrName + "' is repeated.", getPositionFromMatch(matches[i]));
        }
      }
      return true;
    }
    function validateNumberAmpersand(xmlData, i) {
      let re = /\d/;
      if (xmlData[i] === "x") {
        i++;
        re = /[\da-fA-F]/;
      }
      for (; i < xmlData.length; i++) {
        if (xmlData[i] === ";")
          return i;
        if (!xmlData[i].match(re))
          break;
      }
      return -1;
    }
    function validateAmpersand(xmlData, i) {
      i++;
      if (xmlData[i] === ";")
        return -1;
      if (xmlData[i] === "#") {
        i++;
        return validateNumberAmpersand(xmlData, i);
      }
      let count = 0;
      for (; i < xmlData.length; i++, count++) {
        if (xmlData[i].match(/\w/) && count < 20)
          continue;
        if (xmlData[i] === ";")
          break;
        return -1;
      }
      return i;
    }
    function getErrorObject(code, message, lineNumber) {
      return {
        err: {
          code,
          msg: message,
          line: lineNumber.line || lineNumber,
          col: lineNumber.col
        }
      };
    }
    function validateAttrName(attrName) {
      return util.isName(attrName);
    }
    function validateTagName(tagname) {
      return util.isName(tagname);
    }
    function getLineNumberForPosition(xmlData, index) {
      const lines = xmlData.substring(0, index).split(/\r?\n/);
      return {
        line: lines.length,
        // column number is last line's length + 1, because column numbering starts at 1:
        col: lines[lines.length - 1].length + 1
      };
    }
    function getPositionFromMatch(match) {
      return match.startIndex + match[1].length;
    }
  }
});

// node_modules/fast-xml-parser/src/xmlparser/OptionsBuilder.js
var require_OptionsBuilder = __commonJS({
  "node_modules/fast-xml-parser/src/xmlparser/OptionsBuilder.js"(exports2) {
    var { DANGEROUS_PROPERTY_NAMES, criticalProperties } = require_util();
    var defaultOnDangerousProperty = (name) => {
      if (DANGEROUS_PROPERTY_NAMES.includes(name)) {
        return "__" + name;
      }
      return name;
    };
    var defaultOptions = {
      preserveOrder: false,
      attributeNamePrefix: "@_",
      attributesGroupName: false,
      textNodeName: "#text",
      ignoreAttributes: true,
      removeNSPrefix: false,
      // remove NS from tag name or attribute name if true
      allowBooleanAttributes: false,
      //a tag can have attributes without any value
      //ignoreRootElement : false,
      parseTagValue: true,
      parseAttributeValue: false,
      trimValues: true,
      //Trim string values of tag and attributes
      cdataPropName: false,
      numberParseOptions: {
        hex: true,
        leadingZeros: true,
        eNotation: true
      },
      tagValueProcessor: function(tagName, val) {
        return val;
      },
      attributeValueProcessor: function(attrName, val) {
        return val;
      },
      stopNodes: [],
      //nested tags will not be parsed even for errors
      alwaysCreateTextNode: false,
      isArray: () => false,
      commentPropName: false,
      unpairedTags: [],
      processEntities: true,
      htmlEntities: false,
      ignoreDeclaration: false,
      ignorePiTags: false,
      transformTagName: false,
      transformAttributeName: false,
      updateTag: function(tagName, jPath, attrs) {
        return tagName;
      },
      // skipEmptyListItem: false
      captureMetaData: false,
      maxNestedTags: 100,
      strictReservedNames: true,
      onDangerousProperty: defaultOnDangerousProperty
    };
    function validatePropertyName(propertyName, optionName) {
      if (typeof propertyName !== "string") {
        return;
      }
      const normalized = propertyName.toLowerCase();
      if (DANGEROUS_PROPERTY_NAMES.some((dangerous) => normalized === dangerous.toLowerCase())) {
        throw new Error(
          `[SECURITY] Invalid ${optionName}: "${propertyName}" is a reserved JavaScript keyword that could cause prototype pollution`
        );
      }
      if (criticalProperties.some((dangerous) => normalized === dangerous.toLowerCase())) {
        throw new Error(
          `[SECURITY] Invalid ${optionName}: "${propertyName}" is a reserved JavaScript keyword that could cause prototype pollution`
        );
      }
    }
    function normalizeProcessEntities(value) {
      if (typeof value === "boolean") {
        return {
          enabled: value,
          // true or false
          maxEntitySize: 1e4,
          maxExpansionDepth: 10,
          maxTotalExpansions: 1e3,
          maxExpandedLength: 1e5,
          allowedTags: null,
          tagFilter: null
        };
      }
      if (typeof value === "object" && value !== null) {
        return {
          enabled: value.enabled !== false,
          maxEntitySize: Math.max(1, value.maxEntitySize ?? 1e4),
          maxExpansionDepth: Math.max(1, value.maxExpansionDepth ?? 1e4),
          maxTotalExpansions: Math.max(1, value.maxTotalExpansions ?? Infinity),
          maxExpandedLength: Math.max(1, value.maxExpandedLength ?? 1e5),
          maxEntityCount: Math.max(1, value.maxEntityCount ?? 1e3),
          allowedTags: value.allowedTags ?? null,
          tagFilter: value.tagFilter ?? null
        };
      }
      return normalizeProcessEntities(true);
    }
    var buildOptions = function(options) {
      const built = Object.assign({}, defaultOptions, options);
      const propertyNameOptions = [
        { value: built.attributeNamePrefix, name: "attributeNamePrefix" },
        { value: built.attributesGroupName, name: "attributesGroupName" },
        { value: built.textNodeName, name: "textNodeName" },
        { value: built.cdataPropName, name: "cdataPropName" },
        { value: built.commentPropName, name: "commentPropName" }
      ];
      for (const { value, name } of propertyNameOptions) {
        if (value) {
          validatePropertyName(value, name);
        }
      }
      if (built.onDangerousProperty === null) {
        built.onDangerousProperty = defaultOnDangerousProperty;
      }
      built.processEntities = normalizeProcessEntities(built.processEntities);
      return built;
    };
    exports2.buildOptions = buildOptions;
    exports2.defaultOptions = defaultOptions;
  }
});

// node_modules/fast-xml-parser/src/xmlparser/xmlNode.js
var require_xmlNode = __commonJS({
  "node_modules/fast-xml-parser/src/xmlparser/xmlNode.js"(exports2, module2) {
    "use strict";
    var XmlNode = class {
      constructor(tagname) {
        this.tagname = tagname;
        this.child = [];
        this[":@"] = {};
      }
      add(key, val) {
        if (key === "__proto__")
          key = "#__proto__";
        this.child.push({ [key]: val });
      }
      addChild(node) {
        if (node.tagname === "__proto__")
          node.tagname = "#__proto__";
        if (node[":@"] && Object.keys(node[":@"]).length > 0) {
          this.child.push({ [node.tagname]: node.child, [":@"]: node[":@"] });
        } else {
          this.child.push({ [node.tagname]: node.child });
        }
      }
    };
    module2.exports = XmlNode;
  }
});

// node_modules/fast-xml-parser/src/xmlparser/DocTypeReader.js
var require_DocTypeReader = __commonJS({
  "node_modules/fast-xml-parser/src/xmlparser/DocTypeReader.js"(exports2, module2) {
    var util = require_util();
    var DocTypeReader = class {
      constructor(options) {
        this.suppressValidationErr = !options;
        this.options = options || {};
      }
      readDocType(xmlData, i) {
        const entities = /* @__PURE__ */ Object.create(null);
        let entityCount = 0;
        if (xmlData[i + 3] === "O" && xmlData[i + 4] === "C" && xmlData[i + 5] === "T" && xmlData[i + 6] === "Y" && xmlData[i + 7] === "P" && xmlData[i + 8] === "E") {
          i = i + 9;
          let angleBracketsCount = 1;
          let hasBody = false, comment = false;
          let exp = "";
          for (; i < xmlData.length; i++) {
            if (xmlData[i] === "<" && !comment) {
              if (hasBody && hasSeq(xmlData, "!ENTITY", i)) {
                i += 7;
                let entityName, val;
                [entityName, val, i] = this.readEntityExp(xmlData, i + 1, this.suppressValidationErr);
                if (val.indexOf("&") === -1) {
                  if (this.options.enabled !== false && this.options.maxEntityCount != null && entityCount >= this.options.maxEntityCount) {
                    throw new Error(
                      `Entity count (${entityCount + 1}) exceeds maximum allowed (${this.options.maxEntityCount})`
                    );
                  }
                  const escaped = entityName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                  entities[entityName] = {
                    regx: RegExp(`&${escaped};`, "g"),
                    val
                  };
                  entityCount++;
                }
              } else if (hasBody && hasSeq(xmlData, "!ELEMENT", i)) {
                i += 8;
                const { index } = this.readElementExp(xmlData, i + 1);
                i = index;
              } else if (hasBody && hasSeq(xmlData, "!ATTLIST", i)) {
                i += 8;
              } else if (hasBody && hasSeq(xmlData, "!NOTATION", i)) {
                i += 9;
                const { index } = this.readNotationExp(xmlData, i + 1, this.suppressValidationErr);
                i = index;
              } else if (hasSeq(xmlData, "!--", i)) {
                comment = true;
              } else {
                throw new Error(`Invalid DOCTYPE`);
              }
              angleBracketsCount++;
              exp = "";
            } else if (xmlData[i] === ">") {
              if (comment) {
                if (xmlData[i - 1] === "-" && xmlData[i - 2] === "-") {
                  comment = false;
                  angleBracketsCount--;
                }
              } else {
                angleBracketsCount--;
              }
              if (angleBracketsCount === 0) {
                break;
              }
            } else if (xmlData[i] === "[") {
              hasBody = true;
            } else {
              exp += xmlData[i];
            }
          }
          if (angleBracketsCount !== 0) {
            throw new Error(`Unclosed DOCTYPE`);
          }
        } else {
          throw new Error(`Invalid Tag instead of DOCTYPE`);
        }
        return { entities, i };
      }
      readEntityExp(xmlData, i) {
        i = skipWhitespace(xmlData, i);
        let entityName = "";
        while (i < xmlData.length && !/\s/.test(xmlData[i]) && xmlData[i] !== '"' && xmlData[i] !== "'") {
          entityName += xmlData[i];
          i++;
        }
        validateEntityName(entityName);
        i = skipWhitespace(xmlData, i);
        if (!this.suppressValidationErr) {
          if (xmlData.substring(i, i + 6).toUpperCase() === "SYSTEM") {
            throw new Error("External entities are not supported");
          } else if (xmlData[i] === "%") {
            throw new Error("Parameter entities are not supported");
          }
        }
        let entityValue = "";
        [i, entityValue] = this.readIdentifierVal(xmlData, i, "entity");
        if (this.options.enabled !== false && this.options.maxEntitySize != null && entityValue.length > this.options.maxEntitySize) {
          throw new Error(
            `Entity "${entityName}" size (${entityValue.length}) exceeds maximum allowed size (${this.options.maxEntitySize})`
          );
        }
        i--;
        return [entityName, entityValue, i];
      }
      readNotationExp(xmlData, i) {
        i = skipWhitespace(xmlData, i);
        let notationName = "";
        while (i < xmlData.length && !/\s/.test(xmlData[i])) {
          notationName += xmlData[i];
          i++;
        }
        !this.suppressValidationErr && validateEntityName(notationName);
        i = skipWhitespace(xmlData, i);
        const identifierType = xmlData.substring(i, i + 6).toUpperCase();
        if (!this.suppressValidationErr && identifierType !== "SYSTEM" && identifierType !== "PUBLIC") {
          throw new Error(`Expected SYSTEM or PUBLIC, found "${identifierType}"`);
        }
        i += identifierType.length;
        i = skipWhitespace(xmlData, i);
        let publicIdentifier = null;
        let systemIdentifier = null;
        if (identifierType === "PUBLIC") {
          [i, publicIdentifier] = this.readIdentifierVal(xmlData, i, "publicIdentifier");
          i = skipWhitespace(xmlData, i);
          if (xmlData[i] === '"' || xmlData[i] === "'") {
            [i, systemIdentifier] = this.readIdentifierVal(xmlData, i, "systemIdentifier");
          }
        } else if (identifierType === "SYSTEM") {
          [i, systemIdentifier] = this.readIdentifierVal(xmlData, i, "systemIdentifier");
          if (!this.suppressValidationErr && !systemIdentifier) {
            throw new Error("Missing mandatory system identifier for SYSTEM notation");
          }
        }
        return { notationName, publicIdentifier, systemIdentifier, index: --i };
      }
      readIdentifierVal(xmlData, i, type) {
        let identifierVal = "";
        const startChar = xmlData[i];
        if (startChar !== '"' && startChar !== "'") {
          throw new Error(`Expected quoted string, found "${startChar}"`);
        }
        i++;
        while (i < xmlData.length && xmlData[i] !== startChar) {
          identifierVal += xmlData[i];
          i++;
        }
        if (xmlData[i] !== startChar) {
          throw new Error(`Unterminated ${type} value`);
        }
        i++;
        return [i, identifierVal];
      }
      readElementExp(xmlData, i) {
        i = skipWhitespace(xmlData, i);
        let elementName = "";
        while (i < xmlData.length && !/\s/.test(xmlData[i])) {
          elementName += xmlData[i];
          i++;
        }
        if (!this.suppressValidationErr && !util.isName(elementName)) {
          throw new Error(`Invalid element name: "${elementName}"`);
        }
        i = skipWhitespace(xmlData, i);
        let contentModel = "";
        if (xmlData[i] === "E" && hasSeq(xmlData, "MPTY", i)) {
          i += 4;
        } else if (xmlData[i] === "A" && hasSeq(xmlData, "NY", i)) {
          i += 2;
        } else if (xmlData[i] === "(") {
          i++;
          while (i < xmlData.length && xmlData[i] !== ")") {
            contentModel += xmlData[i];
            i++;
          }
          if (xmlData[i] !== ")") {
            throw new Error("Unterminated content model");
          }
        } else if (!this.suppressValidationErr) {
          throw new Error(`Invalid Element Expression, found "${xmlData[i]}"`);
        }
        return {
          elementName,
          contentModel: contentModel.trim(),
          index: i
        };
      }
      readAttlistExp(xmlData, i) {
        i = skipWhitespace(xmlData, i);
        let elementName = "";
        while (i < xmlData.length && !/\s/.test(xmlData[i])) {
          elementName += xmlData[i];
          i++;
        }
        validateEntityName(elementName);
        i = skipWhitespace(xmlData, i);
        let attributeName = "";
        while (i < xmlData.length && !/\s/.test(xmlData[i])) {
          attributeName += xmlData[i];
          i++;
        }
        if (!validateEntityName(attributeName)) {
          throw new Error(`Invalid attribute name: "${attributeName}"`);
        }
        i = skipWhitespace(xmlData, i);
        let attributeType = "";
        if (xmlData.substring(i, i + 8).toUpperCase() === "NOTATION") {
          attributeType = "NOTATION";
          i += 8;
          i = skipWhitespace(xmlData, i);
          if (xmlData[i] !== "(") {
            throw new Error(`Expected '(', found "${xmlData[i]}"`);
          }
          i++;
          let allowedNotations = [];
          while (i < xmlData.length && xmlData[i] !== ")") {
            let notation = "";
            while (i < xmlData.length && xmlData[i] !== "|" && xmlData[i] !== ")") {
              notation += xmlData[i];
              i++;
            }
            notation = notation.trim();
            if (!validateEntityName(notation)) {
              throw new Error(`Invalid notation name: "${notation}"`);
            }
            allowedNotations.push(notation);
            if (xmlData[i] === "|") {
              i++;
              i = skipWhitespace(xmlData, i);
            }
          }
          if (xmlData[i] !== ")") {
            throw new Error("Unterminated list of notations");
          }
          i++;
          attributeType += " (" + allowedNotations.join("|") + ")";
        } else {
          while (i < xmlData.length && !/\s/.test(xmlData[i])) {
            attributeType += xmlData[i];
            i++;
          }
          const validTypes = ["CDATA", "ID", "IDREF", "IDREFS", "ENTITY", "ENTITIES", "NMTOKEN", "NMTOKENS"];
          if (!this.suppressValidationErr && !validTypes.includes(attributeType.toUpperCase())) {
            throw new Error(`Invalid attribute type: "${attributeType}"`);
          }
        }
        i = skipWhitespace(xmlData, i);
        let defaultValue = "";
        if (xmlData.substring(i, i + 8).toUpperCase() === "#REQUIRED") {
          defaultValue = "#REQUIRED";
          i += 8;
        } else if (xmlData.substring(i, i + 7).toUpperCase() === "#IMPLIED") {
          defaultValue = "#IMPLIED";
          i += 7;
        } else {
          [i, defaultValue] = this.readIdentifierVal(xmlData, i, "ATTLIST");
        }
        return {
          elementName,
          attributeName,
          attributeType,
          defaultValue,
          index: i
        };
      }
    };
    var skipWhitespace = (data, index) => {
      while (index < data.length && /\s/.test(data[index])) {
        index++;
      }
      return index;
    };
    function hasSeq(data, seq, i) {
      for (let j = 0; j < seq.length; j++) {
        if (seq[j] !== data[i + j + 1])
          return false;
      }
      return true;
    }
    function validateEntityName(name) {
      if (util.isName(name))
        return name;
      else
        throw new Error(`Invalid entity name ${name}`);
    }
    module2.exports = DocTypeReader;
  }
});

// node_modules/strnum/strnum.js
var require_strnum = __commonJS({
  "node_modules/strnum/strnum.js"(exports2, module2) {
    var hexRegex = /^[-+]?0x[a-fA-F0-9]+$/;
    var numRegex = /^([\-\+])?(0*)([0-9]*(\.[0-9]*)?)$/;
    var consider = {
      hex: true,
      // oct: false,
      leadingZeros: true,
      decimalPoint: ".",
      eNotation: true
      //skipLike: /regex/
    };
    function toNumber(str, options = {}) {
      options = Object.assign({}, consider, options);
      if (!str || typeof str !== "string")
        return str;
      let trimmedStr = str.trim();
      if (options.skipLike !== void 0 && options.skipLike.test(trimmedStr))
        return str;
      else if (str === "0")
        return 0;
      else if (options.hex && hexRegex.test(trimmedStr)) {
        return parse_int(trimmedStr, 16);
      } else if (trimmedStr.search(/[eE]/) !== -1) {
        const notation = trimmedStr.match(/^([-\+])?(0*)([0-9]*(\.[0-9]*)?[eE][-\+]?[0-9]+)$/);
        if (notation) {
          if (options.leadingZeros) {
            trimmedStr = (notation[1] || "") + notation[3];
          } else {
            if (notation[2] === "0" && notation[3][0] === ".") {
            } else {
              return str;
            }
          }
          return options.eNotation ? Number(trimmedStr) : str;
        } else {
          return str;
        }
      } else {
        const match = numRegex.exec(trimmedStr);
        if (match) {
          const sign = match[1];
          const leadingZeros = match[2];
          let numTrimmedByZeros = trimZeros(match[3]);
          if (!options.leadingZeros && leadingZeros.length > 0 && sign && trimmedStr[2] !== ".")
            return str;
          else if (!options.leadingZeros && leadingZeros.length > 0 && !sign && trimmedStr[1] !== ".")
            return str;
          else if (options.leadingZeros && leadingZeros === str)
            return 0;
          else {
            const num = Number(trimmedStr);
            const numStr = "" + num;
            if (numStr.search(/[eE]/) !== -1) {
              if (options.eNotation)
                return num;
              else
                return str;
            } else if (trimmedStr.indexOf(".") !== -1) {
              if (numStr === "0" && numTrimmedByZeros === "")
                return num;
              else if (numStr === numTrimmedByZeros)
                return num;
              else if (sign && numStr === "-" + numTrimmedByZeros)
                return num;
              else
                return str;
            }
            if (leadingZeros) {
              return numTrimmedByZeros === numStr || sign + numTrimmedByZeros === numStr ? num : str;
            } else {
              return trimmedStr === numStr || trimmedStr === sign + numStr ? num : str;
            }
          }
        } else {
          return str;
        }
      }
    }
    function trimZeros(numStr) {
      if (numStr && numStr.indexOf(".") !== -1) {
        numStr = numStr.replace(/0+$/, "");
        if (numStr === ".")
          numStr = "0";
        else if (numStr[0] === ".")
          numStr = "0" + numStr;
        else if (numStr[numStr.length - 1] === ".")
          numStr = numStr.substr(0, numStr.length - 1);
        return numStr;
      }
      return numStr;
    }
    function parse_int(numStr, base) {
      if (parseInt)
        return parseInt(numStr, base);
      else if (Number.parseInt)
        return Number.parseInt(numStr, base);
      else if (window && window.parseInt)
        return window.parseInt(numStr, base);
      else
        throw new Error("parseInt, Number.parseInt, window.parseInt are not supported");
    }
    module2.exports = toNumber;
  }
});

// node_modules/fast-xml-parser/src/ignoreAttributes.js
var require_ignoreAttributes = __commonJS({
  "node_modules/fast-xml-parser/src/ignoreAttributes.js"(exports2, module2) {
    function getIgnoreAttributesFn(ignoreAttributes) {
      if (typeof ignoreAttributes === "function") {
        return ignoreAttributes;
      }
      if (Array.isArray(ignoreAttributes)) {
        return (attrName) => {
          for (const pattern of ignoreAttributes) {
            if (typeof pattern === "string" && attrName === pattern) {
              return true;
            }
            if (pattern instanceof RegExp && pattern.test(attrName)) {
              return true;
            }
          }
        };
      }
      return () => false;
    }
    module2.exports = getIgnoreAttributesFn;
  }
});

// node_modules/fast-xml-parser/src/xmlparser/OrderedObjParser.js
var require_OrderedObjParser = __commonJS({
  "node_modules/fast-xml-parser/src/xmlparser/OrderedObjParser.js"(exports2, module2) {
    "use strict";
    var util = require_util();
    var xmlNode = require_xmlNode();
    var DocTypeReader = require_DocTypeReader();
    var toNumber = require_strnum();
    var getIgnoreAttributesFn = require_ignoreAttributes();
    var OrderedObjParser = class {
      constructor(options) {
        this.options = options;
        this.currentNode = null;
        this.tagsNodeStack = [];
        this.docTypeEntities = {};
        this.lastEntities = {
          "apos": { regex: /&(apos|#39|#x27);/g, val: "'" },
          "gt": { regex: /&(gt|#62|#x3E);/g, val: ">" },
          "lt": { regex: /&(lt|#60|#x3C);/g, val: "<" },
          "quot": { regex: /&(quot|#34|#x22);/g, val: '"' }
        };
        this.ampEntity = { regex: /&(amp|#38|#x26);/g, val: "&" };
        this.htmlEntities = {
          "space": { regex: /&(nbsp|#160);/g, val: " " },
          // "lt" : { regex: /&(lt|#60);/g, val: "<" },
          // "gt" : { regex: /&(gt|#62);/g, val: ">" },
          // "amp" : { regex: /&(amp|#38);/g, val: "&" },
          // "quot" : { regex: /&(quot|#34);/g, val: "\"" },
          // "apos" : { regex: /&(apos|#39);/g, val: "'" },
          "cent": { regex: /&(cent|#162);/g, val: "\xA2" },
          "pound": { regex: /&(pound|#163);/g, val: "\xA3" },
          "yen": { regex: /&(yen|#165);/g, val: "\xA5" },
          "euro": { regex: /&(euro|#8364);/g, val: "\u20AC" },
          "copyright": { regex: /&(copy|#169);/g, val: "\xA9" },
          "reg": { regex: /&(reg|#174);/g, val: "\xAE" },
          "inr": { regex: /&(inr|#8377);/g, val: "\u20B9" },
          "num_dec": { regex: /&#([0-9]{1,7});/g, val: (_, str) => fromCodePoint(str, 10, "&#") },
          "num_hex": { regex: /&#x([0-9a-fA-F]{1,6});/g, val: (_, str) => fromCodePoint(str, 16, "&#x") }
        };
        this.addExternalEntities = addExternalEntities;
        this.parseXml = parseXml;
        this.parseTextData = parseTextData;
        this.resolveNameSpace = resolveNameSpace;
        this.buildAttributesMap = buildAttributesMap;
        this.isItStopNode = isItStopNode;
        this.replaceEntitiesValue = replaceEntitiesValue;
        this.readStopNodeData = readStopNodeData;
        this.saveTextToParentTag = saveTextToParentTag;
        this.addChild = addChild;
        this.ignoreAttributesFn = getIgnoreAttributesFn(this.options.ignoreAttributes);
        this.entityExpansionCount = 0;
        this.currentExpandedLength = 0;
        if (this.options.stopNodes && this.options.stopNodes.length > 0) {
          this.stopNodesExact = /* @__PURE__ */ new Set();
          this.stopNodesWildcard = /* @__PURE__ */ new Set();
          for (let i = 0; i < this.options.stopNodes.length; i++) {
            const stopNodeExp = this.options.stopNodes[i];
            if (typeof stopNodeExp !== "string")
              continue;
            if (stopNodeExp.startsWith("*.")) {
              this.stopNodesWildcard.add(stopNodeExp.substring(2));
            } else {
              this.stopNodesExact.add(stopNodeExp);
            }
          }
        }
      }
    };
    function addExternalEntities(externalEntities) {
      const entKeys = Object.keys(externalEntities);
      for (let i = 0; i < entKeys.length; i++) {
        const ent = entKeys[i];
        const escaped = ent.replace(/[.\-+*:]/g, "\\.");
        this.lastEntities[ent] = {
          regex: new RegExp("&" + escaped + ";", "g"),
          val: externalEntities[ent]
        };
      }
    }
    function parseTextData(val, tagName, jPath, dontTrim, hasAttributes, isLeafNode, escapeEntities) {
      if (val !== void 0) {
        if (this.options.trimValues && !dontTrim) {
          val = val.trim();
        }
        if (val.length > 0) {
          if (!escapeEntities)
            val = this.replaceEntitiesValue(val, tagName, jPath);
          const newval = this.options.tagValueProcessor(tagName, val, jPath, hasAttributes, isLeafNode);
          if (newval === null || newval === void 0) {
            return val;
          } else if (typeof newval !== typeof val || newval !== val) {
            return newval;
          } else if (this.options.trimValues) {
            return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
          } else {
            const trimmedVal = val.trim();
            if (trimmedVal === val) {
              return parseValue(val, this.options.parseTagValue, this.options.numberParseOptions);
            } else {
              return val;
            }
          }
        }
      }
    }
    function resolveNameSpace(tagname) {
      if (this.options.removeNSPrefix) {
        const tags = tagname.split(":");
        const prefix = tagname.charAt(0) === "/" ? "/" : "";
        if (tags[0] === "xmlns") {
          return "";
        }
        if (tags.length === 2) {
          tagname = prefix + tags[1];
        }
      }
      return tagname;
    }
    var attrsRegx = new RegExp(`([^\\s=]+)\\s*(=\\s*(['"])([\\s\\S]*?)\\3)?`, "gm");
    function buildAttributesMap(attrStr, jPath, tagName) {
      if (this.options.ignoreAttributes !== true && typeof attrStr === "string") {
        const matches = util.getAllMatches(attrStr, attrsRegx);
        const len = matches.length;
        const attrs = {};
        for (let i = 0; i < len; i++) {
          const attrName = this.resolveNameSpace(matches[i][1]);
          if (this.ignoreAttributesFn(attrName, jPath)) {
            continue;
          }
          let oldVal = matches[i][4];
          let aName = this.options.attributeNamePrefix + attrName;
          if (attrName.length) {
            if (this.options.transformAttributeName) {
              aName = this.options.transformAttributeName(aName);
            }
            aName = sanitizeName(aName, this.options);
            if (oldVal !== void 0) {
              if (this.options.trimValues) {
                oldVal = oldVal.trim();
              }
              oldVal = this.replaceEntitiesValue(oldVal, tagName, jPath);
              const newVal = this.options.attributeValueProcessor(attrName, oldVal, jPath);
              if (newVal === null || newVal === void 0) {
                attrs[aName] = oldVal;
              } else if (typeof newVal !== typeof oldVal || newVal !== oldVal) {
                attrs[aName] = newVal;
              } else {
                attrs[aName] = parseValue(
                  oldVal,
                  this.options.parseAttributeValue,
                  this.options.numberParseOptions
                );
              }
            } else if (this.options.allowBooleanAttributes) {
              attrs[aName] = true;
            }
          }
        }
        if (!Object.keys(attrs).length) {
          return;
        }
        if (this.options.attributesGroupName) {
          const attrCollection = {};
          attrCollection[this.options.attributesGroupName] = attrs;
          return attrCollection;
        }
        return attrs;
      }
    }
    var parseXml = function(xmlData) {
      xmlData = xmlData.replace(/\r\n?/g, "\n");
      const xmlObj = new xmlNode("!xml");
      let currentNode = xmlObj;
      let textData = "";
      let jPath = "";
      this.entityExpansionCount = 0;
      this.currentExpandedLength = 0;
      const docTypeReader = new DocTypeReader(this.options.processEntities);
      for (let i = 0; i < xmlData.length; i++) {
        const ch = xmlData[i];
        if (ch === "<") {
          if (xmlData[i + 1] === "/") {
            const closeIndex = findClosingIndex(xmlData, ">", i, "Closing Tag is not closed.");
            let tagName = xmlData.substring(i + 2, closeIndex).trim();
            if (this.options.removeNSPrefix) {
              const colonIndex = tagName.indexOf(":");
              if (colonIndex !== -1) {
                tagName = tagName.substr(colonIndex + 1);
              }
            }
            if (this.options.transformTagName) {
              tagName = this.options.transformTagName(tagName);
            }
            if (currentNode) {
              textData = this.saveTextToParentTag(textData, currentNode, jPath);
            }
            const lastTagName = jPath.substring(jPath.lastIndexOf(".") + 1);
            if (tagName && this.options.unpairedTags.indexOf(tagName) !== -1) {
              throw new Error(`Unpaired tag can not be used as closing tag: </${tagName}>`);
            }
            let propIndex = 0;
            if (lastTagName && this.options.unpairedTags.indexOf(lastTagName) !== -1) {
              propIndex = jPath.lastIndexOf(".", jPath.lastIndexOf(".") - 1);
              this.tagsNodeStack.pop();
            } else {
              propIndex = jPath.lastIndexOf(".");
            }
            jPath = jPath.substring(0, propIndex);
            currentNode = this.tagsNodeStack.pop();
            textData = "";
            i = closeIndex;
          } else if (xmlData[i + 1] === "?") {
            let tagData = readTagExp(xmlData, i, false, "?>");
            if (!tagData)
              throw new Error("Pi Tag is not closed.");
            textData = this.saveTextToParentTag(textData, currentNode, jPath);
            if (this.options.ignoreDeclaration && tagData.tagName === "?xml" || this.options.ignorePiTags) {
            } else {
              const childNode = new xmlNode(tagData.tagName);
              childNode.add(this.options.textNodeName, "");
              if (tagData.tagName !== tagData.tagExp && tagData.attrExpPresent) {
                childNode[":@"] = this.buildAttributesMap(tagData.tagExp, jPath, tagData.tagName);
              }
              this.addChild(currentNode, childNode, jPath, i);
            }
            i = tagData.closeIndex + 1;
          } else if (xmlData.substr(i + 1, 3) === "!--") {
            const endIndex = findClosingIndex(xmlData, "-->", i + 4, "Comment is not closed.");
            if (this.options.commentPropName) {
              const comment = xmlData.substring(i + 4, endIndex - 2);
              textData = this.saveTextToParentTag(textData, currentNode, jPath);
              currentNode.add(this.options.commentPropName, [{ [this.options.textNodeName]: comment }]);
            }
            i = endIndex;
          } else if (xmlData.substr(i + 1, 2) === "!D") {
            const result = docTypeReader.readDocType(xmlData, i);
            this.docTypeEntities = result.entities;
            i = result.i;
          } else if (xmlData.substr(i + 1, 2) === "![") {
            const closeIndex = findClosingIndex(xmlData, "]]>", i, "CDATA is not closed.") - 2;
            const tagExp = xmlData.substring(i + 9, closeIndex);
            textData = this.saveTextToParentTag(textData, currentNode, jPath);
            let val = this.parseTextData(tagExp, currentNode.tagname, jPath, true, false, true, true);
            if (val == void 0)
              val = "";
            if (this.options.cdataPropName) {
              currentNode.add(this.options.cdataPropName, [{ [this.options.textNodeName]: tagExp }]);
            } else {
              currentNode.add(this.options.textNodeName, val);
            }
            i = closeIndex + 2;
          } else {
            let result = readTagExp(xmlData, i, this.options.removeNSPrefix);
            let tagName = result.tagName;
            const rawTagName = result.rawTagName;
            let tagExp = result.tagExp;
            let attrExpPresent = result.attrExpPresent;
            let closeIndex = result.closeIndex;
            if (this.options.transformTagName) {
              const newTagName = this.options.transformTagName(tagName);
              if (tagExp === tagName) {
                tagExp = newTagName;
              }
              tagName = newTagName;
            }
            if (this.options.strictReservedNames && (tagName === this.options.commentPropName || tagName === this.options.cdataPropName || tagName === this.options.textNodeName || tagName === this.options.attributesGroupName)) {
              throw new Error(`Invalid tag name: ${tagName}`);
            }
            if (currentNode && textData) {
              if (currentNode.tagname !== "!xml") {
                textData = this.saveTextToParentTag(textData, currentNode, jPath, false);
              }
            }
            const lastTag = currentNode;
            if (lastTag && this.options.unpairedTags.indexOf(lastTag.tagname) !== -1) {
              currentNode = this.tagsNodeStack.pop();
              jPath = jPath.substring(0, jPath.lastIndexOf("."));
            }
            if (tagName !== xmlObj.tagname) {
              jPath += jPath ? "." + tagName : tagName;
            }
            const startIndex = i;
            if (this.isItStopNode(this.stopNodesExact, this.stopNodesWildcard, jPath, tagName)) {
              let tagContent = "";
              if (tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1) {
                if (tagName[tagName.length - 1] === "/") {
                  tagName = tagName.substr(0, tagName.length - 1);
                  jPath = jPath.substr(0, jPath.length - 1);
                  tagExp = tagName;
                } else {
                  tagExp = tagExp.substr(0, tagExp.length - 1);
                }
                i = result.closeIndex;
              } else if (this.options.unpairedTags.indexOf(tagName) !== -1) {
                i = result.closeIndex;
              } else {
                const result2 = this.readStopNodeData(xmlData, rawTagName, closeIndex + 1);
                if (!result2)
                  throw new Error(`Unexpected end of ${rawTagName}`);
                i = result2.i;
                tagContent = result2.tagContent;
              }
              const childNode = new xmlNode(tagName);
              if (tagName !== tagExp && attrExpPresent) {
                childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
              }
              if (tagContent) {
                tagContent = this.parseTextData(tagContent, tagName, jPath, true, attrExpPresent, true, true);
              }
              jPath = jPath.substr(0, jPath.lastIndexOf("."));
              childNode.add(this.options.textNodeName, tagContent);
              this.addChild(currentNode, childNode, jPath, startIndex);
            } else {
              if (tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1) {
                if (tagName[tagName.length - 1] === "/") {
                  tagName = tagName.substr(0, tagName.length - 1);
                  jPath = jPath.substr(0, jPath.length - 1);
                  tagExp = tagName;
                } else {
                  tagExp = tagExp.substr(0, tagExp.length - 1);
                }
                if (this.options.transformTagName) {
                  const newTagName = this.options.transformTagName(tagName);
                  if (tagExp === tagName) {
                    tagExp = newTagName;
                  }
                  tagName = newTagName;
                }
                const childNode = new xmlNode(tagName);
                if (tagName !== tagExp && attrExpPresent) {
                  childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
                }
                this.addChild(currentNode, childNode, jPath, startIndex);
                jPath = jPath.substr(0, jPath.lastIndexOf("."));
              } else if (this.options.unpairedTags.indexOf(tagName) !== -1) {
                const childNode = new xmlNode(tagName);
                if (tagName !== tagExp && attrExpPresent) {
                  childNode[":@"] = this.buildAttributesMap(tagExp, jPath);
                }
                this.addChild(currentNode, childNode, jPath, startIndex);
                jPath = jPath.substr(0, jPath.lastIndexOf("."));
                i = result.closeIndex;
                continue;
              } else {
                const childNode = new xmlNode(tagName);
                if (this.tagsNodeStack.length > this.options.maxNestedTags) {
                  throw new Error("Maximum nested tags exceeded");
                }
                this.tagsNodeStack.push(currentNode);
                if (tagName !== tagExp && attrExpPresent) {
                  childNode[":@"] = this.buildAttributesMap(tagExp, jPath, tagName);
                }
                this.addChild(currentNode, childNode, jPath);
                currentNode = childNode;
              }
              textData = "";
              i = closeIndex;
            }
          }
        } else {
          textData += xmlData[i];
        }
      }
      return xmlObj.child;
    };
    function addChild(currentNode, childNode, jPath, startIndex) {
      if (!this.options.captureMetaData)
        startIndex = void 0;
      const result = this.options.updateTag(childNode.tagname, jPath, childNode[":@"]);
      if (result === false) {
      } else if (typeof result === "string") {
        childNode.tagname = result;
        currentNode.addChild(childNode, startIndex);
      } else {
        currentNode.addChild(childNode, startIndex);
      }
    }
    var replaceEntitiesValue = function(val, tagName, jPath) {
      if (val.indexOf("&") === -1) {
        return val;
      }
      const entityConfig = this.options.processEntities;
      if (!entityConfig.enabled) {
        return val;
      }
      if (entityConfig.allowedTags) {
        if (!entityConfig.allowedTags.includes(tagName)) {
          return val;
        }
      }
      if (entityConfig.tagFilter) {
        if (!entityConfig.tagFilter(tagName, jPath)) {
          return val;
        }
      }
      for (let entityName in this.docTypeEntities) {
        const entity = this.docTypeEntities[entityName];
        const matches = val.match(entity.regx);
        if (matches) {
          this.entityExpansionCount += matches.length;
          if (entityConfig.maxTotalExpansions && this.entityExpansionCount > entityConfig.maxTotalExpansions) {
            throw new Error(
              `Entity expansion limit exceeded: ${this.entityExpansionCount} > ${entityConfig.maxTotalExpansions}`
            );
          }
          const lengthBefore = val.length;
          val = val.replace(entity.regx, entity.val);
          if (entityConfig.maxExpandedLength) {
            this.currentExpandedLength += val.length - lengthBefore;
            if (this.currentExpandedLength > entityConfig.maxExpandedLength) {
              throw new Error(
                `Total expanded content size exceeded: ${this.currentExpandedLength} > ${entityConfig.maxExpandedLength}`
              );
            }
          }
        }
      }
      if (val.indexOf("&") === -1)
        return val;
      for (const entityName of Object.keys(this.lastEntities)) {
        const entity = this.lastEntities[entityName];
        const matches = val.match(entity.regex);
        if (matches) {
          this.entityExpansionCount += matches.length;
          if (entityConfig.maxTotalExpansions && this.entityExpansionCount > entityConfig.maxTotalExpansions) {
            throw new Error(
              `Entity expansion limit exceeded: ${this.entityExpansionCount} > ${entityConfig.maxTotalExpansions}`
            );
          }
        }
        val = val.replace(entity.regex, entity.val);
      }
      if (val.indexOf("&") === -1)
        return val;
      if (this.options.htmlEntities) {
        for (const entityName of Object.keys(this.htmlEntities)) {
          const entity = this.htmlEntities[entityName];
          const matches = val.match(entity.regex);
          if (matches) {
            this.entityExpansionCount += matches.length;
            if (entityConfig.maxTotalExpansions && this.entityExpansionCount > entityConfig.maxTotalExpansions) {
              throw new Error(
                `Entity expansion limit exceeded: ${this.entityExpansionCount} > ${entityConfig.maxTotalExpansions}`
              );
            }
          }
          val = val.replace(entity.regex, entity.val);
        }
      }
      val = val.replace(this.ampEntity.regex, this.ampEntity.val);
      return val;
    };
    function saveTextToParentTag(textData, parentNode, jPath, isLeafNode) {
      if (textData) {
        if (isLeafNode === void 0)
          isLeafNode = parentNode.child.length === 0;
        textData = this.parseTextData(
          textData,
          parentNode.tagname,
          jPath,
          false,
          parentNode[":@"] ? Object.keys(parentNode[":@"]).length !== 0 : false,
          isLeafNode
        );
        if (textData !== void 0 && textData !== "")
          parentNode.add(this.options.textNodeName, textData);
        textData = "";
      }
      return textData;
    }
    function isItStopNode(stopNodesExact, stopNodesWildcard, jPath, currentTagName) {
      if (stopNodesWildcard && stopNodesWildcard.has(currentTagName))
        return true;
      if (stopNodesExact && stopNodesExact.has(jPath))
        return true;
      return false;
    }
    function tagExpWithClosingIndex(xmlData, i, closingChar = ">") {
      let attrBoundary;
      let tagExp = "";
      for (let index = i; index < xmlData.length; index++) {
        let ch = xmlData[index];
        if (attrBoundary) {
          if (ch === attrBoundary)
            attrBoundary = "";
        } else if (ch === '"' || ch === "'") {
          attrBoundary = ch;
        } else if (ch === closingChar[0]) {
          if (closingChar[1]) {
            if (xmlData[index + 1] === closingChar[1]) {
              return {
                data: tagExp,
                index
              };
            }
          } else {
            return {
              data: tagExp,
              index
            };
          }
        } else if (ch === "	") {
          ch = " ";
        }
        tagExp += ch;
      }
    }
    function findClosingIndex(xmlData, str, i, errMsg) {
      const closingIndex = xmlData.indexOf(str, i);
      if (closingIndex === -1) {
        throw new Error(errMsg);
      } else {
        return closingIndex + str.length - 1;
      }
    }
    function readTagExp(xmlData, i, removeNSPrefix, closingChar = ">") {
      const result = tagExpWithClosingIndex(xmlData, i + 1, closingChar);
      if (!result)
        return;
      let tagExp = result.data;
      const closeIndex = result.index;
      const separatorIndex = tagExp.search(/\s/);
      let tagName = tagExp;
      let attrExpPresent = true;
      if (separatorIndex !== -1) {
        tagName = tagExp.substring(0, separatorIndex);
        tagExp = tagExp.substring(separatorIndex + 1).trimStart();
      }
      const rawTagName = tagName;
      if (removeNSPrefix) {
        const colonIndex = tagName.indexOf(":");
        if (colonIndex !== -1) {
          tagName = tagName.substr(colonIndex + 1);
          attrExpPresent = tagName !== result.data.substr(colonIndex + 1);
        }
      }
      return {
        tagName,
        tagExp,
        closeIndex,
        attrExpPresent,
        rawTagName
      };
    }
    function readStopNodeData(xmlData, tagName, i) {
      const startIndex = i;
      let openTagCount = 1;
      for (; i < xmlData.length; i++) {
        if (xmlData[i] === "<") {
          if (xmlData[i + 1] === "/") {
            const closeIndex = findClosingIndex(xmlData, ">", i, `${tagName} is not closed`);
            let closeTagName = xmlData.substring(i + 2, closeIndex).trim();
            if (closeTagName === tagName) {
              openTagCount--;
              if (openTagCount === 0) {
                return {
                  tagContent: xmlData.substring(startIndex, i),
                  i: closeIndex
                };
              }
            }
            i = closeIndex;
          } else if (xmlData[i + 1] === "?") {
            const closeIndex = findClosingIndex(xmlData, "?>", i + 1, "StopNode is not closed.");
            i = closeIndex;
          } else if (xmlData.substr(i + 1, 3) === "!--") {
            const closeIndex = findClosingIndex(xmlData, "-->", i + 3, "StopNode is not closed.");
            i = closeIndex;
          } else if (xmlData.substr(i + 1, 2) === "![") {
            const closeIndex = findClosingIndex(xmlData, "]]>", i, "StopNode is not closed.") - 2;
            i = closeIndex;
          } else {
            const tagData = readTagExp(xmlData, i, ">");
            if (tagData) {
              const openTagName = tagData && tagData.tagName;
              if (openTagName === tagName && tagData.tagExp[tagData.tagExp.length - 1] !== "/") {
                openTagCount++;
              }
              i = tagData.closeIndex;
            }
          }
        }
      }
    }
    function parseValue(val, shouldParse, options) {
      if (shouldParse && typeof val === "string") {
        const newval = val.trim();
        if (newval === "true")
          return true;
        else if (newval === "false")
          return false;
        else
          return toNumber(val, options);
      } else {
        if (util.isExist(val)) {
          return val;
        } else {
          return "";
        }
      }
    }
    function fromCodePoint(str, base, prefix) {
      const codePoint = Number.parseInt(str, base);
      if (codePoint >= 0 && codePoint <= 1114111) {
        return String.fromCodePoint(codePoint);
      } else {
        return prefix + str + ";";
      }
    }
    function sanitizeName(name, options) {
      if (util.criticalProperties.includes(name)) {
        throw new Error(`[SECURITY] Invalid name: "${name}" is a reserved JavaScript keyword that could cause prototype pollution`);
      } else if (util.DANGEROUS_PROPERTY_NAMES.includes(name)) {
        return options.onDangerousProperty(name);
      }
      return name;
    }
    module2.exports = OrderedObjParser;
  }
});

// node_modules/fast-xml-parser/src/xmlparser/node2json.js
var require_node2json = __commonJS({
  "node_modules/fast-xml-parser/src/xmlparser/node2json.js"(exports2) {
    "use strict";
    function prettify(node, options) {
      return compress(node, options);
    }
    function compress(arr, options, jPath) {
      let text;
      const compressedObj = {};
      for (let i = 0; i < arr.length; i++) {
        const tagObj = arr[i];
        const property = propName(tagObj);
        let newJpath = "";
        if (jPath === void 0)
          newJpath = property;
        else
          newJpath = jPath + "." + property;
        if (property === options.textNodeName) {
          if (text === void 0)
            text = tagObj[property];
          else
            text += "" + tagObj[property];
        } else if (property === void 0) {
          continue;
        } else if (tagObj[property]) {
          let val = compress(tagObj[property], options, newJpath);
          const isLeaf = isLeafTag(val, options);
          if (tagObj[":@"]) {
            assignAttributes(val, tagObj[":@"], newJpath, options);
          } else if (Object.keys(val).length === 1 && val[options.textNodeName] !== void 0 && !options.alwaysCreateTextNode) {
            val = val[options.textNodeName];
          } else if (Object.keys(val).length === 0) {
            if (options.alwaysCreateTextNode)
              val[options.textNodeName] = "";
            else
              val = "";
          }
          if (compressedObj[property] !== void 0 && compressedObj.hasOwnProperty(property)) {
            if (!Array.isArray(compressedObj[property])) {
              compressedObj[property] = [compressedObj[property]];
            }
            compressedObj[property].push(val);
          } else {
            if (options.isArray(property, newJpath, isLeaf)) {
              compressedObj[property] = [val];
            } else {
              compressedObj[property] = val;
            }
          }
        }
      }
      if (typeof text === "string") {
        if (text.length > 0)
          compressedObj[options.textNodeName] = text;
      } else if (text !== void 0)
        compressedObj[options.textNodeName] = text;
      return compressedObj;
    }
    function propName(obj) {
      const keys = Object.keys(obj);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (key !== ":@")
          return key;
      }
    }
    function assignAttributes(obj, attrMap, jpath, options) {
      if (attrMap) {
        const keys = Object.keys(attrMap);
        const len = keys.length;
        for (let i = 0; i < len; i++) {
          const atrrName = keys[i];
          if (options.isArray(atrrName, jpath + "." + atrrName, true, true)) {
            obj[atrrName] = [attrMap[atrrName]];
          } else {
            obj[atrrName] = attrMap[atrrName];
          }
        }
      }
    }
    function isLeafTag(obj, options) {
      const { textNodeName } = options;
      const propCount = Object.keys(obj).length;
      if (propCount === 0) {
        return true;
      }
      if (propCount === 1 && (obj[textNodeName] || typeof obj[textNodeName] === "boolean" || obj[textNodeName] === 0)) {
        return true;
      }
      return false;
    }
    exports2.prettify = prettify;
  }
});

// node_modules/fast-xml-parser/src/xmlparser/XMLParser.js
var require_XMLParser = __commonJS({
  "node_modules/fast-xml-parser/src/xmlparser/XMLParser.js"(exports2, module2) {
    var { buildOptions } = require_OptionsBuilder();
    var OrderedObjParser = require_OrderedObjParser();
    var { prettify } = require_node2json();
    var validator = require_validator();
    var XMLParser2 = class {
      constructor(options) {
        this.externalEntities = {};
        this.options = buildOptions(options);
      }
      /**
       * Parse XML dats to JS object 
       * @param {string|Buffer} xmlData 
       * @param {boolean|Object} validationOption 
       */
      parse(xmlData, validationOption) {
        if (typeof xmlData === "string") {
        } else if (xmlData.toString) {
          xmlData = xmlData.toString();
        } else {
          throw new Error("XML data is accepted in String or Bytes[] form.");
        }
        if (validationOption) {
          if (validationOption === true)
            validationOption = {};
          const result = validator.validate(xmlData, validationOption);
          if (result !== true) {
            throw Error(`${result.err.msg}:${result.err.line}:${result.err.col}`);
          }
        }
        const orderedObjParser = new OrderedObjParser(this.options);
        orderedObjParser.addExternalEntities(this.externalEntities);
        const orderedResult = orderedObjParser.parseXml(xmlData);
        if (this.options.preserveOrder || orderedResult === void 0)
          return orderedResult;
        else
          return prettify(orderedResult, this.options);
      }
      /**
       * Add Entity which is not by default supported by this library
       * @param {string} key 
       * @param {string} value 
       */
      addEntity(key, value) {
        if (value.indexOf("&") !== -1) {
          throw new Error("Entity value can't have '&'");
        } else if (key.indexOf("&") !== -1 || key.indexOf(";") !== -1) {
          throw new Error("An entity must be set without '&' and ';'. Eg. use '#xD' for '&#xD;'");
        } else if (value === "&") {
          throw new Error("An entity with value '&' is not permitted");
        } else {
          this.externalEntities[key] = value;
        }
      }
    };
    module2.exports = XMLParser2;
  }
});

// node_modules/fast-xml-parser/src/xmlbuilder/orderedJs2Xml.js
var require_orderedJs2Xml = __commonJS({
  "node_modules/fast-xml-parser/src/xmlbuilder/orderedJs2Xml.js"(exports2, module2) {
    var EOL = "\n";
    function toXml(jArray, options) {
      let indentation = "";
      if (options.format && options.indentBy.length > 0) {
        indentation = EOL;
      }
      return arrToStr(jArray, options, "", indentation);
    }
    function arrToStr(arr, options, jPath, indentation) {
      let xmlStr = "";
      let isPreviousElementTag = false;
      if (!Array.isArray(arr)) {
        if (arr !== void 0 && arr !== null) {
          let text = arr.toString();
          text = replaceEntitiesValue(text, options);
          return text;
        }
        return "";
      }
      for (let i = 0; i < arr.length; i++) {
        const tagObj = arr[i];
        const tagName = propName(tagObj);
        if (tagName === void 0)
          continue;
        let newJPath = "";
        if (jPath.length === 0)
          newJPath = tagName;
        else
          newJPath = `${jPath}.${tagName}`;
        if (tagName === options.textNodeName) {
          let tagText = tagObj[tagName];
          if (!isStopNode(newJPath, options)) {
            tagText = options.tagValueProcessor(tagName, tagText);
            tagText = replaceEntitiesValue(tagText, options);
          }
          if (isPreviousElementTag) {
            xmlStr += indentation;
          }
          xmlStr += tagText;
          isPreviousElementTag = false;
          continue;
        } else if (tagName === options.cdataPropName) {
          if (isPreviousElementTag) {
            xmlStr += indentation;
          }
          const cdataVal = String(tagObj[tagName][0][options.textNodeName]).replace(/\]\]>/g, "]]]]><![CDATA[>");
          xmlStr += `<![CDATA[${cdataVal}]]>`;
          isPreviousElementTag = false;
          continue;
        } else if (tagName === options.commentPropName) {
          const commentVal = String(tagObj[tagName][0][options.textNodeName]).replace(/--/g, "- -").replace(/-$/, "- ");
          xmlStr += indentation + `<!--${commentVal}-->`;
          isPreviousElementTag = true;
          continue;
        } else if (tagName[0] === "?") {
          const attStr2 = attr_to_str(tagObj[":@"], options);
          const tempInd = tagName === "?xml" ? "" : indentation;
          let piTextNodeName = tagObj[tagName][0][options.textNodeName];
          piTextNodeName = piTextNodeName.length !== 0 ? " " + piTextNodeName : "";
          xmlStr += tempInd + `<${tagName}${piTextNodeName}${attStr2}?>`;
          isPreviousElementTag = true;
          continue;
        }
        let newIdentation = indentation;
        if (newIdentation !== "") {
          newIdentation += options.indentBy;
        }
        const attStr = attr_to_str(tagObj[":@"], options);
        const tagStart = indentation + `<${tagName}${attStr}`;
        const tagValue = arrToStr(tagObj[tagName], options, newJPath, newIdentation);
        if (options.unpairedTags.indexOf(tagName) !== -1) {
          if (options.suppressUnpairedNode)
            xmlStr += tagStart + ">";
          else
            xmlStr += tagStart + "/>";
        } else if ((!tagValue || tagValue.length === 0) && options.suppressEmptyNode) {
          xmlStr += tagStart + "/>";
        } else if (tagValue && tagValue.endsWith(">")) {
          xmlStr += tagStart + `>${tagValue}${indentation}</${tagName}>`;
        } else {
          xmlStr += tagStart + ">";
          if (tagValue && indentation !== "" && (tagValue.includes("/>") || tagValue.includes("</"))) {
            xmlStr += indentation + options.indentBy + tagValue + indentation;
          } else {
            xmlStr += tagValue;
          }
          xmlStr += `</${tagName}>`;
        }
        isPreviousElementTag = true;
      }
      return xmlStr;
    }
    function propName(obj) {
      const keys = Object.keys(obj);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (!Object.prototype.hasOwnProperty.call(obj, key))
          continue;
        if (key !== ":@")
          return key;
      }
    }
    function attr_to_str(attrMap, options) {
      let attrStr = "";
      if (attrMap && !options.ignoreAttributes) {
        for (let attr in attrMap) {
          if (!Object.prototype.hasOwnProperty.call(attrMap, attr))
            continue;
          let attrVal = options.attributeValueProcessor(attr, attrMap[attr]);
          attrVal = replaceEntitiesValue(attrVal, options);
          if (attrVal === true && options.suppressBooleanAttributes) {
            attrStr += ` ${attr.substr(options.attributeNamePrefix.length)}`;
          } else {
            attrStr += ` ${attr.substr(options.attributeNamePrefix.length)}="${attrVal}"`;
          }
        }
      }
      return attrStr;
    }
    function isStopNode(jPath, options) {
      jPath = jPath.substr(0, jPath.length - options.textNodeName.length - 1);
      let tagName = jPath.substr(jPath.lastIndexOf(".") + 1);
      for (let index in options.stopNodes) {
        if (options.stopNodes[index] === jPath || options.stopNodes[index] === "*." + tagName)
          return true;
      }
      return false;
    }
    function replaceEntitiesValue(textValue, options) {
      if (textValue && textValue.length > 0 && options.processEntities) {
        for (let i = 0; i < options.entities.length; i++) {
          const entity = options.entities[i];
          textValue = textValue.replace(entity.regex, entity.val);
        }
      }
      return textValue;
    }
    module2.exports = toXml;
  }
});

// node_modules/fast-xml-parser/src/xmlbuilder/json2xml.js
var require_json2xml = __commonJS({
  "node_modules/fast-xml-parser/src/xmlbuilder/json2xml.js"(exports2, module2) {
    "use strict";
    var buildFromOrderedJs = require_orderedJs2Xml();
    var getIgnoreAttributesFn = require_ignoreAttributes();
    var defaultOptions = {
      attributeNamePrefix: "@_",
      attributesGroupName: false,
      textNodeName: "#text",
      ignoreAttributes: true,
      cdataPropName: false,
      format: false,
      indentBy: "  ",
      suppressEmptyNode: false,
      suppressUnpairedNode: true,
      suppressBooleanAttributes: true,
      tagValueProcessor: function(key, a) {
        return a;
      },
      attributeValueProcessor: function(attrName, a) {
        return a;
      },
      preserveOrder: false,
      commentPropName: false,
      unpairedTags: [],
      entities: [
        { regex: new RegExp("&", "g"), val: "&amp;" },
        //it must be on top
        { regex: new RegExp(">", "g"), val: "&gt;" },
        { regex: new RegExp("<", "g"), val: "&lt;" },
        { regex: new RegExp("'", "g"), val: "&apos;" },
        { regex: new RegExp('"', "g"), val: "&quot;" }
      ],
      processEntities: true,
      stopNodes: [],
      // transformTagName: false,
      // transformAttributeName: false,
      oneListGroup: false
    };
    function Builder(options) {
      this.options = Object.assign({}, defaultOptions, options);
      if (this.options.ignoreAttributes === true || this.options.attributesGroupName) {
        this.isAttribute = function() {
          return false;
        };
      } else {
        this.ignoreAttributesFn = getIgnoreAttributesFn(this.options.ignoreAttributes);
        this.attrPrefixLen = this.options.attributeNamePrefix.length;
        this.isAttribute = isAttribute;
      }
      this.processTextOrObjNode = processTextOrObjNode;
      if (this.options.format) {
        this.indentate = indentate;
        this.tagEndChar = ">\n";
        this.newLine = "\n";
      } else {
        this.indentate = function() {
          return "";
        };
        this.tagEndChar = ">";
        this.newLine = "";
      }
    }
    Builder.prototype.build = function(jObj) {
      if (this.options.preserveOrder) {
        return buildFromOrderedJs(jObj, this.options);
      } else {
        if (Array.isArray(jObj) && this.options.arrayNodeName && this.options.arrayNodeName.length > 1) {
          jObj = {
            [this.options.arrayNodeName]: jObj
          };
        }
        return this.j2x(jObj, 0, []).val;
      }
    };
    Builder.prototype.j2x = function(jObj, level, ajPath) {
      let attrStr = "";
      let val = "";
      const jPath = ajPath.join(".");
      for (let key in jObj) {
        if (!Object.prototype.hasOwnProperty.call(jObj, key))
          continue;
        if (typeof jObj[key] === "undefined") {
          if (this.isAttribute(key)) {
            val += "";
          }
        } else if (jObj[key] === null) {
          if (this.isAttribute(key)) {
            val += "";
          } else if (key === this.options.cdataPropName) {
            val += "";
          } else if (key[0] === "?") {
            val += this.indentate(level) + "<" + key + "?" + this.tagEndChar;
          } else {
            val += this.indentate(level) + "<" + key + "/" + this.tagEndChar;
          }
        } else if (jObj[key] instanceof Date) {
          val += this.buildTextValNode(jObj[key], key, "", level);
        } else if (typeof jObj[key] !== "object") {
          const attr = this.isAttribute(key);
          if (attr && !this.ignoreAttributesFn(attr, jPath)) {
            attrStr += this.buildAttrPairStr(attr, "" + jObj[key]);
          } else if (!attr) {
            if (key === this.options.textNodeName) {
              let newval = this.options.tagValueProcessor(key, "" + jObj[key]);
              val += this.replaceEntitiesValue(newval);
            } else {
              val += this.buildTextValNode(jObj[key], key, "", level);
            }
          }
        } else if (Array.isArray(jObj[key])) {
          const arrLen = jObj[key].length;
          let listTagVal = "";
          let listTagAttr = "";
          for (let j = 0; j < arrLen; j++) {
            const item = jObj[key][j];
            if (typeof item === "undefined") {
            } else if (item === null) {
              if (key[0] === "?")
                val += this.indentate(level) + "<" + key + "?" + this.tagEndChar;
              else
                val += this.indentate(level) + "<" + key + "/" + this.tagEndChar;
            } else if (typeof item === "object") {
              if (this.options.oneListGroup) {
                const result = this.j2x(item, level + 1, ajPath.concat(key));
                listTagVal += result.val;
                if (this.options.attributesGroupName && item.hasOwnProperty(this.options.attributesGroupName)) {
                  listTagAttr += result.attrStr;
                }
              } else {
                listTagVal += this.processTextOrObjNode(item, key, level, ajPath);
              }
            } else {
              if (this.options.oneListGroup) {
                let textValue = this.options.tagValueProcessor(key, item);
                textValue = this.replaceEntitiesValue(textValue);
                listTagVal += textValue;
              } else {
                listTagVal += this.buildTextValNode(item, key, "", level);
              }
            }
          }
          if (this.options.oneListGroup) {
            listTagVal = this.buildObjectNode(listTagVal, key, listTagAttr, level);
          }
          val += listTagVal;
        } else {
          if (this.options.attributesGroupName && key === this.options.attributesGroupName) {
            const Ks = Object.keys(jObj[key]);
            const L = Ks.length;
            for (let j = 0; j < L; j++) {
              attrStr += this.buildAttrPairStr(Ks[j], "" + jObj[key][Ks[j]]);
            }
          } else {
            val += this.processTextOrObjNode(jObj[key], key, level, ajPath);
          }
        }
      }
      return { attrStr, val };
    };
    Builder.prototype.buildAttrPairStr = function(attrName, val) {
      val = this.options.attributeValueProcessor(attrName, "" + val);
      val = this.replaceEntitiesValue(val);
      if (this.options.suppressBooleanAttributes && val === "true") {
        return " " + attrName;
      } else
        return " " + attrName + '="' + val + '"';
    };
    function processTextOrObjNode(object, key, level, ajPath) {
      const result = this.j2x(object, level + 1, ajPath.concat(key));
      if (object[this.options.textNodeName] !== void 0 && Object.keys(object).length === 1) {
        return this.buildTextValNode(object[this.options.textNodeName], key, result.attrStr, level);
      } else {
        return this.buildObjectNode(result.val, key, result.attrStr, level);
      }
    }
    Builder.prototype.buildObjectNode = function(val, key, attrStr, level) {
      if (val === "") {
        if (key[0] === "?")
          return this.indentate(level) + "<" + key + attrStr + "?" + this.tagEndChar;
        else {
          return this.indentate(level) + "<" + key + attrStr + this.closeTag(key) + this.tagEndChar;
        }
      } else {
        let tagEndExp = "</" + key + this.tagEndChar;
        let piClosingChar = "";
        if (key[0] === "?") {
          piClosingChar = "?";
          tagEndExp = "";
        }
        if ((attrStr || attrStr === "") && val.indexOf("<") === -1) {
          return this.indentate(level) + "<" + key + attrStr + piClosingChar + ">" + val + tagEndExp;
        } else if (this.options.commentPropName !== false && key === this.options.commentPropName && piClosingChar.length === 0) {
          const safeVal = String(val).replace(/--/g, "- -").replace(/-$/, "- ");
          return this.indentate(level) + `<!--${safeVal}-->` + this.newLine;
        } else {
          return this.indentate(level) + "<" + key + attrStr + piClosingChar + this.tagEndChar + val + this.indentate(level) + tagEndExp;
        }
      }
    };
    Builder.prototype.closeTag = function(key) {
      let closeTag = "";
      if (this.options.unpairedTags.indexOf(key) !== -1) {
        if (!this.options.suppressUnpairedNode)
          closeTag = "/";
      } else if (this.options.suppressEmptyNode) {
        closeTag = "/";
      } else {
        closeTag = `></${key}`;
      }
      return closeTag;
    };
    Builder.prototype.buildTextValNode = function(val, key, attrStr, level) {
      if (this.options.cdataPropName !== false && key === this.options.cdataPropName) {
        const safeVal = String(val).replace(/\]\]>/g, "]]]]><![CDATA[>");
        return this.indentate(level) + `<![CDATA[${safeVal}]]>` + this.newLine;
      } else if (this.options.commentPropName !== false && key === this.options.commentPropName) {
        const safeVal = String(val).replace(/--/g, "- -").replace(/-$/, "- ");
        return this.indentate(level) + `<!--${safeVal}-->` + this.newLine;
      } else if (key[0] === "?") {
        return this.indentate(level) + "<" + key + attrStr + "?" + this.tagEndChar;
      } else {
        let textValue = this.options.tagValueProcessor(key, val);
        textValue = this.replaceEntitiesValue(textValue);
        if (textValue === "") {
          return this.indentate(level) + "<" + key + attrStr + this.closeTag(key) + this.tagEndChar;
        } else {
          return this.indentate(level) + "<" + key + attrStr + ">" + textValue + "</" + key + this.tagEndChar;
        }
      }
    };
    Builder.prototype.replaceEntitiesValue = function(textValue) {
      if (textValue && textValue.length > 0 && this.options.processEntities) {
        for (let i = 0; i < this.options.entities.length; i++) {
          const entity = this.options.entities[i];
          textValue = textValue.replace(entity.regex, entity.val);
        }
      }
      return textValue;
    };
    function indentate(level) {
      return this.options.indentBy.repeat(level);
    }
    function isAttribute(name) {
      if (name.startsWith(this.options.attributeNamePrefix) && name !== this.options.textNodeName) {
        return name.substr(this.attrPrefixLen);
      } else {
        return false;
      }
    }
    module2.exports = Builder;
  }
});

// node_modules/fast-xml-parser/src/fxp.js
var require_fxp = __commonJS({
  "node_modules/fast-xml-parser/src/fxp.js"(exports2, module2) {
    "use strict";
    var validator = require_validator();
    var XMLParser2 = require_XMLParser();
    var XMLBuilder = require_json2xml();
    module2.exports = {
      XMLParser: XMLParser2,
      XMLValidator: validator,
      XMLBuilder
    };
  }
});

// src/parser/ermParser.ts
var import_fast_xml_parser = __toESM(require_fxp());
function ensureArray(item) {
  if (item === void 0 || item === null)
    return [];
  return Array.isArray(item) ? item : [item];
}
function parseNumber(val, defaultVal = 0) {
  if (val === void 0 || val === null || val === "null" || val === "")
    return defaultVal;
  const num = Number(val);
  return isNaN(num) ? defaultVal : num;
}
function parseOptionalNumber(val) {
  if (val === void 0 || val === null || val === "null" || val === "")
    return void 0;
  const num = Number(val);
  return isNaN(num) ? void 0 : num;
}
function parseBoolean(val) {
  if (val === void 0 || val === null)
    return false;
  return val === true || val === "true" || val === "1";
}
function parseString(val, defaultVal = "") {
  if (val === void 0 || val === null || val === "null")
    return defaultVal;
  return String(val);
}
function parseOptionalString(val) {
  if (val === void 0 || val === null || val === "null" || val === "")
    return void 0;
  return String(val);
}
function parseColor(colorObj) {
  if (!colorObj)
    return void 0;
  return {
    r: parseNumber(colorObj.r, 255),
    g: parseNumber(colorObj.g, 255),
    b: parseNumber(colorObj.b, 255)
  };
}
function parseNormalColumns(rawCols, wordMap) {
  const columns = [];
  for (const c of ensureArray(rawCols)) {
    const colId = parseString(c.id);
    const wordId = parseOptionalString(c.word_id);
    const refWord = wordId ? wordMap.get(wordId) : void 0;
    const physicalName = parseOptionalString(c.physical_name) ?? refWord?.physicalName ?? "";
    const logicalName = parseOptionalString(c.logical_name) ?? refWord?.logicalName ?? "";
    const colType = parseOptionalString(c.type) ?? refWord?.type ?? "varchar";
    const colLength = c.length !== void 0 && c.length !== "null" && c.length !== "" ? parseOptionalNumber(c.length) : refWord?.length;
    const colDecimal = c.decimal !== void 0 && c.decimal !== "null" && c.decimal !== "" ? parseOptionalNumber(c.decimal) : refWord?.decimal;
    columns.push({
      id: colId,
      wordId,
      physicalName,
      logicalName,
      type: colType,
      length: colLength,
      decimal: colDecimal,
      primaryKey: parseBoolean(c.primary_key),
      notNull: parseBoolean(c.not_null),
      uniqueKey: parseBoolean(c.unique_key),
      uniqueKeyName: parseOptionalString(c.unique_key_name),
      autoIncrement: parseBoolean(c.auto_increment),
      foreignKey: parseBoolean(c.foreign_key),
      referencedColumnId: parseOptionalString(c.referenced_column),
      relationId: parseOptionalString(c.relation),
      constraint: parseOptionalString(c.constraint),
      defaultValue: parseOptionalString(c.default_value),
      description: parseOptionalString(c.description) ?? refWord?.description,
      characterSet: parseOptionalString(c.character_set),
      collation: parseOptionalString(c.collation),
      sequence: parseOptionalString(c.sequence)
    });
  }
  return columns;
}
function parseBendpoints(rawBendpoints) {
  const bendpoints = [];
  for (const bp of ensureArray(rawBendpoints)) {
    bendpoints.push({
      x: parseNumber(bp.x, 0),
      y: parseNumber(bp.y, 0),
      relative: parseBoolean(bp.relative)
    });
  }
  return bendpoints;
}
function parseCommentConnections(rawConns, defaultTargetId, noteConnections) {
  for (const cc of ensureArray(rawConns)) {
    const bendpoints = parseBendpoints(cc.bendpoint);
    noteConnections.push({
      id: parseString(cc.id, `cc_${noteConnections.length}`),
      sourceId: parseString(cc.source),
      targetId: parseString(cc.target, defaultTargetId),
      bendpoints: bendpoints.length > 0 ? bendpoints : void 0
    });
  }
}
function parseERMXml(xmlString) {
  const parser = new import_fast_xml_parser.XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    parseTagValue: false,
    trimValues: false
  });
  const parsed = parser.parse(xmlString);
  const diagramNode = parsed.diagram || {};
  const db = parseOptionalString(diagramNode.settings?.database) ?? parseOptionalString(diagramNode.db) ?? "PostgreSQL";
  const x = parseNumber(diagramNode.x, 0);
  const y = parseNumber(diagramNode.y, 0);
  const zoom = parseNumber(diagramNode.zoom, 100);
  const rawViewMode = diagramNode.settings?.view_mode;
  const viewMode = rawViewMode === "0" || rawViewMode === 0 ? "logical" : rawViewMode === "1" || rawViewMode === 1 ? "physical" : "both";
  const rawNotation = parseOptionalString(diagramNode.settings?.notation)?.toUpperCase();
  const notation = rawNotation === "IDEF1X" ? "IDEF1X" : "IE";
  const rawTableStyle = parseOptionalString(diagramNode.settings?.table_style)?.toLowerCase();
  const tableStyle = rawTableStyle === "funny" || rawTableStyle === "simple" ? rawTableStyle : "frame";
  const rawNotationLevel = Number(diagramNode.settings?.notation_level);
  const notationLevel = rawNotationLevel === 1 ? "title" : rawNotationLevel === 2 ? "column" : rawNotationLevel === 3 ? "key" : rawNotationLevel === 4 ? "exclude_type" : rawNotationLevel === 5 ? "name_and_key" : "detail";
  const capital = parseBoolean(diagramNode.settings?.capital);
  const wordMap = /* @__PURE__ */ new Map();
  const dictionary = [];
  for (const w of ensureArray(diagramNode.dictionary?.word)) {
    const wordId = parseString(w.id);
    const word = {
      id: wordId,
      physicalName: parseString(w.physical_name),
      logicalName: parseString(w.logical_name),
      description: parseString(w.description),
      type: parseString(w.type, "varchar"),
      length: parseOptionalNumber(w.length),
      decimal: parseOptionalNumber(w.decimal),
      array: parseBoolean(w.array),
      arrayDimension: parseOptionalNumber(w.array_dimension),
      unsigned: parseBoolean(w.unsigned),
      zerofill: parseBoolean(w.zerofill),
      binary: parseBoolean(w.binary),
      args: parseOptionalString(w.args),
      charSemantics: parseBoolean(w.char_semantics)
    };
    wordMap.set(wordId, word);
    dictionary.push(word);
  }
  const tablespaces = [];
  for (const ts of ensureArray(diagramNode.tablespace_set?.tablespace)) {
    const props = {};
    if (ts.properties && typeof ts.properties === "object") {
      for (const [k, v] of Object.entries(ts.properties)) {
        props[k] = v;
      }
    }
    tablespaces.push({
      id: parseString(ts.id),
      name: parseString(ts.name),
      description: parseOptionalString(ts.description),
      properties: Object.keys(props).length > 0 ? props : void 0
    });
  }
  const columnGroups = [];
  for (const cg of ensureArray(diagramNode.column_groups?.column_group)) {
    columnGroups.push({
      id: parseString(cg.id),
      groupName: parseString(cg.group_name),
      columns: parseNormalColumns(cg.columns?.normal_column, wordMap)
    });
  }
  const tables = [];
  const views = [];
  const notes = [];
  const images = [];
  const relations = [];
  const noteConnections = [];
  for (const t of ensureArray(diagramNode.contents?.table)) {
    const tableId = parseString(t.id);
    const columns = parseNormalColumns(t.columns?.normal_column, wordMap);
    const columnGroupIds = ensureArray(t.columns?.column_group).map((g) => parseString(g));
    const indexes = [];
    const rawIndexes = [
      ...ensureArray(t.indexes?.inidex),
      ...ensureArray(t.indexes?.index)
    ];
    rawIndexes.forEach((idx, i) => {
      const idxCols = ensureArray(idx.columns?.column).map((ic) => ({
        columnId: parseString(ic.id),
        order: parseBoolean(ic.desc) ? "DESC" : "ASC"
      }));
      indexes.push({
        id: parseOptionalString(idx.id) ?? `${tableId}_idx_${i}`,
        name: parseString(idx.name),
        type: parseOptionalString(idx.type),
        nonUnique: parseBoolean(idx.non_unique),
        fullText: parseBoolean(idx.full_text),
        columns: idxCols,
        description: parseOptionalString(idx.description)
      });
    });
    const complexUniqueKeys = [];
    for (const cuk of ensureArray(t.complex_unique_key_list?.complex_unique_key)) {
      const cukCols = ensureArray(cuk.columns?.column).map((cc) => parseString(cc.id));
      complexUniqueKeys.push({
        id: parseString(cuk.id),
        name: parseString(cuk.name),
        columns: cukCols
      });
    }
    let tableProperties;
    if (t.table_properties) {
      tableProperties = {
        tablespaceId: parseOptionalString(t.table_properties.tablespace_id),
        schema: parseOptionalString(t.table_properties.schema),
        characterSet: parseOptionalString(t.table_properties.character_set),
        collation: parseOptionalString(t.table_properties.collation),
        storageEngine: parseOptionalString(t.table_properties.storage_engine),
        primaryKeyLengthOfText: parseOptionalNumber(t.table_properties.primary_key_length_of_text),
        withoutOIDs: parseBoolean(t.table_properties.without_oids)
      };
    }
    for (const rel of ensureArray(t.connections?.relation)) {
      const bendpoints = parseBendpoints(rel.bendpoint_list?.bendpoint ?? rel.bendpoint);
      const sourceColumnIds = ensureArray(rel.source_column_ids?.column_id).map((id) => parseString(id));
      const targetColumnIds = ensureArray(rel.target_column_ids?.column_id).map((id) => parseString(id));
      relations.push({
        id: parseString(rel.id),
        name: parseString(rel.name),
        sourceTableId: parseString(rel.source),
        targetTableId: parseString(rel.target, tableId),
        sourceColumnIds: sourceColumnIds.length > 0 ? sourceColumnIds : void 0,
        targetColumnIds: targetColumnIds.length > 0 ? targetColumnIds : void 0,
        referenceForPK: parseBoolean(rel.reference_for_pk),
        referencedComplexUniqueKeyId: parseOptionalString(rel.referenced_complex_unique_key),
        onDeleteAction: parseOptionalString(rel.on_delete_action),
        onUpdateAction: parseOptionalString(rel.on_update_action),
        parentCardinality: parseOptionalString(rel.parent_cardinality) ?? "1",
        childCardinality: parseOptionalString(rel.child_cardinality) ?? "0..n",
        sourceXp: parseOptionalNumber(rel.source_xp),
        sourceYp: parseOptionalNumber(rel.source_yp),
        targetXp: parseOptionalNumber(rel.target_xp),
        targetYp: parseOptionalNumber(rel.target_yp),
        parentMandatory: parseBoolean(rel.parent_mandatory),
        childMandatory: parseBoolean(rel.child_mandatory),
        bendpoints: bendpoints.length > 0 ? bendpoints : void 0
      });
    }
    parseCommentConnections(t.connections?.comment_connection, tableId, noteConnections);
    tables.push({
      id: tableId,
      physicalName: parseString(t.physical_name),
      logicalName: parseString(t.logical_name),
      description: parseString(t.description),
      constraint: parseOptionalString(t.constraint),
      primaryKeyName: parseOptionalString(t.primary_key_name),
      option: parseOptionalString(t.option),
      x: parseNumber(t.x, 50),
      y: parseNumber(t.y, 50),
      width: parseOptionalNumber(t.width) || 160,
      height: parseOptionalNumber(t.height) || 100,
      color: parseColor(t.color),
      columns,
      columnGroupIds: columnGroupIds.length > 0 ? columnGroupIds : void 0,
      indexes,
      complexUniqueKeys,
      tableProperties
    });
  }
  for (const v of ensureArray(diagramNode.contents?.view)) {
    const viewId = parseString(v.id);
    const columns = parseNormalColumns(v.columns?.normal_column, wordMap);
    const columnGroupIds = ensureArray(v.columns?.column_group).map((g) => parseString(g));
    parseCommentConnections(v.connections?.comment_connection, viewId, noteConnections);
    views.push({
      id: viewId,
      physicalName: parseString(v.physical_name),
      logicalName: parseString(v.logical_name),
      description: parseString(v.description),
      sql: parseString(v.sql),
      schema: parseOptionalString(v.view_properties?.schema),
      x: parseNumber(v.x, 100),
      y: parseNumber(v.y, 100),
      width: parseOptionalNumber(v.width) || 180,
      height: parseOptionalNumber(v.height) || 120,
      color: parseColor(v.color),
      columns,
      columnGroupIds: columnGroupIds.length > 0 ? columnGroupIds : void 0
    });
  }
  for (const n of ensureArray(diagramNode.contents?.note)) {
    const noteId = parseString(n.id);
    parseCommentConnections(n.connections?.comment_connection, noteId, noteConnections);
    notes.push({
      id: noteId,
      text: parseString(n.text),
      x: parseNumber(n.x, 100),
      y: parseNumber(n.y, 100),
      width: parseNumber(n.width, 150),
      height: parseNumber(n.height, 80),
      color: parseColor(n.color),
      connections: []
    });
  }
  for (const img of ensureArray(diagramNode.contents?.image)) {
    const imgId = parseString(img.id);
    parseCommentConnections(img.connections?.comment_connection, imgId, noteConnections);
    images.push({
      id: imgId,
      x: parseNumber(img.x, 100),
      y: parseNumber(img.y, 100),
      width: parseNumber(img.width, 200),
      height: parseNumber(img.height, 150),
      color: parseColor(img.color),
      data: parseString(img.data),
      hue: parseOptionalNumber(img.hue),
      saturation: parseOptionalNumber(img.saturation),
      brightness: parseOptionalNumber(img.brightness),
      alpha: parseOptionalNumber(img.alpha),
      fixAspectRatio: img.fix_aspect_ratio !== void 0 ? parseBoolean(img.fix_aspect_ratio) : true
    });
  }
  const categories = [];
  const catSettingsNode = diagramNode.settings?.category_settings;
  const freeLayout = parseBoolean(catSettingsNode?.free_layout);
  const showReferredTables = parseBoolean(catSettingsNode?.show_referred_tables);
  let selectedCategoryId = null;
  for (const cat of ensureArray(catSettingsNode?.categories?.category)) {
    const catId = parseString(cat.id);
    const isSel = parseBoolean(cat.selected);
    if (isSel)
      selectedCategoryId = catId;
    categories.push({
      id: catId,
      name: parseString(cat.name),
      selected: isSel,
      x: parseNumber(cat.x, 0),
      y: parseNumber(cat.y, 0),
      width: parseNumber(cat.width, 400),
      height: parseNumber(cat.height, 300),
      color: parseColor(cat.color),
      nodeElementIds: ensureArray(cat.node_element).map((id) => parseString(id))
    });
  }
  let modelProperties;
  const mpNode = diagramNode.settings?.model_properties;
  if (mpNode) {
    const props = ensureArray(mpNode.model_property).map((p) => ({
      name: parseString(p.name),
      value: parseString(p.value)
    }));
    modelProperties = {
      id: parseOptionalString(mpNode.id),
      x: parseNumber(mpNode.x, 50),
      y: parseNumber(mpNode.y, 50),
      width: parseNumber(mpNode.width, 220),
      height: parseNumber(mpNode.height, 120),
      color: parseColor(mpNode.color),
      display: parseBoolean(mpNode.display),
      creationDate: parseOptionalString(mpNode.creation_date),
      updatedDate: parseOptionalString(mpNode.updated_date),
      properties: props
    };
  }
  const sequences = [];
  for (const seq of ensureArray(diagramNode.sequence_set?.sequence)) {
    sequences.push({
      id: parseString(seq.name, `seq_${sequences.length}`),
      name: parseString(seq.name),
      schema: parseOptionalString(seq.schema),
      increment: parseOptionalNumber(seq.increment),
      minValue: parseOptionalNumber(seq.min_value),
      maxValue: parseOptionalNumber(seq.max_value),
      start: parseOptionalNumber(seq.start),
      cache: parseOptionalNumber(seq.cache),
      nocache: parseBoolean(seq.nocache),
      cycle: parseBoolean(seq.cycle),
      order: parseBoolean(seq.order),
      description: parseOptionalString(seq.description),
      dataType: parseOptionalString(seq.data_type),
      decimalSize: parseOptionalNumber(seq.decimal_size)
    });
  }
  const triggers = [];
  for (const trg of ensureArray(diagramNode.trigger_set?.trigger)) {
    triggers.push({
      id: parseString(trg.name, `trg_${triggers.length}`),
      name: parseString(trg.name),
      schema: parseOptionalString(trg.schema),
      sql: parseString(trg.sql),
      description: parseOptionalString(trg.description)
    });
  }
  const testDataList = [];
  for (const td of ensureArray(diagramNode.test_data_list?.test_data)) {
    const tableTestData = [];
    for (const ttd of ensureArray(td.table_test_data)) {
      const directTestData = [];
      for (const row of ensureArray(ttd.direct_test_data?.data)) {
        const values = {};
        for (const colVal of ensureArray(row.column_data)) {
          values[parseString(colVal.column_id)] = parseString(colVal.value);
        }
        directTestData.push({ values });
      }
      tableTestData.push({
        tableId: parseString(ttd.table_id),
        directTestData,
        repeatCount: parseOptionalNumber(ttd.repeat_test_data?.test_data_num)
      });
    }
    testDataList.push({
      id: `td_${testDataList.length}`,
      name: parseString(td.name),
      tableTestData
    });
  }
  const changeTrackingList = [];
  for (const ct of ensureArray(diagramNode.change_tracking_list?.change_tracking)) {
    changeTrackingList.push({
      id: `ct_${changeTrackingList.length}`,
      comment: parseString(ct.comment),
      updatedDate: parseString(ct.updated_date),
      tableNames: ensureArray(ct.table_name).map((n) => parseString(n)),
      tableCount: parseNumber(ct.table_count, 0),
      columnCount: parseNumber(ct.column_count, 0)
    });
  }
  const translations = [];
  for (const tr of ensureArray(diagramNode.settings?.translation_settings?.custom_translations?.entry)) {
    translations.push({
      id: `tr_${translations.length}`,
      logicalName: parseString(tr.logical_name),
      physicalName: parseString(tr.physical_name)
    });
  }
  return {
    db,
    x,
    y,
    zoom,
    viewMode,
    notation,
    tableStyle,
    notationLevel,
    capital,
    lockEdit: false,
    dictionary,
    tables,
    views,
    notes,
    noteConnections,
    images,
    relations,
    categories,
    categorySettings: {
      freeLayout,
      showReferredTables,
      selectedCategoryId
    },
    columnGroups,
    sequences,
    triggers,
    tablespaces,
    modelProperties,
    testDataList,
    changeTrackingList,
    translations,
    settings: diagramNode.settings
  };
}

// src/parser/ermSerializer.ts
function escapeXml(unsafe = "") {
  return String(unsafe).replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}
function serializeColor(lines, indent, color, fallback = { r: 128, g: 128, b: 192 }) {
  const c = color || fallback;
  lines.push(`${indent}<color>`);
  lines.push(`${indent}	<r>${c.r}</r>`);
  lines.push(`${indent}	<g>${c.g}</g>`);
  lines.push(`${indent}	<b>${c.b}</b>`);
  lines.push(`${indent}</color>`);
}
function serializeNormalColumn(lines, indent, col, wordId, colId) {
  lines.push(`${indent}<normal_column>`);
  lines.push(`${indent}	<word_id>${escapeXml(wordId)}</word_id>`);
  lines.push(`${indent}	<id>${escapeXml(colId)}</id>`);
  if (col.referencedColumnId) {
    lines.push(
      `${indent}	<referenced_column>${escapeXml(col.referencedColumnId)}</referenced_column>`
    );
  }
  if (col.relationId) {
    lines.push(`${indent}	<relation>${escapeXml(col.relationId)}</relation>`);
  }
  lines.push(
    `${indent}	<description>${escapeXml(col.description || "")}</description>`
  );
  lines.push(
    `${indent}	<unique_key_name>${escapeXml(col.uniqueKeyName || "")}</unique_key_name>`
  );
  lines.push(
    `${indent}	<logical_name>${escapeXml(col.logicalName || "")}</logical_name>`
  );
  lines.push(
    `${indent}	<physical_name>${escapeXml(col.physicalName || "")}</physical_name>`
  );
  lines.push(`${indent}	<type>${escapeXml(col.type || "")}</type>`);
  lines.push(
    `${indent}	<constraint>${escapeXml(col.constraint || "")}</constraint>`
  );
  lines.push(
    `${indent}	<default_value>${escapeXml(col.defaultValue || "")}</default_value>`
  );
  lines.push(
    `${indent}	<auto_increment>${col.autoIncrement ? "true" : "false"}</auto_increment>`
  );
  lines.push(
    `${indent}	<foreign_key>${col.foreignKey ? "true" : "false"}</foreign_key>`
  );
  lines.push(
    `${indent}	<not_null>${col.notNull ? "true" : "false"}</not_null>`
  );
  lines.push(
    `${indent}	<primary_key>${col.primaryKey ? "true" : "false"}</primary_key>`
  );
  lines.push(
    `${indent}	<unique_key>${col.uniqueKey ? "true" : "false"}</unique_key>`
  );
  lines.push(
    `${indent}	<character_set>${escapeXml(col.characterSet || "")}</character_set>`
  );
  lines.push(
    `${indent}	<collation>${escapeXml(col.collation || "")}</collation>`
  );
  lines.push(
    `${indent}	<sequence>${escapeXml(col.sequence || "")}</sequence>`
  );
  lines.push(`${indent}</normal_column>`);
}
function serializeCommentConnections(lines, indent, connections) {
  for (const cc of connections) {
    lines.push(`${indent}<comment_connection>`);
    lines.push(`${indent}	<id>${escapeXml(cc.id)}</id>`);
    lines.push(`${indent}	<source>${escapeXml(cc.sourceId)}</source>`);
    lines.push(`${indent}	<target>${escapeXml(cc.targetId)}</target>`);
    if (cc.bendpoints) {
      for (const bp of cc.bendpoints) {
        lines.push(`${indent}	<bendpoint>`);
        lines.push(
          `${indent}		<relative>${bp.relative ? "true" : "false"}</relative>`
        );
        lines.push(`${indent}		<x>${bp.x}</x>`);
        lines.push(`${indent}		<y>${bp.y}</y>`);
        lines.push(`${indent}	</bendpoint>`);
      }
    }
    lines.push(`${indent}</comment_connection>`);
  }
}
function serializeERMXml(diagram3) {
  const lines = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push("<diagram>");
  lines.push(`	<db>${escapeXml(diagram3.db || "PostgreSQL")}</db>`);
  lines.push(`	<page_setting>`);
  lines.push(`		<direction_horizontal>true</direction_horizontal>`);
  lines.push(`		<scale>100</scale>`);
  lines.push(`		<paper_size>A4 210 x 297 mm</paper_size>`);
  lines.push(`		<top_margin>30</top_margin>`);
  lines.push(`		<left_margin>30</left_margin>`);
  lines.push(`		<bottom_margin>30</bottom_margin>`);
  lines.push(`		<right_margin>30</right_margin>`);
  lines.push(`	</page_setting>`);
  lines.push(`	<category_index>0</category_index>`);
  lines.push(`	<zoom>${diagram3.zoom || 100}</zoom>`);
  lines.push(`	<x>${diagram3.x || 0}</x>`);
  lines.push(`	<y>${diagram3.y || 0}</y>`);
  lines.push(`	<default_color>`);
  lines.push(`		<r>128</r>`);
  lines.push(`		<g>128</g>`);
  lines.push(`		<b>192</b>`);
  lines.push(`	</default_color>`);
  serializeColor(lines, "	", void 0, { r: 255, g: 255, b: 255 });
  lines.push(`	<font_name></font_name>`);
  lines.push(`	<font_size>9</font_size>`);
  const viewModeNum = diagram3.viewMode === "logical" ? 0 : diagram3.viewMode === "physical" ? 1 : 2;
  const notationLevelMap = {
    detail: 0,
    title: 1,
    column: 2,
    key: 3,
    exclude_type: 4,
    name_and_key: 5
  };
  const notationLevelNum = notationLevelMap[diagram3.notationLevel || "detail"] ?? 0;
  lines.push(`	<settings>`);
  lines.push(
    `		<database>${escapeXml(diagram3.db || "PostgreSQL")}</database>`
  );
  lines.push(`		<capital>${diagram3.capital ? "true" : "false"}</capital>`);
  lines.push(
    `		<table_style>${escapeXml(diagram3.tableStyle || "frame")}</table_style>`
  );
  lines.push(`		<notation>${escapeXml(diagram3.notation || "IE")}</notation>`);
  lines.push(`		<notation_level>${notationLevelNum}</notation_level>`);
  lines.push(`		<view_mode>${viewModeNum}</view_mode>`);
  if ((diagram3.translations || []).length > 0) {
    lines.push(`		<translation_settings>`);
    lines.push(`			<use>true</use>`);
    lines.push(`			<custom_translations>`);
    for (const tr of diagram3.translations || []) {
      lines.push(`				<entry>`);
      lines.push(`					<logical_name>${escapeXml(tr.logicalName)}</logical_name>`);
      lines.push(`					<physical_name>${escapeXml(tr.physicalName)}</physical_name>`);
      lines.push(`				</entry>`);
    }
    lines.push(`			</custom_translations>`);
    lines.push(`		</translation_settings>`);
  }
  lines.push(`		<category_settings>`);
  lines.push(`			<free_layout>${diagram3.categorySettings?.freeLayout ? "true" : "false"}</free_layout>`);
  lines.push(`			<show_referred_tables>${diagram3.categorySettings?.showReferredTables ? "true" : "false"}</show_referred_tables>`);
  lines.push(`			<categories>`);
  for (const cat of diagram3.categories || []) {
    const isSel = diagram3.categorySettings?.selectedCategoryId ? diagram3.categorySettings.selectedCategoryId === cat.id : Boolean(cat.selected);
    lines.push(`				<category>`);
    lines.push(`					<id>${escapeXml(cat.id)}</id>`);
    lines.push(`					<height>${Math.round(cat.height || 300)}</height>`);
    lines.push(`					<width>${Math.round(cat.width || 400)}</width>`);
    lines.push(`					<font_name></font_name>`);
    lines.push(`					<font_size>9</font_size>`);
    lines.push(`					<x>${Math.round(cat.x)}</x>`);
    lines.push(`					<y>${Math.round(cat.y)}</y>`);
    serializeColor(lines, "					", cat.color, { r: 137, g: 180, b: 250 });
    lines.push(`					<name>${escapeXml(cat.name)}</name>`);
    lines.push(
      `					<selected>${isSel ? "true" : "false"}</selected>`
    );
    for (const nodeId of cat.nodeElementIds || []) {
      lines.push(`					<node_element>${escapeXml(nodeId)}</node_element>`);
    }
    lines.push(`				</category>`);
  }
  lines.push(`			</categories>`);
  lines.push(`		</category_settings>`);
  if (diagram3.modelProperties) {
    const mp = diagram3.modelProperties;
    lines.push(`		<model_properties>`);
    if (mp.id)
      lines.push(`			<id>${escapeXml(mp.id)}</id>`);
    lines.push(`			<height>${Math.round(mp.height || 120)}</height>`);
    lines.push(`			<width>${Math.round(mp.width || 220)}</width>`);
    lines.push(`			<font_name></font_name>`);
    lines.push(`			<font_size>9</font_size>`);
    lines.push(`			<x>${Math.round(mp.x)}</x>`);
    lines.push(`			<y>${Math.round(mp.y)}</y>`);
    serializeColor(lines, "			", mp.color, { r: 255, g: 255, b: 255 });
    lines.push(`			<display>${mp.display ? "true" : "false"}</display>`);
    if (mp.creationDate)
      lines.push(
        `			<creation_date>${escapeXml(mp.creationDate)}</creation_date>`
      );
    if (mp.updatedDate)
      lines.push(
        `			<updated_date>${escapeXml(mp.updatedDate)}</updated_date>`
      );
    for (const prop of mp.properties || []) {
      lines.push(`			<model_property>`);
      lines.push(`				<name>${escapeXml(prop.name)}</name>`);
      lines.push(`				<value>${escapeXml(prop.value)}</value>`);
      lines.push(`			</model_property>`);
    }
    lines.push(`		</model_properties>`);
  }
  lines.push(`	</settings>`);
  const wordList = [...diagram3.dictionary || []];
  const existingWordIds = new Set(wordList.map((w) => w.id));
  const wordKeyMap = /* @__PURE__ */ new Map();
  let nextWordId = 0;
  for (const w of wordList) {
    const numId = Number(w.id);
    if (!isNaN(numId) && numId >= nextWordId)
      nextWordId = numId + 1;
    wordKeyMap.set(`${w.physicalName}_${w.logicalName}_${w.type}`, w.id);
  }
  const ensureWordForColumn = (col) => {
    if (col.wordId && existingWordIds.has(col.wordId)) {
      return col.wordId;
    }
    const key = `${col.physicalName}_${col.logicalName}_${col.type}`;
    const existing = wordKeyMap.get(key);
    if (existing)
      return existing;
    const newId = String(nextWordId++);
    wordKeyMap.set(key, newId);
    existingWordIds.add(newId);
    wordList.push({
      id: newId,
      physicalName: col.physicalName || "",
      logicalName: col.logicalName || "",
      description: col.description || "",
      type: col.type || "varchar",
      length: col.length,
      decimal: col.decimal
    });
    return newId;
  };
  for (const t of diagram3.tables) {
    t.columns.forEach(ensureWordForColumn);
  }
  for (const v of diagram3.views || []) {
    v.columns.forEach(ensureWordForColumn);
  }
  for (const cg of diagram3.columnGroups || []) {
    cg.columns.forEach(ensureWordForColumn);
  }
  lines.push(`	<dictionary>`);
  for (const w of wordList) {
    lines.push(`		<word>`);
    lines.push(`			<id>${escapeXml(w.id)}</id>`);
    lines.push(`			<length>${w.length ?? "null"}</length>`);
    lines.push(`			<decimal>${w.decimal ?? "null"}</decimal>`);
    lines.push(`			<array>${w.array ? "true" : "false"}</array>`);
    lines.push(
      `			<array_dimension>${w.arrayDimension ?? "null"}</array_dimension>`
    );
    lines.push(`			<unsigned>${w.unsigned ? "true" : "false"}</unsigned>`);
    lines.push(`			<zerofill>${w.zerofill ? "true" : "false"}</zerofill>`);
    lines.push(`			<binary>${w.binary ? "true" : "false"}</binary>`);
    lines.push(`			<args>${escapeXml(w.args || "")}</args>`);
    lines.push(
      `			<char_semantics>${w.charSemantics ? "true" : "false"}</char_semantics>`
    );
    lines.push(
      `			<description>${escapeXml(w.description || "")}</description>`
    );
    lines.push(
      `			<logical_name>${escapeXml(w.logicalName || "")}</logical_name>`
    );
    lines.push(
      `			<physical_name>${escapeXml(w.physicalName || "")}</physical_name>`
    );
    lines.push(`			<type>${escapeXml(w.type || "varchar")}</type>`);
    lines.push(`		</word>`);
  }
  lines.push(`	</dictionary>`);
  lines.push(`	<tablespace_set>`);
  for (const ts of diagram3.tablespaces || []) {
    lines.push(`		<tablespace>`);
    lines.push(`			<id>${escapeXml(ts.id)}</id>`);
    lines.push(`			<name>${escapeXml(ts.name)}</name>`);
    if (ts.description)
      lines.push(
        `			<description>${escapeXml(ts.description)}</description>`
      );
    if (ts.properties) {
      lines.push(`			<properties>`);
      for (const [k, v] of Object.entries(ts.properties)) {
        if (v !== void 0 && v !== null) {
          lines.push(`				<${k}>${escapeXml(String(v))}</${k}>`);
        }
      }
      lines.push(`			</properties>`);
    }
    lines.push(`		</tablespace>`);
  }
  lines.push(`	</tablespace_set>`);
  lines.push(`	<contents>`);
  let colIdCounter = 0;
  for (let tIndex = 0; tIndex < diagram3.tables.length; tIndex++) {
    const table = diagram3.tables[tIndex];
    const tableId = table.id || String(tIndex);
    lines.push(`		<table>`);
    lines.push(`			<id>${escapeXml(tableId)}</id>`);
    lines.push(`			<height>${table.height || 100}</height>`);
    lines.push(`			<width>${table.width || 160}</width>`);
    lines.push(`			<font_name></font_name>`);
    lines.push(`			<font_size>9</font_size>`);
    lines.push(`			<x>${Math.round(table.x)}</x>`);
    lines.push(`			<y>${Math.round(table.y)}</y>`);
    serializeColor(lines, "			", table.color, { r: 128, g: 128, b: 192 });
    const incomingRelations = diagram3.relations.filter(
      (r) => r.targetTableId === table.id
    );
    const incomingComments = (diagram3.noteConnections || []).filter(
      (c) => c.targetId === table.id
    );
    lines.push(`			<connections>`);
    for (const rel of incomingRelations) {
      lines.push(`				<relation>`);
      lines.push(`					<id>${escapeXml(rel.id)}</id>`);
      lines.push(`					<source>${escapeXml(rel.sourceTableId)}</source>`);
      lines.push(`					<target>${escapeXml(rel.targetTableId)}</target>`);
      lines.push(`					<name>${escapeXml(rel.name)}</name>`);
      lines.push(
        `					<parent_cardinality>${escapeXml(rel.parentCardinality || "1")}</parent_cardinality>`
      );
      lines.push(
        `					<child_cardinality>${escapeXml(rel.childCardinality || "0..n")}</child_cardinality>`
      );
      lines.push(
        `					<reference_for_pk>${rel.referenceForPK ? "true" : "false"}</reference_for_pk>`
      );
      if (rel.referencedComplexUniqueKeyId) {
        lines.push(
          `					<referenced_complex_unique_key>${escapeXml(rel.referencedComplexUniqueKeyId)}</referenced_complex_unique_key>`
        );
      }
      lines.push(
        `					<on_delete_action>${escapeXml(rel.onDeleteAction || "RESTRICT")}</on_delete_action>`
      );
      lines.push(
        `					<on_update_action>${escapeXml(rel.onUpdateAction || "RESTRICT")}</on_update_action>`
      );
      if (rel.sourceColumnIds && rel.sourceColumnIds.length > 0) {
        lines.push(`					<source_column_ids>`);
        for (const cid of rel.sourceColumnIds) {
          lines.push(`						<column_id>${escapeXml(cid)}</column_id>`);
        }
        lines.push(`					</source_column_ids>`);
      }
      if (rel.targetColumnIds && rel.targetColumnIds.length > 0) {
        lines.push(`					<target_column_ids>`);
        for (const cid of rel.targetColumnIds) {
          lines.push(`						<column_id>${escapeXml(cid)}</column_id>`);
        }
        lines.push(`					</target_column_ids>`);
      }
      if (rel.bendpoints && rel.bendpoints.length > 0) {
        lines.push(`					<bendpoint_list>`);
        for (const bp of rel.bendpoints) {
          lines.push(`						<bendpoint>`);
          lines.push(
            `							<relative>${bp.relative ? "true" : "false"}</relative>`
          );
          lines.push(`							<x>${bp.x}</x>`);
          lines.push(`							<y>${bp.y}</y>`);
          lines.push(`						</bendpoint>`);
        }
        lines.push(`					</bendpoint_list>`);
      }
      lines.push(`				</relation>`);
    }
    serializeCommentConnections(lines, "				", incomingComments);
    lines.push(`			</connections>`);
    lines.push(
      `			<physical_name>${escapeXml(table.physicalName)}</physical_name>`
    );
    lines.push(
      `			<logical_name>${escapeXml(table.logicalName)}</logical_name>`
    );
    lines.push(
      `			<description>${escapeXml(table.description || "")}</description>`
    );
    lines.push(
      `			<constraint>${escapeXml(table.constraint || "")}</constraint>`
    );
    lines.push(
      `			<primary_key_name>${escapeXml(table.primaryKeyName || "")}</primary_key_name>`
    );
    lines.push(`			<option>${escapeXml(table.option || "")}</option>`);
    lines.push(`			<columns>`);
    for (const col of table.columns) {
      const wordId = ensureWordForColumn(col);
      const colId = col.id || String(colIdCounter++);
      serializeNormalColumn(lines, "				", col, wordId, colId);
    }
    for (const cgId of table.columnGroupIds || []) {
      lines.push(`				<column_group>${escapeXml(cgId)}</column_group>`);
    }
    lines.push(`			</columns>`);
    lines.push(`			<indexes>`);
    for (const idx of table.indexes || []) {
      lines.push(`				<inidex>`);
      lines.push(
        `					<full_text>${idx.fullText ? "true" : "false"}</full_text>`
      );
      lines.push(
        `					<non_unique>${idx.nonUnique ? "true" : "false"}</non_unique>`
      );
      lines.push(`					<name>${escapeXml(idx.name)}</name>`);
      lines.push(`					<type>${escapeXml(idx.type || "")}</type>`);
      lines.push(
        `					<description>${escapeXml(idx.description || "")}</description>`
      );
      lines.push(`					<columns>`);
      for (const ic of idx.columns) {
        lines.push(`						<column>`);
        lines.push(`							<id>${escapeXml(ic.columnId)}</id>`);
        lines.push(
          `							<desc>${ic.order === "DESC" ? "true" : "false"}</desc>`
        );
        lines.push(`						</column>`);
      }
      lines.push(`					</columns>`);
      lines.push(`				</inidex>`);
    }
    lines.push(`			</indexes>`);
    lines.push(`			<complex_unique_key_list>`);
    for (const cuk of table.complexUniqueKeys || []) {
      lines.push(`				<complex_unique_key>`);
      lines.push(`					<id>${escapeXml(cuk.id)}</id>`);
      lines.push(`					<name>${escapeXml(cuk.name)}</name>`);
      lines.push(`					<columns>`);
      for (const colId of cuk.columns) {
        lines.push(`						<column>`);
        lines.push(`							<id>${escapeXml(colId)}</id>`);
        lines.push(`						</column>`);
      }
      lines.push(`					</columns>`);
      lines.push(`				</complex_unique_key>`);
    }
    lines.push(`			</complex_unique_key_list>`);
    if (table.tableProperties) {
      const tp = table.tableProperties;
      lines.push(`			<table_properties>`);
      if (tp.tablespaceId)
        lines.push(
          `				<tablespace_id>${escapeXml(tp.tablespaceId)}</tablespace_id>`
        );
      lines.push(`				<schema>${escapeXml(tp.schema || "")}</schema>`);
      if (tp.characterSet)
        lines.push(
          `				<character_set>${escapeXml(tp.characterSet)}</character_set>`
        );
      if (tp.collation)
        lines.push(`				<collation>${escapeXml(tp.collation)}</collation>`);
      if (tp.storageEngine)
        lines.push(
          `				<storage_engine>${escapeXml(tp.storageEngine)}</storage_engine>`
        );
      if (tp.primaryKeyLengthOfText !== void 0) {
        lines.push(
          `				<primary_key_length_of_text>${tp.primaryKeyLengthOfText}</primary_key_length_of_text>`
        );
      }
      lines.push(
        `				<without_oids>${tp.withoutOIDs ? "true" : "false"}</without_oids>`
      );
      lines.push(`			</table_properties>`);
    }
    lines.push(`		</table>`);
  }
  for (let vIndex = 0; vIndex < (diagram3.views || []).length; vIndex++) {
    const view = diagram3.views[vIndex];
    const viewId = view.id || `view_${vIndex}`;
    lines.push(`		<view>`);
    lines.push(`			<id>${escapeXml(viewId)}</id>`);
    lines.push(`			<height>${view.height || 120}</height>`);
    lines.push(`			<width>${view.width || 180}</width>`);
    lines.push(`			<font_name></font_name>`);
    lines.push(`			<font_size>9</font_size>`);
    lines.push(`			<x>${Math.round(view.x)}</x>`);
    lines.push(`			<y>${Math.round(view.y)}</y>`);
    serializeColor(lines, "			", view.color, { r: 166, g: 227, b: 161 });
    const incomingComments = (diagram3.noteConnections || []).filter(
      (c) => c.targetId === view.id
    );
    lines.push(`			<connections>`);
    serializeCommentConnections(lines, "				", incomingComments);
    lines.push(`			</connections>`);
    lines.push(
      `			<physical_name>${escapeXml(view.physicalName)}</physical_name>`
    );
    lines.push(
      `			<logical_name>${escapeXml(view.logicalName)}</logical_name>`
    );
    lines.push(
      `			<description>${escapeXml(view.description || "")}</description>`
    );
    lines.push(`			<sql>${escapeXml(view.sql || "")}</sql>`);
    lines.push(`			<columns>`);
    for (const col of view.columns || []) {
      const wordId = ensureWordForColumn(col);
      const colId = col.id || String(colIdCounter++);
      serializeNormalColumn(lines, "				", col, wordId, colId);
    }
    for (const cgId of view.columnGroupIds || []) {
      lines.push(`				<column_group>${escapeXml(cgId)}</column_group>`);
    }
    lines.push(`			</columns>`);
    lines.push(`			<view_properties>`);
    lines.push(`				<schema>${escapeXml(view.schema || "")}</schema>`);
    lines.push(`			</view_properties>`);
    lines.push(`		</view>`);
  }
  for (let nIndex = 0; nIndex < diagram3.notes.length; nIndex++) {
    const note = diagram3.notes[nIndex];
    const incomingComments = (diagram3.noteConnections || []).filter(
      (c) => c.targetId === note.id
    );
    lines.push(`		<note>`);
    lines.push(`			<id>${escapeXml(note.id || String(nIndex))}</id>`);
    lines.push(`			<height>${note.height || 80}</height>`);
    lines.push(`			<width>${note.width || 150}</width>`);
    lines.push(`			<font_name></font_name>`);
    lines.push(`			<font_size>9</font_size>`);
    lines.push(`			<x>${Math.round(note.x)}</x>`);
    lines.push(`			<y>${Math.round(note.y)}</y>`);
    serializeColor(lines, "			", note.color, { r: 255, g: 255, b: 128 });
    lines.push(`			<connections>`);
    serializeCommentConnections(lines, "				", incomingComments);
    lines.push(`			</connections>`);
    lines.push(`			<text>${escapeXml(note.text)}</text>`);
    lines.push(`		</note>`);
  }
  for (let iIndex = 0; iIndex < (diagram3.images || []).length; iIndex++) {
    const img = diagram3.images[iIndex];
    const incomingComments = (diagram3.noteConnections || []).filter(
      (c) => c.targetId === img.id
    );
    lines.push(`		<image>`);
    lines.push(`			<id>${escapeXml(img.id || `img_${iIndex}`)}</id>`);
    lines.push(`			<height>${Math.round(img.height || 150)}</height>`);
    lines.push(`			<width>${Math.round(img.width || 200)}</width>`);
    lines.push(`			<font_name></font_name>`);
    lines.push(`			<font_size>9</font_size>`);
    lines.push(`			<x>${Math.round(img.x)}</x>`);
    lines.push(`			<y>${Math.round(img.y)}</y>`);
    serializeColor(lines, "			", img.color, { r: 255, g: 255, b: 255 });
    lines.push(`			<connections>`);
    serializeCommentConnections(lines, "				", incomingComments);
    lines.push(`			</connections>`);
    lines.push(`			<data>${escapeXml(img.data)}</data>`);
    lines.push(`			<hue>${img.hue ?? 0}</hue>`);
    lines.push(`			<saturation>${img.saturation ?? 0}</saturation>`);
    lines.push(`			<brightness>${img.brightness ?? 0}</brightness>`);
    lines.push(`			<alpha>${img.alpha ?? 255}</alpha>`);
    lines.push(
      `			<fix_aspect_ratio>${img.fixAspectRatio !== false ? "true" : "false"}</fix_aspect_ratio>`
    );
    lines.push(`		</image>`);
  }
  lines.push(`	</contents>`);
  lines.push(`	<column_groups>`);
  for (const cg of diagram3.columnGroups || []) {
    lines.push(`		<column_group>`);
    lines.push(`			<id>${escapeXml(cg.id)}</id>`);
    lines.push(`			<group_name>${escapeXml(cg.groupName)}</group_name>`);
    lines.push(`			<columns>`);
    for (const col of cg.columns) {
      const wordId = ensureWordForColumn(col);
      const colId = col.id || String(colIdCounter++);
      serializeNormalColumn(lines, "				", col, wordId, colId);
    }
    lines.push(`			</columns>`);
    lines.push(`		</column_group>`);
  }
  lines.push(`	</column_groups>`);
  lines.push(`	<test_data_list>`);
  for (const td of diagram3.testDataList || []) {
    lines.push(`		<test_data>`);
    lines.push(`			<name>${escapeXml(td.name)}</name>`);
    for (const ttd of td.tableTestData || []) {
      lines.push(`			<table_test_data>`);
      lines.push(`				<table_id>${escapeXml(ttd.tableId)}</table_id>`);
      lines.push(`				<direct_test_data>`);
      for (const row of ttd.directTestData || []) {
        lines.push(`					<data>`);
        for (const [colId, val] of Object.entries(row.values)) {
          lines.push(`						<column_data>`);
          lines.push(
            `							<column_id>${escapeXml(colId)}</column_id>`
          );
          lines.push(`							<value>${escapeXml(val)}</value>`);
          lines.push(`						</column_data>`);
        }
        lines.push(`					</data>`);
      }
      lines.push(`				</direct_test_data>`);
      lines.push(`			</table_test_data>`);
    }
    lines.push(`		</test_data>`);
  }
  lines.push(`	</test_data_list>`);
  lines.push(`	<sequence_set>`);
  for (const seq of diagram3.sequences || []) {
    lines.push(`		<sequence>`);
    lines.push(`			<name>${escapeXml(seq.name)}</name>`);
    lines.push(`			<schema>${escapeXml(seq.schema || "")}</schema>`);
    lines.push(`			<increment>${seq.increment ?? ""}</increment>`);
    lines.push(`			<min_value>${seq.minValue ?? ""}</min_value>`);
    lines.push(`			<max_value>${seq.maxValue ?? ""}</max_value>`);
    lines.push(`			<start>${seq.start ?? ""}</start>`);
    lines.push(`			<cache>${seq.cache ?? ""}</cache>`);
    lines.push(`			<nocache>${seq.nocache ? "true" : "false"}</nocache>`);
    lines.push(`			<cycle>${seq.cycle ? "true" : "false"}</cycle>`);
    lines.push(`			<order>${seq.order ? "true" : "false"}</order>`);
    lines.push(
      `			<description>${escapeXml(seq.description || "")}</description>`
    );
    lines.push(`			<data_type>${escapeXml(seq.dataType || "")}</data_type>`);
    lines.push(`			<decimal_size>${seq.decimalSize ?? ""}</decimal_size>`);
    lines.push(`		</sequence>`);
  }
  lines.push(`	</sequence_set>`);
  lines.push(`	<trigger_set>`);
  for (const trg of diagram3.triggers || []) {
    lines.push(`		<trigger>`);
    lines.push(`			<name>${escapeXml(trg.name)}</name>`);
    lines.push(`			<schema>${escapeXml(trg.schema || "")}</schema>`);
    lines.push(`			<sql>${escapeXml(trg.sql)}</sql>`);
    lines.push(
      `			<description>${escapeXml(trg.description || "")}</description>`
    );
    lines.push(`		</trigger>`);
  }
  lines.push(`	</trigger_set>`);
  lines.push(`	<change_tracking_list>`);
  for (const ct of diagram3.changeTrackingList || []) {
    lines.push(`		<change_tracking>`);
    lines.push(`			<comment>${escapeXml(ct.comment)}</comment>`);
    lines.push(`			<updated_date>${escapeXml(ct.updatedDate)}</updated_date>`);
    lines.push(`			<table_count>${ct.tableCount}</table_count>`);
    lines.push(`			<column_count>${ct.columnCount}</column_count>`);
    for (const tn of ct.tableNames || []) {
      lines.push(`			<table_name>${escapeXml(tn)}</table_name>`);
    }
    lines.push(`		</change_tracking>`);
  }
  lines.push(`	</change_tracking_list>`);
  lines.push(`</diagram>`);
  return lines.join("\n");
}

// src/ddl/ddlGenerator.ts
var DEFAULT_OPTIONS = {
  dropTables: true,
  createTablespaces: true,
  createSequences: true,
  createTables: true,
  createIndexes: true,
  createViews: true,
  createForeignKeys: true,
  createTriggers: true,
  createComments: true
};
function generateDDL(diagram3, targetDb, options) {
  const opts = { ...DEFAULT_OPTIONS, ...options || {} };
  const rawDb = targetDb || diagram3.db || "PostgreSQL";
  const db = rawDb.toUpperCase();
  const statements = [];
  const isPostgres = db.includes("POSTGRES");
  const isMySQL = db.includes("MYSQL");
  const isOracle = db.includes("ORACLE");
  const isTibero = db.includes("TIBERO");
  const isOracleLike = isOracle || isTibero;
  const isSqlServer = db.includes("SQLSERVER");
  const isCUBRID = db.includes("CUBRID");
  const isDB2 = db.includes("DB2");
  const isSQLite = db.includes("SQLITE");
  const isH2 = db === "H2";
  const isHSQLDB = db.includes("HSQLDB");
  const isAccess = db.includes("ACCESS");
  statements.push(`-- =============================================`);
  statements.push(`-- DBMS: ${rawDb}`);
  statements.push(`-- Generated by ERMaster for VS Code`);
  statements.push(`-- Created at: ${(/* @__PURE__ */ new Date()).toISOString()}`);
  statements.push(`-- =============================================
`);
  if (isMySQL && opts.dropTables) {
    statements.push(`SET FOREIGN_KEY_CHECKS = 0;
`);
  }
  const tablespaceMap = new Map((diagram3.tablespaces || []).map((ts) => [ts.id, ts]));
  if (opts.createTablespaces && diagram3.tablespaces && diagram3.tablespaces.length > 0) {
    statements.push(`-- 0. Tablespaces`);
    for (const ts of diagram3.tablespaces) {
      if (ts.description)
        statements.push(`-- ${ts.description}`);
      const location = ts.properties?.location || ts.properties?.data_file;
      if (isPostgres && location) {
        statements.push(`CREATE TABLESPACE ${ts.name} LOCATION '${escapeSql(String(location))}';`);
      } else if (isOracleLike && location) {
        const size = ts.properties?.file_size || "100M";
        statements.push(`CREATE TABLESPACE ${ts.name} DATAFILE '${escapeSql(String(location))}' SIZE ${size};`);
      } else if (isMySQL && location) {
        const engine = ts.properties?.engine || "InnoDB";
        statements.push(`CREATE TABLESPACE ${ts.name} ADD DATAFILE '${escapeSql(String(location))}' ENGINE=${engine};`);
      } else if (isDB2) {
        const managedBy = ts.properties?.managed_by || "AUTOMATIC STORAGE";
        statements.push(`CREATE TABLESPACE ${ts.name} MANAGED BY ${managedBy};`);
      } else {
        statements.push(`-- Tablespace: ${ts.name}${location ? ` (${location})` : ""}`);
      }
    }
    statements.push("");
  }
  if (opts.dropTables) {
    if (diagram3.views && diagram3.views.length > 0) {
      statements.push(`-- 1a. Drop Views`);
      for (const view of diagram3.views) {
        const q = qualifyName(view.schema, view.physicalName);
        if (isPostgres || isH2) {
          statements.push(`DROP VIEW IF EXISTS ${q} CASCADE;`);
        } else if (isSqlServer) {
          statements.push(`IF OBJECT_ID('${escapeSql(q)}', 'V') IS NOT NULL DROP VIEW ${q};`);
        } else if (isOracleLike) {
          statements.push(`DROP VIEW ${q};`);
        } else {
          statements.push(`DROP VIEW IF EXISTS ${q};`);
        }
      }
      statements.push("");
    }
    if (diagram3.tables.length > 0) {
      statements.push(`-- 1b. Drop Tables`);
      for (let i = diagram3.tables.length - 1; i >= 0; i--) {
        const table = diagram3.tables[i];
        const q = qualifyName(table.tableProperties?.schema, table.physicalName);
        if (isPostgres || isH2 || isHSQLDB) {
          statements.push(`DROP TABLE IF EXISTS ${q} CASCADE;`);
        } else if (isOracleLike) {
          statements.push(
            `BEGIN
  EXECUTE IMMEDIATE 'DROP TABLE ${q} CASCADE CONSTRAINTS';
EXCEPTION
  WHEN OTHERS THEN IF SQLCODE != -942 THEN RAISE; END IF;
END;
/`
          );
        } else if (isSqlServer) {
          statements.push(`IF OBJECT_ID('${escapeSql(q)}', 'U') IS NOT NULL DROP TABLE ${q};`);
        } else if (isDB2 || isAccess) {
          statements.push(`DROP TABLE ${q};`);
        } else {
          statements.push(`DROP TABLE IF EXISTS ${q};`);
        }
      }
      statements.push("");
    }
    if (diagram3.sequences && diagram3.sequences.length > 0 && !isMySQL && !isSQLite) {
      statements.push(`-- 1c. Drop Sequences`);
      for (const seq of diagram3.sequences) {
        const q = qualifyName(seq.schema, seq.name);
        if (isOracleLike || isDB2) {
          statements.push(`DROP SEQUENCE ${q};`);
        } else {
          statements.push(`DROP SEQUENCE IF EXISTS ${q};`);
        }
      }
      statements.push("");
    }
  }
  if (opts.createSequences && diagram3.sequences && diagram3.sequences.length > 0 && !isMySQL && !isSQLite) {
    statements.push(`-- 2. Sequences`);
    for (const seq of diagram3.sequences) {
      const q = qualifyName(seq.schema, seq.name);
      const parts = [`CREATE SEQUENCE ${q}`];
      if (isSqlServer && seq.dataType)
        parts.push(`AS ${seq.dataType.toUpperCase()}`);
      if (seq.increment !== void 0)
        parts.push(`INCREMENT BY ${seq.increment}`);
      if (seq.start !== void 0)
        parts.push(`START WITH ${seq.start}`);
      if (seq.minValue !== void 0)
        parts.push(`MINVALUE ${seq.minValue}`);
      if (seq.maxValue !== void 0)
        parts.push(`MAXVALUE ${seq.maxValue}`);
      if (seq.nocache) {
        parts.push(isOracleLike ? "NOCACHE" : isPostgres ? "CACHE 1" : "NO CACHE");
      } else if (seq.cache !== void 0) {
        parts.push(`CACHE ${seq.cache}`);
      }
      if (seq.cycle) {
        parts.push("CYCLE");
      } else if (isOracleLike) {
        parts.push("NOCYCLE");
      }
      if (seq.order && isOracleLike) {
        parts.push("ORDER");
      }
      statements.push(parts.join(" ") + ";");
    }
    statements.push("");
  }
  const groupMap = new Map((diagram3.columnGroups || []).map((g) => [g.id, g]));
  const tableColumnsById = /* @__PURE__ */ new Map();
  if (opts.createTables) {
    statements.push(`-- 3. Create Tables`);
    for (const table of diagram3.tables) {
      const qualified = qualifyName(table.tableProperties?.schema, table.physicalName);
      const allColumns = [...table.columns];
      for (const cgId of table.columnGroupIds || []) {
        const group = groupMap.get(cgId);
        if (group)
          allColumns.push(...group.columns);
      }
      tableColumnsById.set(table.id, allColumns);
      const colDefs = [];
      const pks = [];
      const colById = /* @__PURE__ */ new Map();
      for (const col of allColumns) {
        colById.set(col.id, col);
        let dataTypeStr = formatDataType(col, db);
        let autoIncSuffix = "";
        if (col.autoIncrement) {
          if (isPostgres) {
            if (dataTypeStr === "BIGINT")
              dataTypeStr = "BIGSERIAL";
            else if (dataTypeStr === "SMALLINT")
              dataTypeStr = "SMALLSERIAL";
            else
              dataTypeStr = "SERIAL";
          } else if (isMySQL || isCUBRID) {
            autoIncSuffix = " AUTO_INCREMENT";
          } else if (isSqlServer) {
            autoIncSuffix = " IDENTITY(1,1)";
          } else if (isDB2) {
            autoIncSuffix = " GENERATED ALWAYS AS IDENTITY";
          } else if (isSQLite && col.primaryKey) {
            autoIncSuffix = " AUTOINCREMENT";
          } else if (isH2 || isHSQLDB) {
            autoIncSuffix = " AUTO_INCREMENT";
          } else if (isOracleLike) {
            autoIncSuffix = " GENERATED BY DEFAULT AS IDENTITY";
          }
        }
        let colDef = `  ${col.physicalName} ${dataTypeStr}`;
        if (isMySQL && col.characterSet)
          colDef += ` CHARACTER SET ${col.characterSet}`;
        if (isMySQL && col.collation)
          colDef += ` COLLATE ${col.collation}`;
        if (col.defaultValue)
          colDef += ` DEFAULT ${col.defaultValue}`;
        if (col.notNull && !(isSQLite && col.primaryKey && col.autoIncrement))
          colDef += " NOT NULL";
        if (col.uniqueKey && !col.primaryKey)
          colDef += " UNIQUE";
        if (col.constraint)
          colDef += ` ${col.constraint}`;
        if (isSQLite && col.primaryKey && col.autoIncrement) {
          colDef += " PRIMARY KEY AUTOINCREMENT";
        } else {
          colDef += autoIncSuffix;
        }
        if (isMySQL && opts.createComments && (col.logicalName || col.description)) {
          const cmt = buildComment(col.logicalName, col.description);
          colDef += ` COMMENT '${escapeSql(cmt)}'`;
        }
        if (col.primaryKey)
          pks.push(col.physicalName);
        colDefs.push(colDef);
      }
      if (pks.length > 0 && !(isSQLite && pks.length === 1 && allColumns.find((c) => c.primaryKey)?.autoIncrement)) {
        const pkConstraint = table.primaryKeyName ? `CONSTRAINT ${table.primaryKeyName} ` : "";
        colDefs.push(`  ${pkConstraint}PRIMARY KEY (${pks.join(", ")})`);
      }
      for (const cuk of table.complexUniqueKeys || []) {
        const cukColNames = cuk.columns.map((cid) => colById.get(cid)?.physicalName).filter((n) => Boolean(n));
        if (cukColNames.length > 0) {
          const ukName = cuk.name ? `CONSTRAINT ${cuk.name} ` : "";
          colDefs.push(`  ${ukName}UNIQUE (${cukColNames.join(", ")})`);
        }
      }
      if (table.constraint) {
        colDefs.push(`  ${table.constraint}`);
      }
      let createTable = `CREATE TABLE ${qualified} (
${colDefs.join(",\n")}
)`;
      if (isPostgres && table.tableProperties?.withoutOIDs) {
        createTable += " WITHOUT OIDS";
      }
      if (isMySQL) {
        if (table.tableProperties?.storageEngine)
          createTable += ` ENGINE=${table.tableProperties.storageEngine}`;
        if (table.tableProperties?.characterSet)
          createTable += ` DEFAULT CHARSET=${table.tableProperties.characterSet}`;
        if (table.tableProperties?.collation)
          createTable += ` COLLATE=${table.tableProperties.collation}`;
        if (opts.createComments && (table.logicalName || table.description)) {
          createTable += ` COMMENT='${escapeSql(buildComment(table.logicalName, table.description))}'`;
        }
      }
      if (table.tableProperties?.tablespaceId) {
        const ts = tablespaceMap.get(table.tableProperties.tablespaceId);
        if (ts) {
          if (isPostgres || isOracleLike || isMySQL) {
            createTable += ` TABLESPACE ${ts.name}`;
          } else if (isDB2) {
            createTable += ` IN ${ts.name}`;
          }
        }
      }
      if (table.option) {
        createTable += ` ${table.option}`;
      }
      createTable += ";";
      statements.push(createTable);
      if (opts.createIndexes) {
        for (const idx of table.indexes || []) {
          const idxCols = idx.columns.map((ic) => {
            const c = colById.get(ic.columnId);
            if (!c)
              return null;
            return `${c.physicalName}${ic.order === "DESC" ? " DESC" : ""}`;
          }).filter((n) => Boolean(n));
          if (idxCols.length > 0) {
            const uniqueKw = !idx.nonUnique ? "UNIQUE " : idx.fullText && isMySQL ? "FULLTEXT " : "";
            let idxSql = `CREATE ${uniqueKw}INDEX ${idx.name} ON ${qualified}`;
            if (isPostgres && idx.type) {
              idxSql += ` USING ${idx.type.toLowerCase()}`;
            }
            idxSql += ` (${idxCols.join(", ")})`;
            if (isMySQL && idx.type && !idx.fullText) {
              idxSql += ` USING ${idx.type.toUpperCase()}`;
            }
            statements.push(idxSql + ";");
          }
        }
      }
      if (opts.createComments && !isMySQL && !isSQLite && !isAccess) {
        if (table.logicalName || table.description) {
          const tableComment = buildComment(table.logicalName, table.description);
          if (isPostgres || isOracleLike || isDB2 || isH2) {
            statements.push(`COMMENT ON TABLE ${qualified} IS '${escapeSql(tableComment)}';`);
          } else if (isSqlServer) {
            statements.push(
              `EXEC sp_addextendedproperty 'MS_Description', N'${escapeSql(tableComment)}', 'SCHEMA', N'${table.tableProperties?.schema || "dbo"}', 'TABLE', N'${table.physicalName}';`
            );
          }
        }
        for (const col of allColumns) {
          if (col.logicalName || col.description) {
            const colComment = buildComment(col.logicalName, col.description);
            if (isPostgres || isOracleLike || isDB2 || isH2) {
              statements.push(`COMMENT ON COLUMN ${qualified}.${col.physicalName} IS '${escapeSql(colComment)}';`);
            } else if (isSqlServer) {
              statements.push(
                `EXEC sp_addextendedproperty 'MS_Description', N'${escapeSql(colComment)}', 'SCHEMA', N'${table.tableProperties?.schema || "dbo"}', 'TABLE', N'${table.physicalName}', 'COLUMN', N'${col.physicalName}';`
              );
            }
          }
        }
      }
      statements.push("");
    }
  }
  if (opts.createViews && diagram3.views && diagram3.views.length > 0) {
    statements.push(`-- 4. Views`);
    for (const view of diagram3.views) {
      const q = qualifyName(view.schema, view.physicalName);
      const viewSql = (view.sql || "").trim().replace(/;+$/, "") || "SELECT 1";
      if (isPostgres || isMySQL || isOracleLike || isH2) {
        statements.push(`CREATE OR REPLACE VIEW ${q} AS
${viewSql};`);
      } else {
        statements.push(`CREATE VIEW ${q} AS
${viewSql};`);
      }
    }
    statements.push("");
  }
  if (opts.createForeignKeys && diagram3.relations.length > 0) {
    statements.push(`-- 5. Foreign Keys`);
    for (const rel of diagram3.relations) {
      const sourceTable = diagram3.tables.find((t) => t.id === rel.sourceTableId);
      const targetTable = diagram3.tables.find((t) => t.id === rel.targetTableId);
      if (!sourceTable || !targetTable)
        continue;
      const srcCols = tableColumnsById.get(sourceTable.id) || sourceTable.columns;
      const tgtCols = tableColumnsById.get(targetTable.id) || targetTable.columns;
      const { fkCols, pkCols } = resolveRelationColumns(rel, sourceTable, targetTable, srcCols, tgtCols);
      if (fkCols.length === 0 || pkCols.length === 0)
        continue;
      const targetQ = qualifyName(targetTable.tableProperties?.schema, targetTable.physicalName);
      const sourceQ = qualifyName(sourceTable.tableProperties?.schema, sourceTable.physicalName);
      const fkName = rel.name || `FK_${targetTable.physicalName}_${sourceTable.physicalName}`;
      let fkStmt = `ALTER TABLE ${targetQ} ADD CONSTRAINT ${fkName} FOREIGN KEY (${fkCols.join(", ")}) REFERENCES ${sourceQ} (${pkCols.join(", ")})`;
      if (rel.onDeleteAction && rel.onDeleteAction !== "RESTRICT") {
        if (!(isOracleLike && rel.onDeleteAction === "NO ACTION")) {
          fkStmt += ` ON DELETE ${rel.onDeleteAction}`;
        }
      }
      if (rel.onUpdateAction && rel.onUpdateAction !== "RESTRICT" && !isOracleLike) {
        fkStmt += ` ON UPDATE ${rel.onUpdateAction}`;
      }
      fkStmt += ";";
      statements.push(fkStmt);
    }
    statements.push("");
  }
  if (opts.createTriggers && diagram3.triggers && diagram3.triggers.length > 0) {
    statements.push(`-- 6. Triggers`);
    for (const trg of diagram3.triggers) {
      if (trg.description)
        statements.push(`-- ${trg.description}`);
      if (trg.sql && trg.sql.trim()) {
        statements.push(trg.sql.trim());
      } else {
        statements.push(`-- Trigger ${qualifyName(trg.schema, trg.name)} (SQL \uBCF8\uBB38 \uC5C6\uC74C)`);
      }
    }
    statements.push("");
  }
  if (isMySQL && opts.dropTables) {
    statements.push(`SET FOREIGN_KEY_CHECKS = 1;`);
  }
  return statements.join("\n");
}
function resolveRelationColumns(rel, sourceTable, targetTable, srcCols, tgtCols) {
  const srcMap = new Map(srcCols.map((c) => [c.id, c.physicalName]));
  const tgtMap = new Map(tgtCols.map((c) => [c.id, c.physicalName]));
  if (rel.sourceColumnIds?.length && rel.targetColumnIds?.length) {
    const pkCols = rel.sourceColumnIds.map((id) => srcMap.get(id)).filter((n) => Boolean(n));
    const fkCols2 = rel.targetColumnIds.map((id) => tgtMap.get(id)).filter((n) => Boolean(n));
    if (pkCols.length > 0 && fkCols2.length === pkCols.length) {
      return { fkCols: fkCols2, pkCols };
    }
  }
  const linkedTargets = tgtCols.filter((c) => c.relationId === rel.id && c.referencedColumnId && srcMap.has(c.referencedColumnId));
  if (linkedTargets.length > 0) {
    return {
      fkCols: linkedTargets.map((c) => c.physicalName),
      pkCols: linkedTargets.map((c) => srcMap.get(c.referencedColumnId))
    };
  }
  const sourcePks = srcCols.filter((c) => c.primaryKey);
  if (sourcePks.length === 0) {
    return { fkCols: [], pkCols: [] };
  }
  if (sourcePks.length === 1) {
    const pkName = sourcePks[0].physicalName;
    const matchedFk = tgtCols.find((c) => c.physicalName.toLowerCase() === `${sourceTable.physicalName}_${pkName}`.toLowerCase()) || tgtCols.find((c) => c.physicalName.toLowerCase().includes(sourceTable.physicalName.toLowerCase())) || tgtCols.find((c) => !c.primaryKey && c.physicalName.toLowerCase().endsWith("_id")) || tgtCols.find((c) => c.physicalName.toLowerCase() === pkName.toLowerCase());
    return {
      pkCols: [pkName],
      fkCols: [matchedFk ? matchedFk.physicalName : `${sourceTable.physicalName}_${pkName}`]
    };
  }
  const fkCols = sourcePks.map((pk) => {
    const found = tgtCols.find((c) => c.physicalName.toLowerCase() === pk.physicalName.toLowerCase()) || tgtCols.find((c) => c.physicalName.toLowerCase() === `${sourceTable.physicalName}_${pk.physicalName}`.toLowerCase());
    return found ? found.physicalName : `${sourceTable.physicalName}_${pk.physicalName}`;
  });
  return {
    pkCols: sourcePks.map((pk) => pk.physicalName),
    fkCols
  };
}
function qualifyName(schema, name) {
  return schema && schema.trim() ? `${schema.trim()}.${name}` : name;
}
function buildComment(logicalName, description) {
  if (logicalName && description && logicalName !== description) {
    return `${logicalName}: ${description}`;
  }
  return logicalName || description || "";
}
function formatDataType(col, db) {
  const type = (col.type || "varchar").toUpperCase();
  const len = col.length;
  const dec = col.decimal;
  const isOracleLike = db.includes("ORACLE") || db.includes("TIBERO");
  const isSqlServer = db.includes("SQLSERVER");
  const isPostgres = db.includes("POSTGRES");
  if (type.includes("VARCHAR") || type === "STRING") {
    if (isOracleLike)
      return `VARCHAR2(${len || 255})`;
    return `VARCHAR(${len || 255})`;
  }
  if (type === "CHAR" || type === "NCHAR" || type === "NVARCHAR") {
    return `${type}(${len || 1})`;
  }
  if (type.includes("DECIMAL") || type.includes("NUMERIC") || type === "NUMBER") {
    const base = isOracleLike ? "NUMBER" : type;
    if (len && dec)
      return `${base}(${len}, ${dec})`;
    if (len)
      return `${base}(${len})`;
    return base;
  }
  if (type === "INT" || type === "INTEGER") {
    if (isOracleLike)
      return "NUMBER(10)";
    return isSqlServer ? "INT" : "INTEGER";
  }
  if (type === "BIGINT" || type === "LONG") {
    if (isOracleLike)
      return "NUMBER(19)";
    return "BIGINT";
  }
  if (type === "SMALLINT") {
    if (isOracleLike)
      return "NUMBER(5)";
    return "SMALLINT";
  }
  if (type === "DATE" || type === "DATETIME" || type === "TIMESTAMP") {
    if (isOracleLike && type === "DATETIME")
      return "DATE";
    if (isSqlServer && type === "TIMESTAMP")
      return "DATETIME2";
    if (isPostgres && type === "DATETIME")
      return "TIMESTAMP";
    return type;
  }
  if (type === "BOOLEAN" || type === "BOOL") {
    if (isOracleLike)
      return "NUMBER(1)";
    if (isSqlServer)
      return "BIT";
    return "BOOLEAN";
  }
  if (type === "TEXT" || type === "CLOB") {
    if (isOracleLike)
      return "CLOB";
    if (isSqlServer)
      return "NVARCHAR(MAX)";
    return "TEXT";
  }
  if (type === "BLOB" || type === "BYTEA") {
    if (isPostgres)
      return "BYTEA";
    if (isSqlServer)
      return "VARBINARY(MAX)";
    return "BLOB";
  }
  return len ? `${type}(${len})` : type;
}
function escapeSql(str = "") {
  return str.replace(/'/g, "''");
}

// src/ddl/diagramValidator.ts
var RESERVED_WORDS = /* @__PURE__ */ new Set([
  "SELECT",
  "FROM",
  "WHERE",
  "INSERT",
  "UPDATE",
  "DELETE",
  "CREATE",
  "DROP",
  "ALTER",
  "TABLE",
  "VIEW",
  "INDEX",
  "SEQUENCE",
  "TRIGGER",
  "USER",
  "ORDER",
  "GROUP",
  "BY",
  "HAVING",
  "JOIN",
  "INNER",
  "LEFT",
  "RIGHT",
  "OUTER",
  "ON",
  "AS",
  "AND",
  "OR",
  "NOT",
  "NULL",
  "TRUE",
  "FALSE",
  "DEFAULT",
  "PRIMARY",
  "KEY",
  "FOREIGN",
  "REFERENCES",
  "UNIQUE",
  "CHECK",
  "CONSTRAINT",
  "VALUES",
  "INTO",
  "SET",
  "BEGIN",
  "END",
  "CASE",
  "WHEN",
  "THEN",
  "ELSE",
  "EXISTS",
  "IN",
  "BETWEEN",
  "LIKE",
  "IS",
  "UNION",
  "ALL",
  "DISTINCT",
  "TOP",
  "LIMIT",
  "OFFSET",
  "DESC",
  "ASC",
  "GRANT",
  "REVOKE",
  "COMMIT",
  "ROLLBACK",
  "SESSION",
  "DATE",
  "TIME",
  "TIMESTAMP",
  "LEVEL",
  "NUMBER",
  "COMMENT"
]);
function validateDiagram(diagram3, targetDb) {
  const issues2 = [];
  const db = (targetDb || diagram3.db || "PostgreSQL").toUpperCase();
  const groupMap = new Map((diagram3.columnGroups || []).map((g) => [g.id, g]));
  const objectNames = /* @__PURE__ */ new Map();
  const registerObjectName = (rawName, kind) => {
    const name = (rawName || "").trim().toUpperCase();
    if (!name)
      return;
    if (objectNames.has(name)) {
      issues2.push({
        severity: "error",
        category: kind,
        targetName: rawName,
        message: `\uBB3C\uB9AC\uBA85 '${rawName}'\uC774(\uAC00) \uB2E4\uB978 \uAC1D\uCCB4(${objectNames.get(name)})\uC640 \uC911\uBCF5\uB429\uB2C8\uB2E4.`
      });
    } else {
      objectNames.set(name, `${kind}:${rawName}`);
    }
  };
  for (const table of diagram3.tables) {
    const tName = (table.physicalName || "").trim();
    if (!tName) {
      issues2.push({
        severity: "error",
        category: "Table",
        targetName: table.logicalName || table.id,
        message: "\uD14C\uC774\uBE14\uC758 \uBB3C\uB9AC\uBA85\uC774 \uC785\uB825\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4."
      });
    } else {
      registerObjectName(tName, "Table");
      if (RESERVED_WORDS.has(tName.toUpperCase())) {
        issues2.push({
          severity: "warning",
          category: "Table",
          targetName: tName,
          message: `\uD14C\uC774\uBE14\uBA85 '${tName}'\uC740(\uB294) SQL \uC608\uC57D\uC5B4\uC785\uB2C8\uB2E4.`
        });
      }
    }
    const allColumns = [...table.columns];
    for (const cgId of table.columnGroupIds || []) {
      const g = groupMap.get(cgId);
      if (g)
        allColumns.push(...g.columns);
    }
    if (allColumns.length === 0) {
      issues2.push({
        severity: "error",
        category: "Table",
        targetName: tName || table.logicalName || table.id,
        message: "\uD14C\uC774\uBE14\uC5D0 \uCEEC\uB7FC\uC774 \uD558\uB098\uB3C4 \uC5C6\uC2B5\uB2C8\uB2E4."
      });
    }
    const colNames = /* @__PURE__ */ new Set();
    for (const col of allColumns) {
      const cName = (col.physicalName || "").trim();
      if (!cName) {
        issues2.push({
          severity: "error",
          category: "Column",
          targetName: `${tName || table.id}.${col.logicalName || col.id}`,
          message: "\uCEEC\uB7FC\uC758 \uBB3C\uB9AC\uBA85\uC774 \uC785\uB825\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4."
        });
      } else {
        const upper = cName.toUpperCase();
        if (colNames.has(upper)) {
          issues2.push({
            severity: "error",
            category: "Column",
            targetName: `${tName}.${cName}`,
            message: `\uD14C\uC774\uBE14 '${tName}' \uB0B4\uC5D0 \uCEEC\uB7FC\uBA85 '${cName}'\uC774(\uAC00) \uC911\uBCF5\uB429\uB2C8\uB2E4.`
          });
        }
        colNames.add(upper);
        if (RESERVED_WORDS.has(upper)) {
          issues2.push({
            severity: "warning",
            category: "Column",
            targetName: `${tName}.${cName}`,
            message: `\uCEEC\uB7FC\uBA85 '${cName}'\uC740(\uB294) SQL \uC608\uC57D\uC5B4\uC785\uB2C8\uB2E4.`
          });
        }
      }
      if (!col.type || !col.type.trim()) {
        issues2.push({
          severity: "error",
          category: "Column",
          targetName: `${tName}.${cName || col.id}`,
          message: "\uCEEC\uB7FC\uC758 \uB370\uC774\uD130 \uD0C0\uC785\uC774 \uC9C0\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4."
        });
      }
    }
    for (const idx of table.indexes || []) {
      if (!idx.name || !idx.name.trim()) {
        issues2.push({
          severity: "error",
          category: "Index",
          targetName: tName,
          message: `\uD14C\uC774\uBE14 '${tName}'\uC758 \uC778\uB371\uC2A4 \uC774\uB984\uC774 \uBE44\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.`
        });
      }
      if (!idx.columns || idx.columns.length === 0) {
        issues2.push({
          severity: "error",
          category: "Index",
          targetName: `${tName}.${idx.name || "(unnamed)"}`,
          message: "\uC778\uB371\uC2A4\uC5D0 \uB300\uC0C1 \uCEEC\uB7FC\uC774 \uC9C0\uC815\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4."
        });
      }
      if (idx.fullText && !db.includes("MYSQL")) {
        issues2.push({
          severity: "warning",
          category: "Index",
          targetName: `${tName}.${idx.name}`,
          message: `FULLTEXT \uC778\uB371\uC2A4\uB294 ${targetDb || diagram3.db}\uC5D0\uC11C \uC9C0\uC6D0\uB418\uC9C0 \uC54A\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4.`
        });
      }
    }
  }
  for (const view of diagram3.views || []) {
    const vName = (view.physicalName || "").trim();
    if (!vName) {
      issues2.push({
        severity: "error",
        category: "View",
        targetName: view.logicalName || view.id,
        message: "\uBDF0\uC758 \uBB3C\uB9AC\uBA85\uC774 \uC785\uB825\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4."
      });
    } else {
      registerObjectName(vName, "View");
      if (RESERVED_WORDS.has(vName.toUpperCase())) {
        issues2.push({
          severity: "warning",
          category: "View",
          targetName: vName,
          message: `\uBDF0\uBA85 '${vName}'\uC740(\uB294) SQL \uC608\uC57D\uC5B4\uC785\uB2C8\uB2E4.`
        });
      }
    }
    if (!view.sql || !view.sql.trim()) {
      issues2.push({
        severity: "error",
        category: "View",
        targetName: vName || view.id,
        message: "\uBDF0\uC758 SQL \uC815\uC758\uAC00 \uBE44\uC5B4 \uC788\uC2B5\uB2C8\uB2E4."
      });
    }
  }
  for (const seq of diagram3.sequences || []) {
    if (!seq.name || !seq.name.trim()) {
      issues2.push({ severity: "error", category: "Sequence", targetName: seq.id, message: "\uC2DC\uD000\uC2A4 \uC774\uB984\uC774 \uBE44\uC5B4 \uC788\uC2B5\uB2C8\uB2E4." });
    } else {
      registerObjectName(seq.name, "Sequence");
    }
  }
  for (const trg of diagram3.triggers || []) {
    if (!trg.name || !trg.name.trim()) {
      issues2.push({ severity: "error", category: "Trigger", targetName: trg.id, message: "\uD2B8\uB9AC\uAC70 \uC774\uB984\uC774 \uBE44\uC5B4 \uC788\uC2B5\uB2C8\uB2E4." });
    } else {
      registerObjectName(trg.name, "Trigger");
    }
    if (!trg.sql || !trg.sql.trim()) {
      issues2.push({ severity: "warning", category: "Trigger", targetName: trg.name || trg.id, message: "\uD2B8\uB9AC\uAC70 SQL \uBCF8\uBB38\uC774 \uBE44\uC5B4 \uC788\uC2B5\uB2C8\uB2E4." });
    }
  }
  for (const ts of diagram3.tablespaces || []) {
    if (!ts.name || !ts.name.trim()) {
      issues2.push({ severity: "error", category: "Tablespace", targetName: ts.id, message: "\uD14C\uC774\uBE14\uC2A4\uD398\uC774\uC2A4 \uC774\uB984\uC774 \uBE44\uC5B4 \uC788\uC2B5\uB2C8\uB2E4." });
    } else {
      registerObjectName(ts.name, "Tablespace");
    }
  }
  for (const rel of diagram3.relations) {
    const source = diagram3.tables.find((t) => t.id === rel.sourceTableId);
    const target = diagram3.tables.find((t) => t.id === rel.targetTableId);
    if (!source || !target) {
      issues2.push({
        severity: "error",
        category: "Relation",
        targetName: rel.name || rel.id,
        message: "\uAD00\uACC4\uC120\uC758 \uBD80\uBAA8 \uB610\uB294 \uC790\uC2DD \uD14C\uC774\uBE14\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."
      });
      continue;
    }
    const srcCount = rel.sourceColumnIds?.length || 0;
    const tgtCount = rel.targetColumnIds?.length || 0;
    if ((srcCount > 0 || tgtCount > 0) && srcCount !== tgtCount) {
      issues2.push({
        severity: "error",
        category: "Relation",
        targetName: rel.name || `${target.physicalName} -> ${source.physicalName}`,
        message: `\uC678\uB798\uD0A4 \uB9E4\uD551 \uCEEC\uB7FC \uC218\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4 (\uBD80\uBAA8 ${srcCount}\uAC1C, \uC790\uC2DD ${tgtCount}\uAC1C).`
      });
    } else if (srcCount === 0 && !source.columns.some((c) => c.primaryKey)) {
      issues2.push({
        severity: "warning",
        category: "Relation",
        targetName: rel.name || `${target.physicalName} -> ${source.physicalName}`,
        message: `\uBD80\uBAA8 \uD14C\uC774\uBE14 '${source.physicalName}'\uC5D0 \uAE30\uBCF8\uD0A4(PK)\uAC00 \uC5C6\uC5B4 FK \uC790\uB3D9 \uB9E4\uD551\uC774 \uBD80\uC815\uD655\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.`
      });
    }
  }
  return issues2;
}

// src/export/modelExporter.ts
function escXml(s = "") {
  return String(s).replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}
function escHtml(s = "") {
  return String(s).replace(/[<>&"']/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return c;
    }
  });
}
function generateExcelXml(diagram3) {
  const row = (cells) => `<Row>${cells.map(
    (c) => `<Cell${c.style ? ` ss:StyleID="${c.style}"` : ""}><Data ss:Type="${typeof c.val === "number" ? "Number" : "String"}">${escXml(String(c.val))}</Data></Cell>`
  ).join("")}</Row>`;
  const indexRows = [
    row([
      { val: "No", style: "Header" },
      { val: "\uBB3C\uB9AC\uBA85", style: "Header" },
      { val: "\uB17C\uB9AC\uBA85", style: "Header" },
      { val: "\uC2A4\uD0A4\uB9C8", style: "Header" },
      { val: "\uCEEC\uB7FC \uC218", style: "Header" },
      { val: "\uC124\uBA85", style: "Header" }
    ]),
    ...diagram3.tables.map(
      (t, i) => row([
        { val: i + 1 },
        { val: t.physicalName },
        { val: t.logicalName },
        { val: t.tableProperties?.schema || "" },
        { val: t.columns.length },
        { val: t.description || "" }
      ])
    )
  ].join("\n");
  const tableDefRows = [];
  for (const t of diagram3.tables) {
    tableDefRows.push(
      row([
        { val: `\uD14C\uC774\uBE14: ${t.physicalName} (${t.logicalName})`, style: "Section" },
        { val: t.description || "", style: "Section" }
      ])
    );
    tableDefRows.push(
      row([
        { val: "\uCEEC\uB7FC \uBB3C\uB9AC\uBA85", style: "Header" },
        { val: "\uCEEC\uB7FC \uB17C\uB9AC\uBA85", style: "Header" },
        { val: "\uB370\uC774\uD130 \uD0C0\uC785", style: "Header" },
        { val: "\uAE38\uC774", style: "Header" },
        { val: "PK", style: "Header" },
        { val: "NN", style: "Header" },
        { val: "UK", style: "Header" },
        { val: "AI", style: "Header" },
        { val: "\uAE30\uBCF8\uAC12", style: "Header" },
        { val: "\uC124\uBA85", style: "Header" }
      ])
    );
    for (const c of t.columns) {
      tableDefRows.push(
        row([
          { val: c.physicalName },
          { val: c.logicalName },
          { val: c.type },
          { val: c.length ?? "" },
          { val: c.primaryKey ? "Y" : "" },
          { val: c.notNull ? "Y" : "" },
          { val: c.uniqueKey ? "Y" : "" },
          { val: c.autoIncrement ? "Y" : "" },
          { val: c.defaultValue || "" },
          { val: c.description || "" }
        ])
      );
    }
    tableDefRows.push(row([{ val: "" }]));
  }
  const dictRows = [
    row([
      { val: "\uBB3C\uB9AC\uBA85", style: "Header" },
      { val: "\uB17C\uB9AC\uBA85", style: "Header" },
      { val: "\uD0C0\uC785", style: "Header" },
      { val: "\uAE38\uC774", style: "Header" },
      { val: "\uC124\uBA85", style: "Header" }
    ]),
    ...(diagram3.dictionary || []).map(
      (w) => row([
        { val: w.physicalName },
        { val: w.logicalName },
        { val: w.type },
        { val: w.length ?? "" },
        { val: w.description || "" }
      ])
    )
  ].join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#3B5998" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="Section">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#E8EEF5" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="\uD14C\uC774\uBE14 \uBAA9\uB85D">
    <Table>${indexRows}</Table>
  </Worksheet>
  <Worksheet ss:Name="\uD14C\uC774\uBE14 \uC815\uC758\uC11C">
    <Table>${tableDefRows.join("\n")}</Table>
  </Worksheet>
  <Worksheet ss:Name="\uB2E8\uC5B4 \uC0AC\uC804">
    <Table>${dictRows}</Table>
  </Worksheet>
</Workbook>`;
}
function generateHtmlReport(diagram3) {
  const navLinks = diagram3.tables.map((t) => `<a href="#tbl_${escHtml(t.id)}">${escHtml(t.physicalName)} <span>${escHtml(t.logicalName)}</span></a>`).join("\n");
  const tableSections = diagram3.tables.map((t) => {
    const cols = t.columns.map(
      (c) => `<tr>
            <td><code>${escHtml(c.physicalName)}</code></td>
            <td>${escHtml(c.logicalName)}</td>
            <td>${escHtml(c.type)}${c.length ? `(${c.length}${c.decimal ? `,${c.decimal}` : ""})` : ""}</td>
            <td>${c.primaryKey ? "PK" : ""}</td>
            <td>${c.notNull ? "NN" : ""}</td>
            <td>${c.uniqueKey ? "UK" : ""}</td>
            <td>${escHtml(c.defaultValue || "")}</td>
            <td>${escHtml(c.description || "")}</td>
          </tr>`
    ).join("\n");
    return `<section id="tbl_${escHtml(t.id)}" class="card">
        <h2>${escHtml(t.physicalName)} <small>${escHtml(t.logicalName)}</small></h2>
        ${t.description ? `<p class="desc">${escHtml(t.description)}</p>` : ""}
        <table>
          <thead><tr><th>\uBB3C\uB9AC\uBA85</th><th>\uB17C\uB9AC\uBA85</th><th>\uD0C0\uC785</th><th>PK</th><th>NN</th><th>UK</th><th>\uAE30\uBCF8\uAC12</th><th>\uC124\uBA85</th></tr></thead>
          <tbody>${cols}</tbody>
        </table>
      </section>`;
  }).join("\n");
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8"/>
<title>ERMaster DB \uBA85\uC138\uC11C (${escHtml(diagram3.db)})</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; display: flex; background: #0f172a; color: #e2e8f0; }
  aside { width: 260px; background: #1e293b; padding: 16px; height: 100vh; overflow-y: auto; position: sticky; top: 0; border-right: 1px solid #334155; }
  aside h1 { font-size: 16px; margin: 0 0 12px; color: #60a5fa; }
  aside a { display: block; padding: 6px 8px; color: #cbd5e1; text-decoration: none; border-radius: 6px; font-size: 13px; }
  aside a:hover { background: #334155; }
  aside a span { color: #94a3b8; font-size: 11px; margin-left: 4px; }
  main { flex: 1; padding: 24px 32px; max-width: 1100px; }
  .card { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 18px; margin-bottom: 20px; }
  h2 { margin: 0 0 8px; font-size: 18px; color: #93c5fd; }
  h2 small { color: #94a3b8; font-weight: normal; font-size: 13px; }
  .desc { color: #94a3b8; font-size: 13px; margin: 0 0 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { border-bottom: 1px solid #334155; padding: 8px 10px; text-align: left; }
  th { background: #0f172a; color: #94a3b8; font-weight: 600; }
</style>
</head>
<body>
  <aside>
    <h1>ERMaster \uBA85\uC138\uC11C</h1>
    <div style="font-size:12px;color:#94a3b8;margin-bottom:12px;">DBMS: ${escHtml(diagram3.db)} | \uD14C\uC774\uBE14 ${diagram3.tables.length}\uAC1C</div>
    ${navLinks}
  </aside>
  <main>
    ${tableSections}
  </main>
</body>
</html>`;
}
function toPascalCase(str) {
  return str.replace(/[^a-zA-Z0-9]+/g, " ").trim().split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("") || "Entity";
}
function toCamelCase(str) {
  const p = toPascalCase(str);
  return p.charAt(0).toLowerCase() + p.slice(1);
}
function mapSqlTypeToJava(col) {
  const t = (col.type || "").toUpperCase();
  if (t.includes("BIGINT") || t === "LONG")
    return { javaType: "Long" };
  if (t.includes("INT"))
    return { javaType: "Integer" };
  if (t.includes("DECIMAL") || t.includes("NUMERIC")) {
    return { javaType: "BigDecimal", importStmt: "java.math.BigDecimal" };
  }
  if (t.includes("DOUBLE") || t.includes("FLOAT"))
    return { javaType: "Double" };
  if (t.includes("BOOL") || t === "BIT")
    return { javaType: "Boolean" };
  if (t === "DATE")
    return { javaType: "LocalDate", importStmt: "java.time.LocalDate" };
  if (t.includes("TIME"))
    return { javaType: "LocalDateTime", importStmt: "java.time.LocalDateTime" };
  if (t.includes("BLOB") || t.includes("BYTEA"))
    return { javaType: "byte[]" };
  return { javaType: "String" };
}
function generateJavaEntities(diagram3, options) {
  const pkg = options.packageName.trim() || "com.example.entity";
  const files = [];
  for (const table of diagram3.tables) {
    const className = toPascalCase(table.physicalName);
    const imports = /* @__PURE__ */ new Set();
    if (options.useJpa)
      imports.add("jakarta.persistence.*");
    if (options.useLombok)
      imports.add("lombok.Data");
    const fields = [];
    const gettersSetters = [];
    for (const col of table.columns) {
      const { javaType, importStmt } = mapSqlTypeToJava(col);
      if (importStmt)
        imports.add(importStmt);
      const fieldName = toCamelCase(col.physicalName);
      const annos = [];
      if (col.logicalName || col.description) {
        annos.push(`    /** ${col.logicalName || col.description} */`);
      }
      if (options.useJpa) {
        if (col.primaryKey) {
          annos.push("    @Id");
          if (col.autoIncrement)
            annos.push("    @GeneratedValue(strategy = GenerationType.IDENTITY)");
        }
        annos.push(
          `    @Column(name = "${col.physicalName}"${col.notNull ? ", nullable = false" : ""}${col.length ? `, length = ${col.length}` : ""})`
        );
      }
      fields.push(`${annos.join("\n")}${annos.length ? "\n" : ""}    private ${javaType} ${fieldName};`);
      if (!options.useLombok) {
        const cap = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
        gettersSetters.push(
          `    public ${javaType} get${cap}() { return this.${fieldName}; }
    public void set${cap}(${javaType} ${fieldName}) { this.${fieldName} = ${fieldName}; }`
        );
      }
    }
    const lines = [`package ${pkg};`, ""];
    for (const imp of [...imports].sort()) {
      lines.push(`import ${imp};`);
    }
    lines.push("");
    if (options.useLombok)
      lines.push("@Data");
    if (options.useJpa) {
      lines.push("@Entity");
      lines.push(`@Table(name = "${table.physicalName}")`);
    }
    lines.push(`public class ${className} {`, "");
    lines.push(fields.join("\n\n"));
    if (gettersSetters.length > 0) {
      lines.push("");
      lines.push(gettersSetters.join("\n\n"));
    }
    lines.push("}", "");
    files.push({
      fileName: `${className}.java`,
      content: lines.join("\n")
    });
  }
  return files;
}
function generateDictionaryCsv(diagram3) {
  const esc = (s = "") => `"${String(s).replace(/"/g, '""')}"`;
  const lines = ["physical_name,logical_name,type,length,decimal,description"];
  for (const w of diagram3.dictionary || []) {
    lines.push(
      [esc(w.physicalName), esc(w.logicalName), esc(w.type), w.length ?? "", w.decimal ?? "", esc(w.description)].join(",")
    );
  }
  return "\uFEFF" + lines.join("\n");
}
function generateTranslationsCsv(diagram3) {
  const esc = (s = "") => `"${String(s).replace(/"/g, '""')}"`;
  const lines = ["logical_name,physical_name"];
  for (const tr of diagram3.translations || []) {
    lines.push([esc(tr.logicalName), esc(tr.physicalName)].join(","));
  }
  return "\uFEFF" + lines.join("\n");
}
function generateTestDataSql(diagram3) {
  const tableMap = new Map(diagram3.tables.map((t) => [t.id, t]));
  const stmts = [];
  for (const td of diagram3.testDataList || []) {
    stmts.push(`-- Test Data: ${td.name}`);
    for (const ttd of td.tableTestData || []) {
      const table = tableMap.get(ttd.tableId);
      if (!table)
        continue;
      const colNames = table.columns.map((c) => c.physicalName);
      for (const row of ttd.directTestData || []) {
        const vals = table.columns.map((c) => {
          const v = row.values[c.id];
          if (v === void 0 || v === "")
            return "NULL";
          return `'${String(v).replace(/'/g, "''")}'`;
        });
        stmts.push(`INSERT INTO ${table.physicalName} (${colNames.join(", ")}) VALUES (${vals.join(", ")});`);
      }
    }
    stmts.push("");
  }
  return stmts.join("\n");
}

// src/import/fileImporter.ts
function parseExternalModelFile(fileName, content) {
  if (fileName.toLowerCase().endsWith(".sql") || fileName.toLowerCase().endsWith(".ddl")) {
    return parseSqlDdlToDiagram(content);
  }
  return parseERMXml(content);
}
function parseSqlDdlToDiagram(sql) {
  const tables = [];
  const views = [];
  const sequences = [];
  const relations = [];
  const cleaned = sql.replace(/--[^\r\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
  const statements = cleaned.split(";").map((s) => s.trim()).filter(Boolean);
  let colCounter = 0;
  for (const stmt of statements) {
    const createTableMatch = stmt.match(/^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([^\s(]+)\s*\(([\s\S]+)\)$/i);
    if (createTableMatch) {
      const rawName = createTableMatch[1].replace(/[`"\[\]]/g, "");
      const parts = rawName.split(".");
      const physicalName = parts[parts.length - 1];
      const schema = parts.length > 1 ? parts[0] : void 0;
      const body = createTableMatch[2];
      const defs = splitTopLevelCommas(body);
      const columns = [];
      const pkNames = /* @__PURE__ */ new Set();
      for (const def of defs) {
        const trimmed = def.trim();
        if (!trimmed)
          continue;
        const pkMatch = trimmed.match(/^(?:CONSTRAINT\s+\S+\s+)?PRIMARY\s+KEY\s*\(([^)]+)\)/i);
        if (pkMatch) {
          pkMatch[1].split(",").forEach((c) => pkNames.add(c.trim().replace(/[`"\[\]]/g, "")));
          continue;
        }
        const fkMatch = trimmed.match(/^(?:CONSTRAINT\s+(\S+)\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+([^\s(]+)\s*\(([^)]+)\)/i);
        if (fkMatch) {
          const fkName = fkMatch[1] ? fkMatch[1].replace(/[`"\[\]]/g, "") : "";
          const refTableName = fkMatch[3].replace(/[`"\[\]]/g, "").split(".").pop() || "";
          relations.push({
            id: `rel_${Date.now()}_${relations.length}`,
            name: fkName,
            sourceTableId: refTableName,
            targetTableId: physicalName,
            parentCardinality: "1",
            childCardinality: "0..n",
            referenceForPK: false
          });
          continue;
        }
        if (/^(?:CONSTRAINT|UNIQUE|INDEX|KEY|CHECK)\b/i.test(trimmed))
          continue;
        const colMatch = trimmed.match(/^([`"\[\]a-zA-Z0-9_]+)\s+([a-zA-Z0-9_]+)(?:\s*\(\s*(\d+)(?:\s*,\s*(\d+))?\s*\))?([\s\S]*)$/i);
        if (colMatch) {
          const colName = colMatch[1].replace(/[`"\[\]]/g, "");
          const colType = colMatch[2].toLowerCase();
          const length = colMatch[3] ? Number(colMatch[3]) : void 0;
          const decimal = colMatch[4] ? Number(colMatch[4]) : void 0;
          const rest = colMatch[5] || "";
          const isPk = /\bPRIMARY\s+KEY\b/i.test(rest);
          const isNotNull = isPk || /\bNOT\s+NULL\b/i.test(rest);
          const isUnique = /\bUNIQUE\b/i.test(rest);
          const isAutoInc = /\bAUTO_INCREMENT\b|\bSERIAL\b|\bIDENTITY\b/i.test(rest) || colType === "serial" || colType === "bigserial";
          columns.push({
            id: `sql_col_${colCounter++}`,
            physicalName: colName,
            logicalName: colName,
            type: colType === "serial" ? "integer" : colType === "bigserial" ? "bigint" : colType,
            length,
            decimal,
            primaryKey: isPk,
            notNull: isNotNull,
            uniqueKey: isUnique,
            autoIncrement: isAutoInc
          });
        }
      }
      for (const col of columns) {
        if (pkNames.has(col.physicalName)) {
          col.primaryKey = true;
          col.notNull = true;
        }
      }
      const idx = tables.length;
      tables.push({
        id: `sql_tbl_${idx}`,
        physicalName,
        logicalName: physicalName,
        description: "",
        x: 80 + idx % 4 * 280,
        y: 80 + Math.floor(idx / 4) * 240,
        width: 230,
        height: 140,
        columns,
        indexes: [],
        complexUniqueKeys: [],
        tableProperties: schema ? { schema } : void 0
      });
      continue;
    }
    const createViewMatch = stmt.match(/^CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+([^\s(]+)\s+AS\s+([\s\S]+)$/i);
    if (createViewMatch) {
      const rawName = createViewMatch[1].replace(/[`"\[\]]/g, "");
      const parts = rawName.split(".");
      const physicalName = parts[parts.length - 1];
      const schema = parts.length > 1 ? parts[0] : void 0;
      const idx = views.length;
      views.push({
        id: `sql_view_${idx}`,
        physicalName,
        logicalName: physicalName,
        description: "",
        sql: createViewMatch[2].trim(),
        schema,
        x: 100 + idx * 260,
        y: 420,
        width: 220,
        height: 120,
        columns: []
      });
      continue;
    }
    const createSeqMatch = stmt.match(/^CREATE\s+SEQUENCE\s+(?:IF\s+NOT\s+EXISTS\s+)?([^\s;]+)/i);
    if (createSeqMatch) {
      const rawName = createSeqMatch[1].replace(/[`"\[\]]/g, "");
      const parts = rawName.split(".");
      const name = parts[parts.length - 1];
      const schema = parts.length > 1 ? parts[0] : void 0;
      sequences.push({ id: `sql_seq_${sequences.length}`, name, schema });
      continue;
    }
    const alterFkMatch = stmt.match(/^ALTER\s+TABLE\s+([^\s]+)\s+ADD\s+(?:CONSTRAINT\s+(\S+)\s+)?FOREIGN\s+KEY\s*\([^)]+\)\s*REFERENCES\s+([^\s(]+)/i);
    if (alterFkMatch) {
      const targetName = alterFkMatch[1].replace(/[`"\[\]]/g, "").split(".").pop() || "";
      const fkName = alterFkMatch[2] ? alterFkMatch[2].replace(/[`"\[\]]/g, "") : "";
      const sourceName = alterFkMatch[3].replace(/[`"\[\]]/g, "").split(".").pop() || "";
      relations.push({
        id: `rel_${Date.now()}_${relations.length}`,
        name: fkName,
        sourceTableId: sourceName,
        targetTableId: targetName,
        parentCardinality: "1",
        childCardinality: "0..n",
        referenceForPK: false
      });
    }
  }
  const tableByName = new Map(tables.map((t) => [t.physicalName.toLowerCase(), t.id]));
  const resolvedRelations = relations.map((r) => ({
    ...r,
    sourceTableId: tableByName.get(r.sourceTableId.toLowerCase()) || r.sourceTableId,
    targetTableId: tableByName.get(r.targetTableId.toLowerCase()) || r.targetTableId
  })).filter((r) => tables.some((t) => t.id === r.sourceTableId) && tables.some((t) => t.id === r.targetTableId));
  return {
    db: "PostgreSQL",
    viewMode: "both",
    dictionary: [],
    tables,
    views,
    notes: [],
    noteConnections: [],
    images: [],
    relations: resolvedRelations,
    categories: [],
    columnGroups: [],
    sequences,
    triggers: [],
    tablespaces: [],
    testDataList: []
  };
}
function splitTopLevelCommas(str) {
  const result = [];
  let depth = 0;
  let current = "";
  for (const ch of str) {
    if (ch === "(")
      depth++;
    else if (ch === ")")
      depth = Math.max(0, depth - 1);
    if (ch === "," && depth === 0) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim())
    result.push(current);
  return result;
}
function mergeImportedObjects(current, source, selection) {
  const ts = Date.now();
  const tableIdMap = /* @__PURE__ */ new Map();
  const offsetX = current.tables.length > 0 ? 60 : 0;
  const offsetY = current.tables.length > 0 ? 60 : 0;
  const importedTables = source.tables.filter((t) => selection.tableIds.includes(t.id)).map((t, idx) => {
    const newId = `imp_tbl_${ts}_${idx}`;
    tableIdMap.set(t.id, newId);
    return {
      ...t,
      id: newId,
      x: t.x + offsetX,
      y: t.y + offsetY,
      columns: t.columns.map((c, cIdx) => ({ ...c, id: `${newId}_col_${cIdx}` }))
    };
  });
  const importedViews = (source.views || []).filter((v) => selection.viewIds.includes(v.id)).map((v, idx) => ({
    ...v,
    id: `imp_view_${ts}_${idx}`,
    x: v.x + offsetX,
    y: v.y + offsetY
  }));
  const importedNotes = (source.notes || []).filter((n) => selection.noteIds.includes(n.id)).map((n, idx) => ({
    ...n,
    id: `imp_note_${ts}_${idx}`,
    x: n.x + offsetX,
    y: n.y + offsetY
  }));
  const importedRelations = (source.relations || []).filter((r) => tableIdMap.has(r.sourceTableId) && tableIdMap.has(r.targetTableId)).map((r, idx) => ({
    ...r,
    id: `imp_rel_${ts}_${idx}`,
    sourceTableId: tableIdMap.get(r.sourceTableId),
    targetTableId: tableIdMap.get(r.targetTableId)
  }));
  const importedSequences = (source.sequences || []).filter((s) => selection.sequenceIds.includes(s.id)).map((s, idx) => ({ ...s, id: `imp_seq_${ts}_${idx}` }));
  const importedTriggers = (source.triggers || []).filter((t) => selection.triggerIds.includes(t.id)).map((t, idx) => ({ ...t, id: `imp_trg_${ts}_${idx}` }));
  const importedTablespaces = (source.tablespaces || []).filter((t) => selection.tablespaceIds.includes(t.id)).map((t, idx) => ({ ...t, id: `imp_ts_${ts}_${idx}` }));
  const importedColumnGroups = (source.columnGroups || []).filter((g) => selection.columnGroupIds.includes(g.id)).map((g, idx) => ({ ...g, id: `imp_cg_${ts}_${idx}` }));
  return {
    ...current,
    tables: [...current.tables, ...importedTables],
    views: [...current.views || [], ...importedViews],
    notes: [...current.notes, ...importedNotes],
    relations: [...current.relations, ...importedRelations],
    sequences: [...current.sequences || [], ...importedSequences],
    triggers: [...current.triggers || [], ...importedTriggers],
    tablespaces: [...current.tablespaces || [], ...importedTablespaces],
    columnGroups: [...current.columnGroups || [], ...importedColumnGroups]
  };
}

// src/import/jdbcImporter.ts
function mergeJdbcImportResult(current, jdbcResult) {
  const ts = Date.now();
  const qualifiedToId = /* @__PURE__ */ new Map();
  const nameToId = /* @__PURE__ */ new Map();
  const importedTables = (jdbcResult.tables || []).map((t, idx) => {
    const tableId = `jdbc_tbl_${ts}_${idx}`;
    if (t.qualifiedName)
      qualifiedToId.set(t.qualifiedName.toLowerCase(), tableId);
    nameToId.set(t.physicalName.toLowerCase(), tableId);
    const colNameToId = /* @__PURE__ */ new Map();
    const columns = (t.columns || []).map((c, cIdx) => {
      const colId = `${tableId}_col_${cIdx}`;
      colNameToId.set(c.physicalName.toLowerCase(), colId);
      return {
        id: colId,
        physicalName: c.physicalName,
        logicalName: c.logicalName || c.physicalName,
        type: c.type || "varchar",
        length: c.length ?? void 0,
        decimal: c.decimal ?? void 0,
        primaryKey: Boolean(c.primaryKey),
        notNull: Boolean(c.notNull),
        uniqueKey: false,
        autoIncrement: Boolean(c.autoIncrement),
        defaultValue: c.defaultValue || void 0,
        description: c.description || void 0
      };
    });
    const indexes = (t.indexes || []).map((ix, iIdx) => ({
      id: `${tableId}_idx_${iIdx}`,
      name: ix.name,
      nonUnique: Boolean(ix.nonUnique),
      columns: (ix.columns || []).map((ic) => ({
        columnId: colNameToId.get(String(ic.columnName).toLowerCase()) || "",
        order: ic.order === "DESC" ? "DESC" : "ASC"
      })).filter((ic) => Boolean(ic.columnId))
    }));
    return {
      id: tableId,
      physicalName: t.physicalName,
      logicalName: t.logicalName || t.physicalName,
      description: t.description || "",
      x: 80 + idx % 4 * 280,
      y: 80 + Math.floor(idx / 4) * 240,
      width: 230,
      height: 140,
      columns,
      indexes,
      complexUniqueKeys: [],
      tableProperties: t.schema ? { schema: t.schema } : void 0
    };
  });
  const importedViews = (jdbcResult.views || []).map((v, idx) => ({
    id: `jdbc_view_${ts}_${idx}`,
    physicalName: v.physicalName,
    logicalName: v.logicalName || v.physicalName,
    description: v.description || "",
    sql: "",
    schema: v.schema || void 0,
    x: 80 + idx % 4 * 260,
    y: 420 + Math.floor(idx / 4) * 200,
    width: 220,
    height: 120,
    columns: (v.columns || []).map((c, cIdx) => ({
      id: `jdbc_vcol_${ts}_${idx}_${cIdx}`,
      physicalName: c.physicalName,
      logicalName: c.logicalName || c.physicalName,
      type: c.type || "varchar",
      length: c.length ?? void 0,
      primaryKey: false,
      notNull: false,
      uniqueKey: false,
      autoIncrement: false
    }))
  }));
  const seenRels = /* @__PURE__ */ new Set();
  const importedRelations = [];
  for (let i = 0; i < (jdbcResult.relations || []).length; i++) {
    const r = jdbcResult.relations[i];
    const sourceId = qualifiedToId.get(String(r.sourceQualified || "").toLowerCase()) || nameToId.get(String(r.sourceTable || "").toLowerCase());
    const targetId = qualifiedToId.get(String(r.targetQualified || "").toLowerCase()) || nameToId.get(String(r.targetTable || "").toLowerCase());
    if (!sourceId || !targetId)
      continue;
    const dedupKey = `${sourceId}->${targetId}:${r.name || ""}`;
    if (seenRels.has(dedupKey))
      continue;
    seenRels.add(dedupKey);
    importedRelations.push({
      id: `jdbc_rel_${ts}_${i}`,
      name: r.name || "",
      sourceTableId: sourceId,
      targetTableId: targetId,
      parentCardinality: "1",
      childCardinality: "0..n",
      referenceForPK: false,
      onDeleteAction: r.onDeleteAction || "RESTRICT",
      onUpdateAction: r.onUpdateAction || "RESTRICT"
    });
  }
  return {
    ...current,
    tables: [...current.tables, ...importedTables],
    views: [...current.views || [], ...importedViews],
    relations: [...current.relations, ...importedRelations]
  };
}

// test/parser.test.ts
var sampleErmXml = `<?xml version="1.0" encoding="UTF-8"?>
<diagram>
	<db>PostgreSQL</db>
	<page_setting>
		<direction_horizontal>true</direction_horizontal>
		<scale>100</scale>
		<paper_size>A4 210 x 297 mm</paper_size>
		<top_margin>30</top_margin>
		<left_margin>30</left_margin>
		<bottom_margin>30</bottom_margin>
		<right_margin>30</right_margin>
	</page_setting>
	<category_index>0</category_index>
	<zoom>100</zoom>
	<x>0</x>
	<y>0</y>
	<default_color>
		<r>128</r>
		<g>128</g>
		<b>192</b>
	</default_color>
	<color>
		<r>255</r>
		<g>255</g>
		<b>255</b>
	</color>
	<font_name></font_name>
	<font_size>9</font_size>
	<dictionary>
		<word>
			<id>0</id>
			<length>null</length>
			<decimal>null</decimal>
			<array>false</array>
			<array_dimension>null</array_dimension>
			<unsigned>false</unsigned>
			<args></args>
			<description>\uC0AC\uC6A9\uC790 \uC2DD\uBCC4 \uBC88\uD638</description>
			<logical_name>\uC0AC\uC6A9\uC790ID</logical_name>
			<physical_name>id</physical_name>
			<type>bigint</type>
		</word>
		<word>
			<id>1</id>
			<length>255</length>
			<decimal>null</decimal>
			<array>false</array>
			<array_dimension>null</array_dimension>
			<unsigned>false</unsigned>
			<args></args>
			<description></description>
			<logical_name>\uC774\uBA54\uC77C</logical_name>
			<physical_name>email</physical_name>
			<type>varchar</type>
		</word>
	</dictionary>
	<tablespace_set>
	</tablespace_set>
	<contents>
		<table>
			<id>0</id>
			<height>120</height>
			<width>220</width>
			<font_name></font_name>
			<font_size>9</font_size>
			<x>100</x>
			<y>100</y>
			<color>
				<r>128</r>
				<g>128</g>
				<b>192</b>
			</color>
			<connections>
			</connections>
			<physical_name>users</physical_name>
			<logical_name>\uC0AC\uC6A9\uC790</logical_name>
			<description>\uC0AC\uC6A9\uC790 \uACC4\uC815 \uD14C\uC774\uBE14</description>
			<columns>
				<normal_column>
					<word_id>0</word_id>
					<id>0</id>
					<description></description>
					<unique_key_name></unique_key_name>
					<logical_name></logical_name>
					<physical_name></physical_name>
					<type></type>
					<constraint></constraint>
					<default_value></default_value>
					<auto_increment>true</auto_increment>
					<foreign_key>false</foreign_key>
					<not_null>true</not_null>
					<primary_key>true</primary_key>
					<unique_key>false</unique_key>
					<character_set></character_set>
					<collation></collation>
					<sequence></sequence>
				</normal_column>
				<normal_column>
					<word_id>1</word_id>
					<id>1</id>
					<description></description>
					<unique_key_name></unique_key_name>
					<logical_name></logical_name>
					<physical_name></physical_name>
					<type></type>
					<constraint></constraint>
					<default_value></default_value>
					<auto_increment>false</auto_increment>
					<foreign_key>false</foreign_key>
					<not_null>true</not_null>
					<primary_key>false</primary_key>
					<unique_key>true</unique_key>
					<character_set></character_set>
					<collation></collation>
					<sequence></sequence>
				</normal_column>
			</columns>
		</table>
		<table>
			<id>1</id>
			<height>120</height>
			<width>220</width>
			<font_name></font_name>
			<font_size>9</font_size>
			<x>450</x>
			<y>100</y>
			<color>
				<r>128</r>
				<g>128</g>
				<b>192</b>
			</color>
			<connections>
				<relation>
					<id>rel_0</id>
					<source>0</source>
					<target>1</target>
					<name>FK_orders_users</name>
					<parent_cardinality>1</parent_cardinality>
					<child_cardinality>0..n</child_cardinality>
					<reference_for_pk>false</reference_for_pk>
					<on_delete_action>CASCADE</on_delete_action>
					<on_update_action>CASCADE</on_update_action>
				</relation>
			</connections>
			<physical_name>orders</physical_name>
			<logical_name>\uC8FC\uBB38</logical_name>
			<description>\uC8FC\uBB38 \uB0B4\uC5ED \uD14C\uC774\uBE14</description>
			<columns>
				<normal_column>
					<word_id>0</word_id>
					<id>2</id>
					<description></description>
					<unique_key_name></unique_key_name>
					<logical_name></logical_name>
					<physical_name></physical_name>
					<type></type>
					<constraint></constraint>
					<default_value></default_value>
					<auto_increment>true</auto_increment>
					<foreign_key>false</foreign_key>
					<not_null>true</not_null>
					<primary_key>true</primary_key>
					<unique_key>false</unique_key>
					<character_set></character_set>
					<collation></collation>
					<sequence></sequence>
				</normal_column>
			</columns>
		</table>
		<note>
			<id>2</id>
			<height>80</height>
			<width>180</width>
			<font_name></font_name>
			<font_size>9</font_size>
			<x>200</x>
			<y>300</y>
			<color>
				<r>255</r>
				<g>255</g>
				<b>128</b>
			</color>
			<connections>
			</connections>
			<text>\uC774 \uC2DC\uC2A4\uD15C\uC740 \uC0AC\uC6A9\uC790 \uC8FC\uBB38 \uAD00\uB9AC \uC2DC\uC2A4\uD15C\uC785\uB2C8\uB2E4.</text>
		</note>
	</contents>
	<column_groups>
	</column_groups>
	<test_data_list>
	</test_data_list>
	<sequence_set>
	</sequence_set>
	<trigger_set>
	</trigger_set>
	<change_tracking_list>
	</change_tracking_list>
</diagram>`;
console.log("=== [1] Parsing ERM XML ===");
var diagram = parseERMXml(sampleErmXml);
console.log("DBMS:", diagram.db);
console.log("Tables Count:", diagram.tables.length);
console.log("Notes Count:", diagram.notes.length);
console.log("Relations Count:", diagram.relations.length);
console.log("First Table Columns:", diagram.tables[0].columns.map((c) => `${c.physicalName}(${c.logicalName}): ${c.type}${c.length ? "(" + c.length + ")" : ""}`));
console.log("\n=== [2] Generating DDL ===");
var ddl = generateDDL(diagram, "PostgreSQL");
console.log(ddl);
console.log("\n=== [3] Serializing back to XML ===");
var serializedXml = serializeERMXml(diagram);
console.log("Serialized XML Length:", serializedXml.length);
console.log("\n=== [4] Roundtrip Parsing ===");
var diagram2 = parseERMXml(serializedXml);
console.log("Roundtrip Tables Count:", diagram2.tables.length);
console.log("Roundtrip Relations Count:", diagram2.relations.length);
console.log("\n=== [5] Full Data Model Elements Roundtrip ===");
var fullDiagram = {
  ...diagram,
  tablespaces: [{ id: "ts_1", name: "ts_main", description: "Main TS", properties: { location: "/pgdata" } }],
  sequences: [{ id: "seq_1", name: "seq_users", start: 1, increment: 1, cache: 20, cycle: false }],
  triggers: [{ id: "trg_1", name: "trg_audit", sql: "CREATE TRIGGER trg_audit AFTER INSERT ON users FOR EACH ROW EXECUTE FUNCTION audit();" }],
  columnGroups: [{
    id: "cg_1",
    groupName: "AuditColumns",
    columns: [{ id: "cg_c1", physicalName: "created_at", logicalName: "\uC0DD\uC131\uC77C", type: "timestamp", primaryKey: false, notNull: true, uniqueKey: false, autoIncrement: false }]
  }],
  views: [{
    id: "v_1",
    physicalName: "v_active_users",
    logicalName: "\uD65C\uC131\uC0AC\uC6A9\uC790\uBDF0",
    description: "Active users",
    sql: "SELECT id, email FROM users",
    x: 300,
    y: 400,
    columns: [{ id: "vc_1", physicalName: "id", logicalName: "ID", type: "bigint", primaryKey: false, notNull: false, uniqueKey: false, autoIncrement: false }]
  }],
  categories: [{
    id: "cat_1",
    name: "\uD68C\uC6D0 \uC601\uC5ED",
    selected: true,
    x: 50,
    y: 50,
    width: 600,
    height: 400,
    nodeElementIds: ["0", "1"]
  }],
  images: [{ id: "img_1", x: 700, y: 100, width: 120, height: 80, data: "iVBORw0KGgo=", alpha: 255, fixAspectRatio: true }],
  noteConnections: [{ id: "cc_1", sourceId: "2", targetId: "0" }],
  modelProperties: {
    x: 20,
    y: 20,
    width: 200,
    height: 100,
    display: true,
    properties: [{ name: "Author", value: "J-Lab" }]
  },
  testDataList: [{
    id: "td_0",
    name: "\uAE30\uBCF8 \uD14C\uC2A4\uD2B8 \uB370\uC774\uD130",
    tableTestData: [{ tableId: "0", directTestData: [{ values: { "0": "1", "1": "a@b.com" } }] }]
  }]
};
fullDiagram.tables[0] = {
  ...fullDiagram.tables[0],
  columnGroupIds: ["cg_1"],
  indexes: [{ id: "idx_1", name: "idx_users_email", nonUnique: false, columns: [{ columnId: "1", order: "ASC" }] }],
  complexUniqueKeys: [{ id: "uk_1", name: "uk_users_email", columns: ["1"] }]
};
var fullXml = serializeERMXml(fullDiagram);
var parsedFull = parseERMXml(fullXml);
var fullDdl = generateDDL(parsedFull, "PostgreSQL");
var assert = (cond, msg) => {
  if (!cond)
    throw new Error(`Assertion failed: ${msg}`);
};
assert(parsedFull.tablespaces.length === 1, "tablespaces");
assert(parsedFull.sequences.length === 1, "sequences");
assert(parsedFull.triggers.length === 1, "triggers");
assert(parsedFull.columnGroups.length === 1, "columnGroups");
assert(parsedFull.views.length === 1, "views");
assert(parsedFull.categories.length === 1, "categories");
assert(parsedFull.images.length === 1, "images");
assert(parsedFull.noteConnections.length === 1, "noteConnections");
assert(parsedFull.modelProperties?.display === true, "modelProperties");
assert(parsedFull.testDataList.length === 1, "testDataList");
assert(parsedFull.tables[0].indexes.length === 1, "table indexes");
assert(parsedFull.tables[0].complexUniqueKeys.length === 1, "table complexUniqueKeys");
assert(parsedFull.tables[0].columnGroupIds?.length === 1, "table columnGroupIds");
assert(fullDdl.includes("CREATE SEQUENCE seq_users"), "DDL sequence");
assert(fullDdl.includes("CREATE OR REPLACE VIEW v_active_users"), "DDL view");
assert(fullDdl.includes("CREATE UNIQUE INDEX idx_users_email"), "DDL index");
assert(fullDdl.includes("CONSTRAINT uk_users_email UNIQUE"), "DDL complex unique key");
assert(fullDdl.includes("CREATE TRIGGER trg_audit"), "DDL trigger");
console.log("\n=== [6] File & JDBC Import Tests ===");
var sqlSample = `
  CREATE TABLE departments (
    id BIGINT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
  );
  CREATE TABLE employees (
    id BIGINT PRIMARY KEY,
    dept_id BIGINT NOT NULL,
    CONSTRAINT fk_emp_dept FOREIGN KEY (dept_id) REFERENCES departments (id)
  );
  CREATE VIEW v_employees AS SELECT id, dept_id FROM employees;
  CREATE SEQUENCE seq_emp;
`;
var parsedSql = parseExternalModelFile("schema.sql", sqlSample);
assert(parsedSql.tables.length === 2, "SQL import tables");
assert(parsedSql.views.length === 1, "SQL import views");
assert(parsedSql.sequences.length === 1, "SQL import sequences");
assert(parsedSql.relations.length === 1, "SQL import FK relation");
var mergedFile = mergeImportedObjects(diagram, parsedSql, {
  tableIds: parsedSql.tables.map((t) => t.id),
  viewIds: parsedSql.views.map((v) => v.id),
  noteIds: [],
  sequenceIds: parsedSql.sequences.map((s) => s.id),
  triggerIds: [],
  tablespaceIds: [],
  columnGroupIds: []
});
assert(mergedFile.tables.length === 4, "merged file tables");
assert(mergedFile.relations.length === 2, "merged file relations");
var mergedJdbc = mergeJdbcImportResult(diagram, {
  tables: [
    {
      qualifiedName: "public.customers",
      schema: "public",
      physicalName: "customers",
      logicalName: "\uACE0\uAC1D",
      description: "",
      columns: [{ physicalName: "id", logicalName: "ID", type: "bigint", primaryKey: true, notNull: true }],
      indexes: [{ name: "idx_cust_id", nonUnique: false, columns: [{ columnName: "id", order: "ASC" }] }]
    },
    {
      qualifiedName: "public.invoices",
      schema: "public",
      physicalName: "invoices",
      logicalName: "\uCCAD\uAD6C\uC11C",
      description: "",
      columns: [{ physicalName: "id", logicalName: "ID", type: "bigint", primaryKey: true, notNull: true }],
      indexes: []
    }
  ],
  views: [{ schema: "public", physicalName: "v_cust", logicalName: "\uACE0\uAC1D\uBDF0", description: "", columns: [] }],
  relations: [{
    name: "fk_inv_cust",
    sourceQualified: "public.customers",
    sourceTable: "customers",
    targetQualified: "public.invoices",
    targetTable: "invoices",
    onDeleteAction: "CASCADE",
    onUpdateAction: "RESTRICT"
  }]
});
assert(mergedJdbc.tables.length === 4, "merged jdbc tables");
assert(mergedJdbc.views.length === 1, "merged jdbc views");
assert(mergedJdbc.relations.length === 2, "merged jdbc relations");
console.log("\n=== [7] DBMS-Specific DDL & Validator Tests ===");
var compositeDiagram = {
  ...fullDiagram,
  relations: [
    {
      id: "rel_comp",
      name: "FK_orders_users_comp",
      sourceTableId: "0",
      targetTableId: "1",
      sourceColumnIds: ["0"],
      targetColumnIds: ["2"],
      onDeleteAction: "CASCADE",
      onUpdateAction: "RESTRICT"
    }
  ]
};
var mysqlDdl = generateDDL(compositeDiagram, "MySQL");
assert(mysqlDdl.includes("SET FOREIGN_KEY_CHECKS = 0;"), "MySQL FK checks");
assert(mysqlDdl.includes("AUTO_INCREMENT"), "MySQL AUTO_INCREMENT");
assert(mysqlDdl.includes("FOREIGN KEY (id) REFERENCES users (id)"), "Explicit FK mapping");
var oracleDdl = generateDDL(compositeDiagram, "Oracle");
assert(oracleDdl.includes("VARCHAR2(255)"), "Oracle VARCHAR2");
assert(oracleDdl.includes("NOCYCLE"), "Oracle sequence NOCYCLE");
var mssqlDdl = generateDDL(compositeDiagram, "SQLServer");
assert(mssqlDdl.includes("OBJECT_ID('users', 'U')"), "SQLServer IF OBJECT_ID");
assert(mssqlDdl.includes("IDENTITY(1,1)"), "SQLServer IDENTITY");
var badDiagram = {
  ...fullDiagram,
  tables: [
    ...fullDiagram.tables,
    {
      id: "bad_t",
      physicalName: "users",
      // duplicate!
      logicalName: "\uC911\uBCF5",
      description: "",
      x: 0,
      y: 0,
      columns: [],
      // no columns!
      indexes: [{ id: "bad_idx", name: "idx_ft", nonUnique: true, fullText: true, columns: [] }],
      complexUniqueKeys: []
    }
  ]
};
var issues = validateDiagram(badDiagram, "PostgreSQL");
assert(issues.some((i) => i.severity === "error" && i.category === "Table" && i.message.includes("\uC911\uBCF5")), "Validator duplicate table");
assert(issues.some((i) => i.severity === "error" && i.category === "Table" && i.message.includes("\uCEEC\uB7FC\uC774 \uD558\uB098\uB3C4")), "Validator no columns");
assert(issues.some((i) => i.severity === "warning" && i.category === "Index" && i.message.includes("FULLTEXT")), "Validator fulltext warning");
console.log("\n=== [8] Notation, Theme, Level, Capital Roundtrip ===");
var styledDiagram = {
  ...fullDiagram,
  notation: "IDEF1X",
  tableStyle: "funny",
  notationLevel: "key",
  capital: true
};
var styledXml = serializeERMXml(styledDiagram);
var parsedStyled = parseERMXml(styledXml);
assert(parsedStyled.notation === "IDEF1X", "notation IDEF1X roundtrip");
assert(parsedStyled.tableStyle === "funny", "tableStyle funny roundtrip");
assert(parsedStyled.notationLevel === "key", "notationLevel key roundtrip");
assert(parsedStyled.capital === true, "capital true roundtrip");
console.log("\n=== [9] ChangeTracking & Translations Roundtrip ===");
var trackedDiagram = {
  ...styledDiagram,
  changeTrackingList: [
    {
      id: "ct_0",
      comment: "Initial snapshot",
      updatedDate: "2026-11-22 11:45:00",
      tableNames: ["users", "orders"],
      tableCount: 2,
      columnCount: 5
    }
  ],
  translations: [
    { id: "tr_0", logicalName: "\uC0AC\uC6A9\uC790", physicalName: "user" }
  ]
};
var trackedXml = serializeERMXml(trackedDiagram);
var parsedTracked = parseERMXml(trackedXml);
assert(parsedTracked.changeTrackingList?.length === 1, "changeTrackingList roundtrip");
assert(parsedTracked.changeTrackingList?.[0].comment === "Initial snapshot", "changeTracking comment");
assert(parsedTracked.translations?.length === 1, "translations roundtrip");
assert(parsedTracked.translations?.[0].physicalName === "user", "translation entry");
console.log("\n=== [10] Model Exporters (Excel, HTML, Java, CSV, TestData) ===");
var excelXml = generateExcelXml(trackedDiagram);
assert(excelXml.includes('<Worksheet ss:Name="\uD14C\uC774\uBE14 \uC815\uC758\uC11C">'), "Excel XML worksheet");
var htmlReport = generateHtmlReport(trackedDiagram);
assert(htmlReport.includes("ERMaster \uBA85\uC138\uC11C") && htmlReport.includes("users"), "HTML report");
var javaFiles = generateJavaEntities(trackedDiagram, { packageName: "com.jlab.entity", useJpa: true, useLombok: true });
assert(javaFiles.length === 2 && javaFiles[0].content.includes("@Entity"), "Java entities");
var dictCsv = generateDictionaryCsv(trackedDiagram);
assert(dictCsv.includes("physical_name,logical_name"), "Dictionary CSV");
var transCsv = generateTranslationsCsv(trackedDiagram);
assert(transCsv.includes("\uC0AC\uC6A9\uC790") && transCsv.includes("user"), "Translations CSV");
var tdSql = generateTestDataSql(trackedDiagram);
assert(tdSql.includes("INSERT INTO users"), "TestData INSERT SQL");
console.log("\n=== [11] CategorySettings & Bendpoint Roundtrip ===");
var catDiagram = {
  ...trackedDiagram,
  categorySettings: { freeLayout: true, showReferredTables: true, selectedCategoryId: "cat_1" },
  relations: [
    { ...trackedDiagram.relations[0], bendpoints: [{ x: 300, y: 200, relative: false }] }
  ]
};
var catXml = serializeERMXml(catDiagram);
var parsedCat = parseERMXml(catXml);
assert(parsedCat.categorySettings?.freeLayout === true, "freeLayout roundtrip");
assert(parsedCat.categorySettings?.showReferredTables === true, "showReferredTables roundtrip");
assert(parsedCat.categorySettings?.selectedCategoryId === "cat_1", "selectedCategoryId roundtrip");
assert(parsedCat.relations[0].bendpoints?.length === 1, "relation bendpoint roundtrip");
console.log("SUCCESS: All tests passed!");
