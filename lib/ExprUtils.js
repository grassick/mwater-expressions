var ExprUtils, _, addOpItem, i, k, l, len, len1, len2, len3, len4, len5, len6, m, moment, n, o, op, opItems, p, ref, ref1, ref2, ref3, ref4, ref5, relativeDateOp, relativeDateOps, type,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  slice = [].slice;

_ = require('lodash');

moment = require('moment');

module.exports = ExprUtils = (function() {
  function ExprUtils(schema) {
    this.schema = schema;
  }

  ExprUtils.prototype.findMatchingOpItems = function(search) {
    return _.filter(opItems, (function(_this) {
      return function(opItem) {
        var lhsType, ref;
        if (search.resultTypes) {
          if (ref = opItem.resultType, indexOf.call(search.resultTypes, ref) < 0) {
            return false;
          }
        }
        if (search.op && opItem.op !== search.op) {
          return false;
        }
        if ((search.aggr != null) && opItem.aggr !== search.aggr) {
          return false;
        }
        if (search.ordered === false && opItem.ordered) {
          return false;
        }
        if ((search.prefix != null) && opItem.prefix !== search.prefix) {
          return false;
        }
        if (search.lhsExpr) {
          lhsType = _this.getExprType(search.lhsExpr);
          if (lhsType && opItem.exprTypes[0] !== null && opItem.exprTypes[0] !== lhsType && opItem.moreExprType !== lhsType) {
            return false;
          }
        }
        if (search.lhsExpr && opItem.lhsCond && !opItem.lhsCond(search.lhsExpr, _this)) {
          return false;
        }
        return true;
      };
    })(this));
  };

  ExprUtils.isOpAggr = function(op) {
    return _.findWhere(opItems, {
      op: op,
      aggr: true
    }) != null;
  };

  ExprUtils.isOpPrefix = function(op) {
    return _.findWhere(opItems, {
      op: op,
      prefix: true
    }) != null;
  };

  ExprUtils.prototype.followJoins = function(startTable, joins) {
    var i, j, joinCol, len, t;
    t = startTable;
    for (i = 0, len = joins.length; i < len; i++) {
      j = joins[i];
      joinCol = this.schema.getColumn(t, j);
      t = joinCol.join.toTable;
    }
    return t;
  };

  ExprUtils.prototype.isMultipleJoins = function(table, joins) {
    var i, j, joinCol, len, ref, t;
    t = table;
    for (i = 0, len = joins.length; i < len; i++) {
      j = joins[i];
      joinCol = this.schema.getColumn(t, j);
      if ((ref = joinCol.join.type) === '1-n' || ref === 'n-n') {
        return true;
      }
      t = joinCol.join.toTable;
    }
    return false;
  };

  ExprUtils.prototype.getExprEnumValues = function(expr) {
    var column, cse, enumValues, i, len, ref, ref1;
    if (!expr) {
      return;
    }
    if (expr.type === "field") {
      column = this.schema.getColumn(expr.table, expr.column);
      if (!column) {
        return null;
      }
      if (column.enumValues) {
        return column.enumValues;
      }
      if (column.type === "expr") {
        return this.getExprEnumValues(column.expr);
      }
      return null;
    }
    if (expr.type === "scalar") {
      if (expr.expr) {
        return this.getExprEnumValues(expr.expr);
      }
    }
    if (expr.type === "op" && ((ref = expr.op) === "last" || ref === "last where" || ref === "previous") && expr.exprs[0]) {
      return this.getExprEnumValues(expr.exprs[0]);
    }
    if (expr.type === "op" && expr.op === "weekofmonth") {
      return [
        {
          id: "1",
          name: {
            en: "1"
          }
        }, {
          id: "2",
          name: {
            en: "2"
          }
        }, {
          id: "3",
          name: {
            en: "3"
          }
        }, {
          id: "4",
          name: {
            en: "4"
          }
        }, {
          id: "5",
          name: {
            en: "5"
          }
        }
      ];
    }
    if (expr.type === "op" && expr.op === "month") {
      return [
        {
          id: "01",
          name: {
            en: "January"
          }
        }, {
          id: "02",
          name: {
            en: "February"
          }
        }, {
          id: "03",
          name: {
            en: "March"
          }
        }, {
          id: "04",
          name: {
            en: "April"
          }
        }, {
          id: "05",
          name: {
            en: "May"
          }
        }, {
          id: "06",
          name: {
            en: "June"
          }
        }, {
          id: "07",
          name: {
            en: "July"
          }
        }, {
          id: "08",
          name: {
            en: "August"
          }
        }, {
          id: "09",
          name: {
            en: "September"
          }
        }, {
          id: "10",
          name: {
            en: "October"
          }
        }, {
          id: "11",
          name: {
            en: "November"
          }
        }, {
          id: "12",
          name: {
            en: "December"
          }
        }
      ];
    }
    if (expr.type === "case") {
      ref1 = expr.cases;
      for (i = 0, len = ref1.length; i < len; i++) {
        cse = ref1[i];
        enumValues = this.getExprEnumValues(cse.then);
        if (enumValues) {
          return enumValues;
        }
      }
      return this.getExprEnumValues(expr["else"]);
    }
  };

  ExprUtils.prototype.getExprIdTable = function(expr) {
    var column, ref, ref1;
    if (!expr) {
      return null;
    }
    if (expr.type === "literal" && ((ref = expr.valueType) === "id" || ref === "id[]")) {
      return expr.idTable;
    }
    if (expr.type === "id") {
      return expr.table;
    }
    if (expr.type === "scalar") {
      return this.getExprIdTable(expr.expr);
    }
    if (expr.type === "field") {
      column = this.schema.getColumn(expr.table, expr.column);
      if ((column != null ? column.type : void 0) === "join") {
        return column.join.toTable;
      }
      if ((column != null ? column.type : void 0) === "expr") {
        return this.getExprIdTable(column.expr);
      }
      if ((ref1 = column != null ? column.type : void 0) === "id" || ref1 === "id[]") {
        return column.idTable;
      }
      return null;
    }
  };

  ExprUtils.prototype.getExprType = function(expr) {
    var column, cse, i, len, matchingOpItems, ref, ref1, resultTypes, type;
    if ((expr == null) || !expr.type) {
      return null;
    }
    switch (expr.type) {
      case "field":
        column = this.schema.getColumn(expr.table, expr.column);
        if (column) {
          if (column.type === "join") {
            if ((ref = column.join.type) === '1-1' || ref === 'n-1') {
              return "id";
            } else {
              return "id[]";
            }
          } else if (column.type === "expr") {
            return this.getExprType(column.expr);
          }
          return column.type;
        }
        return null;
      case "id":
        return "id";
      case "scalar":
        if (expr.aggr) {
          return this.getExprType({
            type: "op",
            op: expr.aggr,
            table: expr.table,
            exprs: [expr.expr]
          });
        }
        return this.getExprType(expr.expr);
      case "op":
        matchingOpItems = this.findMatchingOpItems({
          op: expr.op
        });
        resultTypes = _.uniq(_.compact(_.pluck(matchingOpItems, "resultType")));
        if (resultTypes.length === 1) {
          return resultTypes[0];
        }
        matchingOpItems = this.findMatchingOpItems({
          op: expr.op,
          lhsExpr: expr.exprs[0]
        });
        resultTypes = _.uniq(_.compact(_.pluck(matchingOpItems, "resultType")));
        if (resultTypes.length === 1) {
          return resultTypes[0];
        }
        return null;
      case "literal":
        return expr.valueType;
      case "case":
        ref1 = expr.cases;
        for (i = 0, len = ref1.length; i < len; i++) {
          cse = ref1[i];
          type = this.getExprType(cse.then);
          if (type) {
            return type;
          }
        }
        return this.getExprType(expr["else"]);
      case "build enumset":
        return "enumset";
      case "score":
        return "number";
      case "count":
        return "count";
      default:
        throw new Error("Not implemented for " + expr.type);
    }
  };

  ExprUtils.prototype.getExprAggrStatus = function(expr) {
    var column, depth, exprs, getListAggrStatus;
    if ((expr == null) || !expr.type) {
      return null;
    }
    getListAggrStatus = (function(_this) {
      return function(exprs) {
        var i, k, l, len, len1, len2, subExpr;
        for (i = 0, len = exprs.length; i < len; i++) {
          subExpr = exprs[i];
          if (_this.getExprAggrStatus(subExpr) === "aggregate") {
            return "aggregate";
          }
        }
        for (k = 0, len1 = exprs.length; k < len1; k++) {
          subExpr = exprs[k];
          if (_this.getExprAggrStatus(subExpr) === "individual") {
            return "individual";
          }
        }
        for (l = 0, len2 = exprs.length; l < len2; l++) {
          subExpr = exprs[l];
          if (_this.getExprAggrStatus(subExpr) === "literal") {
            return "literal";
          }
        }
        return null;
      };
    })(this);
    switch (expr.type) {
      case "id":
      case "scalar":
        return "individual";
      case "field":
        column = this.schema.getColumn(expr.table, expr.column);
        if (column != null ? column.expr : void 0) {
          depth = (arguments[1] || 0) + 1;
          if (depth > 100) {
            throw new Error("Infinite recursion");
          }
          return this.getExprAggrStatus(column.expr, depth + 1);
        }
        return "individual";
      case "op":
        if (this.findMatchingOpItems({
          op: expr.op,
          aggr: true
        })[0]) {
          return "aggregate";
        }
        return getListAggrStatus(expr.exprs);
      case "literal":
        return "literal";
      case "case":
        exprs = [expr.input, expr["else"]];
        exprs = exprs.concat(_.map(expr.cases, function(cs) {
          return cs.when;
        }));
        exprs = exprs.concat(_.map(expr.cases, function(cs) {
          return cs.then;
        }));
        return getListAggrStatus(exprs);
      case "score":
        return this.getExprAggrStatus(expr.input);
      case "build enumset":
        exprs = _.values(expr.values);
        return getListAggrStatus(exprs);
      case "count":
      case "comparison":
      case "logical":
        return "individual";
      default:
        throw new Error("Not implemented for " + expr.type);
    }
  };

  ExprUtils.prototype.areJoinsValid = function(table, joins) {
    var i, j, joinCol, len, t;
    t = table;
    for (i = 0, len = joins.length; i < len; i++) {
      j = joins[i];
      joinCol = this.schema.getColumn(t, j);
      if (!joinCol) {
        return false;
      }
      t = joinCol.join.toTable;
    }
    return true;
  };

  ExprUtils.prototype.getExprTable = function(expr) {
    if (!expr) {
      return null;
    }
    return expr.table;
  };

  ExprUtils.prototype.getAggrTypes = function(expr) {
    var aggrOpItems, ref;
    aggrOpItems = this.findMatchingOpItems({
      lhsExpr: expr,
      aggr: true,
      ordered: ((ref = this.schema.getTable(expr.table)) != null ? ref.ordering : void 0) != null
    });
    return _.uniq(_.pluck(aggrOpItems, "resultType"));
  };

  ExprUtils.prototype.localizeString = function(name, locale) {
    return ExprUtils.localizeString(name, locale);
  };

  ExprUtils.localizeString = function(name, locale) {
    if (!name) {
      return name;
    }
    if (typeof name === "string") {
      return name;
    }
    if (locale && (name[locale] != null)) {
      return name[locale];
    }
    if (name._base && (name[name._base] != null)) {
      return name[name._base];
    }
    if (name.en != null) {
      return name.en;
    }
    return null;
  };

  ExprUtils.andExprs = function() {
    var exprs;
    exprs = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    exprs = _.map(exprs, function(expr) {
      if ((expr != null ? expr.type : void 0) === "op" && expr.op === "and") {
        return expr.exprs;
      } else {
        return expr;
      }
    });
    exprs = _.compact(_.flatten(exprs));
    if (exprs.length === 0) {
      return null;
    }
    if (exprs.length === 1) {
      return exprs[0];
    }
    return {
      type: "op",
      op: "and",
      exprs: exprs
    };
  };

  ExprUtils.prototype.summarizeExpr = function(expr, locale) {
    var opItem, ref, ref1, ref2, ref3, ref4, ref5, ref6;
    if (!expr) {
      return "None";
    }
    switch (expr.type) {
      case "scalar":
        return this.summarizeScalarExpr(expr, locale);
      case "field":
        return this.localizeString((ref = this.schema.getColumn(expr.table, expr.column)) != null ? ref.name : void 0, locale);
      case "id":
        return this.localizeString((ref1 = this.schema.getTable(expr.table)) != null ? ref1.name : void 0, locale);
      case "op":
        if (expr.op === "contains" && ((ref2 = expr.exprs[1]) != null ? ref2.type : void 0) === "literal") {
          return this.summarizeExpr(expr.exprs[0], locale) + " includes all of " + this.stringifyLiteralValue("enumset", expr.exprs[1].value, locale, this.getExprEnumValues(expr.exprs[0]));
        }
        if (expr.op === "intersects" && ((ref3 = expr.exprs[1]) != null ? ref3.type : void 0) === "literal") {
          return this.summarizeExpr(expr.exprs[0], locale) + " includes any of " + this.stringifyLiteralValue("enumset", expr.exprs[1].value, locale, this.getExprEnumValues(expr.exprs[0]));
        }
        if (expr.op === "= any" && ((ref4 = expr.exprs[1]) != null ? ref4.type : void 0) === "literal") {
          return this.summarizeExpr(expr.exprs[0], locale) + " is any of " + this.stringifyLiteralValue("enumset", expr.exprs[1].value, locale, this.getExprEnumValues(expr.exprs[0]));
        }
        if (expr.op === "=" && ((ref5 = expr.exprs[1]) != null ? ref5.type : void 0) === "literal" && ((ref6 = expr.exprs[1]) != null ? ref6.valueType : void 0) === "enum") {
          return this.summarizeExpr(expr.exprs[0], locale) + " is " + this.stringifyLiteralValue("enum", expr.exprs[1].value, locale, this.getExprEnumValues(expr.exprs[0]));
        }
        if (expr.op === "count") {
          return "Number of " + this.localizeString(this.schema.getTable(expr.table).name, locale);
        }
        opItem = this.findMatchingOpItems({
          op: expr.op
        })[0];
        if (opItem) {
          if (opItem.prefix) {
            return opItem.name + " " + _.map(expr.exprs, (function(_this) {
              return function(e) {
                return _this.summarizeExpr(e, locale);
              };
            })(this)).join(", ");
          }
          if (expr.exprs.length === 1) {
            return this.summarizeExpr(expr.exprs[0], locale) + " " + opItem.name;
          }
          return _.map(expr.exprs, (function(_this) {
            return function(e) {
              return _this.summarizeExpr(e, locale);
            };
          })(this)).join(" " + opItem.name + " ");
        } else {
          return "";
        }
        break;
      case "case":
        return this.summarizeCaseExpr(expr, locale);
      case "literal":
        return expr.value + "";
      case "score":
        return "Score of " + this.summarizeExpr(expr.input, locale);
      case "build enumset":
        return "Build Enumset";
      case "count":
        return "Count";
      default:
        throw new Error("Unsupported type " + expr.type);
    }
  };

  ExprUtils.prototype.summarizeScalarExpr = function(expr, locale) {
    var exprType, i, innerExpr, join, joinCol, len, ref, ref1, ref2, str, t;
    exprType = this.getExprType(expr.expr);
    str = "";
    t = expr.table;
    ref = expr.joins;
    for (i = 0, len = ref.length; i < len; i++) {
      join = ref[i];
      joinCol = this.schema.getColumn(t, join);
      if (joinCol) {
        str += this.localizeString(joinCol.name, locale) + " > ";
      } else {
        str += "NOT FOUND > ";
      }
      t = joinCol.join.toTable;
    }
    if (((ref1 = expr.expr) != null ? ref1.type : void 0) === "id" && !expr.aggr) {
      str = str.substring(0, str.length - 3);
    } else {
      innerExpr = expr.expr;
      if (expr.aggr) {
        innerExpr = {
          type: "op",
          op: expr.aggr,
          table: (ref2 = expr.expr) != null ? ref2.table : void 0,
          exprs: [expr.expr]
        };
      }
      str += this.summarizeExpr(innerExpr, locale);
    }
    return str;
  };

  ExprUtils.prototype.summarizeCaseExpr = function(expr, locale) {
    var c, i, len, ref, str;
    str = "If";
    ref = expr.cases;
    for (i = 0, len = ref.length; i < len; i++) {
      c = ref[i];
      str += " " + this.summarizeExpr(c.when);
      str += " Then " + this.summarizeExpr(c.then);
    }
    if (expr["else"]) {
      str += " Else " + this.summarizeExpr(expr["else"]);
    }
    return str;
  };

  ExprUtils.prototype.stringifyExprLiteral = function(expr, literal, locale, preferEnumCodes) {
    if (preferEnumCodes == null) {
      preferEnumCodes = false;
    }
    return this.stringifyLiteralValue(this.getExprType(expr), literal, locale, this.getExprEnumValues(expr), preferEnumCodes);
  };

  ExprUtils.prototype.stringifyLiteralValue = function(type, value, locale, enumValues, preferEnumCodes) {
    var item;
    if (preferEnumCodes == null) {
      preferEnumCodes = false;
    }
    if (value == null) {
      return "None";
    }
    switch (type) {
      case "text":
        return value;
      case "number":
        return "" + value;
      case "enum":
        item = _.findWhere(enumValues, {
          id: value
        });
        if (item) {
          if (preferEnumCodes && item.code) {
            return item.code;
          }
          return ExprUtils.localizeString(item.name, locale);
        }
        return "???";
      case "enumset":
        return _.map(value, (function(_this) {
          return function(val) {
            item = _.findWhere(enumValues, {
              id: val
            });
            if (item) {
              if (preferEnumCodes && item.code) {
                return item.code;
              }
              return ExprUtils.localizeString(item.name, locale);
            }
            return "???";
          };
        })(this)).join(', ');
      case "text[]":
        if (_.isString(value)) {
          value = JSON.parse(value || "[]");
        }
        return value.join(', ');
      case "date":
        return moment(value, moment.ISO_8601).format("ll");
      case "datetime":
        return moment(value, moment.ISO_8601).format("lll");
    }
    if (value === true) {
      return "True";
    }
    if (value === false) {
      return "False";
    }
    return "" + value;
  };

  ExprUtils.prototype.getComparisonOps = function(lhsType) {
    var ops;
    ops = [];
    switch (lhsType) {
      case "number":
        ops.push({
          id: "=",
          name: "equals"
        });
        ops.push({
          id: ">",
          name: "is greater than"
        });
        ops.push({
          id: ">=",
          name: "is greater or equal to"
        });
        ops.push({
          id: "<",
          name: "is less than"
        });
        ops.push({
          id: "<=",
          name: "is less than or equal to"
        });
        break;
      case "text":
        ops.push({
          id: "= any",
          name: "is one of"
        });
        ops.push({
          id: "=",
          name: "is"
        });
        ops.push({
          id: "~*",
          name: "matches"
        });
        break;
      case "date":
      case "datetime":
        ops.push({
          id: "between",
          name: "between"
        });
        ops.push({
          id: ">",
          name: "after"
        });
        ops.push({
          id: "<",
          name: "before"
        });
        break;
      case "enum":
        ops.push({
          id: "= any",
          name: "is one of"
        });
        ops.push({
          id: "=",
          name: "is"
        });
        break;
      case "boolean":
        ops.push({
          id: "= true",
          name: "is true"
        });
        ops.push({
          id: "= false",
          name: "is false"
        });
    }
    ops.push({
      id: "is null",
      name: "has no value"
    });
    ops.push({
      id: "is not null",
      name: "has a value"
    });
    return ops;
  };

  ExprUtils.prototype.getComparisonRhsType = function(lhsType, op) {
    if (op === '= true' || op === '= false' || op === 'is null' || op === 'is not null') {
      return null;
    }
    if (op === '= any') {
      if (lhsType === "enum") {
        return 'enum[]';
      } else if (lhsType === "text") {
        return "text[]";
      } else {
        throw new Error("Invalid lhs type for op = any");
      }
    }
    if (op === "between") {
      if (lhsType === "date") {
        return 'daterange';
      }
      if (lhsType === "datetime") {
        return 'datetimerange';
      } else {
        throw new Error("Invalid lhs type for op between");
      }
    }
    return lhsType;
  };

  ExprUtils.prototype.getReferencedFields = function(expr) {
    var cols, column, i, join, k, l, len, len1, len2, len3, len4, m, n, ref, ref1, ref2, ref3, ref4, subcase, subexpr, table, value;
    cols = [];
    if (!expr) {
      return cols;
    }
    switch (expr.type) {
      case "field":
        cols.push(expr);
        column = this.schema.getColumn(expr.table, expr.column);
        if (column != null ? column.expr : void 0) {
          cols = cols.concat(this.getReferencedFields(column.expr));
        }
        break;
      case "op":
        ref = expr.exprs;
        for (i = 0, len = ref.length; i < len; i++) {
          subexpr = ref[i];
          cols = cols.concat(this.getReferencedFields(subexpr));
        }
        break;
      case "case":
        ref1 = expr.cases;
        for (k = 0, len1 = ref1.length; k < len1; k++) {
          subcase = ref1[k];
          cols = cols.concat(this.getReferencedFields(subcase.when));
          cols = cols.concat(this.getReferencedFields(subcase.then));
        }
        cols = cols.concat(this.getReferencedFields(expr["else"]));
        break;
      case "scalar":
        table = expr.table;
        ref2 = expr.joins;
        for (l = 0, len2 = ref2.length; l < len2; l++) {
          join = ref2[l];
          cols.push({
            type: "field",
            table: table,
            column: join
          });
          column = this.schema.getColumn(table, join);
          if (!column) {
            break;
          }
          table = column.join.toTable;
        }
        cols = cols.concat(this.getReferencedFields(expr.expr));
        break;
      case "score":
        cols = cols.concat(this.getReferencedFields(expr.input));
        ref3 = _.values(expr.scores);
        for (m = 0, len3 = ref3.length; m < len3; m++) {
          value = ref3[m];
          cols = cols.concat(this.getReferencedFields(value));
        }
        break;
      case "build enumset":
        ref4 = _.values(expr.values);
        for (n = 0, len4 = ref4.length; n < len4; n++) {
          value = ref4[n];
          cols = cols.concat(this.getReferencedFields(value));
        }
    }
    return _.uniq(cols, function(col) {
      return col.table + "/" + col.column;
    });
  };

  return ExprUtils;

})();

