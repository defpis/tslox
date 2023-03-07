import fs from "fs";
import readline from "readline";
import { Scanner } from "./Scanner";
import { globalState } from "./State";

function run(source: string) {
  const scanner = new Scanner(source);
  const tokens = scanner.scanTokens();

  for (const token of tokens) {
    console.log(token);
  }
}

function runFile(path: string) {
  const buffer = fs.readFileSync(path);
  run(buffer.toString());

  if (globalState.hadError) {
    process.exit(65);
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
          globalState.hadError = false;
        } catch (err) {
          console.error(err);
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
