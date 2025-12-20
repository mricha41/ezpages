import { RouteError, ERROR_404 } from "../../components/error/error";

function UpdateWindowHistory (event: Event) {

    event.preventDefault();

    const target = event.target;

    if (target) {

        //clean up url if necessary
        window.history.replaceState("", document.title, window.location.pathname);

        let href = (target as HTMLElement).dataset.href;
        
        window.history.pushState({}, "", href);

    }
    
}

function Route (event: Event) {

    UpdateWindowHistory(event);

}

function HandleError (error: RouteError) {

    window.history.replaceState("", document.title, window.location.pathname);
    let href: string | null = null;

    switch (error) {
        case RouteError.NOT_FOUND:
        {
            href = ERROR_404.route;
        }
        break;
        default:
            break;
    }
    
    window.history.pushState({}, "", href);

}

export { Route, HandleError };