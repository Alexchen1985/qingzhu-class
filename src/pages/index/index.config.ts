export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '家委助手' })
  : { navigationBarTitleText: '家委助手' }
