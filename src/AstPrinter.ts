import { isNil } from "lodash";
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
// import { Token, TokenType } from "./Token";

export class AstPrinter implements ExprVisitor<string> {
  visitCallExpr(expr: CallExpr): string {
    throw new Error("Method not implemented.");
  }

  visitLogicalExpr(expr: LogicalExpr): string {
    throw new Error("Method not implemented.");
  }

  visitAssignExpr(expr: AssignExpr): string {
    throw new Error("Method not implemented.");
  }

  visitVariableExpr(expr: VariableExpr): string {
    throw new Error("Method not implemented.");
  }

  visitBinaryExpr(expr: BinaryExpr): string {
    return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
  }

  visitGroupingExpr(expr: GroupingExpr): string {
    return this.parenthesize("group", expr.expression);
  }

  visitLiteralExpr(expr: LiteralExpr): string {
    if (isNil(expr.value)) return "nil";
    return expr.value.toString();
  }

  visitUnaryExpr(expr: UnaryExpr): string {
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
