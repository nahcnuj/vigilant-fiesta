// src/logic.ts
/**
 * Evaluate a simple arithmetic expression represented as an array of string tokens.
 * The expression must follow the pattern: [digit, operator, digit]
 * Supported operators: + - * /
 * Division results are truncated toward zero (integer division like in the original game).
 * Returns the numeric result.
 */
export function evalThreeTokenExpr(tokens: string[]): number {
  if (tokens.length !== 3) {
    throw new Error("Expression must have exactly three tokens");
  }
  const [aStr, op, bStr] = tokens;
  const a = Number(aStr);
  const b = Number(bStr);
  if (Number.isNaN(a) || Number.isNaN(b)) {
    throw new Error("Operands must be numeric");
  }
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "*":
    case "×":
      return a * b;
    case "/":
    case "÷":
      // integer division truncating toward zero
      return Math.trunc(a / b);
    default:
      throw new Error(`Unsupported operator: ${op}`);
  }
}

/**
 * Given a flat list of tokens representing a sequence of blocks on the board,
 * find all non‑overlapping three‑token groups that form a valid expression
 * (digit‑operator‑digit) and sum their evaluated results.
 * This mimics the original game's rule: each matching pattern contributes its
 * value to the score.
 */
export function sumAllExpressions(tokens: string[]): number {
  let total = 0;
  let i = 0;
  while (i + 2 < tokens.length) {
    const group = tokens.slice(i, i + 3);
    if (/^\d$/.test(group[0]) && /^[+\-*/×÷]$/.test(group[1]) && /^\d$/.test(group[2])) {
      total += evalThreeTokenExpr(group);
      i += 3; // move past this match
      // after a match, look at the next immediate group; if it doesn't match, stop scanning
      if (i + 2 >= tokens.length) break;
      const nextGroup = tokens.slice(i, i + 3);
      if (!(/^\d$/.test(nextGroup[0]) && /^[+\-*/×÷]$/.test(nextGroup[1]) && /^\d$/.test(nextGroup[2]))) {
        break;
      }
      continue; // next iteration will handle the next match
    } else {
      i++;
    }
  }
  return total;
}
