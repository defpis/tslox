import { isArray } from "lodash";
import {
  AssignExpr,
  BinaryExpr,
  CallExpr,
  Expr,
  ExprVisitor,
  GetExpr,
  GroupingExpr,
  LiteralExpr,
  LogicalExpr,
  SetExpr,
  SuperExpr,
  ThisExpr,
  UnaryExpr,
  VariableExpr,
} from "./Expr";
import { Interpreter } from "./Interpreter";
import { Lox } from "./Lox";
import {
  BlockStmt,
  ClassStmt,
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
import { Token } from "./Token";

export enum FunctionType {
  NONE,
  FUNCTION,
  INITIALIZER,
  METHOD,
}

export enum ClassType {
  NONE,
  CLASS,
  SUBCLASS,
}

export class Resolver implements ExprVisitor<void>, StmtVisitor<void> {
  interpreter: Interpreter;
  scopes: Array<Map<string, boolean>> = []; // 数组当成栈用
  currentFunction = FunctionType.NONE;
  currentClass = ClassType.NONE;

  // 类似 Java Stack 的 peek() 方法
  get scope() {
    return this.scopes[this.scopes.length - 1];
  }

  isEmpty() {
    return this.scopes.length === 0;
  }

  constructor(interpreter: Interpreter) {
    this.interpreter = interpreter;
  }

  visitSuperExpr(expr: SuperExpr): void {
    if (this.currentClass === ClassType.NONE) {
      Lox.error(expr.keyword, "Can't use 'super' outside of a class.");
    } else if (this.currentClass !== ClassType.SUBCLASS) {
      Lox.error(
        expr.keyword,
        "Can't use 'super' in a class with no superclass."
      );
    }

    this.resolveLocal(expr, expr.keyword);
  }

  visitThisExpr(expr: ThisExpr): void {
    if (this.currentClass === ClassType.NONE) {
      Lox.error(expr.keyword, "Can't use 'this' outside of a class.");
    } else {
      this.resolveLocal(expr, expr.keyword);
    }
  }

  visitSetExpr(expr: SetExpr): void {
    this.resolve(expr.value);
    this.resolve(expr.object);
  }

  visitGetExpr(expr: GetExpr): void {
    this.resolve(expr.object);
  }

  visitClassStmt(stmt: ClassStmt): void {
    const enclosingClass = this.currentClass;
    this.currentClass = ClassType.CLASS;

    this.declare(stmt.name);
    this.define(stmt.name);

    if (stmt.superclass && stmt.name.lexeme === stmt.superclass.name.lexeme) {
      Lox.error(stmt.superclass.name, "A class can't inherit from itself.");
    }

    if (stmt.superclass) {
      this.currentClass = ClassType.SUBCLASS;
      this.resolve(stmt.superclass);
    }

    if (stmt.superclass) {
      this.beginScope();
      this.scope.set("super", true);
    }

    this.beginScope();
    this.scope.set("this", true);
    for (const method of stmt.methods) {
      this.resolveFunction(
        method,
        method.name.lexeme === "init"
          ? FunctionType.INITIALIZER
          : FunctionType.METHOD
      );
    }
    this.endScope();

    if (stmt.superclass) {
      this.endScope();
    }

    this.currentClass = enclosingClass;
  }

  visitBlockStmt(stmt: BlockStmt): void {
    this.beginScope();
    this.resolve(stmt.statements);
    this.endScope();
  }

  beginScope() {
    this.scopes.push(new Map<string, boolean>());
  }

  endScope() {
    this.scopes.pop();
  }

  resolve(stmts: void | Expr): void;
  resolve(stmts: void | Stmt): void;
  resolve(stmts: (void | Stmt)[]): void;

  resolve(stmts: (void | Stmt)[] | void | Stmt | Expr): void {
    if (isArray(stmts)) {
      for (const stmt of stmts) {
        this.resolve(stmt);
      }
    } else {
      stmts && stmts.accept(this);
    }
  }

  visitExpressionStmt(stmt: ExpressionStmt): void {
    this.resolve(stmt.expression);
  }

  visitIfStmt(stmt: IfStmt): void {
    this.resolve(stmt.condition);
    this.resolve(stmt.thenBranch);
    if (stmt.elseBranch) this.resolve(stmt.elseBranch);
  }

  visitFunctionStmt(stmt: FunctionStmt): void {
    this.declare(stmt.name);
    this.define(stmt.name);
    this.resolveFunction(stmt, FunctionType.FUNCTION);
  }

  resolveFunction(stmt: FunctionStmt, type: FunctionType) {
    const enclosingFunction = this.currentFunction;
    this.currentFunction = type;

    this.beginScope();
    for (const param of stmt.params) {
      this.declare(param);
      this.define(param);
    }
    this.resolve(stmt.body);
    this.endScope();

    this.currentFunction = enclosingFunction;
  }

  visitPrintStmt(stmt: PrintStmt): void {
    this.resolve(stmt.expression);
  }

  visitReturnStmt(stmt: ReturnStmt): void {
    if (this.currentFunction === FunctionType.NONE) {
      Lox.error(stmt.keyword, "Can't return form top-level code.");
    }
    if (stmt.value) {
      if (this.currentFunction === FunctionType.INITIALIZER) {
        Lox.error(stmt.keyword, "Can't return a value from an initializer.");
      }
      this.resolve(stmt.value);
    }
  }

  visitVarStmt(stmt: VarStmt): void {
    this.declare(stmt.name);
    if (stmt.initializer) {
      this.resolve(stmt.initializer);
    }
    this.define(stmt.name);
  }

  declare(name: Token) {
    if (this.isEmpty()) return;

    if (this.scope.has(name.lexeme)) {
      Lox.error(name, "Already declare variable with this name in this scope.");
    }

    this.scope.set(name.lexeme, false);
  }

  define(name: Token) {
    if (this.isEmpty()) return;
    this.scope.set(name.lexeme, true);
  }

  visitWhileStmt(stmt: WhileStmt): void {
    this.resolve(stmt.condition);
    this.resolve(stmt.body);
  }

  visitAssignExpr(expr: AssignExpr): void {
    this.resolve(expr.value);
    this.resolveLocal(expr, expr.name);
  }

  visitBinaryExpr(expr: BinaryExpr): void {
    this.resolve(expr.left);
    this.resolve(expr.right);
  }

  visitCallExpr(expr: CallExpr): void {
    this.resolve(expr.callee);

    for (const arg of expr.args) {
      this.resolve(arg);
    }
  }

  visitGroupingExpr(expr: GroupingExpr): void {
    this.resolve(expr.expression);
  }

  visitLiteralExpr(expr: LiteralExpr): void {
    // nothing to do...
  }

  visitLogicalExpr(expr: LogicalExpr): void {
    this.resolve(expr.left);
    this.resolve(expr.right);
  }

  visitUnaryExpr(expr: UnaryExpr): void {
    this.resolve(expr.right);
  }

  visitVariableExpr(expr: VariableExpr): void {
    // TODO 为什么递归自身的函数无法在当前scope中找到？
    if (!this.isEmpty() && this.scope.get(expr.name.lexeme) === false) {
      Lox.error(expr.name, "Can't read local variable in its own initializer.");
    }

    this.resolveLocal(expr, expr.name);
  }

  resolveLocal(expr: Expr, name: Token) {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i].has(name.lexeme)) {
        this.interpreter.resolve(expr, this.scopes.length - 1 - i);
        return;
      }
    }
  }
}
