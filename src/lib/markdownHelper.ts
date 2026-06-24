/**
 * Safely splits a markdown string into logical block-level chunks
 * (paragraphs, code blocks, tables, headers) to enable progressive rendering.
 */
export function splitMarkdownIntoBlocks(content: string): string[] {
  if (!content) return [];

  const lines = content.split(/\r?\n/);
  const blocks: string[] = [];
  let currentBlock: string[] = [];
  let inCodeBlock = false;
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

    const isTableRow = trimmed.startsWith("|");

    // 3. Inside Table
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

    // 4. Start of Table
    if (isTableRow) {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join("\n"));
        currentBlock = [];
      }
      inTable = true;
      currentBlock.push(line);
      continue;
    }

    // 5. Headings
    if (trimmed.startsWith("#")) {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join("\n"));
        currentBlock = [];
      }
      blocks.push(line);
      continue;
    }

    // 6. Empty Line
    if (trimmed === "") {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock.join("\n"));
        currentBlock = [];
      }
      continue;
    }

    // 7. Normal text
    currentBlock.push(line);
  }

  // Clean up remainders
  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join("\n"));
  }

  return blocks.map(b => b.trim()).filter(b => b.length > 0);
}
