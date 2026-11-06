export default {
  title: 'BudgetGate',
  description: 'Fail a pull request when a Soroban contract function gets more expensive, using costs measured on a real network.',
  base: '/docs/',
  // head links are not prefixed with base, so the paths include /docs/.
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/docs/favicon.svg' }],
    ['link', { rel: 'icon', type: 'image/png', sizes: '64x64', href: '/docs/favicon.png' }]
  ],
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Core CLI', link: '/core/' },
      { text: 'GitHub Action', link: '/action/' },
      { text: 'Dashboard', link: '/dashboard/' }
    ],
    sidebar: {
      '/core/': [
        {
          text: 'Core CLI',
          items: [
            { text: 'Introduction', link: '/core/' },
            { text: 'API Reference', link: '/core/api-reference' },
            { text: 'In-Depth Documentation', link: '/core/documentation' }
          ]
        }
      ],
      '/action/': [
        {
          text: 'GitHub Action',
          items: [
            { text: 'Introduction', link: '/action/' },
            { text: 'Workflow Setup', link: '/action/setup' },
            { text: 'In-Depth Documentation', link: '/action/documentation' }
          ]
        }
      ],
      '/dashboard/': [
        {
          text: 'Dashboard',
          items: [
            { text: 'Introduction', link: '/dashboard/' },
            { text: 'Deployment', link: '/dashboard/deployment' },
            { text: 'In-Depth Documentation', link: '/dashboard/documentation' }
          ]
        }
      ]
    }
  }
}
