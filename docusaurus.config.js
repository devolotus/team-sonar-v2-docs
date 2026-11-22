const metadata = require('./generation.json');

module.exports = {
  title: metadata.repository,
  tagline: 'Documentação técnica gerada a partir do código',
  url: `https://${metadata.owner}.github.io`,
  baseUrl: `/${metadata.documentationRepository}/`,
  trailingSlash: true,
  organizationName: metadata.owner,
  projectName: metadata.documentationRepository,
  onBrokenLinks: 'throw',
  markdown: { format: 'md', hooks: { onBrokenMarkdownLinks: 'throw' } },
  i18n: { defaultLocale: 'pt-BR', locales: ['pt-BR'] },
  presets: [['classic', { docs: { routeBasePath: '/', sidebarPath: './sidebars.js' }, blog: false }]],
  themeConfig: {
    navbar: { title: metadata.repository, items: [{ href: metadata.sourceUrl, label: 'Código-fonte', position: 'right' }] },
    footer: { style: 'dark', copyright: `Origem: ${metadata.sourceSha} · Gerado com ${metadata.model}` }
  }
};
