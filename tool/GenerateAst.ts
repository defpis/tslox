// 使用模版引擎会更加直观，但我就是不想引入依赖！
import path from "path";
import fs from "fs";

function getFieldList(fields: string) {
  return fields.split(",").map((field) => {
    const [type, name] = field.trim().split(" ");
    return {
      type:
        {
          Object: "LiteralValue",
        }[type] || type,
      name,
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
export class ${className}Expr implements ${baseName} {
`);

  const fieldList = getFieldList(fields);

  // 声明
  ws.write(`
  ${fieldList.map((field) => `${field.name}: ${field.type};`).join("\n  ")}
`);
  ws.write(`
  constructor(${fieldList
    .map((field) => `${field.name}: ${field.type}`)
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
  accept<R>(visitor: ExprVisitor<R>): R {
`);
  ws.write(`
    return visitor.visitor${className}Expr(this);
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
  visitor${className}Expr(expr: ${className}Expr): R;
`);
  }
  ws.write(`
}
`);
}

function defineAst(outputDir: string, baseName: string, types: string[]) {
  const outputPath = path.join(outputDir, `${baseName}.ts`);

  const ws = fs.createWriteStream(outputPath, { encoding: "utf-8" });

  // imports
  ws.write(`
import { Token, LiteralValue } from "./Token";
`);
  ws.write(`
export interface ${baseName} {
`);
  ws.write(`
  accept<R>(visitor: ExprVisitor<R>): R;
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
    console.error("Usage: GenerateAst <output directory>");
    process.exit(64);
  }

  const outputDir = process.argv[2];

  defineAst(outputDir, "Expr", [
    "Binary   : Expr left, Token operator, Expr right",
    "Grouping : Expr expression",
    "Literal  : Object value",
    "Unary    : Token operator, Expr right",
  ]);
})();
