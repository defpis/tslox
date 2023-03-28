import { RuntimeError } from "./Interpreter";
import { AnyValue, Token } from "./Token";

export class Environment {
  values = new Map();
  enclosing?: Environment;

  constructor(enclosing?: Environment) {
    this.enclosing = enclosing;
  }

  getAt(distance: number, name: string): AnyValue {
    this.ancestor(distance).values.get(name);
  }

  assignAt(distance: number, name: Token, value: AnyValue) {
    this.ancestor(distance).values.set(name.lexeme, value);
  }

  ancestor(distance: number) {
    let environment: Environment = this;
    for (let i = 0; i < distance; i++) {
      environment = environment.enclosing!; // 先遍历过一遍得到的距离，不可能取不到值
    }
    return environment;
  }

  define(name: string, value: AnyValue) {
    this.values.set(name, value);
  }

  get(name: Token): AnyValue {
    if (this.values.has(name.lexeme)) {
      return this.values.get(name.lexeme);
    }

    if (this.enclosing) {
      return this.enclosing.get(name);
    }

    throw new RuntimeError(name, `Undefined variable ${name.lexeme}.`);
  }

  assign(name: Token, value: AnyValue) {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value);
      return;
    }

    if (this.enclosing) {
      this.enclosing.assign(name, value);
      return;
    }

    throw new RuntimeError(name, `Undefined variable ${name.lexeme}.`);
  }
}
