/**
 * Normalizes raw document text into standardized markdown before rendering.
 * Converts LaTeX \(...\) -> $...$ and \[...\] -> $$...$$
 * Converts raw <br> tags and unicode bullet dots (•) to clean markdown list syntax.
 */
export function normalizeMarkdownForRendering(content: string): string {
  if (!content) return "";

  let result = content;

  // 1. Clean non-breaking spaces (\u00A0) and carriage returns
  result = result.replace(/\u00A0/g, " ");

  // 2. Repair malformed dollar insertions inside LaTeX commands like $\frac{m}${v} or $\frac${\text{...}} or $\bar${p}
  result = result.replace(/\$\\frac\$\s*(\{[\s\S]*?\})\s*(\{[\s\S]*?\})/g, '\\frac$1$2');
  result = result.replace(/\$\\frac(\{[\s\S]*?\})\$\s*(\{[\s\S]*?\})/g, '\\frac$1$2');
  result = result.replace(/\$\\([a-zA-Z]+)\$\s*(\{[\s\S]*?\})/g, '\\$1$2');
  result = result.replace(/\\([a-zA-Z]+)\$\s*(\{[\s\S]*?\})\$/g, '\\$1$2');

  // 3. Convert LaTeX inline delimiters \( ... \) to $ ... $
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math.trim()}$`);

  // 4. Convert LaTeX display delimiters \[ ... \] to $$ ... $$
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `\n$$\n${math.trim()}\n$$\n`);

  // 5. Wrap raw LaTeX environments (\begin{matrix|align|equation|cases|bmatrix|pmatrix}... \end{...}) in $$...$$ if not wrapped
  result = result.replace(/(?<!\$\$)\s*(\\begin\{(?:matrix|bmatrix|pmatrix|vmatrix|cases|align|aligned|equation|gather)\}[\s\S]*?\\end\{(?:matrix|bmatrix|pmatrix|vmatrix|cases|align|aligned|equation|gather)\})\s*(?!\$\$)/g, (_, env) => {
    return `\n$$\n${env.trim()}\n$$\n`;
  });

  // 6. Normalize raw <br>, <br/>, <br /> HTML linebreaks to actual newlines
  result = result.replace(/<br\s*\/?>/gi, "\n");

  // 7. Normalize unicode bullet characters (•, ◦, ▪, ►, ▸) at line starts to standard markdown bullet items (- )
  result = result.replace(/^(\s*)[•◦▪►▸]\s*/gm, "$1- ");

  // 8. Process equations line-by-line: If a line contains LaTeX math commands (\frac, \bar, \text, \implies, etc.),
  // repair fragmented inner dollars and wrap the entire math equation in $...$
  const lines = result.split(/\r?\n/);
  const processedLines = lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('```') || trimmed.startsWith('#') || trimmed.startsWith('>')) {
      return line;
    }

    const hasMathCommand = /\\(?:frac|bar|text|implies|times|cdot|sum|int|sqrt|alpha|beta|gamma|delta|theta|pi|sigma|omega|infty)/.test(trimmed);
    if (!hasMathCommand) return line;

    if ((trimmed.startsWith('$') && trimmed.endsWith('$')) || (trimmed.startsWith('$$') && trimmed.endsWith('$$'))) {
      return line;
    }

    // Strip fragmented inner dollars inside the equation line and wrap cleanly
    const cleanEq = trimmed.replace(/\$/g, '');
    return `$${cleanEq}$`;
  });

  return processedLines.join('\n');
}

/**
 * Safely splits a markdown string into logical block-level chunks
 * (paragraphs, code blocks, tables, headers) to enable progressive rendering.
 */
export function splitMarkdownIntoBlocks(content: string): string[] {
  if (!content) return [];

  const normalized = normalizeMarkdownForRendering(content);

  const lines = normalized.split(/\r?\n/);
  const blocks: string[] = [];
  let currentBlock: string[] = [];
  let inCodeBlock = false;
  let inMathBlock = false;
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Inside Code Block
    if (inCodeBlock) {
      currentBlock.push(line);
      if (trimmed.startsWith("```")) {
        inCodeBlock = false;
        blocks.push(currentBlock.join("\n"));
        currentBlock = [];
      }
      continue;
    }

    // 2. Start of Code Block
    if (trimmed.startsWith("```")) {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join("\n"));
        currentBlock = [];
      }
      inCodeBlock = true;
      currentBlock.push(line);
      continue;
    }

    // 3. Inside Math Block ($$)
    if (inMathBlock) {
      currentBlock.push(line);
      if (trimmed.endsWith("$$") || trimmed === "$$") {
        inMathBlock = false;
        blocks.push(currentBlock.join("\n"));
        currentBlock = [];
      }
      continue;
    }

    // 4. Start of Math Block ($$)
    if (trimmed.startsWith("$$") && !trimmed.endsWith("$$", trimmed.length - 2)) {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join("\n"));
        currentBlock = [];
      }
      inMathBlock = true;
      currentBlock.push(line);
      continue;
    }

    const isTableRow = trimmed.startsWith("|");

    // 5. Inside Table
    if (inTable) {
      if (isTableRow) {
        currentBlock.push(line);
      } else {
        // Table ended
        inTable = false;
        if (currentBlock.length > 0) {
          blocks.push(currentBlock.join("\n"));
          currentBlock = [];
        }
        // Process current line as a normal line
        if (trimmed !== "") {
          if (trimmed.startsWith("#")) {
            blocks.push(line);
          } else {
            currentBlock.push(line);
          }
        }
      }
      continue;
    }

    // 6. Start of Table
    if (isTableRow) {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join("\n"));
        currentBlock = [];
      }
      inTable = true;
      currentBlock.push(line);
      continue;
    }

    // 7. Headings
    if (trimmed.startsWith("#")) {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join("\n"));
        currentBlock = [];
      }
      blocks.push(line);
      continue;
    }

    // 8. Empty Line
    if (trimmed === "") {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join("\n"));
        currentBlock = [];
      }
      continue;
    }

    // 9. Normal text
    currentBlock.push(line);
  }

  // Clean up remainders
  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join("\n"));
  }

  return blocks.map(b => b.trim()).filter(b => b.length > 0);
}
