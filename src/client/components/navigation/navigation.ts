import { Capitalize } from "../../utilities/string";
import { Content, Page } from "../../components/content/content";
import { Route, HandleError } from "../../components/routing/routing";
import { Layout } from "../../components/layout/layout";
import { ERROR_404 } from "../../components/error/error";

import "./css/styles.css";

function Navigation (layout: Layout, cm: Content) {
    
    /////////////////////////////////////////////////////
    //**************************************************
    //some initial state checks and handling required
    //user may or may not land on the index route "/"
    //so need to check all pages and their children
    //and find that page if it exists - otherwise 404
    //**************************************************
    /////////////////////////////////////////////////////
    let page = cm.Pages().find((p) => p.route === window.location.pathname) || null;
            
    if (page) {

        layout.Render(page);

    } else {

        let childPage = null;
        for (let i = 0; i<cm.Pages().length; ++i) {
            childPage = cm.Pages()[i].children.find((c) => c.route === window.location.pathname) || null;
            page = cm.Pages()[i];
            if (childPage)
                break;
        }

        if (page && childPage) {

            layout.Render(page);
            layout.RenderChild(childPage);
            
        } else {

            layout.Render(ERROR_404);
            HandleError(404);

        }

    }
    
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
                layout.Render(page);
                Route(event);
            } else {
                layout.Render(ERROR_404);
                HandleError(404);
            }

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
                Route(event);
            } else {
                layout.RenderChild(ERROR_404);
                HandleError(404);
            }

        });
    });

}

export { Navigation, ChildNavigation };