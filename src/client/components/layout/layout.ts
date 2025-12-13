import { Content, Page } from "../../components/content/content";
import { Route } from "../../components/routing/routing";
import { Capitalize } from "../../utilities/string";
import { LayoutTemplate, DEFAULT_LAYOUT, LayoutType } from "./layouts";

import "./css/styles.css";

const DEFAULT_PAGE = "index";

async function Layout () {

    let cm = await Content.Instance();
    const page: Page | null = cm.Pages().find(p => p.label === DEFAULT_PAGE) || null;
    
    Navigation(cm);

    ResetContent(page);
    
}

async function ResetContent (page: Page | null = null) {

    let template: string;
    let content: string;
    let layout: LayoutType;

    if (page) {

        layout = page.config.layout;
        template = LayoutTemplate(layout).template;
        content = page.content;

    } else {

        layout = DEFAULT_LAYOUT.type;
        template = DEFAULT_LAYOUT.template;

        content = `
            If you're seeing this content, it's because you haven't written anything!<br>
            Start by creating an index.md in the top-level content directory on your server.
        `;
        
    }

    ContentLayout(layout, content, template);

}

function Navigation (cm: Content) {
    
    document.body.insertAdjacentHTML("afterbegin", `
        <header>
            <nav>
                <div>
                    <div class="menu-tab">
                        <button class="nav-button" data-page-label="index" data-href="/">
                            Home
                        </button>
                    </div>
                    ${cm.Pages().map((p: Page) => p.label != "index" ? `
                        <div class="menu-tab">
                            <button class="nav-button" data-page-label="${p.label}" data-href="${p.route}">
                            ${ Capitalize(p.label) }
                            </button>
                        </div>
                    ` : '').join('')}
                </div>
            </nav>
        </header>
    `);

    document.querySelectorAll(".nav-button").forEach((button) => {
        button.addEventListener("click", (event: Event) => {

            let page = cm.Pages().find((p) => p.label === (button as HTMLElement).dataset.pageLabel) || null;
            
            ResetContent(page);

            //clean up url if necessary
            window.history.replaceState("", document.title, window.location.pathname);
            
            //route the click to
            //the appropriate location
            window.route = Route(event);

        });
    });

}

function ContentLayout (layout: LayoutType, content: string, template: string) {

    switch (layout) {

        case LayoutType.SIMPLE:
        {

            let app = document.querySelector("#app") as HTMLDivElement;
            app.innerHTML = "";
            app.insertAdjacentHTML("beforeend", template);

            //main page content area
            const mainElement = document.querySelector("main") as HTMLElement;
            mainElement.innerHTML = "";

            mainElement.insertAdjacentHTML("afterbegin", content);

        }
        break;
        case LayoutType.NESTED:
        {

            let app = document.querySelector("#app") as HTMLDivElement;
            app.innerHTML = "";
            app.insertAdjacentHTML("beforeend", template);

            //main page content area
            const mainElement = document.querySelector("main") as HTMLElement;
            mainElement.innerHTML = "";

            mainElement.insertAdjacentHTML("afterbegin", content);

        }
        break;
        default:
            break;
    }

}

export { Layout };