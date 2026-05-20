import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseArticle, buildWordPressHtml } from '../services/articleParser.js';
import { DEFAULT_DOC_URL } from '../types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, '../../../output');

async function main() {
  console.log('Extracting article from Google Doc...');
  console.log(`Source: ${DEFAULT_DOC_URL}\n`);

  const article = await parseArticle(DEFAULT_DOC_URL);

  fs.mkdirSync(outputDir, { recursive: true });

  const wordpressHtml = buildWordPressHtml(article);
  const htmlPath = path.join(outputDir, 'article.html');
  const jsonPath = path.join(outputDir, 'article-data.json');

  fs.writeFileSync(htmlPath, wordpressHtml, 'utf-8');
  fs.writeFileSync(jsonPath, JSON.stringify(article, null, 2), 'utf-8');

  console.log('=== Extracted Article Data ===');
  console.log(`Meta Title:       ${article.metaTitle}`);
  console.log(`Meta Description: ${article.metaDescription.slice(0, 80)}...`);
  console.log(`Article Title:    ${article.articleTitle}`);
  console.log(`Images:           ${article.images.length}`);
  console.log(`Product Links:    ${article.productLinks.length}`);
  console.log(`Total Links:      ${article.links.length}`);
  console.log(`Can Upload:       ${article.canUpload}`);
  console.log('\n=== Quality Checks ===');
  for (const check of article.qualityChecks) {
    const icon = check.status === 'pass' ? '✓' : check.status === 'warn' ? '!' : '✗';
    console.log(`  [${icon}] ${check.label}: ${check.message}`);
  }
  console.log(`\nOutput HTML:  ${htmlPath}`);
  console.log(`Output JSON:  ${jsonPath}`);
}

main().catch((err) => {
  console.error('Extraction failed:', err.message);
  process.exit(1);
});
