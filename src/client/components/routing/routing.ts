import { Content } from "../../components/content/content";
import { Capitalize } from "../../utilities/string";

function locationHandler (cm: Content) {

    let location: string = window.location.pathname;
    if (location.length == 0) {

        location = "/";

    }

    const pages = cm.Pages();
    const page = pages.find((p) => p.label === location.substring(1, location.length));
    
    if (page) {

        document.title = Capitalize(page.label);
        document.querySelector('meta[name="description"]')!.setAttribute("content", page.description);

    }
    
}

function Route (event: Event, cm: Content) {

    event.preventDefault();

    const target = event.target;

    if (target) {

        window.history.pushState({}, "", (target as HTMLButtonElement).dataset.href);

    }

    locationHandler(cm);

}

export { Route };