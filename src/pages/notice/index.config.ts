export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '班级公告' })
  : { navigationBarTitleText: '班级公告' }
