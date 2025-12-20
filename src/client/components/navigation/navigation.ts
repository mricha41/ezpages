import { Capitalize } from "../../utilities/string";
import { Content, Page } from "../../components/content/content";
import { Route } from "../../components/routing/routing";
import { Layout } from "../../components/layout/layout";

import "./css/styles.css";

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
                    <div class="menu-tab">
                        <button class="nav-button" data-page-label="derp" data-href="/derp">
                            Derp
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
                layout.Render(page);
            } else {
                layout.Render(layout.ERROR_404);
            }
            
            Route(event);

        });
    });

}

function ChildNavigation (layout: Layout, nested_nav: HTMLElement, child_pages: Array<Page>) {

    nested_nav.insertAdjacentHTML("afterbegin", `
        <div>
            ${child_pages.map((p) => p.label != "index" ? `
                <div class="menu-tab">
                    <a class="nav-link" data-page-label="${p.label}" data-href="${p.route}" href="${p.route}">
                    ${ Capitalize(p.label) }
                    </a>
                </div>
            ` : '').join('')}
        </div>
    `);

    document.querySelectorAll(".nav-link").forEach((link) => {
        link.addEventListener("click", (event: Event) => {

            let page = child_pages.find((p) => p.label === (link as HTMLAnchorElement).dataset.pageLabel) || null;
            
            if (page) {
                layout.RenderChild(page);
            } else {
                layout.RenderChild(layout.ERROR_404);
            }

            Route(event);

        });
    });

}

export { Navigation, ChildNavigation };