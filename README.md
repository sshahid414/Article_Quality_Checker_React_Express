# Article Quality Checker

A full-stack tool for SEO content teams to parse Google Doc articles, run automated quality checks, and upload validated content to WordPress or Shopify.

## Stack

- **Backend:** Express + TypeScript + Cheerio
- **Frontend:** React + Vite + TypeScript

## Features

- Extracts article data from Google Docs (contents, links, images, alt tags)
- Separates **meta title**, **meta description**, **article title**, and **article HTML**
- Automated quality checks:
  - Image count (too many / too few)
  - Google Drive hosting validation
  - Public sharing verification
  - Product link count
  - Basic formatting (headings, lists, paragraphs)
- React dashboard for reviewing checks before upload
- Placeholder WordPress / Shopify upload automation

## Quick Start

```bash
# Install dependencies
npm install
cd server && npm install
cd ../client && npm install
cd ..

# Run dev (Express on :3001, React on :5173)
npm run dev
```

Open **http://localhost:5173** and click **Parse & Check**.

## Extract Script (Output HTML)

Generate the WordPress-ready HTML file and JSON data:

```bash
npm run extract
```

Output files:
- `output/article.html` — full HTML with meta tags
- `output/article-data.json` — parsed article data

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/articles/parse` | Parse doc from `{ docUrl }` |

## Project Structure

```
├── client/          React frontend
├── server/
│   └── src/
│       ├── services/
│       │   ├── articleParser.ts    # Google Doc extraction
│       │   ├── qualityChecker.ts # Quality validation rules
│       │   └── uploadService.ts    # Upload placeholder
│       ├── scripts/
│       │   └── extractArticle.ts   # CLI extraction script
│       └── routes/
├── output/          Generated HTML + JSON
└── README.md
```

## Sample Document

Default source: [Google Doc sample article](https://docs.google.com/document/d/1s0fZsDcXJtiwrqUT1fVInS6q1yCZwVKkyCEGcxUiIYY/edit)

## Production Build

```bash
npm run build
npm start
```

Serves the React app from Express on port 3001.
