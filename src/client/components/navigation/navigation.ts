import { Capitalize } from "../../utilities/string";
import { Content, Page } from "../../components/content/content";
import { Route } from "../../components/routing/routing";
import { Layout } from "../../components/layout/layout";

function Navigation (layout: Layout, cm: Content) {
    
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
            
            if (page) {
                layout.Reset(page);
                layout.Render(page.config.layout);
            }

            //clean up url if necessary
            window.history.replaceState("", document.title, window.location.pathname);
            
            //route the click to
            //the appropriate location
            window.route = Route(event);

        });
    });

}

export { Navigation };