import { Content, Page } from "../../components/content/content";
import { Route } from "../../components/routing/routing";
import { Capitalize } from "../../utilities/string";
import { LayoutTemplate } from "./layouts";

import "./css/styles.css";

async function Layout (url: string) {

    let cm = await Content.Instance();
    const page: Page | null = cm.Pages().find(p => p.label === url) || null;

    if (page) {
        ResetContent(page);
        document.body.insertAdjacentHTML("afterbegin", LayoutTemplate(page.config.layout).template);
    }

    Navigation(cm);

    //main page content area
    const mainElement = document.querySelector("main") as HTMLElement;

    if (page) {

        mainElement.insertAdjacentHTML("afterbegin", page.content);

    } else {

        mainElement.insertAdjacentHTML("afterbegin", `
            If you're seeing this content, it's because you haven't written anything!<br>
            Start by creating an index.md in the top-level content directory on your server.
        `);
        
    }
    
    return mainElement;
    
}

function ResetContent (page: Page) {

    //replace meta data
    const meta = document.head.querySelector('meta[name="description"]');
    meta?.setAttribute("content", page.config.description);

    //replace title
    const title = document.head.querySelector("title") as HTMLTitleElement;
    title.innerHTML = page.config.title;

    //replace the content in the main content area
    const main = document.querySelector("main") as HTMLElement;
    if (main) {
        main.innerHTML = "";
    }

}

function Navigation (cm: Content) {
    
    const header = document.querySelector("header");
    header?.insertAdjacentHTML("afterbegin", `
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
    `);

    document.querySelectorAll(".nav-button").forEach((button) => {
        button.addEventListener("click", (event: Event) => {

            let page = cm.Pages().find((p) => p.label === (button as HTMLElement).dataset.pageLabel) || null;
            if (page) {

                ResetContent(page);

                let content = page.content || "";
                const main = document.querySelector("main") as HTMLElement;
                main.insertAdjacentHTML("afterbegin", content);

                //clean up url if necessary
                window.history.replaceState("", document.title, window.location.pathname);
                
                //route the click to
                //the appropriate location
                window.route = Route(event);

            }

        });
    });

}

export { Layout };