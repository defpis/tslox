import fs from "fs";
import readline from "readline";
import { Interpreter, RuntimeError } from "./Interpreter";
import { Parser } from "./Parser";
import { Scanner } from "./Scanner";
import { Token, TokenType } from "./Token";

export class Lox {
  static hadError = false;
  static hadRuntimeError = false;
  static interpreter = new Interpreter();

  static error(token: Token, message: string) {
    if (token.type === TokenType.EOF) {
      Lox.report(token.line, "at end", message);
    } else {
      Lox.report(token.line, `at '${token.lexeme}'`, message);
    }
  }

  static runtimeError(error: RuntimeError) {
    console.log(`[line ${error.token.line}]: ${error.message}`);
    Lox.hadRuntimeError = true;
  }

  static report(line: number, where: string, message: string) {
    console.log(`[line ${line}] Error ${where}: ${message}`);
    Lox.hadError = true;
  }

  static run(source: string) {
    const scanner = new Scanner(source);
    const tokens = scanner.scanTokens();

    // console.log(tokens);

    const parser = new Parser(tokens);
    const statements = parser.parse();

    if (Lox.hadError) return;

    Lox.interpreter.interpret(statements);
  }

  static runFile(path: string) {
    const buffer = fs.readFileSync(path);
    Lox.run(buffer.toString());

    if (Lox.hadError) {
      process.exit(65);
    }

    if (Lox.hadRuntimeError) {
      process.exit(70);
    }
  }

  static runPrompt() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: ">>> ",
    });

    rl.on("line", (line) => {
      line = line.trim();

      if (line === "exit") {
        rl.close();
      } else {
        if (line) {
          try {
            Lox.run(line);
          } catch (err) {
            console.log(err);
          } finally {
            Lox.hadError = false;
          }
        }
        rl.prompt();
      }
    });

    rl.prompt();
  }
}

(function main() {
  // node index.js ...
  // console.log(process.argv);

  if (process.argv.length > 3) {
    console.log("Usage: Lox [script]");
    process.exit(64);
  } else if (process.argv.length === 3) {
    Lox.runFile(process.argv[2]);
  } else {
    Lox.runPrompt();
  }
})();
