import fs from "fs";
import readline from "readline";
import { AstPrinter } from "./AstPrinter";
import { Interpreter } from "./Interpreter";
import { Parser } from "./Parser";
import { Scanner } from "./Scanner";
import { g } from "./State";

function run(source: string) {
  const scanner = new Scanner(source);
  const tokens = scanner.scanTokens();

  // console.log(tokens);

  const parser = new Parser(tokens);
  const expression = parser.parse();

  if (g.hadError) return;

  // const printer = new AstPrinter();
  // printer.print(expression!);

  const interpreter = new Interpreter();
  interpreter.interpret(expression!);
}

function runFile(path: string) {
  const buffer = fs.readFileSync(path);
  run(buffer.toString());

  if (g.hadError) {
    process.exit(65);
  }

  if (g.hadRuntimeError) {
    process.exit(70);
  }
}

function runPrompt() {
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
          run(line);
          g.hadError = false;
        } catch (err) {
          console.log(err);
        }
      }
      rl.prompt();
    }
  });

  rl.prompt();
}

(function main() {
  // node index.js ...
  // console.log(process.argv);

  if (process.argv.length > 3) {
    console.log("Usage: Lox [script]");
    process.exit(64);
  } else if (process.argv.length === 3) {
    runFile(process.argv[2]);
  } else {
    runPrompt();
  }
})();
