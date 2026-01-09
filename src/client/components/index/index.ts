import { Content, Page } from "../../components/content/content";
import { Layout, LayoutTemplate } from "../layout/layout";
import { Route, HandleError } from "../routing/routing";
import { ERROR_404 } from "../error/error";
import { Capitalize } from "../../utilities/string";

import "./css/styles.css";

document.addEventListener("DOMContentLoaded", async () => {

    //get page content
    let cm = await Content.Instance();
    
    //create layout markup
    const custom_template: LayoutTemplate = {
        type: "custom",
        template: "",
        render_hook: (page: Page) => {

            const last_rendered = new Date(Date.now());
            console.log(`Custom render hook fired ${last_rendered.toDateString()} at ${last_rendered.toTimeString()}`);

            let app = document.querySelector("#app") as HTMLDivElement;
            app.insertAdjacentHTML("beforeend", custom_template.template);

            //main page content area
            const mainElement = document.querySelector("main") as HTMLElement;
            mainElement.insertAdjacentHTML("afterbegin", page.content);

        },
        navigation_hook: (layout: Layout, cm: Content) => {

            console.log("Custom navigation hook...");

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
    };

    //construct the layout
    //const layout = 
    new Layout({
        content_manager: cm,
        layout_template: custom_template //can be one template or an array of templates
    });
    //layout.AddTemplate(custom_template); //fires after first draw

});
