import path from 'path';
import express from 'express';
import { Request, NextFunction, Response } from 'express';
var contentApiRouter = express.Router();

import { logger, LogRequest } from '../../../logger.js';
import { LoadContentFromFile, LoadContentFromFolder } from '../../../utilities/content_utilities.js';

async function getContent (_req: LogRequest, res: Response, _next: NextFunction) {
  
  try {

    let contentCache = path.join(process.cwd(), "src/server/content/content.json");
    const json = await LoadContentFromFile(contentCache);

    if (json) {

      logger.info(`Content cached at ${contentCache}. Loading cache and sending content...`);
      const content = JSON.parse(json);
      res.json(content);

    } else {

      logger.info(`Content cache not found. Rebuilding content cache and sending content...`);
      const content = await LoadContentFromFolder(path.join(process.cwd(), "src/server/content"));

      res.json(content);

    }

  } catch (error) {

    res.status(500).send({ error: "Failed to get content." });
    
  }

}

contentApiRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  getContent(req as LogRequest, res, next);
});

export { contentApiRouter };
