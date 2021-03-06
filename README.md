# Expressions

Defines a language for expressions that return a value for a single row of a table. Also gives a React-based UI for editing expressions.

Complex expressions involving joins, arithmetic or case statements can be created visually and then compiled to SQL or interpreted.

See the [docs](docs/Expressions.md) for more information.

### To add a new expression
1. Add tests in `ExprCompilerTests`
2. Add tests in `testExprs`
3. Add the expression in `ExprUtils`
4. Update `ExprCompiler`
5. Update `ExprEvaluator`
6. Make tests pass
