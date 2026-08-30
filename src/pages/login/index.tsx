import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GraduationCap, Phone } from 'lucide-react-taro'
import { login } from '@/services/cloud'
import { setUserRole, setCurrentClassId, setCurrentStudentName, updateProfile, getCurrentClassId } from '@/store'
import type { LoginResult, CurrentClass } from '@/services/cloud-types'

const STORAGE_KEY_LOGIN = 'app_login_result'
const STORAGE_KEY_CURRENT_CLASS = 'app_current_class'
const STORAGE_KEY_PHONE = 'app_login_phone'

const LoginPage = () => {
  // 初始化时读取缓存的手机号
  const [phone, setPhone] = useState(() => {
    return Taro.getStorageSync(STORAGE_KEY_PHONE) || ''
  })
  const [loading, setLoading] = useState(false)

  // 页面加载时检查是否已登录
  useDidShow(() => {
    // 如果已登录，直接跳转到首页
    const classId = getCurrentClassId()
    if (classId) {
      Taro.switchTab({ url: '/pages/index/index' })
    }
  })

  const handleLogin = async () => {
    if (!phone.trim() || phone.length !== 11) {
      Taro.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }

    setLoading(true)
    try {
      const result: LoginResult = await login({ phone: phone.trim() })

      // 保存到本地缓存
      Taro.setStorageSync(STORAGE_KEY_LOGIN, result)
      // 记住手机号
      Taro.setStorageSync(STORAGE_KEY_PHONE, phone.trim())

      if (result.classes.length > 0) {
        const first = result.classes[0]
        console.log('登录成功，班级信息:', first)
        const cc: CurrentClass = {
          classId: first.member.class_id,
          className: first.className,
          role: first.member.role,
          studentName: first.member.student_name,
          parentName: first.member.parent_name,
          phone: first.member.phone,
          relation: first.member.relation,
        }
        Taro.setStorageSync(STORAGE_KEY_CURRENT_CLASS, cc)
        setCurrentClassId(first.member.class_id)
        setUserRole(first.member.role)
        setCurrentStudentName(first.member.student_name)
        // 更新用户资料
        updateProfile({
          studentName: first.member.student_name,
          parentName: first.member.parent_name,
          contact: first.member.phone,
          role: first.member.role as any,
        })
        console.log('已保存班级信息到缓存:', cc)
      } else {
        // 没有班级信息，提示用户先加入班级
        Taro.showToast({ title: '该手机号未加入任何班级', icon: 'none', duration: 3000 })
        return
      }

      Taro.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/index/index' })
      }, 1500)
    } catch (err) {
      Taro.showToast({ title: (err as Error).message || '登录失败', icon: 'none', duration: 3000 })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="min-h-full bg-[#F0F8F4] px-4 pt-16">
      {/* Logo 区域 */}
      <View className="flex flex-col items-center mb-8">
        <View className="w-20 h-20 rounded-full bg-[#E0F5ED] flex items-center justify-center mb-4">
          <GraduationCap size={40} color="#5EC4A0" />
        </View>
        <Text className="block text-2xl font-bold text-gray-800">班级信息公开平台</Text>
        <Text className="block text-sm text-gray-500 mt-2">南京市南站小学 · 青竹班</Text>
      </View>

      {/* 登录表单 */}
      <Card className="shadow-sm border-0">
        <CardContent className="p-6">
          <Text className="block text-lg font-semibold text-gray-800 mb-6">手机号登录</Text>

          <View className="space-y-4">
            <View>
              <Label className="text-sm text-gray-700 mb-1 block">手机号 *</Label>
              <View className="bg-gray-50 rounded-xl px-3 py-2">
                <Input
                  className="w-full bg-transparent"
                  placeholder="请输入 11 位手机号"
                  type="number"
                  value={phone}
                  onInput={(e) => setPhone(e.detail.value)}
                  maxlength={11}
                />
              </View>
            </View>

            <Button
              className="w-full bg-[#5EC4A0] text-white mt-6"
              onClick={handleLogin}
              disabled={loading}
            >
              <Phone size={16} color="#fff" />
              <Text className="ml-2 text-sm">{loading ? '登录中...' : '登录'}</Text>
            </Button>
          </View>

          <View className="mt-6 p-3 bg-[#F0F8F4] rounded-xl">
            <Text className="block text-xs text-gray-600">
              <Text className="font-semibold">温馨提示：</Text>
              首次使用请先创建或加入班级。登录时需要输入您在班级中登记的手机号。
            </Text>
          </View>
        </CardContent>
      </Card>
    </View>
  )
}

export default LoginPage