opItems = [];

addOpItem = (function(_this) {
  return function(item) {
    return opItems.push(_.defaults(item, {
      prefix: false,
      rhsLiteral: true,
      aggr: false,
      ordered: false
    }));
  };
})(this);

addOpItem({
  op: "= any",
  name: "is any of",
  resultType: "boolean",
  exprTypes: ["text", "text[]"]
});

addOpItem({
  op: "= any",
  name: "is any of",
  resultType: "boolean",
  exprTypes: ["enum", "enumset"]
});

addOpItem({
  op: "contains",
  name: "includes all of",
  resultType: "boolean",
  exprTypes: ["enumset", "enumset"]
});

addOpItem({
  op: "intersects",
  name: "includes any of",
  resultType: "boolean",
  exprTypes: ["enumset", "enumset"]
});

relativeDateOps = [['thisyear', 'is this year'], ['lastyear', 'is last year'], ['thismonth', 'is this month'], ['lastmonth', 'is last month'], ['today', 'is today'], ['yesterday', 'is yesterday'], ['last24hours', 'is in last 24 hours'], ['last7days', 'is in last 7 days'], ['last30days', 'is in last 30 days'], ['last365days', 'is in last 365 days'], ['last3months', 'is in last 3 months'], ['last6months', 'is in last 6 months'], ['last12months', 'is in last 12 months']];

