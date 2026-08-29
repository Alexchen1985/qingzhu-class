import { useEffect } from 'react'
import Taro from '@tarojs/taro'
import { View, Text, Image } from '@tarojs/components'

function Splash() {
  useEffect(() => {
    const timer = setTimeout(() => {
      // 检查是否已登录（有缓存的班级信息）
      const currentClassId = Taro.getStorageSync('current_class_id')
      if (currentClassId) {
        Taro.switchTab({ url: '/pages/index/index' })
      } else {
        Taro.redirectTo({ url: '/pages/onboarding/index' })
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <View className="flex flex-col items-center justify-center min-h-full bg-gradient-to-b from-[#5EC4A0] to-[#4AA886]">
      {/* Logo */}
      <View className="w-32 h-32 rounded-full bg-white p-2 shadow-lg mb-6">
        <Image
          src="/assets/logo.png"
          mode="aspectFit"
          className="w-full h-full rounded-full"
        />
      </View>

      {/* 品牌名 */}
      <Text className="block text-2xl font-bold text-white mb-2">
        信息公开平台
      </Text>
      <Text className="block text-base text-white opacity-80">
        青竹班
      </Text>

      {/* 底部标语 */}
      <View className="absolute bottom-16">
        <Text className="block text-xs text-white opacity-60 text-center">
          南京南站小学 · 家校信息公示
        </Text>
      </View>
    </View>
  )
}

export default Splash
