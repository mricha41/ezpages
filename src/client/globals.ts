declare global {
    interface Window {
        route: any;
    }
}

//quirk of scoping - needs to be a module even though
//we're not exporting anything
export {}