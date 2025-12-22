import path from 'path';
import express from 'express';
import { NextFunction, Request, Response } from 'express';
var contentApiRouter = express.Router();

import { LoadMarkdownFromFolder } from '../../../utilities/markdown_utilities.js';

async function getContent (_req: Request, res: Response, _next: NextFunction) {

  const content = await LoadMarkdownFromFolder(path.join(process.cwd(), "src/server/content"));

  res.json(content);

}

contentApiRouter.get('/', getContent);

export { contentApiRouter };
