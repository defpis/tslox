
import { Token } from "./Token";
import { Expr, VariableExpr } from "./Expr";

export interface Stmt {

  accept<R>(visitor: StmtVisitor<R>): R;

}

export interface StmtVisitor<R> {

  visitBlockStmt(stmt: BlockStmt): R;

  visitClassStmt(stmt: ClassStmt): R;

  visitExpressionStmt(stmt: ExpressionStmt): R;

  visitIfStmt(stmt: IfStmt): R;

  visitFunctionStmt(stmt: FunctionStmt): R;

  visitPrintStmt(stmt: PrintStmt): R;

  visitReturnStmt(stmt: ReturnStmt): R;

  visitVarStmt(stmt: VarStmt): R;

  visitWhileStmt(stmt: WhileStmt): R;

}

export class BlockStmt implements Stmt {

  statements: Array<Stmt | void>;

  constructor(statements: Array<Stmt | void>) {

    this.statements = statements;

  }

  accept<R>(visitor: StmtVisitor<R>): R {

    return visitor.visitBlockStmt(this);

  }

}

export class ClassStmt implements Stmt {

  name: Token;
  methods: Array<FunctionStmt>;
  superclass?: VariableExpr;

  constructor(name: Token, methods: Array<FunctionStmt>, superclass?: VariableExpr) {

    this.name = name;
    this.methods = methods;
    this.superclass = superclass;

  }

  accept<R>(visitor: StmtVisitor<R>): R {

    return visitor.visitClassStmt(this);

  }

}

export class ExpressionStmt implements Stmt {

  expression: Expr;

  constructor(expression: Expr) {

    this.expression = expression;

  }

  accept<R>(visitor: StmtVisitor<R>): R {

    return visitor.visitExpressionStmt(this);

  }

}

export class IfStmt implements Stmt {

  condition: Expr;
  thenBranch: Stmt;
  elseBranch?: Stmt;

  constructor(condition: Expr, thenBranch: Stmt, elseBranch?: Stmt) {

    this.condition = condition;
    this.thenBranch = thenBranch;
    this.elseBranch = elseBranch;

  }

  accept<R>(visitor: StmtVisitor<R>): R {

    return visitor.visitIfStmt(this);

  }

}

export class FunctionStmt implements Stmt {

  name: Token;
  params: Array<Token>;
  body: Array<Stmt | void>;

  constructor(name: Token, params: Array<Token>, body: Array<Stmt | void>) {

    this.name = name;
    this.params = params;
    this.body = body;

  }

  accept<R>(visitor: StmtVisitor<R>): R {

    return visitor.visitFunctionStmt(this);

  }

}

export class PrintStmt implements Stmt {

  expression: Expr;

  constructor(expression: Expr) {

    this.expression = expression;

  }

  accept<R>(visitor: StmtVisitor<R>): R {

    return visitor.visitPrintStmt(this);

  }

}

export class ReturnStmt implements Stmt {

  keyword: Token;
  value?: Expr;

  constructor(keyword: Token, value?: Expr) {

    this.keyword = keyword;
    this.value = value;

  }

  accept<R>(visitor: StmtVisitor<R>): R {

    return visitor.visitReturnStmt(this);

  }

}

export class VarStmt implements Stmt {

  name: Token;
  initializer?: Expr;

  constructor(name: Token, initializer?: Expr) {

    this.name = name;
    this.initializer = initializer;

  }

  accept<R>(visitor: StmtVisitor<R>): R {

    return visitor.visitVarStmt(this);

  }

}

export class WhileStmt implements Stmt {

  condition: Expr;
  body: Stmt;

  constructor(condition: Expr, body: Stmt) {

    this.condition = condition;
    this.body = body;

  }

  accept<R>(visitor: StmtVisitor<R>): R {

    return visitor.visitWhileStmt(this);

  }

}
