import { Interpreter } from "./Interpreter";
import { AnyValue } from "./Token";
import dayjs from "dayjs";

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
