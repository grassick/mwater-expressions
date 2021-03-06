_ = require 'lodash'

# Schema for a database. Immutable.
# Stores tables with columns (possibly in nested sections).
# See docs/Schema-and-Types for details of format
module.exports = class Schema
  constructor: (json) ->
    @tables = []

    # Map of table.id to table
    @tableMap = {} 

    # Map of "<tableid>" to map of { "<columnid>" to column }
    @columnMap = {}

    if json
      @tables = json.tables

      # Setup maps
      for table in @tables
        @tableMap[table.id] = table
        @columnMap[table.id] = @_indexTable(table)

  _indexTable: (table) ->
    mapContent = (t, map, item) =>
      # Recurse for sections
      if item.type == "section"
        for item2 in item.contents
          mapContent(t, map, item2)
      else
        map[item.id] = item

    map = {}
    for item in table.contents
      mapContent(table, map, item)

    return map

  getTables: -> @tables

  getTable: (tableId) -> @tableMap[tableId]

  getColumn: (tableId, columnId) ->
    map = @columnMap[tableId]
    if not map
      return null
    return map[columnId]

  # Gets the columns in order, flattened out from sections
  getColumns: (tableId) ->
    columns = []
    searchContent = (item) =>
      # Recurse for sections
      if item.type == "section"
        for item2 in item.contents
          searchContent(item2)
      else
        columns.push(item)

    table = @getTable(tableId)
    for item in table.contents
      searchContent(item)

    return columns

  # Add table with id, name, desc, primaryKey, ordering (column with natural order) and contents (array of columns/sections)
  # Will replace table if already exists. 
  # schemas are immutable, so returns a fresh copy
  addTable: (table) ->
    # Remove existing and add new
    tables = _.filter(@tables, (t) -> t.id != table.id)
    tables.push(table)

    # Update table map
    tableMap = _.clone(@tableMap)
    tableMap[table.id] = table

    # Update column map
    columnMap = _.clone(@columnMap)
    columnMap[table.id] = @_indexTable(table)

    schema = new Schema()
    schema.tables = tables
    schema.tableMap = tableMap
    schema.columnMap = columnMap

    return schema

  # Convert to a JSON 
  toJSON: ->
    return { tables: @tables }
