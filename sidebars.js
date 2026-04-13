// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
    // This key MUST match the sidebarId in docusaurus.config.js
    mainSidebar: [
        {
            type: 'doc',
            id: 'architecture/index',
            label: 'Getting Started',
        },
        {
            type: 'category',
            label: 'Architecture & Guides',
            collapsed: false,
            items: [
                'architecture/directory-structure',
            ],
        },
        {
            type: 'doc',
            id: 'adr/index',
            label: 'Architecture Decision Records',
        },
    ],
};

export default sidebars;