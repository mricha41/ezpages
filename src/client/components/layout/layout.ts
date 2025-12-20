import { Content, Page } from "../../components/content/content";
import { Navigation, ChildNavigation } from "../../components/navigation/navigation";

import "./css/styles.css";

interface LayoutTemplate {
    type: string,
    template: string,
    content: string,
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

    private SIMPLE_LAYOUT = { 
        type: LayoutType.SIMPLE as string, 
        template: `
            <main></main>
        `,
        content: "",
        callback: () => {

            let app = document.querySelector("#app") as HTMLDivElement;
            app.insertAdjacentHTML("beforeend", this.SIMPLE_LAYOUT.template);

            //main page content area
            const mainElement = document.querySelector("main") as HTMLElement;
            mainElement.insertAdjacentHTML("afterbegin", this.SIMPLE_LAYOUT.content);

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
        content: "",
        callback: (page: Page) => {

            let app = document.querySelector("#app") as HTMLDivElement;
            app.insertAdjacentHTML("beforeend", this.NESTED_LAYOUT.template);

            //main page content area
            const mainElement = document.querySelector("main") as HTMLElement;
            mainElement.insertAdjacentHTML("afterbegin", this.NESTED_LAYOUT.content);

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

    constructor (options: LayoutOptions) {

        this._default_layout = this._layout_templates[0];
        this._default_page = "index";

        const page: Page | null = options.content_manager.Pages().find(p => p.label === this._default_page) || null;
        
        Navigation(this, options.content_manager);

        if (options.layout_template) {
            this.AddTemplate(options.layout_template);
        }

        let template = this.Reset(page);
        this.Render(template.type, page);

    }

    public Reset (page: Page | null = null) {

        let app = document.querySelector("#app") as HTMLDivElement;
        app.innerHTML = "";

        let template: LayoutTemplate;

        if (page) {

            template = this.Template(page.config.layout);
            template.content = page.content;

        } else {

            template = this._default_layout;

            template.content = `
                If you're seeing this content, it's because you haven't written anything!<br>
                Start by creating an index.md in the top-level content directory on your server.
            `;
            
        }

        return template;

    }

    public AddTemplate (template: LayoutTemplate) {

        this._layout_templates.push(template);

    }

    private Template (type: string) {

        return this._layout_templates.find((t) => t.type === type) || this._default_layout;

    }

    public Render (template_type: string, page: Page | null) {

        let template = this._layout_templates.find((t) => t.type === template_type) || null;
        if (template) {
            page ? template.callback(page) : template.callback;
        }

    }

    public RenderChild (page: Page) {

        //main page content area
        const mainElement = document.querySelector("main") as HTMLElement;
        mainElement.innerHTML = "";
        mainElement.insertAdjacentHTML("afterbegin", page.content);

    }

}

export { Layout, LayoutOptions, LayoutTemplate };