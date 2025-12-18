import { Content } from "../../components/content/content";
import { Layout, LayoutTemplate } from "../layout/layout";
import "./css/styles.css";

declare global {
    interface Window {
        route: any;
    }
}

document.addEventListener("DOMContentLoaded", async () => {

    //get page content
    let cm = await Content.Instance();

    //create layout markup
    const template: LayoutTemplate = {
        type: "custom",
        template: "<div><h2>Hur Dur</h2><main></main></div>",
        content: "",
        callback: () => {

            let app = document.querySelector("#app") as HTMLDivElement;
            app.insertAdjacentHTML("beforeend", template.template);

            //main page content area
            const mainElement = document.querySelector("main") as HTMLElement;
            mainElement.insertAdjacentHTML("afterbegin", template.content);

        }
    };

    //construct the layout
    const layout = new Layout({
        content_manager: cm,
        layout_template: template
    });

});
