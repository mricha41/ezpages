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

class Content {

    private static _instance: Content | null = null;

    private _pages: Array<Page> = [];

    private constructor () {}

    private async UpdatePages () {

        try {

            let response = await fetch('/api/content');
            let content = await response.json();
            console.log(content);

            this._pages = content;

        } catch (error) {

            console.log("Error getting page updates: ", error);

        }

    }

    public Pages () {
        return this._pages;
    }

    public static async Instance () {

        if (this._instance) {

            return this._instance; 
        
        } else { 
            
            this._instance = new this();
            await this._instance.UpdatePages();
            return this._instance;

        }

    }

}

export { Content, Page };