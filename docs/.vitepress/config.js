export default {
  title: 'BudgetGate',
  description: 'Soroban Resource Budget Guard',
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
            { text: 'API Reference', link: '/core/api-reference' }
          ]
        }
      ],
      '/action/': [
        {
          text: 'GitHub Action',
          items: [
            { text: 'Introduction', link: '/action/' },
            { text: 'Workflow Setup', link: '/action/setup' }
          ]
        }
      ],
      '/dashboard/': [
        {
          text: 'Dashboard',
          items: [
            { text: 'Introduction', link: '/dashboard/' },
            { text: 'Deployment', link: '/dashboard/deployment' }
          ]
        }
      ]
    }
  }
}
