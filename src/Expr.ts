
import { Token, AnyValue } from "./Token";

export interface Expr {

  accept<R>(visitor: ExprVisitor<R>): R;

}

export interface ExprVisitor<R> {

  visitorAssignExpr(expr: AssignExpr): R;

  visitorBinaryExpr(expr: BinaryExpr): R;

  visitorGroupingExpr(expr: GroupingExpr): R;

  visitorLiteralExpr(expr: LiteralExpr): R;

  visitorUnaryExpr(expr: UnaryExpr): R;

  visitorVariableExpr(expr: VariableExpr): R;

}

export class AssignExpr implements Expr {

  name: Token;
  value: Expr;

  constructor(name: Token, value: Expr) {

    this.name = name;
    this.value = value;

  }

  accept<R>(visitor: ExprVisitor<R>): R {

    return visitor.visitorAssignExpr(this);

  }

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

  value: AnyValue;

  constructor(value: AnyValue) {

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

export class VariableExpr implements Expr {

  name: Token;

  constructor(name: Token) {

    this.name = name;

  }

  accept<R>(visitor: ExprVisitor<R>): R {

    return visitor.visitorVariableExpr(this);

  }

}
