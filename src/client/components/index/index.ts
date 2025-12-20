import { Content } from "../../components/content/content";
import { Layout, LayoutTemplate } from "../layout/layout";
import "./css/styles.css";

document.addEventListener("DOMContentLoaded", async () => {

    //get page content
    let cm = await Content.Instance();

    //create layout markup
    const custom_template: LayoutTemplate = {
        type: "custom",
        template: "<main></main>",
        content: "",
        callback: () => {

            let app = document.querySelector("#app") as HTMLDivElement;
            app.insertAdjacentHTML("beforeend", custom_template.template);

            //main page content area
            const mainElement = document.querySelector("main") as HTMLElement;
            mainElement.insertAdjacentHTML("afterbegin", custom_template.content);

        }
    };

    //construct the layout
    const layout = new Layout({
        content_manager: cm,
        layout_template: custom_template
    });

});
