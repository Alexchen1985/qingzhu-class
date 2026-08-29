export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '活动报名' })
  : { navigationBarTitleText: '活动报名' }
