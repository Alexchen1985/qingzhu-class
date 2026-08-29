export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '班级信息公开平台' })
  : { navigationBarTitleText: '班级信息公开平台' }
