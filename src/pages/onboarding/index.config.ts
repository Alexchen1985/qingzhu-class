export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '加入班级' })
  : { navigationBarTitleText: '加入班级' }
