var ComparisonExprComponent, DateRangeLiteralComponent, EditableLinkComponent, ExpressionBuilder, H, React, ScalarExprComponent, TextArrayComponent, literalComponents,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

React = require('react');

H = React.DOM;

ScalarExprComponent = require('./ScalarExprComponent');

literalComponents = require('./literalComponents');

ExpressionBuilder = require('../ExpressionBuilder');

EditableLinkComponent = require('./EditableLinkComponent');

TextArrayComponent = require('./TextArrayComponent');

DateRangeLiteralComponent = require('./DateRangeLiteralComponent');

module.exports = ComparisonExprComponent = (function(superClass) {
  extend(ComparisonExprComponent, superClass);

  function ComparisonExprComponent() {
    this.handleRhsChange = bind(this.handleRhsChange, this);
    this.handleOpChange = bind(this.handleOpChange, this);
    this.handleLhsChange = bind(this.handleLhsChange, this);
    return ComparisonExprComponent.__super__.constructor.apply(this, arguments);
  }

  ComparisonExprComponent.propTypes = {
    value: React.PropTypes.object.isRequired,
    onChange: React.PropTypes.func.isRequired,
    schema: React.PropTypes.object.isRequired,
    dataSource: React.PropTypes.object.isRequired,
    table: React.PropTypes.string.isRequired
  };

  ComparisonExprComponent.prototype.handleLhsChange = function(lhs) {
    return this.props.onChange(_.extend({}, this.props.value || {
      type: "comparison",
      table: this.props.table
    }, {
      lhs: lhs
    }));
  };

  ComparisonExprComponent.prototype.handleOpChange = function(op) {
    return this.props.onChange(_.extend({}, this.props.value, {
      op: op
    }));
  };

  ComparisonExprComponent.prototype.handleRhsChange = function(rhs) {
    return this.props.onChange(_.extend({}, this.props.value, {
      rhs: rhs
    }));
  };

  ComparisonExprComponent.prototype.render = function() {
    var currentOp, exprBuilder, hideOp, lhsControl, lhsType, opControl, ops, rhsControl, rhsType;
    exprBuilder = new ExpressionBuilder(this.props.schema);
    lhsControl = React.createElement(ScalarExprComponent, {
      key: "lhs",
      schema: this.props.schema,
      dataSource: this.props.dataSource,
      table: this.props.table,
      value: this.props.value.lhs,
      onChange: this.handleLhsChange,
      preventRemove: true,
      editorTitle: "Filter By",
      editorInitiallyOpen: !this.props.value.lhs
    });
    lhsType = exprBuilder.getExprType(this.props.value.lhs);
    if (lhsType) {
      ops = exprBuilder.getComparisonOps(lhsType);
      currentOp = _.findWhere(ops, {
        id: this.props.value.op
      });
      hideOp = false;
      if (currentOp) {
        if (currentOp.id === "= any" && (lhsType === 'enum' || lhsType === 'text')) {
          hideOp = true;
        }
        if (currentOp.id === "between" && (lhsType === 'date' || lhsType === 'datetime')) {
          hideOp = true;
        }
      }
      if (!hideOp) {
        opControl = React.createElement(EditableLinkComponent, {
          dropdownItems: ops,
          onDropdownItemClicked: this.handleOpChange
        }, currentOp ? currentOp.name : void 0);
      }
    }
    if (lhsType && this.props.value.op) {
      rhsType = exprBuilder.getComparisonRhsType(lhsType, this.props.value.op);
      switch (rhsType) {
        case "text":
          rhsControl = React.createElement(literalComponents.TextComponent, {
            key: "rhs",
            value: this.props.value.rhs,
            onChange: this.handleRhsChange
          });
          break;
        case "integer":
          rhsControl = React.createElement(literalComponents.IntegerComponent, {
            key: "rhs",
            value: this.props.value.rhs,
            onChange: this.handleRhsChange
          });
          break;
        case "decimal":
          rhsControl = React.createElement(literalComponents.DecimalComponent, {
            key: "rhs",
            value: this.props.value.rhs,
            onChange: this.handleRhsChange
          });
          break;
        case "date":
          rhsControl = React.createElement(literalComponents.DateComponent, {
            key: "rhs",
            value: this.props.value.rhs,
            onChange: this.handleRhsChange
          });
          break;
        case "datetime":
          rhsControl = React.createElement(literalComponents.DatetimeComponent, {
            key: "rhs",
            value: this.props.value.rhs,
            onChange: this.handleRhsChange
          });
          break;
        case "enum":
          rhsControl = React.createElement(literalComponents.EnumComponent, {
            key: "rhs",
            value: this.props.value.rhs,
            enumValues: exprBuilder.getExprValues(this.props.value.lhs),
            onChange: this.handleRhsChange
          });
          break;
        case "enum[]":
          rhsControl = React.createElement(literalComponents.EnumArrComponent, {
            key: "rhs",
            value: this.props.value.rhs,
            enumValues: exprBuilder.getExprValues(this.props.value.lhs),
            onChange: this.handleRhsChange
          });
          break;
        case "text[]":
          rhsControl = React.createElement(TextArrayComponent, {
            key: "rhs",
            value: this.props.value.rhs,
            expr: this.props.value.lhs,
            schema: this.props.schema,
            dataSource: this.props.dataSource,
            onChange: this.handleRhsChange
          });
          break;
        case "daterange":
          rhsControl = React.createElement(DateRangeLiteralComponent, {
            key: "rhs",
            datetime: false,
            value: this.props.value.rhs,
            onChange: this.handleRhsChange
          });
          break;
        case "datetimerange":
          rhsControl = React.createElement(DateRangeLiteralComponent, {
            key: "rhs",
            datetime: true,
            value: this.props.value.rhs,
            onChange: this.handleRhsChange
          });
      }
    }
    return H.div(null, lhsControl, " ", opControl, " ", rhsControl);
  };

  return ComparisonExprComponent;

})(React.Component);
