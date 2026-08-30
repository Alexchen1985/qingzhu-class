import { useState, useCallback } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  User,
  School,
  ChevronRight,
  Copy,
  LogOut,
  Camera,
  Users,
  Shield,
  Phone,
  GraduationCap,
  Heart,
} from 'lucide-react-taro'
import { ROLE_LABELS } from '@/services/cloud-types'
import { updateAvatar } from '@/services/cloud'
import type { ClassRole, ClassMemberWithClass, CurrentClass } from '@/services/cloud-types'

const STORAGE_KEY_LOGIN = 'app_login_result'
const STORAGE_KEY_CURRENT_CLASS = 'app_current_class'

function getLoginData(): { openid: string; classes: ClassMemberWithClass[] } {
  try {
    const val = Taro.getStorageSync(STORAGE_KEY_LOGIN)
    return val || { openid: '', classes: [] }
  } catch {
    return { openid: '', classes: [] }
  }
}

function getCurrentClass(): CurrentClass | null {
  try {
    const val = Taro.getStorageSync(STORAGE_KEY_CURRENT_CLASS)
    return val || null
  } catch {
    return null
  }
}

const ProfilePage = () => {
  const [loginData, setLoginData] = useState<{ openid: string; classes: ClassMemberWithClass[] }>({ openid: '', classes: [] })
  const [currentClass, setCurrentClass] = useState<CurrentClass | null>(null)
  const [showSwitchDialog, setShowSwitchDialog] = useState(false)
  const [showCodesDialog, setShowCodesDialog] = useState(false)
  const [copiedField, setCopiedField] = useState('')
  const [uploading, setUploading] = useState(false)

  const loadData = useCallback(() => {
    const data = getLoginData()
    setLoginData(data)
    setCurrentClass(getCurrentClass())
  }, [])

  useDidShow(() => {
    loadData()
  })

  const roleLabel = currentClass ? ROLE_LABELS[currentClass.role as ClassRole] || '家长' : '未加入班级'

  const handleSwitchClass = (cls: ClassMemberWithClass) => {
    const cc: CurrentClass = {
      classId: cls.member.class_id,
      className: cls.className,
      role: cls.member.role,
      studentName: cls.member.student_name,
      parentName: cls.member.parent_name,
      phone: cls.member.phone,
      relation: cls.member.relation,
    }
    Taro.setStorageSync(STORAGE_KEY_CURRENT_CLASS, cc)
    setCurrentClass(cc)
    setShowSwitchDialog(false)
    Taro.showToast({ title: `已切换到 ${cls.className}`, icon: 'success' })
  }

  const copyCode = (code: string, label: string) => {
    Taro.setClipboardData({
      data: code,
      success: () => {
        setCopiedField(label)
        setTimeout(() => setCopiedField(''), 2000)
      },
    })
  }

  const handleChooseAvatar = async () => {
    if (!currentClass) return
    try {
      // 选择图片
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
      })
      const tempFilePath = res.tempFilePaths[0]
      setUploading(true)
      // 上传到云存储
      const uploadRes = await Taro.cloud.uploadFile({
        cloudPath: `avatars/${currentClass.classId}_${Date.now()}.jpg`,
        filePath: tempFilePath,
      })
      // 更新数据库
      await updateAvatar({
        class_id: currentClass.classId,
        avatar_url: uploadRes.fileID,
      })
      // 更新本地缓存
      const cc: CurrentClass = {
        ...currentClass,
        avatarUrl: uploadRes.fileID,
      }
      Taro.setStorageSync(STORAGE_KEY_CURRENT_CLASS, cc)
      setCurrentClass(cc)
      Taro.showToast({ title: '头像更新成功', icon: 'success' })
    } catch (err) {
      Taro.showToast({ title: (err as Error).message || '头像上传失败', icon: 'none' })
    } finally {
      setUploading(false)
    }
  }

  const handleGoOnboarding = () => {
    Taro.navigateTo({ url: '/pages/onboarding/index' })
  }

  const handleLogout = () => {
    Taro.showModal({
      title: '确认退出',
      content: '退出后需要重新登录',
      success: (res) => {
        if (res.confirm) {
          // 保留手机号缓存，清除其他登录信息
          const savedPhone = Taro.getStorageSync('app_login_phone')
          console.log('退出登录 - 保存的手机号:', savedPhone)
          Taro.clearStorageSync()
          if (savedPhone) {
            Taro.setStorageSync('app_login_phone', savedPhone)
            console.log('退出登录 - 已恢复手机号缓存')
          }
          Taro.navigateTo({ url: '/pages/login/index' })
        }
      },
    })
  }

  return (
    <View className="min-h-full bg-gray-50 pb-6">
      {/* 头部个人信息卡片 */}
      <View className="bg-white px-4 pt-8 pb-6">
        <View className="flex items-center gap-4">
          {/* 头像区域 - 可点击修改 */}
          <View className="relative" onClick={handleChooseAvatar}>
            {currentClass?.avatarUrl ? (
              <Image
                src={currentClass.avatarUrl}
                mode="aspectFill"
                className="w-20 h-20 rounded-full bg-gray-100 shadow-md"
              />
            ) : (
              <View className="w-20 h-20 rounded-full bg-gradient-to-br from-[#5EC4A0] to-[#7DD4B4] flex items-center justify-center shadow-md">
                <User size={40} color="#fff" />
              </View>
            )}
            {/* 相机图标 */}
            <View className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#5EC4A0] flex items-center justify-center shadow border-2 border-white">
              <Camera size={14} color="#fff" />
            </View>
            {uploading && (
              <View className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
                <Text className="text-white text-xs">上传中</Text>
              </View>
            )}
          </View>

          {/* 个人信息 */}
          <View className="flex-1">
            <Text className="block text-xl font-bold text-gray-800 mb-1">
              {currentClass?.parentName || '家长'}
            </Text>
            <View className="flex items-center gap-2 mb-1">
              <Badge className="bg-[#E0F5ED] text-[#5EC4A0] text-xs">
                {roleLabel}
              </Badge>
              {currentClass?.studentName && (
                <Text className="text-sm text-gray-500">
                  {currentClass.studentName}的{currentClass.relation || '家长'}
                </Text>
              )}
            </View>
            <Text className="text-xs text-gray-400">
              点击头像可修改
            </Text>
          </View>
        </View>
      </View>

      <View className="px-4 mt-4 space-y-3">
        {/* 个人信息 */}
        <Card className="shadow-sm border-0">
          <CardContent className="p-0">
            <View className="px-4 py-3 bg-gray-50">
              <Text className="text-sm font-semibold text-gray-700">个人信息</Text>
            </View>
            
            {/* 姓名 */}
            <View className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
              <View className="flex items-center gap-3">
                <User size={18} color="#9CA3AF" />
                <Text className="text-sm text-gray-500">姓名</Text>
              </View>
              <Text className="text-sm text-gray-800 font-medium">
                {currentClass?.parentName || '未设置'}
              </Text>
            </View>

            {/* 手机号 */}
            <View className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
              <View className="flex items-center gap-3">
                <Phone size={18} color="#9CA3AF" />
                <Text className="text-sm text-gray-500">手机号</Text>
              </View>
              <Text className="text-sm text-gray-800 font-medium">
                {currentClass?.phone || '未设置'}
              </Text>
            </View>

            {/* 学生姓名 */}
            {currentClass?.studentName && (
              <View className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
                <View className="flex items-center gap-3">
                  <GraduationCap size={18} color="#9CA3AF" />
                  <Text className="text-sm text-gray-500">学生姓名</Text>
                </View>
                <Text className="text-sm text-gray-800 font-medium">
                  {currentClass.studentName}
                </Text>
              </View>
            )}

            {/* 与学生关系 */}
            {currentClass?.relation && (
              <View className="px-4 py-3 flex items-center justify-between">
                <View className="flex items-center gap-3">
                  <Heart size={18} color="#9CA3AF" />
                  <Text className="text-sm text-gray-500">与学生关系</Text>
                </View>
                <Text className="text-sm text-gray-800 font-medium">
                  {currentClass.relation}
                </Text>
              </View>
            )}
          </CardContent>
        </Card>

        {/* 当前班级 */}
        <Card className="shadow-sm border-0">
          <CardContent className="p-0">
            <View className="px-4 py-3 bg-gray-50">
              <Text className="text-sm font-semibold text-gray-700">班级信息</Text>
            </View>
            
            <View className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
              <View className="flex items-center gap-3">
                <School size={18} color="#9CA3AF" />
                <Text className="text-sm text-gray-500">班级</Text>
              </View>
              <View className="flex items-center gap-2">
                <Text className="text-sm text-gray-800 font-medium">
                  {currentClass?.className || '未加入班级'}
                </Text>
                {loginData.classes.length > 1 && (
                  <ChevronRight size={16} color="#9CA3AF" />
                )}
              </View>
            </View>

            {loginData.classes.length > 1 && (
              <View
                className="px-4 py-3 flex items-center justify-between"
                onClick={() => setShowSwitchDialog(true)}
              >
                <View className="flex items-center gap-3">
                  <Users size={18} color="#9CA3AF" />
                  <Text className="text-sm text-gray-500">切换班级</Text>
                </View>
                <ChevronRight size={16} color="#9CA3AF" />
              </View>
            )}
          </CardContent>
        </Card>

        {/* 班级邀请码 */}
        {currentClass && (
          <Card className="shadow-sm border-0">
            <CardContent className="p-4">
              <View className="flex items-center justify-between mb-3">
                <View className="flex items-center gap-2">
                  <Shield size={16} color="#5EC4A0" />
                  <Text className="text-base font-semibold text-gray-800">
                    班级邀请码
                  </Text>
                </View>
              </View>
              <View className="space-y-2">
                <View className="flex items-center justify-between py-2">
                  <Text className="text-sm text-gray-500">家长邀请码</Text>
                  <View className="flex items-center gap-2">
                    <Text className="text-sm text-gray-800 font-mono">
                      {loginData.classes.find(c => c.member.class_id === currentClass.classId)?.inviteCode || '—'}
                    </Text>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyCode(
                        loginData.classes.find(c => c.member.class_id === currentClass.classId)?.inviteCode || '',
                        'parent'
                      )}
                    >
                      {copiedField === 'parent' ? (
                        <Text className="text-xs text-green-500">已复制</Text>
                      ) : (
                        <Copy size={14} color="#9CA3AF" />
                      )}
                    </Button>
                  </View>
                </View>
                <Separator />
                <View className="flex items-center justify-between py-2">
                  <Text className="text-sm text-gray-500">教师邀请码</Text>
                  <View className="flex items-center gap-2">
                    <Text className="text-sm text-gray-800 font-mono">
                      {loginData.classes.find(c => c.member.class_id === currentClass.classId)?.teacherInviteCode || '—'}
                    </Text>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyCode(
                        loginData.classes.find(c => c.member.class_id === currentClass.classId)?.teacherInviteCode || '',
                        'teacher'
                      )}
                    >
                      {copiedField === 'teacher' ? (
                        <Text className="text-xs text-green-500">已复制</Text>
                      ) : (
                        <Copy size={14} color="#9CA3AF" />
                      )}
                    </Button>
                  </View>
                </View>
              </View>
            </CardContent>
          </Card>
        )}

        {/* 功能菜单 */}
        <Card className="shadow-sm border-0">
          <CardContent className="p-0">
            {currentClass?.role === 'admin' || currentClass?.role === 'head_teacher' || currentClass?.role === 'committee' ? (
              <View
                className="px-4 py-3 flex items-center justify-between border-b border-gray-100"
                onClick={() => Taro.navigateTo({ url: '/pages/roster/index' })}
              >
                <View className="flex items-center gap-3">
                  <Users size={18} color="#9CA3AF" />
                  <Text className="text-sm text-gray-700">家长名单管理</Text>
                </View>
                <ChevronRight size={16} color="#9CA3AF" />
              </View>
            ) : null}

            <View
              className="px-4 py-3 flex items-center justify-between"
              onClick={handleLogout}
            >
              <View className="flex items-center gap-3">
                <LogOut size={18} color="#EF4444" />
                <Text className="text-sm text-red-500">退出登录</Text>
              </View>
              <ChevronRight size={16} color="#9CA3AF" />
            </View>
          </CardContent>
        </Card>

        {/* 加入班级按钮 */}
        {!currentClass && (
          <Button
            className="w-full bg-[#5EC4A0] text-white"
            onClick={handleGoOnboarding}
          >
            <Text>加入班级</Text>
          </Button>
        )}
      </View>

      {/* 切换班级弹窗 */}
      <Dialog open={showSwitchDialog} onOpenChange={setShowSwitchDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>切换班级</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-64">
            <View className="space-y-2 p-1">
              {loginData.classes.map((cls) => (
                <View
                  key={cls.member.class_id}
                  className={`p-3 rounded-lg border cursor-pointer ${
                    currentClass?.classId === cls.member.class_id
                      ? 'border-[#5EC4A0] bg-[#E0F5ED]'
                      : 'border-gray-200'
                  }`}
                  onClick={() => handleSwitchClass(cls)}
                >
                  <View className="flex items-center justify-between">
                    <Text className="text-sm font-medium text-gray-800">
                      {cls.className}
                    </Text>
                    {currentClass?.classId === cls.member.class_id && (
                      <Badge className="bg-[#5EC4A0] text-white text-xs">
                        当前
                      </Badge>
                    )}
                  </View>
                  <Text className="text-xs text-gray-500 mt-1">
                    {ROLE_LABELS[cls.member.role as ClassRole] || '家长'}
                    {cls.member.student_name ? ` · ${cls.member.student_name}的家长` : ''}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </View>
  )
}

export default ProfilePage
