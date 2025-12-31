import path from 'path';
import express from 'express';
import { Request, NextFunction, Response } from 'express';
var contentApiRouter = express.Router();

import { LogRequest } from '../../../logger.js';
import { LoadMarkdownFromFolder } from '../../../utilities/markdown_utilities.js';

async function getContent (req: LogRequest, res: Response, _next: NextFunction) {
  
  req.log.info("Getting content...");

  try {

    const content = await LoadMarkdownFromFolder(path.join(process.cwd(), "src/server/content"));

    res.json(content);

  } catch (error) {

    res.status(500).send({ error: "Failed to get content." });
    
  }

}

contentApiRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  getContent(req as LogRequest, res, next);
});

export { contentApiRouter };