for (i = 0, len = relativeDateOps.length; i < len; i++) {
  relativeDateOp = relativeDateOps[i];
  addOpItem({
    op: relativeDateOp[0],
    name: relativeDateOp[1],
    resultType: "boolean",
    exprTypes: ['date']
  });
  addOpItem({
    op: relativeDateOp[0],
    name: relativeDateOp[1],
    resultType: "boolean",
    exprTypes: ['datetime']
  });
}

addOpItem({
  op: "between",
  name: "is between",
  resultType: "boolean",
  exprTypes: ["date", "date", "date"]
});

addOpItem({
  op: "between",
  name: "is between",
  resultType: "boolean",
  exprTypes: ["datetime", "datetime", "datetime"]
});

addOpItem({
  op: "=",
  name: "is",
  resultType: "boolean",
  exprTypes: ["number", "number"]
});

addOpItem({
  op: "=",
  name: "is",
  resultType: "boolean",
  exprTypes: ["text", "text"]
});

addOpItem({
  op: "=",
  name: "is",
  resultType: "boolean",
  exprTypes: ["enum", "enum"]
});

addOpItem({
  op: "=",
  name: "is",
  resultType: "boolean",
  exprTypes: ["date", "date"]
});

addOpItem({
  op: "=",
  name: "is",
  resultType: "boolean",
  exprTypes: ["datetime", "datetime"]
});

