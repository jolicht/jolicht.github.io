// @ts-check

import {themes as prismThemes} from 'prism-react-renderer';

/** * Logic to detect development environment for local absolute URLs
 */
const isDevelopment = process.env.NODE_ENV === 'development';
const siteUrl = isDevelopment ? 'http://localhost:3000' : 'https://lichtenwallner.at';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Johannes Lichtenwallner',
  tagline: 'Where clean architecture meets clear thinking',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  // Dynamic URL assignment based on environment
  url: siteUrl,
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
        // This will now resolve to http://localhost:3000/img/... in dev
        // and https://lichtenwallner.at/img/... in production
        image: 'img/og/lichtenwallner.at.jpg',
        colorMode: {
          respectPrefersColorScheme: true,
        },
        metadata: [
          { name: 'author', content: 'Johannes Lichtenwallner' },
          {
            name: 'keywords',
            content: 'PHP, Symfony, Event Sourcing, CQRS, Serverless, AWS, Architecture, Laravel',
          },
          { name: 'twitter:card', content: 'summary_large_image' },
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
              sidebarId: 'mainSidebar',
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
              title: 'Connect',
              items: [
                { label: 'GitHub', href: 'https://github.com/jolicht' },
                { label: 'LinkedIn', href: 'https://www.linkedin.com/in/lichtenwallner/' },
              ],
            },
          ],
          copyright: `Copyright © ${new Date().getFullYear()} Johannes Lichtenwallner. Built with Docusaurus.`,
        },
        prism: {
          theme: prismThemes.github,
          darkTheme: prismThemes.dracula,
          additionalLanguages: ['php', 'bash', 'json'],
        },
      }),
};

export default config;