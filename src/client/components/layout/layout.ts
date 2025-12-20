import { Content, Page } from "../../components/content/content";
import { Navigation, ChildNavigation } from "../../components/navigation/navigation";

import "./css/styles.css";

interface LayoutTemplate {
    type: string,
    template: string,
    //content: string,
    callback(page: Page | null): void
};

enum LayoutType {
    SIMPLE="simple",
    NESTED="nested"
};

type LayoutOptions = {
    content_manager: Content,
    layout_template?: LayoutTemplate
};

class Layout {

    private PLACEHOLDER_CONTENT: Page = {
        label: "index",
        content: `
            If you're seeing this content, it's because you haven't written anything!<br>
            Start by creating an index.md in the top-level content directory on your server.
        `,
        config: {
            title: "Main Page",
            description: "Main page content.",
            layout: "simple"
        },
        children: [],
        route: "/"
    };

    private SIMPLE_LAYOUT = { 
        type: LayoutType.SIMPLE as string, 
        template: `
            <main></main>
        `,
        callback: (page: Page) => {

            let app = document.querySelector("#app") as HTMLDivElement;
            app.insertAdjacentHTML("beforeend", this.SIMPLE_LAYOUT.template);

            //main page content area
            const mainElement = document.querySelector("main") as HTMLElement;
            mainElement.insertAdjacentHTML("afterbegin", page.content);

        }
    };

    private NESTED_LAYOUT = {
        type: LayoutType.NESTED as string, 
        template: `
            <div class="grid-container">
                <div class="grid-item-1">
                    <nav class="nested_nav"></nav>
                </div>
                <div class="grid-item-2">
                    <main></main>
                </div>
            </div>
        `,
        callback: (page: Page) => {

            let app = document.querySelector("#app") as HTMLDivElement;
            app.insertAdjacentHTML("beforeend", this.NESTED_LAYOUT.template);

            //main page content area
            const mainElement = document.querySelector("main") as HTMLElement;
            mainElement.insertAdjacentHTML("afterbegin", page.content);

            //nested navigation
            const nested_nav = app.querySelector(".nested_nav") as HTMLElement; 
            if (page && page.children.length) {
                ChildNavigation(this, nested_nav, page.children);
            }
        }
    };

    private _layout_templates = [
        this.SIMPLE_LAYOUT, //default layout template
        this.NESTED_LAYOUT
    ];  

    private _default_layout: LayoutTemplate;
    private _default_page: string;
    private _options: LayoutOptions | null;

    constructor (options: LayoutOptions) {

        this._default_layout = this._layout_templates[0];
        this._default_page = "index";

        const page: Page | null = options.content_manager.Pages().find(p => p.label === this._default_page) || this.PLACEHOLDER_CONTENT;

        this._options = options || null;

        if (this._options.layout_template) {
            this.AddTemplate(this._options.layout_template);
        }

        this.Reset();
        this.Render(page);

        Navigation(this, options.content_manager);

    }

    private Reset () {

        let app = document.querySelector("#app") as HTMLDivElement;
        app.innerHTML = "";

    }

    public AddTemplate (template: LayoutTemplate) {

        this._layout_templates.push(template);

    }

    private Template (type: string) {

        return this._layout_templates.find((t) => t.type === type) || this._default_layout;

    }

    public Render (page: Page) {

        this.Reset();
        let template = this.Template(page.config.layout);
        template.callback(page);
        this.UpdateMetadata(page);

    }

    public RenderChild (page: Page) {

        //main page content area
        const mainElement = document.querySelector("main") as HTMLElement;
        mainElement.innerHTML = "";
        mainElement.insertAdjacentHTML("afterbegin", page.content);

        this.UpdateMetadata(page);

    }

    public UpdateMetadata (page: Page) {

        const description = document.head.querySelector('meta[name="description"]');
        description?.setAttribute("content", page.config.description);
        document.title = page.config.title;

    }

}

export { Layout, LayoutOptions, LayoutTemplate };