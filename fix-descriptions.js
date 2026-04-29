const fs = require('fs');
const path = require('path');

const KB_ROOT = path.dirname(__filename);
const MAX_LENGTH = 160;
const MIN_LENGTH = 80;
const TRUNCATE_TO = 157; // 157 + "..." = 160

let fixed = 0;
let skippedShort = 0;
let skippedOk = 0;
let total = 0;
const examples = [];

/**
 * Truncate text to maxLen characters by whole words, then append "..."
 */
function truncateByWords(text, maxLen) {
  if (text.length <= maxLen) return text;
  const sub = text.slice(0, maxLen);
  const lastSpace = sub.lastIndexOf(' ');
  if (lastSpace === -1) {
    // No space found — hard cut
    return sub.trimEnd() + '...';
  }
  return sub.slice(0, lastSpace).trimEnd() + '...';
}

/**
 * Parse frontmatter from file content.
 * Returns { before, fields, after } where:
 *   before = '' (empty, frontmatter starts at position 0)
 *   fields = raw lines between --- markers
 *   after  = rest of the file after closing ---
 */
function parseFrontmatter(content) {
  if (!content.startsWith('---')) return null;
  const end = content.indexOf('\n---', 3);
  if (end === -1) return null;
  const fieldsRaw = content.slice(3, end); // everything between opening --- and closing ---
  const after = content.slice(end + 4); // skip \n---
  return { fieldsRaw, after };
}

/**
 * Reassemble file content from parsed frontmatter + modified fields
 */
function buildContent(fieldsRaw, after) {
  return `---${fieldsRaw}\n---${after}`;
}

/**
 * Find all index.md files recursively
 */
function findIndexFiles(dir, results = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      // Skip node_modules and hidden dirs
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      findIndexFiles(path.join(dir, entry.name), results);
    } else if (entry.isFile() && entry.name === 'index.md') {
      results.push(path.join(dir, entry.name));
    }
  }
  return results;
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const parsed = parseFrontmatter(content);
  if (!parsed) return;

  const { fieldsRaw, after } = parsed;

  // Match metaDescription line (handles quoted and unquoted values)
  // Pattern: metaDescription: value OR metaDescription: "value" OR metaDescription: 'value'
  const lineRegex = /^(metaDescription:\s*)(.+)$/m;
  const match = fieldsRaw.match(lineRegex);
  if (!match) return;

  total++;

  let rawValue = match[2].trim();

  // Strip surrounding quotes if present (single or double)
  let isQuoted = false;
  let quoteChar = '';
  if ((rawValue.startsWith('"') && rawValue.endsWith('"')) ||
      (rawValue.startsWith("'") && rawValue.endsWith("'"))) {
    isQuoted = true;
    quoteChar = rawValue[0];
    rawValue = rawValue.slice(1, -1);
  }

  const originalLength = rawValue.length;

  if (originalLength < MIN_LENGTH) {
    skippedShort++;
    return;
  }

  if (originalLength <= MAX_LENGTH) {
    skippedOk++;
    return;
  }

  // Need to fix: truncate by words
  const truncated = truncateByWords(rawValue, TRUNCATE_TO);

  // Rebuild the field value (preserve quoting style if it was quoted)
  let newValue;
  if (isQuoted) {
    newValue = `${quoteChar}${truncated}${quoteChar}`;
  } else {
    // If truncated value contains a colon, wrap in quotes to be safe
    if (truncated.includes(':') || truncated.includes('#') || truncated.includes('[') || truncated.includes(']')) {
      newValue = `"${truncated}"`;
    } else {
      newValue = truncated;
    }
  }

  const newFieldsRaw = fieldsRaw.replace(lineRegex, `$1${newValue}`);
  const newContent = buildContent(newFieldsRaw, after);

  fs.writeFileSync(filePath, newContent, 'utf8');

  fixed++;

  if (examples.length < 5) {
    examples.push({
      file: filePath.replace(KB_ROOT + '/', ''),
      before: rawValue.slice(0, 100) + (rawValue.length > 100 ? '...' : ''),
      beforeLen: originalLength,
      after: truncated,
      afterLen: truncated.length,
    });
  }
}

// Main
console.log('Scanning for index.md files...');
const files = findIndexFiles(KB_ROOT);
console.log(`Found ${files.length} index.md files\n`);

for (const file of files) {
  try {
    processFile(file);
  } catch (err) {
    console.error(`Error processing ${file}: ${err.message}`);
  }
}

console.log('=== Results ===');
console.log(`Total files with metaDescription: ${total}`);
console.log(`Fixed (was > 160 chars):          ${fixed}`);
console.log(`Skipped OK (80-160 chars):         ${skippedOk}`);
console.log(`Skipped short (< 80 chars):        ${skippedShort}`);
console.log(`Files without metaDescription:     ${files.length - total}`);
console.log('');
console.log('=== Sample fixes (up to 5) ===');
for (const ex of examples) {
  console.log(`\nFile: ${ex.file}`);
  console.log(`  Before (${ex.beforeLen} chars): ${ex.before}`);
  console.log(`  After  (${ex.afterLen} chars): ${ex.after}`);
}
