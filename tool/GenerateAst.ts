// 使用模版引擎会更加直观，但我就是不想引入依赖！
import path from "path";
import fs from "fs";

function checkOptional(type: string): [boolean, string] {
  if (type.endsWith("?")) {
    return [true, type.substring(0, type.length - 1)];
  }
  return [false, type];
}

function getFieldList(fields: string) {
  return fields.split(",").map((field) => {
    let [type, name] = field.trim().split(" ");
    let optional = false;
    [optional, type] = checkOptional(type);

    const reg = /List<(.*)>/;
    const match = reg.exec(type);

    if (match) {
      const [maybeVoid, subType] = checkOptional(match[1]);
      type = `Array<${subType}${maybeVoid ? " | void" : ""}>`;
    }

    return {
      type,
      name,
      optional,
    };
  });
}

function defineType(
  ws: fs.WriteStream,
  baseName: string,
  className: string,
  fields: string
) {
  ws.write(`
export class ${className}${baseName} implements ${baseName} {
`);

  const fieldList = getFieldList(fields);

  ws.write(`
  ${fieldList
    .map((field) => `${field.name}${field.optional ? "?" : ""}: ${field.type};`)
    .join("\n  ")}
`);
  ws.write(`
  constructor(${fieldList
    .map((field) => `${field.name}${field.optional ? "?" : ""}: ${field.type}`)
    .join(", ")}) {
`);
  ws.write(`
    ${fieldList
      .map((field) => `this.${field.name} = ${field.name};`)
      .join("\n    ")}
`);
  ws.write(`
  }
`);
  ws.write(`
  accept<R>(visitor: ${baseName}Visitor<R>): R {
`);
  ws.write(`
    return visitor.visit${className}${baseName}(this);
`);
  ws.write(`
  }
`);
  ws.write(`
}
`);
}

function defineVisitor(ws: fs.WriteStream, baseName: string, types: string[]) {
  ws.write(`
export interface ${baseName}Visitor<R> {
`);
  for (const type of types) {
    const [className, fields] = type.split(":").map((s) => s.trim());
    ws.write(`
  visit${className}${baseName}(${baseName.toLowerCase()}: ${className}${baseName}): R;
`);
  }
  ws.write(`
}
`);
}

function defineAst(
  outputDir: string,
  baseName: string,
  types: string[],
  callback: (ws: fs.WriteStream) => void
) {
  const outputPath = path.join(outputDir, `${baseName}.ts`);

  const ws = fs.createWriteStream(outputPath, { encoding: "utf-8" });

  callback(ws);

  ws.write(`
export interface ${baseName} {
`);
  ws.write(`
  accept<R>(visitor: ${baseName}Visitor<R>): R;
`);
  ws.write(`
}
`);

  defineVisitor(ws, baseName, types);

  for (const type of types) {
    const [className, fields] = type.split(":").map((s) => s.trim());
    defineType(ws, baseName, className, fields);
  }

  ws.close();
}

(function main() {
  if (process.argv.length !== 3) {
    console.log("Usage: GenerateAst <output directory>");
    process.exit(64);
  }

  const outputDir = process.argv[2];

  defineAst(
    outputDir,
    "Expr",
    [
      "Assign   : Token name, Expr value",
      "Binary   : Expr left, Token operator, Expr right",
      "Call     : Expr callee, Token paren, List<Expr> args",
      "Get      : Expr object, Token name",
      "Grouping : Expr expression",
      "Literal  : AnyValue value",
      "Logical  : Expr left, Token operator, Expr right",
      "Set      : Expr object, Token name, Expr value",
      "Super    : Token keyword, Token method",
      "This     : Token keyword",
      "Unary    : Token operator, Expr right",
      "Variable : Token name",
    ],
    (ws) => {
      ws.write(`
import { Token, AnyValue } from "./Token";
`);
    }
  );

  defineAst(
    outputDir,
    "Stmt",
    [
      "Block      : List<Stmt?> statements",
      "Class      : Token name, List<FunctionStmt> methods, VariableExpr? superclass",
      "Expression : Expr expression",
      "If         : Expr condition, Stmt thenBranch, Stmt? elseBranch",
      "Function   : Token name, List<Token> params, List<Stmt?> body",
      "Print      : Expr expression",
      "Return     : Token keyword, Expr? value",
      "Var        : Token name, Expr? initializer",
      "While      : Expr condition, Stmt body",
    ],
    (ws) => {
      ws.write(`
import { Token } from "./Token";
import { Expr, VariableExpr } from "./Expr";
`);
    }
  );
})();
