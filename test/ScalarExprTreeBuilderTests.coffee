assert = require('chai').assert
_ = require 'lodash'
ScalarExprTreeBuilder = require '../src/ui/ScalarExprTreeBuilder'
Schema = require '../src/Schema'

describe "ScalarExprTreeBuilder", ->
  beforeEach ->
    @schema = new Schema()
    @schema.addTable({ id: "t1", name: "T1", contents: [
      { id: "c1", name: "C1", type: "text" }
    ]})

    @schema.addTable({ id: "t2", name: "T2", contents: [
      { id: "c1", name: "C1", type: "text" }
    ]})

  it "returns columns", ->
    nodes = new ScalarExprTreeBuilder(@schema).getTree(table: "t1")
    assert.deepEqual _.pluck(nodes, "name"), ["C1"]
    assert _.isEqual(nodes[0].value, { table: "t1", joins: [], expr: { type: "field", table: "t1", column: "c1"}}), JSON.stringify(nodes[0].value)

  it "returns table sections if present", ->
    @schema = new Schema()
    @schema.addTable({ id: "t1", contents: [
        { id: "c2", name: "C2", type: "text" }
        { name: "A", type: "section", contents: [
          { id: "c4", name: "C4", type: "text" }
          { id: "c5", name: "C5", type: "text" }
        ]}
    ]})

    nodes = new ScalarExprTreeBuilder(@schema).getTree(table: "t1")
    assert.deepEqual _.pluck(nodes, "name"), ["C2", "A"]
    assert.equal nodes[1].children().length, 2
    assert.equal nodes[1].children()[0].name, "C4"

  it "returns count expr as first if includeCount is true", ->
    # Should not add root node
    nodes = new ScalarExprTreeBuilder(@schema).getTree({ table: "t1", includeCount: true })
    assert.deepEqual _.pluck(nodes, "name"), ["Number of T1", "C1"]
    assert.deepEqual nodes[0].value.expr, { type: "count", table: "t1" }, JSON.stringify(nodes[0].value)

  it "follows joins", ->
    # Join column
    join = { fromTable: "t1", fromCol: "c1", toTable: "t2", toCol: "c1", op: "=", multiple: false }
    
    @schema.addTable({ id: "t1", name: "T1", contents: [
      { id: "c1", name: "C1", type: "text" }
      { id: "c2", name: "C2", type: "join", join: join }
    ]})

    nodes = new ScalarExprTreeBuilder(@schema).getTree(table: "t1")
    # Go to 2nd child
    subnode = nodes[1]

    assert _.isEqual(subnode.children()[0].value, { table: "t1", joins: ["c2"], expr: { type: "field", table: "t2", column: "c1"}}), JSON.stringify(subnode)

  it "limits to one table", ->
    # Should not add root node
    nodes = new ScalarExprTreeBuilder(@schema).getTree({ table: "t1" })
    assert.deepEqual _.pluck(nodes, "name"), ["C1"]

  describe "limits type", ->
    it "includes direct types", ->
      @schema.addTable({ id: "t1", name: "T1", contents: [
        { id: "c1", name: "C1", type: "text" }
        { id: "c2", name: "C2", type: "integer" }
      ]})

      # Get nodes 
      nodes = new ScalarExprTreeBuilder(@schema).getTree({ table: "t1", types: ["integer"] })
      assert.equal nodes.length, 1

      # Get nodes of first table
      nodes = new ScalarExprTreeBuilder(@schema).getTree({ table: "t1", types: ["decimal"] })
      assert.equal nodes.length, 0, "Decimal not included"

    it "includes types formed by aggregation", ->
      # Join column
      join = { fromTable: "t1", fromCol: "c1", toTable: "t2", toCol: "c1", op: "=", multiple: true }
      @schema.addTable({ id: "t1", name: "T1", contents: [
        { id: "c1", name: "C1", type: "text" }
        { id: "c2", name: "C2", type: "join", join: join }
      ]})

      # Go to 2nd child, children
      nodes = new ScalarExprTreeBuilder(@schema).getTree({ table: "t1", types: ["integer"] })[0].children()
      
      # Should include count and text field, because can be aggregated to integer via count
      assert.equal nodes.length, 2, "Should include count and text"

      assert.equal nodes[0].name, "Number of T2"
      assert.deepEqual nodes[0].value.expr, { type: "count", table: "t2" }

      assert.equal nodes[1].name, "C1"
      assert.equal nodes[1].value.expr.column, "c1"
