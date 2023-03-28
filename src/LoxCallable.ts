import { Interpreter } from "./Interpreter";
import { AnyValue } from "./Token";
import dayjs from "dayjs";
import { FunctionStmt } from "./Stmt";
import { Environment } from "./Environment";
import { Return } from "./Return";

export abstract class LoxCallable {
  abstract arity(): number;
  abstract call(interpreter: Interpreter, args: AnyValue[]): AnyValue;
  abstract toString(): string;
}

class Clock extends LoxCallable {
  arity(): number {
    return 0;
  }
  call() {
    return dayjs().format("YYYY-MM-DD HH:mm:ss.SSS");
  }
  toString(): string {
    return "<native function>";
  }
}

// 原生函数
export const __clock__ = new Clock();

export class LoxFunction extends LoxCallable {
  declaration: FunctionStmt;
  closure: Environment;

  constructor(declaration: FunctionStmt, closure: Environment) {
    super();
    this.declaration = declaration;
    this.closure = closure;
  }

  arity(): number {
    return this.declaration.params.length;
  }

  call(interpreter: Interpreter, args: AnyValue[]) {
    const environment = new Environment(this.closure);

    for (let i = 0; i < this.declaration.params.length; i++) {
      environment.define(this.declaration.params[i].lexeme, args[i]); // 目前形参和实参一一对应
    }

    try {
      interpreter.executeBlock(this.declaration.body, environment);
    } catch (err) {
      if (err instanceof Return) return err.value;
      throw err; // rethrow
    }
  }

  toString(): string {
    return `<function ${this.declaration.name.lexeme}>`;
  }
}
