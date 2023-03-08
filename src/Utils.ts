import { globalState } from "./State";
import { Token, TokenType } from "./Token";

export function error(token: Token, message: string) {
  if (token.type === TokenType.EOF) {
    report(token.line, " at end", message);
  } else {
    report(token.line, ` at '${token.lexeme}'`, message);
  }
}

export function report(line: number, where: string, message: string) {
  console.log(`[line ${line}] Error ${where}: ${message}`);
  globalState.hadError = true;
}
