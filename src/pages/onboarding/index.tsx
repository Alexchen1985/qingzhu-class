import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GraduationCap } from 'lucide-react-taro'
import { classJoin } from '@/services/cloud'
import { setUserRole, setCurrentClassId } from '@/store'
import type { CurrentClass } from '@/services/cloud-types'

const STORAGE_KEY_LOGIN = 'app_login_result'
const STORAGE_KEY_CURRENT_CLASS = 'app_current_class'

const OnboardingPage = () => {
  // 加入班级表单
  const [inviteCode, setInviteCode] = useState('')
  const [phone, setPhone] = useState('')
  const [joining, setJoining] = useState(false)

  const handleJoin = async () => {
    if (!inviteCode.trim() || !phone.trim() || phone.length !== 11) {
      Taro.showToast({ title: '请输入邀请码和正确的手机号', icon: 'none' })
      return
    }
    setJoining(true)
    try {
      const result = await classJoin({
        invite_code: inviteCode.trim(),
        phone: phone.trim(),
      })

      // 设置当前班级
      const cc: CurrentClass = {
        classId: result.member.class_id,
        className: result.className,
        role: result.member.role,
        studentName: result.member.student_name,
        parentName: result.member.parent_name,
        phone: result.member.phone,
        relation: result.member.relation,
      }
      Taro.setStorageSync(STORAGE_KEY_CURRENT_CLASS, cc)
      setCurrentClassId(result.member.class_id)
      setUserRole(result.member.role)

      // 更新登录缓存
      const loginData = Taro.getStorageSync(STORAGE_KEY_LOGIN) || { openid: '', classes: [] }
      loginData.classes.push({
        member: result.member,
        className: result.className,
        schoolName: result.schoolName,
      })
      Taro.setStorageSync(STORAGE_KEY_LOGIN, loginData)

      Taro.showToast({ title: '加入成功', icon: 'success' })
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/index/index' })
      }, 1500)
    } catch (err) {
      const errMsg = (err as Error).message || '加入失败'
      // 如果已经加入过班级，直接跳转到首页
      if (errMsg.includes('已加入')) {
        Taro.showToast({ title: '您已加入该班级', icon: 'none' })
        setTimeout(() => {
          Taro.switchTab({ url: '/pages/index/index' })
        }, 1500)
      } else {
        Taro.showToast({ title: errMsg, icon: 'none' })
      }
    } finally {
      setJoining(false)
    }
  }

  return (
    <View className="min-h-full bg-[#F0F8F4] px-4 pt-8">
      <View className="flex flex-col items-center mb-6">
        <View className="w-20 h-20 rounded-full bg-[#E0F5ED] flex items-center justify-center mb-4">
          <GraduationCap size={40} color="#5EC4A0" />
        </View>
        <Text className="block text-xl font-bold text-gray-800">欢迎使用班级信息公开平台</Text>
        <Text className="block text-sm text-gray-500 mt-1">输入邀请码和手机号加入班级</Text>
      </View>

      <Card className="shadow-sm border-0">
        <CardContent className="p-6">
          <View className="space-y-4">
            <View>
              <Text className="block text-sm font-medium text-gray-700 mb-2">邀请码 *</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent"
                  placeholder="请输入 6 位邀请码"
                  value={inviteCode}
                  onInput={(e) => setInviteCode(e.detail.value)}
                  maxlength={6}
                />
              </View>
            </View>

            <View>
              <Text className="block text-sm font-medium text-gray-700 mb-2">手机号 *</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent"
                  type="number"
                  placeholder="请输入 11 位手机号"
                  value={phone}
                  onInput={(e) => setPhone(e.detail.value)}
                  maxlength={11}
                />
              </View>
            </View>

            <Button
              className="w-full bg-[#5EC4A0] text-white py-4"
              disabled={joining}
              onClick={handleJoin}
            >
              <GraduationCap size={18} color="#fff" />
              <Text className="ml-2 text-base">加入班级</Text>
            </Button>
          </View>
        </CardContent>
      </Card>

      <View className="mt-6 text-center">
        <Text className="text-xs text-gray-400">
          邀请码由班级管理员提供
        </Text>
      </View>
    </View>
  )
}

export default OnboardingPage
