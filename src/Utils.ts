import { RuntimeError } from "./Interpreter";
import { g } from "./State";
import { Token, TokenType } from "./Token";

export function error(token: Token, message: string) {
  if (token.type === TokenType.EOF) {
    report(token.line, "at end", message);
  } else {
    report(token.line, `at '${token.lexeme}'`, message);
  }
}

export function runtimeError(error: RuntimeError) {
  console.log(`[line ${error.token.line}]: ${error.message}`);
  g.hadRuntimeError = true;
}

export function report(line: number, where: string, message: string) {
  console.log(`[line ${line}] Error ${where}: ${message}`);
  g.hadError = true;
}
