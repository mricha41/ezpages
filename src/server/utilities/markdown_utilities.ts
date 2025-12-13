import fs, { opendir } from 'fs/promises';
import path from 'path';
import { marked } from 'marked';

//https://marked.js.org/using_advanced#options
//use original markdown standard, async parsing
marked.use({ pedantic: true, async: true });

//file-level configuration options
type Config = {
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

const DEFAULT_CONFIG: Config = {
  title: "",
  description: "",
  layout: LayoutType.SIMPLE
}

async function LoadMarkdownFromFolder (folder: string) {

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
      
      if (file.isFile() && extension != "json") {

          const relativePath = file.parentPath.replace(contentDir, "") + "\\" + file.name;

          const currentFile = path.join(contentDir, relativePath);
          const markdownFile = await fs.readFile(currentFile, { encoding: 'utf-8' });
          const markdownParsed = await marked.parse(markdownFile);
          
          let config = DEFAULT_CONFIG;

          try { //look for config options
            
            const jsonFile = await fs.readFile(currentFile.replace(".md", ".json"), { encoding: 'utf-8' });
            if (jsonFile) {
              config = JSON.parse(jsonFile) as Config;
            }

          } catch (error) {

            console.log(`There are no config options set for ${currentFile}.\n Using default config options for this page:\n`, DEFAULT_CONFIG);

          }

          const route = file.name === "index.md" ? "/" : relativePath.replaceAll("\\", "/").replace(`/${file.name}`, "");
          const label = file.name.replace(".md", "");

          const hasParent = route.split("/").length > 2; //nested route - /about/stuff, for example
          
          if (hasParent) { //need to store that in children of parent
            
            const parent = content.find((c) => c.label === route.split("/")[1]); //the parent of /about/stuff would be /about, for example
            if (parent) {
              
              parent.children.push( { label: label, content: markdownParsed, config: config, children: [], route: route } );

            }

          } else {

            content.push( { label: label, content: markdownParsed, config: config, children: [], route: route } );

          }
      }
      
    }

  } catch (err) {

    console.error("Error creating content JSON object - make sure there is content in the /src/server/content folder.\n", err);

  }

  return content;
 
}

export { LoadMarkdownFromFolder };