function Route (event: Event) {

    event.preventDefault();

    const target = event.target;

    if (target) {

        window.history.pushState({}, "", (target as HTMLButtonElement).dataset.href);

    }

}

export { Route };