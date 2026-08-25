/**
 * Script to convert Figma design tokens to CSS variables.
 * 
 * This script processes 'design-tokens.tokens.json' and outputs a CSS file 'theme.css'.
 * It specifically handles:
 * 1. Primitive Colors: Used as foundational values (resolved during generation, not exposed directly as usable UI variables).
 * 2. Color Roles: The actual semantic colors applied to the UI, which reference the primitive colors.
 * 3. Other tokens like typography, spacing, effects, etc.
 */

const fs = require('fs');
const path = require('path');

const INPUT_FILE = path.join(__dirname, 'design-tokens.tokens.json');
const OUTPUT_FILE = path.join(__dirname, 'design-token.css');

// Read the JSON file
let rawData;
try {
  rawData = fs.readFileSync(INPUT_FILE, 'utf8');
} catch (err) {
  console.error(`Error reading ${INPUT_FILE}:`, err.message);
  process.exit(1);
}

const tokens = JSON.parse(rawData);

/**
 * Utility to flatten a nested object of tokens into an array of token definitions.
 * @param {Object} obj - The current level of the token object.
 * @param {string} prefix - The accumulated path/prefix for the token name.
 * @returns {Array} An array of tokens with path and details.
 */
function flattenTokens(obj, prefix = '') {
  let result = [];
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      if ('value' in obj[key] && 'type' in obj[key]) {
        // This is a token
        result.push({
          path: prefix ? `${prefix}.${key}` : key,
          name: key,
          ...obj[key]
        });
      } else {
        // This is a group, recurse deeper
        result = result.concat(flattenTokens(obj[key], prefix ? `${prefix}.${key}` : key));
      }
    }
  }
  return result;
}

const allTokens = flattenTokens(tokens);

/**
 * Helper to get a token by its dot-notation path (e.g., 'primitive color collection.key colors group.primary key color')
 */
function getTokenByPath(path) {
  return allTokens.find(t => t.path === path);
}

/**
 * Resolves token values that are aliases/references to other tokens.
 * Example: "{primitive color collection.primary color palettes.primary100}" -> resolves to actual hex value
 * @param {string|object} value - The token value to resolve.
 * @returns {string} The resolved CSS value.
 */
function resolveValue(value, pathStr = '') {
  if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
    const refPath = value.slice(1, -1);
    const referencedToken = getTokenByPath(refPath);
    if (referencedToken) {
      return resolveValue(referencedToken.value, referencedToken.path); // recursively resolve in case of nested references
    } else {
      console.warn(`Warning: Reference not found for path: ${refPath}`);
      return value;
    }
  }
  
  // Custom shadow effect handling
  if (typeof value === 'object' && value.shadowType) {
    return `${value.offsetX}px ${value.offsetY}px ${value.radius}px ${value.spread}px ${value.color}`;
  }
  
  // Convert typography numeric pixel values to rem
  if (pathStr.includes('typography') && (pathStr.endsWith('fontSize') || pathStr.endsWith('lineHeight') || pathStr.endsWith('letterSpacing'))) {
    if (!isNaN(parseFloat(value))) {
      return `${parseFloat(value) / 16}rem`;
    }
  }

  return value;
}

/**
 * Converts a dot-notation path to a CSS variable name.
 * Example: 'color roles.primary' -> '--color-roles-primary'
 */
function pathToCssVar(pathStr) {
  return '--' + pathStr
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace spaces and special chars with hyphens
    .replace(/^-+|-+$/g, ''); // Trim trailing/leading hyphens
}

// Separate tokens by category based on user requirements
const primitiveColors = [];
const colorRoles = [];
const otherTokens = [];

allTokens.forEach(token => {
  if (token.path.startsWith('primitive color collection')) {
    primitiveColors.push(token);
  } else if (token.path.startsWith('color roles')) {
    colorRoles.push(token);
  } else {
    otherTokens.push(token);
  }
});

// Generate CSS Content
let cssContent = `/* 
  Design System CSS Variables
  Generated from design-tokens.tokens.json 
*/\n\n:root {\n`;

cssContent += `  /* ==========================================\n`;
cssContent += `     COLOR ROLES\n`;
cssContent += `     These are the semantic colors intended for UI usage.\n`;
cssContent += `     ========================================== */\n`;

colorRoles.forEach(token => {
  const cssVarName = pathToCssVar(token.path.replace('color roles group.', '').replace('color roles.', 'color-'));
  const resolvedVal = resolveValue(token.value, token.path);
  cssContent += `  ${cssVarName}: ${resolvedVal};\n`;
});

cssContent += `\n  /* ==========================================\n`;
cssContent += `     OTHER TOKENS\n`;
cssContent += `     Typography, spacing, effects, etc.\n`;
cssContent += `     ========================================== */\n`;

otherTokens.forEach(token => {
  const cssVarName = pathToCssVar(token.path);
  const resolvedVal = resolveValue(token.value, token.path);
  cssContent += `  ${cssVarName}: ${resolvedVal};\n`;
});

cssContent += `}\n\n`;

cssContent += `/* \n`;
cssContent += `   Note: Primitive colors from 'primitive color collection' \n`;
cssContent += `   are resolved directly into the Color Roles above and are \n`;
cssContent += `   intentionally NOT exported as CSS variables to prevent \n`;
cssContent += `   them from being applied directly on the UI as requested.\n`;
cssContent += `*/\n`;

// Write output
fs.writeFileSync(OUTPUT_FILE, cssContent, 'utf8');
console.log(`Successfully generated CSS variables to ${OUTPUT_FILE}`);
console.log(`Processed ${colorRoles.length} color roles and ${otherTokens.length} other tokens.`);
console.log(`Skipped generating variables for ${primitiveColors.length} primitive colors (they were resolved inline).`);
