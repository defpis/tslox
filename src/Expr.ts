
import { Token, LiteralValue } from "./Token";

export interface Expr {

  accept<R>(visitor: ExprVisitor<R>): R;

}

export interface ExprVisitor<R> {

  visitorBinaryExpr(expr: BinaryExpr): R;

  visitorGroupingExpr(expr: GroupingExpr): R;

  visitorLiteralExpr(expr: LiteralExpr): R;

  visitorUnaryExpr(expr: UnaryExpr): R;

}

export class BinaryExpr implements Expr {

  left: Expr;
  operator: Token;
  right: Expr;

  constructor(left: Expr, operator: Token, right: Expr) {

    this.left = left;
    this.operator = operator;
    this.right = right;

  }

  accept<R>(visitor: ExprVisitor<R>): R {

    return visitor.visitorBinaryExpr(this);

  }

}

export class GroupingExpr implements Expr {

  expression: Expr;

  constructor(expression: Expr) {

    this.expression = expression;

  }

  accept<R>(visitor: ExprVisitor<R>): R {

    return visitor.visitorGroupingExpr(this);

  }

}

export class LiteralExpr implements Expr {

  value: LiteralValue;

  constructor(value: LiteralValue) {

    this.value = value;

  }

  accept<R>(visitor: ExprVisitor<R>): R {

    return visitor.visitorLiteralExpr(this);

  }

}

export class UnaryExpr implements Expr {

  operator: Token;
  right: Expr;

  constructor(operator: Token, right: Expr) {

    this.operator = operator;
    this.right = right;

  }

  accept<R>(visitor: ExprVisitor<R>): R {

    return visitor.visitorUnaryExpr(this);

  }

}
