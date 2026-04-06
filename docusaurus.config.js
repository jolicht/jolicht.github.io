// @ts-check

import {themes as prismThemes} from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Johannes Lichtenwallner',
  tagline: 'Where clean architecture meets clear thinking',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://lichtenwallner.at',
  baseUrl: '/',

  organizationName: 'jolicht',
  projectName: 'jolicht.github.io',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
    localeConfigs: {
      en: {
        label: 'English',
        htmlLang: 'en-US',
      },
    },
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          // Removed path and routeBasePath so Docusaurus uses the default "docs/" directory
          sidebarPath: './sidebars.js',
          editUrl: 'https://github.com/jolicht/jolicht.github.io/tree/main/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
  /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
      ({
        image: 'img/docusaurus-social-card.jpg',
        colorMode: {
          respectPrefersColorScheme: true,
        },
        metadata: [
          { name: 'author', content: 'Johannes Lichtenwallner' },
          {
            name: 'keywords',
            content: 'PHP, Symfony, Event Sourcing, CQRS, Serverless, AWS, Architecture, Laravel',
          },
        ],
        navbar: {
          title: 'Johannes Lichtenwallner',
          logo: {
            alt: 'JHL Monogram',
            src: 'img/jhl.svg',
          },
          items: [
            {
              type: 'docSidebar',
              sidebarId: 'mainSidebar', // Correctly references the sidebar defined in sidebars.js
              position: 'left',
              label: 'Documentation',
            },
            {
              href: 'https://github.com/jolicht/jolicht.github.io',
              label: 'GitHub',
              position: 'right',
            },
          ],
        },
        footer: {
          style: 'dark',
          links: [
            {
              title: 'Community',
              items: [
                { label: 'Stack Overflow', href: 'https://stackoverflow.com/questions/tagged/docusaurus' },
                { label: 'Discord', href: 'https://discordapp.com/invite/docusaurus' },
                { label: 'X', href: 'https://x.com/docusaurus' },
              ],
            },
            {
              title: 'More',
              items: [
                { label: 'GitHub', href: 'https://github.com/facebook/docusaurus' },
              ],
            },
          ],
          copyright: `Copyright © ${new Date().getFullYear()} My Project, Inc. Built with Docusaurus.`,
        },
        prism: {
          theme: prismThemes.github,
          darkTheme: prismThemes.dracula,
        },
      }),
};

export default config;