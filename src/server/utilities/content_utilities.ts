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

async function LoadContentFromFile (path: string) {

  try {

    const file = await fs.readFile(path, { encoding: 'utf-8' });
    return file;

  } catch (error) {

    logger.warn(`Could not load content from file at ${path}.`, { error: error });
    return null;

  }

}

async function SerializeContent (path: string, content: Array<Page>) {

  try {
    
    fs.writeFile(path, JSON.stringify(content));

  } catch (error) {

    logger.error(`Could not serialize content to ${path}`, { error: error });

  }

}

function RecursiveFind (content: Array<Page>, page_attribute: string, search_term: string): Page | null {

  let found = null;
  content.forEach((page) => {
    
    if ((page[page_attribute as keyof Page] as Object) === search_term) {
      found = page;
    }

    if (page.children) {
      
      const child_found = RecursiveFind(page.children, page_attribute, search_term);
      if (child_found) {
        found = child_found;
      }

    }

  });
  return found;

}

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

          const relativePath = file.parentPath.replace(contentDir, "") + "/" + file.name;
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

            const route_parts = route.split("/");
            const route_parts_length = route_parts.length;
            const has_parent = route_parts_length > 2; //nested route - /about/stuff, for example
            
            if (has_parent) { //need to store that in children of parent
              
              const full_route = file.parentPath.replace(contentDir, "").replaceAll("\\", "/").replaceAll("_", "-");
              const parent_route = full_route.replace(`/${route_parts[route_parts_length-1]}`, "");
              
              let parent = RecursiveFind(content, "route", parent_route);

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

  if (content.length) {

    try {
      
      SerializeContent(path.join(folder, "/content.json"), content);

    } catch (error) {

      logger.warn(`Failed to serialize content - make sure content exists in the src/server/content folder.`, { error: error });

    }

  }

  return content;
 
}

export { LoadContentFromFile, LoadContentFromFolder, SerializeContent };