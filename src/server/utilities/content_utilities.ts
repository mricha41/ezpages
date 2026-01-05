import fs, { opendir } from 'fs/promises';
import path from 'path';
import { marked } from 'marked';
import { logger } from '../logger.js';

//https://marked.js.org/using_advanced#options
//use original markdown standard, async parsing
marked.use({ pedantic: true, async: true });

//file-level configuration options
type Config = {
  content_type?: ContentType,
  title: string,
  description: string,
  layout: LayoutType
};

type Page = {
  label: string,
  content: string, //html to render on front-end
  config: Config,
  children: Array<Page>, //child pages
  route: string //front-end route
};

enum LayoutType {
    SIMPLE="simple",
    NESTED="nested"
};

enum ContentType {
  MARKDOWN="markdown",
  HTML="html"
}

const DEFAULT_CONFIG: Config = {
  content_type: ContentType.MARKDOWN,
  title: "",
  description: "",
  layout: LayoutType.SIMPLE
}

const SUPPORTED_CONTENT_FILE_TYPES = ["html", "md"];

async function LoadContentFromFolder (folder: string) {

  let content: Array<Page> = [];

  const contentDir = folder;

  try {

    //per nodejs docs, this is "async iteration"...
    //...huh, learned something new :D
    //see also: 
    //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncIterator
    //const directoryIterator = await opendir(contentDir);
    const files = await opendir(contentDir, { recursive: true });
    for await (const file of files) {

      const extension = file.name.split(".")[1] || null;
      const file_name = file.name.split(".")[0] || null;
      
      if (file.isFile() && extension && file_name && extension != "json" && SUPPORTED_CONTENT_FILE_TYPES.includes(extension)) {

          const relativePath = file.parentPath.replace(contentDir, "") + "\\" + file.name;
          const currentFile = path.join(contentDir, relativePath);
          let config = DEFAULT_CONFIG;

          try { //look for config options

            const jsonFilePath = currentFile.replace(`.${extension}`, ".json");
            const jsonFile = await fs.readFile(jsonFilePath, { encoding: 'utf-8' });
            if (jsonFile) {
              
              config = JSON.parse(jsonFile) as Config;

              if (!config.content_type) {
                config.content_type = ContentType.MARKDOWN;
              }

            } else {

              logger.warn(`Parsing failed on config options set for ${jsonFilePath}.\n Using default config options for this page:\n`, { default_config: DEFAULT_CONFIG });
              
            }

          } catch (error) {

            logger.warn(`There are no config options set for ${currentFile}.\n Using default config options for this page:\n`, { default_config: DEFAULT_CONFIG });

          }

          try {

            const markdownFile = await fs.readFile(currentFile, { encoding: 'utf-8' });
            const markdownParsed = config.content_type === ContentType.MARKDOWN ? await marked.parse(markdownFile) : markdownFile; //only parse if it's a markdown file

            //transform file name into a route-friendly form
            const route = file_name === "index" ? "/" : relativePath.replaceAll("\\", "/").replace(`/${file.name}`, "").replaceAll("_", "-");
            const label = file_name.replaceAll("_", "-");

            const hasParent = route.split("/").length > 2; //nested route - /about/stuff, for example
            
            if (hasParent) { //need to store that in children of parent
              
              const parent = content.find((c) => c.label === route.split("/")[1]); //the parent of /about/stuff would be /about, for example
              if (parent) {
                
                parent.children.push( { label: label, content: markdownParsed, config: config, children: [], route: route } );

              }

            } else {

              content.push( { label: label, content: markdownParsed, config: config, children: [], route: route } );

            }

          } catch (error) {

            logger.error(`Error parsing ${currentFile}:\n`, { error: error });

          }

      }
      
    }

  } catch (err) {

    logger.error("Error creating content JSON object - make sure there is content in the /src/server/content folder.\n", err);

  }

  return content;
 
}

export { LoadContentFromFolder };