addOpItem({
  op: "=",
  name: "is",
  resultType: "boolean",
  exprTypes: ["boolean", "boolean"]
});

addOpItem({
  op: "<>",
  name: "is not",
  resultType: "boolean",
  exprTypes: ["text", "text"]
});

addOpItem({
  op: "<>",
  name: "is not",
  resultType: "boolean",
  exprTypes: ["enum", "enum"]
});

addOpItem({
  op: "<>",
  name: "is not",
  resultType: "boolean",
  exprTypes: ["date", "date"]
});

addOpItem({
  op: "<>",
  name: "is not",
  resultType: "boolean",
  exprTypes: ["datetime", "datetime"]
});

addOpItem({
  op: "<>",
  name: "is not",
  resultType: "boolean",
  exprTypes: ["boolean", "boolean"]
});

addOpItem({
  op: "<>",
  name: "is not",
  resultType: "boolean",
  exprTypes: ["number", "number"]
});

addOpItem({
  op: ">",
  name: "is greater than",
  resultType: "boolean",
  exprTypes: ["number", "number"]
});

addOpItem({
  op: "<",
  name: "is less than",
  resultType: "boolean",
  exprTypes: ["number", "number"]
});

addOpItem({
  op: ">=",
  name: "is greater than or equal to",
  resultType: "boolean",
  exprTypes: ["number", "number"]
});

