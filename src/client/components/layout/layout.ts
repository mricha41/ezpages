import { Content, Page } from "../../components/content/content";
import { Navigation, ChildNavigation } from "../../components/navigation/navigation";

import "./css/styles.css";

interface LayoutTemplate {
    type: string,
    template: string,
    render_hook: (page: Page) => void,
    navigation_hook?: (layout: Layout, cm: Content) => void
};

enum LayoutType {
    SIMPLE="simple",
    NESTED="nested"
};

type LayoutOptions = {
    content_manager: Content,
    layout_template?: LayoutTemplate | Array<LayoutTemplate>
};

class Layout {

    private SIMPLE_LAYOUT = { 
        type: LayoutType.SIMPLE as string, 
        template: `
            <main></main>
        `,
        render_hook: (page: Page) => {

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
        render_hook: (page: Page) => {

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

    private _layout_templates: Array<LayoutTemplate> = [
        this.SIMPLE_LAYOUT, //default layout template
        this.NESTED_LAYOUT
    ];  

    private _default_layout: LayoutTemplate;
    private _default_page: string;
    private _options: LayoutOptions;

    constructor (options: LayoutOptions) {

        this._default_layout = this._layout_templates[0];
        this._default_page = "index";

        this._options = options;

        const page: Page = this._options.content_manager.Pages().find(p => p.label === this._default_page) || this._options.content_manager.Pages()[0];

        if (this._options.layout_template) {

            if (Array.isArray(this._options.layout_template)) {
                    
                this._options.layout_template.forEach((t) => {
                    this.AddTemplate(t);
                });

            } else {

                this.AddTemplate(this._options.layout_template);
                
            }

        }

        //navigation triggers first render
        const index_template = this.Template(page.config.layout);
        index_template.navigation_hook ? index_template.navigation_hook(this, this._options.content_manager) : Navigation(this, this._options.content_manager);

    }

    private Reset () {

        let app = document.querySelector("#app") as HTMLDivElement;
        app.innerHTML = "";

    }

    public AddTemplate (template: LayoutTemplate | Array<LayoutTemplate>) {

        if (Array.isArray(template)) {

            template.forEach((t) => {

                this._layout_templates.push(t);

            });

        } else {

            this._layout_templates.push(template);

        }

    }

    private Template (type: string) {

        return this._layout_templates.find((t) => t.type === type) || this._default_layout;

    }

    public Render (page: Page) {

        this.Reset();
        let template = this.Template(page.config.layout);
        template.render_hook(page);
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