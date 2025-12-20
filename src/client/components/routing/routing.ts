function Route (event: Event) {

    event.preventDefault();

    const target = event.target;

    if (target) {

        let href = (target as HTMLElement).dataset.href;
        console.log(href)

        window.history.pushState({}, "", href);

    }

}

export { Route };