addOpItem({
  op: "<=",
  name: "is less than or equal to",
  resultType: "boolean",
  exprTypes: ["number", "number"]
});

ref = ['date', 'datetime'];
for (k = 0, len1 = ref.length; k < len1; k++) {
  type = ref[k];
  addOpItem({
    op: ">",
    name: "is after",
    resultType: "boolean",
    exprTypes: [type, type]
  });
  addOpItem({
    op: "<",
    name: "is before",
    resultType: "boolean",
    exprTypes: [type, type]
  });
  addOpItem({
    op: ">=",
    name: "is after or same as",
    resultType: "boolean",
    exprTypes: [type, type]
  });
  addOpItem({
    op: "<=",
    name: "is before or same as",
    resultType: "boolean",
    exprTypes: [type, type]
  });
}

addOpItem({
  op: "between",
  name: "is between",
  resultType: "boolean",
  exprTypes: ["number", "number", "number"]
});

addOpItem({
  op: "round",
  name: "Round",
  desc: "Round a number to closest whole number",
  resultType: "number",
  exprTypes: ["number"],
  prefix: true
});

addOpItem({
  op: "floor",
  name: "Floor",
  desc: "Round a number down",
  resultType: "number",
  exprTypes: ["number"],
  prefix: true
});

addOpItem({
  op: "ceiling",
  name: "Ceiling",
  desc: "Round a number up",
  resultType: "number",
  exprTypes: ["number"],
  prefix: true
});

