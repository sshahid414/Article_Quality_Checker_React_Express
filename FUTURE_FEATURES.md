# Future Feature Ideas

## Quality & Validation

- **Configurable rules per client** — Different ecommerce clients may require 2 vs 5 images, specific product link counts, or brand-specific alt tag formats. Store thresholds in a client profile database.
- **AI-powered content review** — Use an LLM to flag awkward phrasing, keyword stuffing, or off-brand tone beyond structural checks.
- **Duplicate content detection** — Compare article text against previously published articles and competitor pages.
- **Readability scoring** — Flesch-Kincaid or similar metrics with target ranges per client.
- **Keyword density analysis** — Ensure target keywords appear at optimal frequency without over-optimization.

## Image Handling

- **Automatic image upload to CDN** — Download from Google Drive and upload to WordPress media library or Shopify Files during publish.
- **Alt tag quality scoring** — Flag generic alt text like "image 1" or alt tags that don't describe the image.
- **Image dimension validation** — Ensure images meet minimum resolution requirements for web.

## Workflow & Integrations

- **Real WordPress REST API integration** — Authenticate via application passwords or JWT, create posts with Yoast/RankMath meta fields.
- **Shopify Admin API** — Create blog articles with metafields for SEO title and description.
- **Batch processing** — Queue hundreds of articles from a spreadsheet of Google Doc URLs.
- **Google Docs API with OAuth** — Parse private docs without requiring public export access.
- **Webhook notifications** — Slack/email alerts when articles pass or fail checks.
- **Revision history** — Track changes between doc versions and highlight diffs.

## UI & UX

- **Client dashboard** — Multi-client view with filters by status (draft, checked, published).
- **Inline doc editing suggestions** — Show fix recommendations directly mapped to doc sections.
- **Side-by-side preview** — Compare Google Doc rendering vs final WordPress/Shopify output.
- **Role-based access** — Writers submit, editors approve, admins configure rules.

## Analytics

- **Publish success tracking** — Monitor which articles were uploaded, when, and to which platform.
- **Quality trend reports** — Track common failure types across the writing team over time.
