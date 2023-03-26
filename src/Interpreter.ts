import {
  AssignExpr,
  BinaryExpr,
  Expr,
  ExprVisitor,
  GroupingExpr,
  LiteralExpr,
  UnaryExpr,
  VariableExpr,
} from "./Expr";
import {
  BlockStmt,
  ExpressionStmt,
  PrintStmt,
  Stmt,
  StmtVisitor,
  VarStmt,
} from "./Stmt";
import { AnyValue, Token } from "./Token";
import { TokenType } from "./Token";
import { toNumber, isNumber, isString, toString, isNil } from "lodash";
import { runtimeError } from "./Utils";
import { Environment } from "./Environment";

export class RuntimeError extends Error {
  token: Token;

  constructor(token: Token, message: string) {
    super(message);
    this.token = token;
  }
}

export class Interpreter implements ExprVisitor<AnyValue>, StmtVisitor<void> {
  environemnt = new Environment();

  visitorBlockStmt(stmt: BlockStmt): void {
    this.executeBlock(stmt.statements, new Environment(this.environemnt));
    return;
  }

  executeBlock(statements: Array<Stmt | void>, environemnt: Environment) {
    const previous = this.environemnt;

    try {
      this.environemnt = environemnt;

      for (const stmt of statements) {
        stmt && this.execute(stmt);
      }
    } finally {
      this.environemnt = previous;
    }
  }

  visitorAssignExpr(expr: AssignExpr): AnyValue {
    const value = this.evaluate(expr.value);
    this.environemnt.assign(expr.name, value);
    return value;
  }

  visitorVariableExpr(expr: VariableExpr): AnyValue {
    return this.environemnt.get(expr.name);
  }

  visitorVarStmt(stmt: VarStmt): void {
    let value;
    if (stmt.initializer) {
      value = this.evaluate(stmt.initializer);
    }
    this.environemnt.define(stmt.name, value);
    return;
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

  interpret(statements: Array<Stmt | void>) {
    try {
      for (const stmt of statements) {
        stmt && this.execute(stmt);
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

  stringify(value: AnyValue) {
    if (isNil(value)) return "nil";
    return toString(value);
  }

  visitorBinaryExpr(expr: BinaryExpr): AnyValue {
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

    return;
  }

  visitorGroupingExpr(expr: GroupingExpr): AnyValue {
    return this.evaluate(expr.expression);
  }

  visitorLiteralExpr(expr: LiteralExpr): AnyValue {
    return expr.value;
  }

  visitorUnaryExpr(expr: UnaryExpr): AnyValue {
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.BANG:
        return !this.isTruthy(right);
      case TokenType.MINUS:
        this.checkNumberOperand(expr.operator, right);
        return -toNumber(right);
    }

    return;
  }

  evaluate(expr: Expr): AnyValue {
    return expr.accept(this);
  }

  isTruthy(value: AnyValue) {
    return !!value;
  }

  isEqual(left: AnyValue, right: AnyValue) {
    return left === right;
  }

  checkNumberOperand(operator: Token, value: AnyValue) {
    if (isNumber(value)) return;
    throw new RuntimeError(operator, "Operand must be a number.");
  }

  checkNumberOperands(operator: Token, left: AnyValue, right: AnyValue) {
    if (isNumber(left) && isNumber(right)) return;
    throw new RuntimeError(operator, "Operands must be numbers.");
  }
}
