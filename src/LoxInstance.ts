import { RuntimeError } from "./Interpreter";
import { LoxClass } from "./LoxClass";
import { AnyValue, Token } from "./Token";

export class LoxInstance {
  klass: LoxClass;
  fields = new Map<string, AnyValue>();

  constructor(klass: LoxClass) {
    this.klass = klass;
  }

  get(name: Token) {
    if (this.fields.has(name.lexeme)) {
      return this.fields.get(name.lexeme);
    }

    const method = this.klass.findMethod(name.lexeme);
    if (method) return method.bind(this);

    throw new RuntimeError(name, `Undefined property '${name.lexeme}'.`);
  }

  set(name: Token, value: any) {
    this.fields.set(name.lexeme, value);
  }

  toString() {
    return `<${this.klass.name} instance>`;
  }
}
