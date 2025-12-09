enum LayoutType {
    SIMPLE="simple"
};

type LayoutTemplate = {
    type: string,
    template: string,
    layout: LayoutType
};

const LayoutTemplates = [
    //default layout
    { 
        type: LayoutType.SIMPLE, 
        template: `
            <header></header>
            <main></main>
        `
    }
];

const DEFAULT_LAYOUT: number = 0;

function LayoutTemplate (type: LayoutType) {

    return LayoutTemplates.find((t) => t.type === type) || LayoutTemplates[DEFAULT_LAYOUT];

}

export { LayoutTemplate, LayoutType };