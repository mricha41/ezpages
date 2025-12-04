import { Layout } from "../layout/layout";
import { LayoutType } from "../layout/layouts";
import "./css/styles.css";

declare global {
    interface Window {
        route: any;
    }
}

document.addEventListener("DOMContentLoaded", () => {

    //grab the layout markup
    Layout("index", LayoutType.SIMPLE);

});
