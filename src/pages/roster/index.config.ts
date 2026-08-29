export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '家长名单管理' })
  : { navigationBarTitleText: '家长名单管理' }
