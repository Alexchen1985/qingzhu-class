export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '值日排班' })
  : { navigationBarTitleText: '值日排班' }