addOpItem({
  op: "latitude",
  name: "Latitude of",
  desc: "Get latitude in degrees of a location",
  resultType: "number",
  exprTypes: ["geometry"],
  prefix: true
});

addOpItem({
  op: "longitude",
  name: "Longitude of",
  desc: "Get longitude in degrees of a location",
  resultType: "number",
  exprTypes: ["geometry"],
  prefix: true
});

addOpItem({
  op: "distance",
  name: "Distance between",
  desc: "Get distance in meters between two locations",
  resultType: "number",
  exprTypes: ["geometry", "geometry"],
  prefix: true,
  rhsLiteral: false,
  joiner: "and"
});

addOpItem({
  op: "and",
  name: "and",
  resultType: "boolean",
  exprTypes: [],
  moreExprType: "boolean"
});

addOpItem({
  op: "or",
  name: "or",
  resultType: "boolean",
  exprTypes: [],
  moreExprType: "boolean"
});

ref1 = ['+', '*'];
for (l = 0, len2 = ref1.length; l < len2; l++) {
  op = ref1[l];
  addOpItem({
    op: op,
    name: op,
    resultType: "number",
    exprTypes: [],
    moreExprType: "number"
  });
}

addOpItem({
  op: "-",
  name: "-",
  resultType: "number",
  exprTypes: ["number", "number"]
});

