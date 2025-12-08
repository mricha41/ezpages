import fs, { opendir } from 'fs/promises';
import path from 'path';
import { marked } from 'marked';

//https://marked.js.org/using_advanced#options
//use original markdown standard, async parsing
marked.use({ pedantic: true, async: true });

enum MarkdownConfig {
  TITLE= 0,
  DESCRIPTION= 1,
};

interface Content {
  label: string,
  title: string, //page title that appears in tab
  content: string, //html to render on front-end
  description: string, //meta tag description
  children: Array<Content>, //child pages
  route: string //front-end route
};

//markdown config items are
//placed at the top of markdown files.
//for now, order matters: 
//see MardownConfig enum above
function ParseMarkdownConfig (config: MarkdownConfig, html: string) {

  switch (config) {

    case MarkdownConfig.TITLE:
    case MarkdownConfig.DESCRIPTION:
    {

      let commentRegex = /<!--.*?-->/gs;
      let comments = html.match(commentRegex) as Array<string> || [];
      let comment: string = comments.length ? comments[config].trim() : "";
      //console.log(comment);
      return comment.substring(4, comment.length - 3);

    }
    default:
      return "";
  }

}

async function LoadMarkdownFromFolder (folder: string) {

  let content: Array<Content> = [];

  const contentDir = folder;

  try {

    //per nodejs docs, this is "async iteration"...
    //...huh, learned something new :D
    //see also: 
    //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncIterator
    //const directoryIterator = await opendir(contentDir);
    const files = await opendir(contentDir, { recursive: true });
    for await (const file of files) {

      if (file.isFile()) {

          const relativePath = file.parentPath.replace(contentDir, "") + "\\" + file.name;

          const currentFile = path.join(contentDir, relativePath);
          const markdownFile = await fs.readFile(currentFile, { encoding: 'utf-8' });
          const markdownParsed = await marked.parse(markdownFile);

          const title = ParseMarkdownConfig(MarkdownConfig.TITLE, markdownParsed);
          const description = ParseMarkdownConfig(MarkdownConfig.DESCRIPTION, markdownParsed);
          const route = file.name === "index.md" ? "/" : relativePath.replaceAll("\\", "/").replace(`/${file.name}`, "");
          const label = file.name.replace(".md", "");

          const hasParent = route.split("/").length > 2; //nested route - /about/stuff, for example
          
          if (hasParent) { //need to store that in children of parent
            
            const parent = content.find((c) => c.label === route.split("/")[1]); //the parent of /about/stuff would be /about, for example
            if (parent) {
              
              parent.children.push( { label: label, title: title, content: markdownParsed, description: description, children: [], route: route } );

            }

          } else {

            content.push( { label: label, title: title, content: markdownParsed, description: description, children: [], route: route } );

          }
      }
      
    }

  } catch (err) {

    console.error("Error creating content JSON object - make sure there is content in the /src/server/content folder.\n", err);

  }

  return content;
 
}

export { MarkdownConfig, ParseMarkdownConfig, LoadMarkdownFromFolder };