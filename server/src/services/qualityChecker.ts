import type { ArticleImage, ArticleLink, QualityCheck } from '../types.js';
import { QUALITY_THRESHOLDS } from '../types.js';

interface CheckInput {
  metaTitle: string;
  metaDescription: string;
  articleTitle: string;
  articleHtml: string;
  images: ArticleImage[];
  productLinks: ArticleLink[];
}

export function runQualityChecks(input: CheckInput): QualityCheck[] {
  const checks: QualityCheck[] = [];

  checks.push(checkMetaTitle(input.metaTitle));
  checks.push(checkMetaDescription(input.metaDescription));
  checks.push(checkArticleTitle(input.articleTitle));
  checks.push(checkImageCount(input.images));
  checks.push(...checkImagesHosting(input.images));
  checks.push(checkProductLinks(input.productLinks));
  checks.push(checkFormatting(input.articleHtml));

  return checks;
}

function checkMetaTitle(metaTitle: string): QualityCheck {
  const len = metaTitle.length;
  const { metaTitleMin, metaTitleMax } = QUALITY_THRESHOLDS;

  if (!metaTitle) {
    return { id: 'meta-title', label: 'Meta Title', status: 'fail', message: 'Meta title is missing.' };
  }
  if (len < metaTitleMin) {
    return { id: 'meta-title', label: 'Meta Title', status: 'warn', message: `Meta title is short (${len} chars). Aim for ${metaTitleMin}-${metaTitleMax}.` };
  }
  if (len > metaTitleMax) {
    return { id: 'meta-title', label: 'Meta Title', status: 'warn', message: `Meta title is long (${len} chars). Aim for ${metaTitleMin}-${metaTitleMax}.` };
  }
  return { id: 'meta-title', label: 'Meta Title', status: 'pass', message: `Meta title length looks good (${len} chars).` };
}

function checkMetaDescription(metaDescription: string): QualityCheck {
  const len = metaDescription.length;
  const { metaDescriptionMin, metaDescriptionMax } = QUALITY_THRESHOLDS;

  if (!metaDescription) {
    return { id: 'meta-description', label: 'Meta Description', status: 'fail', message: 'Meta description is missing.' };
  }
  if (len < metaDescriptionMin) {
    return { id: 'meta-description', label: 'Meta Description', status: 'warn', message: `Meta description is short (${len} chars). Aim for ${metaDescriptionMin}-${metaDescriptionMax}.` };
  }
  if (len > metaDescriptionMax) {
    return { id: 'meta-description', label: 'Meta Description', status: 'warn', message: `Meta description is long (${len} chars). Aim for ${metaDescriptionMin}-${metaDescriptionMax}.` };
  }
  return { id: 'meta-description', label: 'Meta Description', status: 'pass', message: `Meta description length looks good (${len} chars).` };
}

function checkArticleTitle(articleTitle: string): QualityCheck {
  if (!articleTitle) {
    return { id: 'article-title', label: 'Article Title', status: 'fail', message: 'Article title (H1) is missing.' };
  }
  return { id: 'article-title', label: 'Article Title', status: 'pass', message: `Article title found: "${articleTitle}".` };
}

function checkImageCount(images: ArticleImage[]): QualityCheck {
  const count = images.length;
  const { minImages, maxImages } = QUALITY_THRESHOLDS;

  if (count < minImages) {
    return { id: 'image-count', label: 'Image Count', status: 'fail', message: `Only ${count} image(s) found. Expected at least ${minImages}.` };
  }
  if (count > maxImages) {
    return { id: 'image-count', label: 'Image Count', status: 'warn', message: `${count} images found. Consider reducing to ${maxImages} or fewer.` };
  }
  return { id: 'image-count', label: 'Image Count', status: 'pass', message: `${count} images found (within ${minImages}-${maxImages} range).` };
}

function checkImagesHosting(images: ArticleImage[]): QualityCheck[] {
  if (images.length === 0) {
    return [{
      id: 'image-hosting',
      label: 'Image Hosting',
      status: 'fail',
      message: 'No images to validate.',
    }];
  }

  const notOnDrive = images.filter((img) => !img.isGoogleDrive);
  const missingAlt = images.filter((img) => !img.altTag);
  const notPublic = images.filter((img) => img.isPubliclyAccessible === false);

  const checks: QualityCheck[] = [];

  if (notOnDrive.length > 0) {
    checks.push({
      id: 'image-hosting',
      label: 'Google Drive Hosting',
      status: 'fail',
      message: `${notOnDrive.length} image(s) are not hosted on Google Drive: ${notOnDrive.map((i) => i.label).join(', ')}.`,
    });
  } else {
    checks.push({
      id: 'image-hosting',
      label: 'Google Drive Hosting',
      status: 'pass',
      message: 'All images are hosted on Google Drive.',
    });
  }

  if (missingAlt.length > 0) {
    checks.push({
      id: 'image-alt',
      label: 'Image Alt Tags',
      status: 'fail',
      message: `${missingAlt.length} image(s) missing alt tags: ${missingAlt.map((i) => i.label).join(', ')}.`,
    });
  } else {
    checks.push({
      id: 'image-alt',
      label: 'Image Alt Tags',
      status: 'pass',
      message: 'All images have alt tags.',
    });
  }

  if (notPublic.length > 0) {
    checks.push({
      id: 'image-public',
      label: 'Public Image Access',
      status: 'warn',
      message: `${notPublic.length} image(s) may not be publicly accessible: ${notPublic.map((i) => i.label).join(', ')}.`,
    });
  } else if (images.some((img) => img.isPubliclyAccessible === true)) {
    checks.push({
      id: 'image-public',
      label: 'Public Image Access',
      status: 'pass',
      message: 'Google Drive images appear publicly accessible.',
    });
  }

  return checks;
}

function checkProductLinks(productLinks: ArticleLink[]): QualityCheck {
  const count = productLinks.length;
  const { minProductLinks, maxProductLinks } = QUALITY_THRESHOLDS;

  if (count < minProductLinks) {
    return { id: 'product-links', label: 'Product Links', status: 'fail', message: `Only ${count} product link(s). Expected at least ${minProductLinks}.` };
  }
  if (count > maxProductLinks) {
    return { id: 'product-links', label: 'Product Links', status: 'warn', message: `${count} product links found. Consider reducing to ${maxProductLinks} or fewer.` };
  }
  return { id: 'product-links', label: 'Product Links', status: 'pass', message: `${count} product links found (within ${minProductLinks}-${maxProductLinks} range).` };
}

function checkFormatting(articleHtml: string): QualityCheck {
  const hasH2 = /<h2/i.test(articleHtml);
  const hasLists = /<(ul|ol)/i.test(articleHtml);
  const hasParagraphs = /<p/i.test(articleHtml);

  const issues: string[] = [];
  if (!hasH2) issues.push('missing H2 headings');
  if (!hasLists) issues.push('missing lists');
  if (!hasParagraphs) issues.push('missing paragraphs');

  if (issues.length > 0) {
    return { id: 'formatting', label: 'Basic Formatting', status: 'warn', message: `Formatting issues: ${issues.join(', ')}.` };
  }
  return { id: 'formatting', label: 'Basic Formatting', status: 'pass', message: 'Article has headings, paragraphs, and lists.' };
}