addOpItem({
  op: "/",
  name: "/",
  resultType: "number",
  exprTypes: ["number", "number"]
});

addOpItem({
  op: "days difference",
  name: "Days between",
  desc: "Get the number of days between two dates",
  resultType: "number",
  exprTypes: ["date", "date"],
  prefix: true,
  rhsLiteral: false,
  joiner: "and"
});

addOpItem({
  op: "days difference",
  name: "Days between",
  desc: "Get the number of days between two dates",
  resultType: "number",
  exprTypes: ["datetime", "datetime"],
  prefix: true,
  rhsLiteral: false,
  joiner: "and"
});

addOpItem({
  op: "days since",
  name: "Days since",
  desc: "Get number of days from a date to the present",
  resultType: "number",
  exprTypes: ["date"],
  prefix: true,
  rhsLiteral: false
});

addOpItem({
  op: "days since",
  name: "Days since",
  desc: "Get number of days from a date to the present",
  resultType: "number",
  exprTypes: ["datetime"],
  prefix: true,
  rhsLiteral: false
});

addOpItem({
  op: "month",
  name: "Month",
  desc: "Month of year",
  resultType: "enum",
  exprTypes: ["date"],
  prefix: true,
  rhsLiteral: false
});

addOpItem({
  op: "month",
  name: "Month",
  desc: "Month of year",
  resultType: "enum",
  exprTypes: ["datetime"],
  prefix: true,
  rhsLiteral: false
});

addOpItem({
  op: "yearmonth",
  name: "Year and Month",
  desc: "Date of start of month",
  resultType: "date",
  exprTypes: ["date"],
  prefix: true,
  rhsLiteral: false
});

addOpItem({
  op: "yearmonth",
  name: "Year and Month",
  desc: "Date of start of month",
  resultType: "date",
  exprTypes: ["datetime"],
  prefix: true,
  rhsLiteral: false
});

addOpItem({
  op: "year",
  name: "Year",
  desc: "Date of start of year",
  resultType: "date",
  exprTypes: ["date"],
  prefix: true,
  rhsLiteral: false
});

addOpItem({
  op: "year",
  name: "Year",
  desc: "Date of start of year",
  resultType: "date",
  exprTypes: ["datetime"],
  prefix: true,
  rhsLiteral: false
});

addOpItem({
  op: "weekofmonth",
  name: "Week of month",
  desc: "Week within the month",
  resultType: "enum",
  exprTypes: ["date"],
  prefix: true,
  rhsLiteral: false
});

addOpItem({
  op: "weekofmonth",
  name: "Week of month",
  desc: "Week within the month",
  resultType: "enum",
  exprTypes: ["datetime"],
  prefix: true,
  rhsLiteral: false
});

ref2 = ['text', 'number', 'enum', 'enumset', 'boolean', 'date', 'datetime', 'geometry'];
for (m = 0, len3 = ref2.length; m < len3; m++) {
  type = ref2[m];
  addOpItem({
    op: "last",
    name: "Latest",
    desc: "Get latest value when there are multiple",
    resultType: type,
    exprTypes: [type],
    prefix: true,
    aggr: true,
    ordered: true
  });
  addOpItem({
    op: "last where",
    name: "Latest where",
    desc: "Get latest value that matches a condition",
    resultType: type,
    exprTypes: [type, "boolean"],
    prefix: true,
    prefixLabel: "Latest",
    aggr: true,
    ordered: true,
    rhsLiteral: false,
    joiner: "where",
    rhsPlaceholder: "All"
  });
  addOpItem({
    op: "previous",
    name: "Previous",
    desc: "Get 2nd latest value when there are multiple",
    resultType: type,
    exprTypes: [type],
    prefix: true,
    aggr: true,
    ordered: true
  });
}

addOpItem({
  op: "sum",
  name: "Total",
  desc: "Add all values together",
  resultType: "number",
  exprTypes: ["number"],
  prefix: true,
  aggr: true
});

addOpItem({
  op: "avg",
  name: "Average",
  desc: "Average all values together",
  resultType: "number",
  exprTypes: ["number"],
  prefix: true,
  aggr: true
});

ref3 = ['number', 'date', 'datetime'];
for (n = 0, len4 = ref3.length; n < len4; n++) {
  type = ref3[n];
  addOpItem({
    op: "min",
    name: "Minimum",
    desc: "Get smallest value",
    resultType: type,
    exprTypes: [type],
    prefix: true,
    aggr: true
  });
  addOpItem({
    op: "max",
    name: "Maximum",
    desc: "Get largest value",
    resultType: type,
    exprTypes: [type],
    prefix: true,
    aggr: true
  });
}

