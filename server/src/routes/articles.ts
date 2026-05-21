import { Router } from 'express';
import { parseArticle } from '../services/articleParser.js';
import { DEFAULT_DOC_URL } from '../types.js';

export const articlesRouter = Router();

/**
 * Parse the article from the Google Doc
 * @param req - The request object
 * @param res - The response object
 * @returns The parsed article
 */
articlesRouter.post('/parse', async (req, res) => {
  try {
    const { docUrl } = req.body as { docUrl?: string };
    const article = await parseArticle(docUrl || DEFAULT_DOC_URL);
    res.json(article);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to parse article' });
  }
});
