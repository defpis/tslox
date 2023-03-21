import {
  BinaryExpr,
  Expr,
  ExprVisitor,
  GroupingExpr,
  LiteralExpr,
  UnaryExpr,
  VariableExpr,
} from "./Expr";
import { ExpressionStmt, PrintStmt, Stmt, StmtVisitor, VarStmt } from "./Stmt";
import { LiteralValue, Token } from "./Token";
import { TokenType } from "./Token";
import { toNumber, isNumber, isString, toString, isNil } from "lodash";
import { runtimeError } from "./Utils";

export class RuntimeError extends Error {
  token: Token;

  constructor(token: Token, message: string) {
    super(message);
    this.token = token;
  }
}

// Object无法表示null、undefined等，用LiteralValue代替
export class Interpreter
  implements ExprVisitor<LiteralValue>, StmtVisitor<void>
{
  visitorVariableExpr(expr: VariableExpr) {
    throw new Error("Method not implemented.");
  }

  visitorVarStmt(stmt: VarStmt): void {
    throw new Error("Method not implemented.");
  }

  visitorExpressionStmt(stmt: ExpressionStmt): void {
    this.evaluate(stmt.expression);
    return;
  }

  visitorPrintStmt(stmt: PrintStmt): void {
    const value = this.evaluate(stmt.expression);
    console.log(this.stringify(value));
    return;
  }

  interpret(statements: Stmt[]) {
    try {
      for (const stmt of statements) {
        this.execute(stmt);
      }
    } catch (err) {
      if (err instanceof RuntimeError) {
        runtimeError(err);
      } else {
        throw err; // rethrow
      }
    }
  }

  execute(stmt: Stmt) {
    stmt.accept(this);
  }

  stringify(value: LiteralValue) {
    if (isNil(value)) return "nil";
    return toString(value);
  }

  visitorBinaryExpr(expr: BinaryExpr): LiteralValue {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.GREATER:
        this.checkNumberOperands(expr.operator, left, right);
        return toNumber(left) > toNumber(right);
      case TokenType.GREATER_EQUAL:
        this.checkNumberOperands(expr.operator, left, right);
        return toNumber(left) >= toNumber(right);
      case TokenType.LESS:
        this.checkNumberOperands(expr.operator, left, right);
        return toNumber(left) < toNumber(right);
      case TokenType.LESS_EQUAL:
        this.checkNumberOperands(expr.operator, left, right);
        return toNumber(left) <= toNumber(right);
      case TokenType.MINUS:
        this.checkNumberOperands(expr.operator, left, right);
        return toNumber(left) - toNumber(right);
      case TokenType.PLUS:
        if (isNumber(left) && isNumber(right)) {
          return toNumber(left) + toNumber(right);
        }
        if (isString(left) && isString(right)) {
          return toString(left) + toString(right);
        }
        throw new RuntimeError(
          expr.operator,
          "Operands must be two numbers or two strings."
        );
      case TokenType.SLASH:
        this.checkNumberOperands(expr.operator, left, right);

        if (right === 0) {
          throw new RuntimeError(
            expr.operator,
            "Operand can't be divided by zero"
          );
        }

        return toNumber(left) / toNumber(right);
      case TokenType.STAR:
        this.checkNumberOperands(expr.operator, left, right);
        return toNumber(left) * toNumber(right);
      case TokenType.BANG_EQUAL:
        return !this.isEqual(left, right);
      case TokenType.EQUAL_EQUAL:
        return this.isEqual(left, right);
    }

    return null;
  }

  visitorGroupingExpr(expr: GroupingExpr): LiteralValue {
    return this.evaluate(expr.expression);
  }

  visitorLiteralExpr(expr: LiteralExpr): LiteralValue {
    return expr.value;
  }

  visitorUnaryExpr(expr: UnaryExpr): LiteralValue {
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.BANG:
        return !this.isTruthy(right);
      case TokenType.MINUS:
        this.checkNumberOperand(expr.operator, right);
        return -toNumber(right);
    }

    return null;
  }

  evaluate(expr: Expr) {
    return expr.accept(this);
  }

  isTruthy(value: LiteralValue) {
    return !!value;
  }

  isEqual(left: LiteralValue, right: LiteralValue) {
    return left === right;
  }

  checkNumberOperand(operator: Token, value: LiteralValue) {
    if (isNumber(value)) return;
    throw new RuntimeError(operator, "Operand must be a number.");
  }

  checkNumberOperands(
    operator: Token,
    left: LiteralValue,
    right: LiteralValue
  ) {
    if (isNumber(left) && isNumber(right)) return;
    throw new RuntimeError(operator, "Operands must be numbers.");
  }
}
