
import { Token } from "./Token";
import { Expr } from "./Expr";

export interface Stmt {

  accept<R>(visitor: StmtVisitor<R>): R;

}

export interface StmtVisitor<R> {

  visitorExpressionStmt(stmt: ExpressionStmt): R;

  visitorPrintStmt(stmt: PrintStmt): R;

  visitorVarStmt(stmt: VarStmt): R;

}

export class ExpressionStmt implements Stmt {

  expression: Expr;

  constructor(expression: Expr) {

    this.expression = expression;

  }

  accept<R>(visitor: StmtVisitor<R>): R {

    return visitor.visitorExpressionStmt(this);

  }

}

export class PrintStmt implements Stmt {

  expression: Expr;

  constructor(expression: Expr) {

    this.expression = expression;

  }

  accept<R>(visitor: StmtVisitor<R>): R {

    return visitor.visitorPrintStmt(this);

  }

}

export class VarStmt implements Stmt {

  name: Token;
  initializer: Expr;

  constructor(name: Token, initializer: Expr) {

    this.name = name;
    this.initializer = initializer;

  }

  accept<R>(visitor: StmtVisitor<R>): R {

    return visitor.visitorVarStmt(this);

  }

}
