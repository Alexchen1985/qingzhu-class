export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '班费管理' })
  : { navigationBarTitleText: '班费管理' }
