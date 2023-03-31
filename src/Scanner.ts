import { Token, TokenType, AnyValue } from "./Token";
import { toNumber } from "lodash";
import { Lox } from "./Lox";

export class Scanner {
  static END = ""; // 教程中使用\0作为截止符

  source: string;
  tokens: Token[] = [];

  start: number = 0;
  current: number = 0;
  line: number = 1;

  static KEYWORDS = new Map([
    ["and", TokenType.AND],
    ["class", TokenType.CLASS],
    ["else", TokenType.ELSE],
    ["false", TokenType.FALSE],
    ["for", TokenType.FOR],
    ["fun", TokenType.FUN],
    ["if", TokenType.IF],
    ["nil", TokenType.NIL],
    ["or", TokenType.OR],
    ["print", TokenType.PRINT],
    ["return", TokenType.RETURN],
    ["super", TokenType.SUPER],
    ["this", TokenType.THIS],
    ["true", TokenType.TRUE],
    ["var", TokenType.VAR],
    ["while", TokenType.WHILE],
  ]);

  constructor(source: string) {
    this.source = source;
  }

  scanTokens(): Token[] {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push(new Token(TokenType.EOF, "", undefined, this.line));
    return this.tokens;
  }

  scanToken() {
    const c = this.advance();

    switch (c) {
      case "(":
        this.addToken(TokenType.LEFT_PAREN);
        break;
      case ")":
        this.addToken(TokenType.RIGHT_PAREN);
        break;
      case "{":
        this.addToken(TokenType.LEFT_BRACE);
        break;
      case "}":
        this.addToken(TokenType.RIGHT_BRACE);
        break;
      case ",":
        this.addToken(TokenType.COMMA);
        break;
      case ".":
        this.addToken(TokenType.DOT);
        break;
      case "-":
        this.addToken(TokenType.MINUS);
        break;
      case "+":
        this.addToken(TokenType.PLUS);
        break;
      case ";":
        this.addToken(TokenType.SEMICOLON);
        break;
      case "*":
        this.addToken(TokenType.STAR);
        break;
      case "!":
        this.addToken(this.match("=") ? TokenType.BANG_EQUAL : TokenType.BANG);
        break;
      case "=":
        this.addToken(
          this.match("=") ? TokenType.EQUAL_EQUAL : TokenType.EQUAL
        );
        break;
      case "<":
        this.addToken(this.match("=") ? TokenType.LESS_EQUAL : TokenType.LESS);
        break;
      case ">":
        this.addToken(
          this.match("=") ? TokenType.GREATER_EQUAL : TokenType.GREATER
        );
        break;
      case "/":
        if (this.match("/")) {
          // A comment goes until the end of the line.
          while (this.peek() !== "\n" && !this.isAtEnd()) {
            this.advance();
          }
        } else {
          this.addToken(TokenType.SLASH);
        }
        break;
      case " ":
      case "\r":
      case "\t":
        // Ignore whitespace.
        break;
      case "\n":
        this.line++;
        break;
      case '"':
        this.string();
        break;
      default:
        if (this.isDigit(c)) {
          this.number();
        } else if (this.isAlpha(c)) {
          this.identifier();
        } else {
          Lox.error(
            new Token(TokenType.STRING, c, undefined, this.line),
            "Unexpected character."
          );
        }
        break;
    }
  }

  identifier() {
    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }

    const text = this.source.substring(this.start, this.current);
    let type = Scanner.KEYWORDS.get(text);
    if (!type) {
      type = TokenType.IDENTIFIER;
    }
    this.addToken(type);
  }

  isAlpha(c: string) {
    return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_";
  }

  isDigit(c: string) {
    return c >= "0" && c <= "9";
  }

  isAlphaNumeric(c: string) {
    return this.isAlpha(c) || this.isDigit(c);
  }

  number() {
    while (this.isDigit(this.peek())) {
      this.advance();
    }

    // Look for a fractional part.
    if (this.peek() === "." && this.isDigit(this.peekNext())) {
      // Consume the "."
      this.advance();

      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    this.addToken(
      TokenType.NUMBER,
      toNumber(this.source.substring(this.start, this.current))
    );
  }

  string() {
    while (this.peek() !== '"' && !this.isAtEnd()) {
      if (this.peek() === "\n") {
        this.line++;
      }
      this.advance();
    }

    if (this.isAtEnd()) {
      Lox.error(
        new Token(TokenType.STRING, "", undefined, this.line),
        "Unterminated string."
      );
      return;
    }

    // The closing ".
    this.advance();

    // Trim the surrounding quotes.
    const value = this.source.substring(this.start + 1, this.current - 1);
    this.addToken(TokenType.STRING, value);
  }

  peek() {
    if (this.isAtEnd()) return Scanner.END;
    return this.source.charAt(this.current);
  }

  peekNext() {
    if (this.current + 1 >= this.source.length) return Scanner.END;
    return this.source.charAt(this.current + 1);
  }

  // 匹配下一个字符
  match(expect: string) {
    if (this.isAtEnd()) {
      return false;
    }
    if (this.source.charAt(this.current) !== expect) {
      return false;
    }
    this.current++;
    return true;
  }

  advance() {
    this.current++;
    return this.source.charAt(this.current - 1);
  }

  // 函数重载
  addToken(type: TokenType): void;
  addToken(type: TokenType, literal: AnyValue): void;

  addToken(type: TokenType, literal?: AnyValue) {
    const text = this.source.substring(this.start, this.current);
    this.tokens.push(new Token(type, text, literal, this.line));
  }

  isAtEnd() {
    return this.current >= this.source.length;
  }
}
