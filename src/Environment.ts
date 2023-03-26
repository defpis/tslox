import { RuntimeError } from "./Interpreter";
import { AnyValue, Token } from "./Token";

export class Environment {
  values = new Map();
  enclosing?: Environment;

  constructor(enclosing?: Environment) {
    this.enclosing = enclosing;
  }

  define(name: Token, value: AnyValue) {
    this.values.set(name.lexeme, value);
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
