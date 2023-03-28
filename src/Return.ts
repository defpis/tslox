import { AnyValue } from "./Token";

export class Return extends Error {
  value: AnyValue;

  constructor(value: AnyValue) {
    super();
    this.value = value;
  }
}
