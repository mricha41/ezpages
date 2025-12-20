import { Page } from "../../components/content/content";

enum RouteError {
    NOT_FOUND=404
};

const ERROR_404: Page = {
    label: "404 Error",
    content: `<h2>404 Error</h2><p>This page does not exist.</p>`,
    config: {
        title: "Error | 404",
        description: "Page does not exist.",
        layout: "simple"
    },
    children: [],
    route: "/page-not-found"
};

export { RouteError, ERROR_404 };