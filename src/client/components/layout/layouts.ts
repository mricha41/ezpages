enum LayoutType {
    SIMPLE=0
};

type LayoutTemplate = {
    type: number,
    template: string
};

const LayoutTemplates: Array<LayoutTemplate> = [
    { 
        type: LayoutType.SIMPLE, 
        template: `
            <header></header>
            <main></main>
        `
    }
];

function LayoutTemplate (type: LayoutType) {

    return LayoutTemplates.find((t) => t.type === type) || LayoutTemplates[LayoutType.SIMPLE];

}

export { LayoutTemplate, LayoutType };