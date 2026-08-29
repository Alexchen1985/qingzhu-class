export default typeof defineAppConfig === 'function'
  ? defineAppConfig({
      pages: [
        'pages/index/index',
        'pages/notice/index',
        'pages/activity/index',
        'pages/finance/index',
        'pages/profile/index',
        'pages/duty/index'
      ],
      window: {
        backgroundTextStyle: 'light',
        navigationBarBackgroundColor: '#fff',
        navigationBarTitleText: '家委助手',
        navigationBarTextStyle: 'black'
      },
      tabBar: {
        color: '#9CA3AF',
        selectedColor: '#F97316',
        backgroundColor: '#ffffff',
        borderStyle: 'black',
        list: [
          {
            pagePath: 'pages/index/index',
            text: '首页',
            iconPath: './assets/tabbar/house.png',
            selectedIconPath: './assets/tabbar/house-active.png'
          },
          {
            pagePath: 'pages/notice/index',
            text: '公告',
            iconPath: './assets/tabbar/megaphone.png',
            selectedIconPath: './assets/tabbar/megaphone-active.png'
          },
          {
            pagePath: 'pages/activity/index',
            text: '活动',
            iconPath: './assets/tabbar/calendar.png',
            selectedIconPath: './assets/tabbar/calendar-active.png'
          },
          {
            pagePath: 'pages/finance/index',
            text: '班费',
            iconPath: './assets/tabbar/wallet.png',
            selectedIconPath: './assets/tabbar/wallet-active.png'
          },
          {
            pagePath: 'pages/profile/index',
            text: '我的',
            iconPath: './assets/tabbar/user.png',
            selectedIconPath: './assets/tabbar/user-active.png'
          }
        ]
      }
    })
  : {
      pages: [
        'pages/index/index',
        'pages/notice/index',
        'pages/activity/index',
        'pages/finance/index',
        'pages/profile/index',
        'pages/duty/index'
      ],
      window: {
        backgroundTextStyle: 'light',
        navigationBarBackgroundColor: '#fff',
        navigationBarTitleText: '家委助手',
        navigationBarTextStyle: 'black'
      },
      tabBar: {
        color: '#9CA3AF',
        selectedColor: '#F97316',
        backgroundColor: '#ffffff',
        borderStyle: 'black',
        list: [
          {
            pagePath: 'pages/index/index',
            text: '首页',
            iconPath: './assets/tabbar/house.png',
            selectedIconPath: './assets/tabbar/house-active.png'
          },
          {
            pagePath: 'pages/notice/index',
            text: '公告',
            iconPath: './assets/tabbar/megaphone.png',
            selectedIconPath: './assets/tabbar/megaphone-active.png'
          },
          {
            pagePath: 'pages/activity/index',
            text: '活动',
            iconPath: './assets/tabbar/calendar.png',
            selectedIconPath: './assets/tabbar/calendar-active.png'
          },
          {
            pagePath: 'pages/finance/index',
            text: '班费',
            iconPath: './assets/tabbar/wallet.png',
            selectedIconPath: './assets/tabbar/wallet-active.png'
          },
          {
            pagePath: 'pages/profile/index',
            text: '我的',
            iconPath: './assets/tabbar/user.png',
            selectedIconPath: './assets/tabbar/user-active.png'
          }
        ]
      }
    }