addOpItem({
  op: "percent where",
  name: "Percent where",
  desc: "Get percent of items that match a condition",
  resultType: "number",
  exprTypes: ["boolean", "boolean"],
  prefix: true,
  aggr: true,
  rhsLiteral: false,
  joiner: "of",
  rhsPlaceholder: "All"
});

addOpItem({
  op: "count where",
  name: "Number where",
  desc: "Get number of items that match a condition",
  resultType: "number",
  exprTypes: ["boolean"],
  prefix: true,
  aggr: true
});

addOpItem({
  op: "sum where",
  name: "Total where",
  desc: "Add together only values that match a condition",
  resultType: "number",
  exprTypes: ["number", "boolean"],
  prefix: true,
  prefixLabel: "Total",
  aggr: true,
  rhsLiteral: false,
  joiner: "where",
  rhsPlaceholder: "All"
});

addOpItem({
  op: "within",
  name: "is within",
  resultType: "boolean",
  exprTypes: ["id", "id"],
  lhsCond: (function(_this) {
    return function(lhsExpr, exprUtils) {
      var lhsIdTable;
      lhsIdTable = exprUtils.getExprIdTable(lhsExpr);
      if (lhsIdTable) {
        return (exprUtils.schema.getTable(lhsIdTable).ancestry != null) || (exprUtils.schema.getTable(lhsIdTable).ancestryTable != null);
      }
      return false;
    };
  })(this)
});

addOpItem({
  op: "within any",
  name: "is within any of",
  resultType: "boolean",
  exprTypes: ["id", "id[]"],
  lhsCond: (function(_this) {
    return function(lhsExpr, exprUtils) {
      var lhsIdTable;
      lhsIdTable = exprUtils.getExprIdTable(lhsExpr);
      if (lhsIdTable) {
        return (exprUtils.schema.getTable(lhsIdTable).ancestry != null) || (exprUtils.schema.getTable(lhsIdTable).ancestryTable != null);
      }
      return false;
    };
  })(this)
});

addOpItem({
  op: "= any",
  name: "is any of",
  resultType: "boolean",
  exprTypes: ["id", "id[]"]
});

addOpItem({
  op: "contains",
  name: "includes all of",
  resultType: "boolean",
  exprTypes: ["id[]", "id[]"]
});

addOpItem({
  op: "=",
  name: "is",
  resultType: "boolean",
  exprTypes: ["id", "id"]
});

addOpItem({
  op: "<>",
  name: "is not",
  resultType: "boolean",
  exprTypes: ["id", "id"]
});

addOpItem({
  op: "count",
  name: "Total Number",
  desc: "Get total number of items",
  resultType: "number",
  exprTypes: [],
  prefix: true,
  aggr: true
});

addOpItem({
  op: "percent",
  name: "Percent of Total",
  desc: "Percent of all items",
  resultType: "number",
  exprTypes: [],
  prefix: true,
  aggr: true
});

addOpItem({
  op: "~*",
  name: "matches",
  resultType: "boolean",
  exprTypes: ["text", "text"]
});

addOpItem({
  op: "not",
  name: "Not",
  desc: "Opposite of a value",
  resultType: "boolean",
  exprTypes: ["boolean"],
  prefix: true
});

ref4 = ['text', 'number', 'enum', 'enumset', 'boolean', 'date', 'datetime', 'geometry', 'image', 'imagelist', 'id'];
for (o = 0, len5 = ref4.length; o < len5; o++) {
  type = ref4[o];
  addOpItem({
    op: "is null",
    name: "is blank",
    resultType: "boolean",
    exprTypes: [type]
  });
  addOpItem({
    op: "is not null",
    name: "is not blank",
    resultType: "boolean",
    exprTypes: [type]
  });
}

ref5 = ['id', 'text'];
for (p = 0, len6 = ref5.length; p < len6; p++) {
  type = ref5[p];
  addOpItem({
    op: "count distinct",
    name: "Number of unique",
    desc: "Count number of unique values",
    resultType: "number",
    exprTypes: [type],
    prefix: true,
    aggr: true
  });
}

addOpItem({
  op: "length",
  name: "Number of values in",
  desc: "Advanced: number of values selected in a multi-choice field",
  resultType: "number",
  exprTypes: ["enumset"],
  prefix: true
});

addOpItem({
  op: "length",
  name: "Number of values in",
  desc: "Advanced: number of images present",
  resultType: "number",
  exprTypes: ["imagelist"],
  prefix: true
});

addOpItem({
  op: "length",
  name: "Number of values in",
  desc: "Advanced: number of items present in a text list",
  resultType: "number",
  exprTypes: ["text[]"],
  prefix: true
});

addOpItem({
  op: "to text",
  name: "Convert to text",
  desc: "Advanced: convert a choice or number type to a text value",
  resultType: "text",
  exprTypes: ["enum"],
  prefix: true
});

addOpItem({
  op: "to text",
  name: "Convert to text",
  desc: "Advanced: convert a choice or number type to a text value",
  resultType: "text",
  exprTypes: ["number"],
  prefix: true
});
