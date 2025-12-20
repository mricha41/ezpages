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

    window.route = UpdateWindowHistory(event);

}

export { Route };