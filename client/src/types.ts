export interface ArticleImage {
  label: string;
  url: string;
  altTag: string;
  isGoogleDrive: boolean;
  isPubliclyAccessible: boolean | null;
}

export interface ArticleLink {
  text: string;
  url: string;
  isProductLink: boolean;
}

export interface QualityCheck {
  id: string;
  label: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
}

export interface ParsedArticle {
  sourceUrl: string;
  metaTitle: string;
  metaDescription: string;
  articleTitle: string;
  articleHtml: string;
  articleCss: string;
  images: ArticleImage[];
  links: ArticleLink[];
  productLinks: ArticleLink[];
  qualityChecks: QualityCheck[];
  canUpload: boolean;
}

export interface UploadResult {
  success: boolean;
  message: string;
  platform: string;
  timestamp: string;
}

export const DEFAULT_DOC_URL =
  'https://docs.google.com/document/d/1s0fZsDcXJtiwrqUT1fVInS6q1yCZwVKkyCEGcxUiIYY/edit';
