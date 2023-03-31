import { Interpreter } from "./Interpreter";
import { AnyValue } from "./Token";
import { FunctionStmt } from "./Stmt";
import { Environment } from "./Environment";
import { Return } from "./Return";
import { LoxInstance } from "./LoxInstance";
import { LoxCallable } from "./LoxCallable";

export class LoxFunction extends LoxCallable {
  declaration: FunctionStmt;
  closure: Environment;
  isInitializer: boolean;

  constructor(
    declaration: FunctionStmt,
    closure: Environment,
    isInitializer: boolean
  ) {
    super();
    this.declaration = declaration;
    this.closure = closure;
    this.isInitializer = isInitializer;
  }

  bind(instance: LoxInstance) {
    const environment = new Environment(this.closure);
    environment.define("this", instance);
    return new LoxFunction(this.declaration, environment, this.isInitializer);
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
      if (err instanceof Return) {
        // 构造函数中使用`return;`依旧返回this
        if (this.isInitializer) {
          return this.closure.getAt(0, "this");
        }
        return err.value;
      }
      throw err; // rethrow
    }

    if (this.isInitializer) {
      return this.closure.getAt(0, "this");
    }
  }

  toString(): string {
    return `<function ${this.declaration.name.lexeme}>`;
  }
}
