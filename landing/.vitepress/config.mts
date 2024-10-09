import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Torpedo",
  description: "Сделайте работу с Task Manager снова приятной с помощью нового клиента Kaiten с привычным, интуитивно понятным интерфейсом.",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: {
      light: "/logo.svg",
      dark: "/logo.svg",
    },
    lastUpdated: {
      text: "Обновлено",
    },
    outline: {
      label: "На этой странице",
    },
    docFooter: {
      prev: "Предыдущая страница",
      next: "Следующая страница",
    },
    darkModeSwitchLabel: "Тема",
    lightModeSwitchTitle: "Переключиться на светлую тему",
    darkModeSwitchTitle: "Переключиться на тёмную тему",
    sidebarMenuLabel: "Меню",
    returnToTopLabel: "Наверх",
    nav: [
      { text: 'О проекте', link: '/' },
      { text: 'Поддержать', link: '/support' },
    ],

    sidebar: [
      {
        text: 'Документация',
        items: [
          { text: 'Зачем?', link: '/reasons' },
          { text: 'Для кого?', link: '/audience' },
          { text: 'Настройка и использование', link: '/usage' },
          { text: 'Поддержать', link: '/support' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/mlivirov/kaiten-desktop' }
    ],

    footer: {
      message: "Опубликовано под лицензией \"GNU Lesser General Public License (LGPL)\"",
    },
  },
  head: [
    [
      'script',
      {},
      '   (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};\n' +
      '   m[i].l=1*new Date();\n' +
      '   for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}\n' +
      '   k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})\n' +
      '   (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");\n' +
      '\n' +
      '   ym(98594445, "init", {\n' +
      '        clickmap:true,\n' +
      '        trackLinks:true,\n' +
      '        accurateTrackBounce:true,\n' +
      '        webvisor:true\n' +
      '   });\n'
    ]
  ]
})
