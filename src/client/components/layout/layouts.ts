enum LayoutType {
    SIMPLE="simple",
    NESTED="nested"
};

type LayoutTemplate = {
    type: LayoutType,
    template: string,
};

const LayoutTemplates = [
    //default layout
    { 
        type: LayoutType.SIMPLE, 
        template: `
            <main></main>
        `
    },
    {
        type: LayoutType.NESTED, 
        template: `
            <div>
                <nav></nav>
                <main></main>
            </div>
        `
    }
];

const DEFAULT_LAYOUT: LayoutTemplate = LayoutTemplates[0];

function LayoutTemplate (type: string) {

    return LayoutTemplates.find((t) => t.type === type) || DEFAULT_LAYOUT;

}

export { LayoutTemplate, LayoutType, DEFAULT_LAYOUT };