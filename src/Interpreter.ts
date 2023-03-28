import {
  AssignExpr,
  BinaryExpr,
  CallExpr,
  Expr,
  ExprVisitor,
  GroupingExpr,
  LiteralExpr,
  LogicalExpr,
  UnaryExpr,
  VariableExpr,
} from "./Expr";
import {
  BlockStmt,
  ExpressionStmt,
  FunctionStmt,
  IfStmt,
  PrintStmt,
  ReturnStmt,
  Stmt,
  StmtVisitor,
  VarStmt,
  WhileStmt,
} from "./Stmt";
import { AnyValue, Token } from "./Token";
import { TokenType } from "./Token";
import { toNumber, isNumber, isString, toString, isNil } from "lodash";
import { Environment } from "./Environment";
import { Lox } from "./Lox";
import { LoxCallable, LoxFunction, __clock__ } from "./LoxCallable";
import { Return } from "./Return";

export class RuntimeError extends Error {
  token: Token;

  constructor(token: Token, message: string) {
    super(message);
    this.token = token;
  }
}

export class Interpreter implements ExprVisitor<AnyValue>, StmtVisitor<void> {
  globals = new Environment();
  environment = this.globals;
  locals = new Map<Expr, number>();

  constructor() {
    this.globals.define("clock", __clock__);
  }

  resolve(expr: Expr, depth: number) {
    this.locals.set(expr, depth);
  }

  visitReturnStmt(stmt: ReturnStmt): void {
    let value;
    if (stmt.value) {
      value = this.evaluate(stmt.value);
    }
    throw new Return(value);
  }

  visitFunctionStmt(stmt: FunctionStmt): void {
    const func = new LoxFunction(stmt, this.environment);
    this.environment.define(stmt.name.lexeme, func);
  }

  visitCallExpr(expr: CallExpr) {
    const callee = this.evaluate(expr.callee);

    const args: AnyValue[] = [];
    for (const arg of expr.args) {
      args.push(this.evaluate(arg));
    }

    if (!(callee instanceof LoxCallable)) {
      throw new RuntimeError(
        expr.paren,
        "Can only call functions and classes."
      );
    }

    const func = callee;

    if (args.length !== func.arity()) {
      throw new RuntimeError(
        expr.paren,
        `Expect ${func.arity()} arguments, but got ${args.length}.`
      );
    }

    return func.call(this, args);
  }

  visitWhileStmt(stmt: WhileStmt): void {
    while (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.body);
    }
  }

  visitLogicalExpr(expr: LogicalExpr) {
    const left = this.evaluate(expr.left);

    if (expr.operator.type === TokenType.OR) {
      if (this.isTruthy(left)) return left;
    } else {
      if (!this.isTruthy(left)) return left;
    }

    return this.evaluate(expr.right);
  }

  visitIfStmt(stmt: IfStmt): void {
    if (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.thenBranch);
    } else if (stmt.elseBranch) {
      this.execute(stmt.elseBranch);
    }
  }

  visitBlockStmt(stmt: BlockStmt): void {
    this.executeBlock(stmt.statements, new Environment(this.environment));
  }

  executeBlock(statements: Array<Stmt | void>, environment: Environment) {
    const previous = this.environment;

    try {
      this.environment = environment;

      for (const stmt of statements) {
        stmt && this.execute(stmt);
      }
    } finally {
      this.environment = previous;
    }
  }

  visitAssignExpr(expr: AssignExpr): AnyValue {
    const value = this.evaluate(expr.value);
    const distance = this.locals.get(expr);

    // distance == 0,1,2...
    if (!isNil(distance)) {
      this.environment.assignAt(distance, expr.name, value);
    } else {
      this.globals.assign(expr.name, value);
    }

    return value;
  }

  visitVariableExpr(expr: VariableExpr): AnyValue {
    return this.lookUpVariable(expr.name, expr);
  }

  lookUpVariable(name: Token, expr: Expr): AnyValue {
    const distance = this.locals.get(expr);

    // distance == 0,1,2...
    if (!isNil(distance)) {
      return this.environment.getAt(distance, name.lexeme);
    } else {
      return this.globals.get(name);
    }
  }

  visitVarStmt(stmt: VarStmt): void {
    let value;
    if (stmt.initializer) {
      value = this.evaluate(stmt.initializer);
    }
    this.environment.define(stmt.name.lexeme, value);
  }

  visitExpressionStmt(stmt: ExpressionStmt): void {
    this.evaluate(stmt.expression);
  }

  visitPrintStmt(stmt: PrintStmt): void {
    const value = this.evaluate(stmt.expression);
    console.log(this.stringify(value));
  }

  interpret(statements: Array<Stmt | void>) {
    try {
      for (const stmt of statements) {
        stmt && this.execute(stmt);
      }
    } catch (err) {
      if (err instanceof RuntimeError) {
        Lox.runtimeError(err);
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

  visitBinaryExpr(expr: BinaryExpr): AnyValue {
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
  }

  visitGroupingExpr(expr: GroupingExpr): AnyValue {
    return this.evaluate(expr.expression);
  }

  visitLiteralExpr(expr: LiteralExpr): AnyValue {
    return expr.value;
  }

  visitUnaryExpr(expr: UnaryExpr): AnyValue {
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.BANG:
        return !this.isTruthy(right);
      case TokenType.MINUS:
        this.checkNumberOperand(expr.operator, right);
        return -toNumber(right);
    }
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
