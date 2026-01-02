import path from 'path';
import express from 'express';
import { Request, NextFunction, Response } from 'express';
var contentApiRouter = express.Router();

import { LogRequest } from '../../../logger.js';
import { LoadContentFromFolder } from '../../../utilities/content_utilities.js';

async function getContent (_req: LogRequest, res: Response, _next: NextFunction) {
  
  try {

    const content = await LoadContentFromFolder(path.join(process.cwd(), "src/server/content"));

    res.json(content);

  } catch (error) {

    res.status(500).send({ error: "Failed to get content." });
    
  }

}

contentApiRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
  getContent(req as LogRequest, res, next);
});

export { contentApiRouter };
