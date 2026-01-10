//file-level configuration options
type Config = {
  title: string,
  description: string,
  layout: string
};

type Page = {
    label: string,
    content: string,
    config: Config,
    children: Array<Page>,
    route: string
};

const API_ENDPOINT = '/api/content';

class Content {

    private static _instance: Content | null = null;

    private PLACEHOLDER_CONTENT: Page = {
        label: "index",
        content: `
            If you're seeing this content, it's because you haven't written anything!<br>
            Start by creating an index.md or index.html in the top-level content directory on your server.
        `,
        config: {
            title: "Main Page",
            description: "Main page content.",
            layout: "simple"
        },
        children: [],
        route: "/"
    };

    private _pages: Array<Page> = [this.PLACEHOLDER_CONTENT];

    private constructor () {}

    private async UpdatePages () {

        try {

            let response = await fetch(API_ENDPOINT);
            let content = await response.json();

            this._pages = content;

            if (!this._pages.length) {
                this._pages.push(this.PLACEHOLDER_CONTENT);
            }

        } catch (error) {

            console.log("Error getting page updates: ", error);

            this._pages.push(this.PLACEHOLDER_CONTENT);

        }

    }

    public Pages () {
        return this._pages;
    }

    public static async Instance () {

        if (this._instance) {

            return this._instance; 
        
        } else { 
            
            this._instance = new Content();
            await this._instance.UpdatePages();
            return this._instance;

        }

    }

}

export { Content, Page };