
function locationHandler () {

    let location: string = window.location.pathname;
    if (location.length == 0) {

        location = "/";

    }
    
}

function Route (event: Event) {

    event.preventDefault();

    const target = event.target;

    if (target) {

        window.history.pushState({}, "", (target as HTMLButtonElement).dataset.href);

    }

    locationHandler();

}

export { Route };