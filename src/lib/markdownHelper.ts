/**
 * Normalizes raw document text into standardized markdown before rendering.
 * Converts LaTeX \(...\) -> $...$ and \[...\] -> $$...$$
 * Handles double-escaped LaTeX delimiters (\\( -> $...$, \\\[ -> $$...$$) from JSON / AI copy-paste.
 * Preserves <br> tags inside tables while normalizing outside linebreaks.
 * Detects ASCII Box Art diagrams and wraps them into monospace ```text ``` code blocks.
 * Auto-wraps unwrapped LaTeX commands (\frac, \rightarrow, \alpha, \bar, etc.) without wrapping full prose lines in $...$.
 */

export function normalizeMarkdownForRendering(content: string): string {
  if (!content || typeof content !== "string") return "";
  const trimmedInput = content.trim();
  if (trimmedInput === "" || trimmedInput === "undefined" || trimmedInput === "null") {
    return "";
  }

  let result = content;

  // 1. Clean non-breaking spaces (\u00A0) and standardize carriage returns
  result = result.replace(/\u00A0/g, " ").replace(/\r\n/g, "\n");

  // 2. Filter out raw "undefined" or "null" string artifacts accidentally inserted into documents
  result = result.replace(/(?:^|\n)\s*(?:undefined|null)\s*(?=\n|$)/gi, "\n");

  // 3. Normalize double-escaped backslashes in LaTeX delimiters: \\( -> \(, \\) -> \), \\\[ -> \[, \\\] -> \]
  result = result.replace(/\\\\\(/g, '\\(').replace(/\\\\\)/g, '\\)');
  result = result.replace(/\\\\\[/g, '\\[').replace(/\\\\\]/g, '\\]');

  // 4. Convert LaTeX inline delimiters \( ... \) to $ ... $
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math.trim()}$`);

  // 5. Convert LaTeX display delimiters \[ ... \] to $$ ... $$
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `\n$$\n${math.trim()}\n$$\n`);

  // 6. Repair malformed dollar insertions inside LaTeX commands like $\frac{m}${v} or $\frac${\text{...}}
  result = result.replace(/\$\\frac\$\s*(\{[\s\S]*?\})\s*(\{[\s\S]*?\})/g, '\\frac$1$2');
  result = result.replace(/\$\\frac(\{[\s\S]*?\})\$\s*(\{[\s\S]*?\})/g, '\\frac$1$2');

  // 7. Auto-detect ASCII Box Art diagrams and wrap them in ```diagram ... ``` code blocks
  const lines = result.split("\n");
  const processedLines: string[] = [];
  let inBoxArt = false;
  let boxArtLines: string[] = [];

  const isBoxSymbol = (l: string) => /[┌┐└┘├┤┬┴┼━┃┏┓┗┛║╔╗╚╝─│▼▲◄►]/.test(l);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!inBoxArt && isBoxSymbol(line)) {
      inBoxArt = true;
      boxArtLines = [line];
    } else if (inBoxArt) {
      if (trimmed === "" || trimmed.startsWith("#") || trimmed === "---" || trimmed.startsWith(">")) {
        inBoxArt = false;
        processedLines.push("```diagram");
        processedLines.push(...boxArtLines);
        processedLines.push("```");
        boxArtLines = [];
        processedLines.push(line.replace(/<br\s*\/?>/gi, "\n"));
      } else {
        boxArtLines.push(line);
      }
    } else {
      // Preserve <br> inside tables, replace <br> outside tables
      if (trimmed.startsWith("|")) {
        processedLines.push(line);
      } else {
        processedLines.push(line.replace(/<br\s*\/?>/gi, "\n"));
      }
    }
  }

  if (inBoxArt) {
    processedLines.push("```diagram");
    processedLines.push(...boxArtLines);
    processedLines.push("```");
  }

  result = processedLines.join("\n");

  // 8. Wrap raw LaTeX environments (\begin{matrix|align|...} ... \end{...}) in $$...$$ if not wrapped
  result = result.replace(/(?<!\$\$)\s*(\\begin\{(?:matrix|bmatrix|pmatrix|vmatrix|cases|align|aligned|equation|gather)\}[\s\S]*?\\end\{(?:matrix|bmatrix|pmatrix|vmatrix|cases|align|aligned|equation|gather)\})\s*(?!\$\$)/g, (_, env) => {
    return `\n$$\n${env.trim()}\n$$\n`;
  });

  // 9. Normalize unicode bullet characters (•, ◦, ▪, ►, ▸) at line starts to standard markdown bullet items (- )
  result = result.replace(/^(\s*)[•◦▪►▸]\s*/gm, "$1- ");

  // 10. Process line-by-line to wrap unwrapped inline math expressions safely
  const finalLines = result.split("\n").map(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('```') || trimmed.startsWith('#') || trimmed.startsWith('>[!') || trimmed.startsWith('> [!')) {
      return line;
    }

    return processLineMath(line);
  });

  return finalLines.join("\n");
}

