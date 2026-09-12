/**
 * Normalizes raw document text into standardized markdown before rendering.
 * Converts LaTeX \(...\) -> $...$ and \[...\] -> $$...$$
 * Converts raw <br> tags and unicode bullet dots (•) to clean markdown list syntax.
 */
export function normalizeMarkdownForRendering(content: string): string {
  if (!content) return "";

  let result = content;

  // 1. Convert LaTeX inline delimiters \( ... \) to $ ... $
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_, math) => `$${math.trim()}$`);

  // 2. Convert LaTeX display delimiters \[ ... \] to $$ ... $$
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_, math) => `\n$$\n${math.trim()}\n$$\n`);

  // 3. Normalize raw <br>, <br/>, <br /> HTML linebreaks to actual newlines
  result = result.replace(/<br\s*\/?>/gi, "\n");

  // 4. Normalize unicode bullet characters (•) at line starts or after newlines into standard markdown bullet items (- )
  result = result.replace(/^(\s*)•\s*/gm, "$1- ");

  return result;
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
