import {
  BinaryExpr,
  Expr,
  ExprVisitor,
  GroupingExpr,
  LiteralExpr,
  UnaryExpr,
} from "./Expr";
import { Token, TokenType } from "./Token";

export class AstPrinter implements ExprVisitor<string> {
  visitorBinaryExpr(expr: BinaryExpr): string {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
  }

  visitorGroupingExpr(expr: GroupingExpr): string {
    return this.parenthesize("group", expr.expression);
  }

  visitorLiteralExpr(expr: LiteralExpr): string {
    if (expr.value === null) return "nil";
    return expr.value.toString();
  }

  visitorUnaryExpr(expr: UnaryExpr): string {
    return this.parenthesize(expr.operator.lexeme, expr.right);
  }

  parenthesize(name: string, ...exprs: Expr[]) {
    return `(${name} ${exprs.map((expr) => `${expr.accept(this)}`).join(" ")})`;
  }

  print(expr: Expr) {
    console.log(expr.accept(this));
  }
}

// npx ts-node ./src/AstPrinter.ts
// >> (* (- 123) (group 45.67))

// const expression = new BinaryExpr(
//   new UnaryExpr(new Token(TokenType.MINUS, "-", null, 1), new LiteralExpr(123)),
//   new Token(TokenType.STAR, "*", null, 1),
//   new GroupingExpr(new LiteralExpr(45.67))
// );
// new AstPrinter().print(expression);