/**
 * Safely processes a single text line: finds text outside existing $...$ math blocks,
 * and auto-wraps unwrapped LaTeX expressions (\frac{...}{...}, \rightarrow, \alpha, \sum, etc.)
 * in $...$ so KaTeX renders them properly without turning prose into red error text.
 */
function processLineMath(line: string): string {
  // Split line by existing math blocks ($...$ or $$...$$)
  const mathBlockRegex = /(\$\{[\s\S]*?\}\$|\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g;

  const parts: { text: string; isMath: boolean }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mathBlockRegex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: line.substring(lastIndex, match.index), isMath: false });
    }
    parts.push({ text: match[0], isMath: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < line.length) {
    parts.push({ text: line.substring(lastIndex), isMath: false });
  }

  // Transform non-math segments by auto-wrapping unwrapped LaTeX math symbols
  return parts.map(part => {
    if (part.isMath) {
      // Sanitize < and > inside math for rehypeRaw safety
      return part.text.replace(/(?<!\\)</g, "\\lt ").replace(/(?<!\\)>/g, "\\gt ");
    }

    let segment = part.text;

    // Clean stray escaped closing paren after LaTeX math
    segment = segment.replace(/(\\frac\{[^{}]*\}\{[^{}]*\}|\\(?:[a-zA-Z]+)(?:\{[^{}]*\})*)\\\)/g, '$$$1$$)');

    // 1. Auto-wrap unwrapped \frac{...}{...}
    segment = segment.replace(/(?<!\$)\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}(?!\$)/g, '$\\frac{$1}{$2}$');

    // 2. Auto-wrap unwrapped \bar{...}, \text{...}, \vec{...}, \sqrt{...}, \hat{...}
    segment = segment.replace(/(?<!\$)\\(?:bar|vec|sqrt|hat|tilde|mathrm|mathbf)\s*\{([^{}]*)\}(?!\$)/g, (m) => `$${m}$`);

    // 3. Auto-wrap unwrapped \bar{p}' or \bar{p}
    segment = segment.replace(/(?<!\$)\\bar\{[^{}]*\}'?(?!\$)/g, (m) => `$${m}$`);

    // 4. Auto-wrap unwrapped standalone LaTeX math symbols
    segment = segment.replace(/(?<!\$)\\(?:rightarrow|Rightarrow|leftrightarrow|Leftarrow|leftarrow|cdot|times|implies|iff|infty|alpha|beta|gamma|delta|Delta|theta|pi|sigma|omega|approx|neq|le|ge|pm|mp|partial|nabla|sum|int)(?![a-zA-Z\$])/g, (m) => `$${m}$`);

    return segment;
  }).join("");
}

/**
 * Safely splits a markdown string into logical block-level chunks
 * (paragraphs, code blocks, tables, headers) to enable progressive rendering.
 */
export function splitMarkdownIntoBlocks(content: string): string[] {
  if (!content) return [];

  const normalized = normalizeMarkdownForRendering(content);
  if (!normalized || normalized.trim() === "") return [];

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

  return blocks
    .map(b => b.trim())
    .filter(b => b.length > 0 && b !== "undefined" && b !== "null");
}

