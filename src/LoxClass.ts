import { Interpreter } from "./Interpreter";
import { LoxCallable } from "./LoxCallable";
import { LoxFunction } from "./LoxFunction";
import { LoxInstance } from "./LoxInstance";
import { AnyValue } from "./Token";

export class LoxClass extends LoxCallable {
  name: string;
  methods: Map<string, LoxFunction>;

  constructor(name: string, methods: Map<string, LoxFunction>) {
    super();
    this.name = name;
    this.methods = methods;
  }

  arity(): number {
    const initializer = this.findMethod("init");
    if (initializer) return initializer.arity();
    return 0;
  }

  call(interpreter: Interpreter, args: AnyValue[]) {
    const instance = new LoxInstance(this);

    const initializer = this.findMethod("init");
    if (initializer) {
      initializer.bind(instance).call(interpreter, args);
    }

    return instance;
  }

  findMethod(name: string): LoxFunction | void {
    if (this.methods.has(name)) {
      return this.methods.get(name);
    }
  }

  toString() {
    return `<class ${this.name}>`;
  }
}
