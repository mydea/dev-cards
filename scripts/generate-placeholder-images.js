#!/usr/bin/env node

/**
 * Generate placeholder images for dev-cards
 * Run with: node scripts/generate-placeholder-images.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cards = [
  { id: 'quick-bug-fix', title: 'Quick Bug Fix' },
  { id: 'unit-tests', title: 'Write Unit Tests' },
  { id: 'implement-feature', title: 'Implement Feature' },
  { id: 'code-review', title: 'Code Review' },
  { id: 'refactor', title: 'Refactor Legacy Code' },
  { id: 'pair-programming', title: 'Pair Programming' },
  { id: 'stack-overflow', title: 'Stack Overflow Research' },
  { id: 'all-nighter', title: 'Pull an All-Nighter' },
  { id: 'documentation', title: 'Documentation Sprint' },
  { id: 'hotfix', title: 'Emergency Hotfix' },
  { id: 'coffee-break', title: 'Coffee Break' },
  { id: 'database-migration', title: 'Database Migration' },
  { id: 'rubber-duck', title: 'Rubber Duck Debugging' },
  { id: 'tech-debt-cleanup', title: 'Technical Debt Cleanup' },
  { id: 'integration-testing', title: 'Integration Testing' },
];

const colors = [
  '4F46E5', // Indigo
  '059669', // Emerald
  'DC2626', // Red
  'CA8A04', // Yellow
  '7C3AED', // Violet
  'EA580C', // Orange
  '0891B2', // Cyan
  'BE123C', // Rose
  '65A30D', // Lime
  '7C2D12', // Amber
];

const cardsDir = path.join(
  __dirname,
  '..',
  'packages',
  'data',
  'src',
  'assets',
  'images',
  'cards'
);

// Create directory if it doesn't exist
if (!fs.existsSync(cardsDir)) {
  fs.mkdirSync(cardsDir, { recursive: true });
}

console.log('🎨 Generating placeholder images for dev-cards...\n');

// Create placeholder image URLs and save as markdown for reference
const placeholderInfo = [];

cards.forEach((card, index) => {
  const color = colors[index % colors.length];
  const encodedTitle = encodeURIComponent(card.title);
  const placeholderUrl = `https://via.placeholder.com/800x640/${color}/ffffff?text=${encodedTitle}`;

  placeholderInfo.push({
    ...card,
    color: `#${color}`,
    url: placeholderUrl,
    filename: `${card.id}.jpg`,
  });

  console.log(`✓ ${card.title} -> ${card.id}.jpg (${color})`);
});

// Create a reference file with all placeholder URLs
const referenceContent = `# Placeholder Card Images

Generated placeholder URLs for dev-cards. Use these during development while creating actual card images.

## Placeholder Images (800x640, 5:4 aspect ratio)

${placeholderInfo
  .map(
    (card) => `
### ${card.title}
- **File**: \`${card.filename}\`
- **Color**: ${card.color}
- **URL**: [${card.url}](${card.url})
`
  )
  .join('\n')}

## Usage

You can download these placeholder images by:
1. Opening each URL in your browser
2. Right-clicking and saving the image
3. Renaming to the correct filename
4. Saving in \`packages/data/src/assets/images/cards/\`

Or use a script to download them automatically:

\`\`\`bash
# Example download script (requires curl)
cd packages/data/src/assets/images/cards/

${placeholderInfo
  .map((card) => `curl "${card.url}" -o "${card.filename}"`)
  .join('\n')}
\`\`\`

## Next Steps

Replace these placeholder images with actual designed images following the specifications in \`CARD_IMAGE_SPECIFICATIONS.md\`.
`;

fs.writeFileSync(
  path.join(__dirname, '..', 'PLACEHOLDER_IMAGES.md'),
  referenceContent
);

console.log(`\n📝 Generated PLACEHOLDER_IMAGES.md with download URLs`);
console.log(`📁 Placeholder images should be saved to: ${cardsDir}`);
console.log(`\n🎯 Next steps:`);
console.log(
  `   1. Download placeholder images using URLs in PLACEHOLDER_IMAGES.md`
);
console.log(
  `   2. Replace with actual designed images following CARD_IMAGE_SPECIFICATIONS.md`
);
console.log(`   3. Ensure all images are 800x640 pixels, .jpg format`);
