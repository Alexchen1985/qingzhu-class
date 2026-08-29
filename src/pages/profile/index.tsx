import { useState, useCallback } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  User,
  Shield,
  School,
  ChevronRight,
  Megaphone,
  CalendarDays,
  Calendar,
  Copy,
  Check,
  LogOut,
  Users,
  Camera,
  Pencil,
} from 'lucide-react-taro'
import { ROLE_LABELS } from '@/services/cloud-types'
import { updateProfile, updateAvatar } from '@/services/cloud'
import type { ClassRole, ClassMemberWithClass, CurrentClass } from '@/services/cloud-types'

const STORAGE_KEY_LOGIN = 'app_login_result'
const STORAGE_KEY_CURRENT_CLASS = 'app_current_class'

function getRoleBadgeClass(role: string): string {
  switch (role) {
    case 'admin':
    case 'head_teacher':
      return 'bg-red-100 text-red-600 text-xs'
    case 'teacher':
      return 'bg-yellow-100 text-yellow-600 text-xs'
    case 'committee':
      return 'bg-blue-100 text-blue-600 text-xs'
    default:
      return 'bg-gray-100 text-gray-600 text-xs'
  }
}

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
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [copiedField, setCopiedField] = useState('')
  const [uploading, setUploading] = useState(false)

  // 编辑表单
  const [editParentName, setEditParentName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editStudentName, setEditStudentName] = useState('')
  const [editRelation, setEditRelation] = useState('')
  const [saving, setSaving] = useState(false)

  const loadData = useCallback(() => {
    const data = getLoginData()
    setLoginData(data)
    setCurrentClass(getCurrentClass())
  }, [])

  useDidShow(() => {
    loadData()
  })

  const roleLabel = currentClass ? ROLE_LABELS[currentClass.role as ClassRole] || '家长' : '未加入班级'

  const isHeadTeacher = currentClass?.role === 'admin' || currentClass?.role === 'head_teacher'
  const isCommittee = currentClass?.role === 'committee'

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

  const handleOpenEdit = () => {
    if (!currentClass) return
    setEditParentName(currentClass.parentName || '')
    setEditPhone(currentClass.phone || '')
    setEditStudentName(currentClass.studentName || '')
    setEditRelation(currentClass.relation || '')
    setShowEditDialog(true)
  }

  const handleSaveProfile = async () => {
    if (!currentClass) return
    if (!editParentName.trim() || !editPhone.trim()) {
      Taro.showToast({ title: '姓名和手机号为必填项', icon: 'none' })
      return
    }
    setSaving(true)
    try {
      await updateProfile({
        class_id: currentClass.classId,
        parent_name: editParentName.trim(),
        phone: editPhone.trim(),
        student_name: editStudentName.trim(),
        relation: editRelation.trim(),
      })
      // 更新本地缓存
      const cc: CurrentClass = {
        ...currentClass,
        parentName: editParentName.trim(),
        phone: editPhone.trim(),
        studentName: editStudentName.trim(),
        relation: editRelation.trim(),
      }
      Taro.setStorageSync(STORAGE_KEY_CURRENT_CLASS, cc)
      setCurrentClass(cc)
      // 更新登录缓存
      const data = getLoginData()
      data.classes = data.classes.map((c) => {
        if (c.member.class_id === currentClass.classId) {
          return {
            ...c,
            member: {
              ...c.member,
              parent_name: editParentName.trim(),
              phone: editPhone.trim(),
              student_name: editStudentName.trim(),
              relation: editRelation.trim(),
            },
          }
        }
        return c
      })
      Taro.setStorageSync(STORAGE_KEY_LOGIN, data)
      setLoginData(data)
      setShowEditDialog(false)
      Taro.showToast({ title: '保存成功', icon: 'success' })
    } catch (err) {
      Taro.showToast({ title: (err as Error).message || '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
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

  return (
    <View className="min-h-full bg-[#F0F8F4] pb-6">
      {/* 头部 */}
      <View className="bg-gradient-to-r from-[#5EC4A0] to-[#7DD4B4] px-4 pt-8 pb-10">
        {/* 班级 Logo */}
        <View className="flex justify-center mb-4">
          <Image
            src="/assets/logo.png"
            mode="aspectFit"
            className="w-24 h-24 rounded-full bg-white p-1 shadow-lg"
          />
        </View>
        <View className="flex items-center gap-3">
          {/* 头像区域 */}
          <View className="relative" onClick={handleChooseAvatar}>
            {currentClass?.avatarUrl ? (
              <Image
                src={currentClass.avatarUrl}
                mode="aspectFill"
                className="w-16 h-16 rounded-full bg-[#A0E4CC] shadow-lg"
              />
            ) : (
              <View className="w-16 h-16 rounded-full bg-[#A0E4CC] flex items-center justify-center shadow-lg">
                <User size={32} color="#fff" />
              </View>
            )}
            <View className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow">
              <Camera size={12} color="#5EC4A0" />
            </View>
          </View>
          <View className="flex-1">
            <View className="flex items-center gap-2">
              <Text className="block text-lg font-bold text-white">
                {currentClass?.parentName || '家长'}
              </Text>
              <View onClick={handleOpenEdit}>
                <Pencil size={14} color="#fff" />
              </View>
            </View>
            <Text className="block text-sm text-[#E0F5ED]">
              {currentClass?.studentName ? `${currentClass.studentName} 的家长` : '未设置学生信息'}
            </Text>
            <Badge className="mt-1 bg-[#A0E4CC] text-white text-xs">
              {roleLabel}
            </Badge>
          </View>
        </View>
      </View>

      <View className="px-4 -mt-5 space-y-3">
        {/* 当前班级 */}
        <Card className="shadow-sm border-0">
          <CardContent className="p-4">
            <View className="flex items-center justify-between mb-3">
              <View className="flex items-center gap-2">
                <School size={16} color="#5EC4A0" />
                <Text className="text-base font-semibold text-gray-800">
                  当前班级
                </Text>
              </View>
              {loginData.classes.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => setShowSwitchDialog(true)}>
                  <Text className="text-xs text-[#5EC4A0]">切换班级</Text>
                  <ChevronRight size={14} color="#5EC4A0" />
                </Button>
              )}
            </View>
            {currentClass ? (
              <View className="space-y-2">
                <View className="flex items-center justify-between py-1">
                  <Text className="text-sm text-gray-500">班级</Text>
                  <Text className="text-sm text-gray-800 font-medium">{currentClass.className}</Text>
                </View>
                <Separator />
                <View className="flex items-center justify-between py-1">
                  <Text className="text-sm text-gray-500">我的角色</Text>
                  <Badge className={getRoleBadgeClass(currentClass.role)}>
                    {roleLabel}
                  </Badge>
                </View>
                {currentClass.studentName && (
                  <>
                    <Separator />
                    <View className="flex items-center justify-between py-1">
                      <Text className="text-sm text-gray-500">学生姓名</Text>
                      <Text className="text-sm text-gray-800">{currentClass.studentName}</Text>
                    </View>
                  </>
                )}
                {currentClass.phone && (
                  <>
                    <Separator />
                    <View className="flex items-center justify-between py-1">
                      <Text className="text-sm text-gray-500">联系方式</Text>
                      <Text className="text-sm text-gray-800">{currentClass.phone}</Text>
                    </View>
                  </>
                )}
              </View>
            ) : (
              <View className="py-4">
                <Text className="text-sm text-gray-400 text-center block">暂未加入班级</Text>
                <Button className="w-full mt-3 bg-[#5EC4A0] text-white" onClick={handleGoOnboarding}>
                  创建/加入班级
                </Button>
              </View>
            )}
          </CardContent>
        </Card>

        {/* 邀请码入口（仅班主任可见） */}
        {isHeadTeacher && (
          <Card className="shadow-sm border-0">
            <CardContent className="p-4">
              <View
                className="flex items-center justify-between"
                onClick={() => setShowCodesDialog(true)}
              >
                <View className="flex items-center gap-2">
                  <Shield size={16} color="#5EC4A0" />
                  <View>
                    <Text className="text-sm font-medium text-gray-800 block">
                      班级邀请码
                    </Text>
                    <Text className="text-xs text-gray-400">
                      查看并分享邀请码给家长和老师
                    </Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#9CA3AF" />
              </View>
            </CardContent>
          </Card>
        )}

        {/* 名单管理入口（班主任/家委可见） */}
        {(isHeadTeacher || isCommittee) && (
          <Card className="shadow-sm border-0">
            <CardContent className="p-4">
              <View
                className="flex items-center justify-between"
                onClick={() => Taro.navigateTo({ url: '/pages/roster/index' })}
              >
                <View className="flex items-center gap-2">
                  <Users size={16} color="#5EC4A0" />
                  <View>
                    <Text className="text-sm font-medium text-gray-800 block">
                      家长名单管理
                    </Text>
                    <Text className="text-xs text-gray-400">
                      导入/管理班级家长清单
                    </Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#9CA3AF" />
              </View>
            </CardContent>
          </Card>
        )}

        {/* 快捷入口 */}
        <Card className="shadow-sm border-0">
          <CardContent className="p-4">
            <Text className="text-base font-semibold text-gray-800 block mb-3">
              常用功能
            </Text>
            <View className="space-y-0">
              <View
                className="flex items-center gap-3 py-3"
                onClick={() => Taro.switchTab({ url: '/pages/notice/index' })}
              >
                <View className="w-9 h-9 rounded-xl bg-[#F0F8F4] flex items-center justify-center">
                  <Megaphone size={16} color="#5EC4A0" />
                </View>
                <Text className="text-sm text-gray-700 flex-1">班级公告</Text>
                <ChevronRight size={16} color="#9CA3AF" />
              </View>
              <Separator />
              <View
                className="flex items-center gap-3 py-3"
                onClick={() => Taro.switchTab({ url: '/pages/activity/index' })}
              >
                <View className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Calendar size={16} color="#8B5CF6" />
                </View>
                <Text className="text-sm text-gray-700 flex-1">活动报名</Text>
                <ChevronRight size={16} color="#9CA3AF" />
              </View>
              <Separator />
              <View
                className="flex items-center gap-3 py-3"
                onClick={() => Taro.navigateTo({ url: '/pages/duty/index' })}
              >
                <View className="w-9 h-9 rounded-xl bg-[#F0F8F4] flex items-center justify-center">
                  <CalendarDays size={16} color="#5EC4A0" />
                </View>
                <Text className="text-sm text-gray-700 flex-1">值日排班</Text>
                <ChevronRight size={16} color="#9CA3AF" />
              </View>
              <Separator />
              <View
                className="flex items-center gap-3 py-3"
                onClick={handleGoOnboarding}
              >
                <View className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  <LogOut size={16} color="#3B82F6" />
                </View>
                <Text className="text-sm text-gray-700 flex-1">创建/加入班级</Text>
                <ChevronRight size={16} color="#9CA3AF" />
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 切换班级弹窗 */}
      <Dialog open={showSwitchDialog} onOpenChange={setShowSwitchDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>切换班级</DialogTitle>
            <DialogDescription>选择要查看的班级</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-80">
            <View className="space-y-2 p-1">
              {loginData.classes.map((cls) => {
                const isCurrent = cls.member.class_id === currentClass?.classId
                return (
                  <View
                    key={cls.member._id || cls.member.class_id}
                    className={`p-3 rounded-xl flex items-center justify-between ${
                      isCurrent ? 'bg-[#F0F8F4] border border-[#B8E8D4]' : 'bg-gray-50'
                    }`}
                    onClick={() => !isCurrent && handleSwitchClass(cls)}
                  >
                    <View>
                      <Text className="block text-sm font-medium text-gray-800">
                        {cls.className}
                      </Text>
                      <Text className="block text-xs text-gray-400 mt-1">
                        {cls.schoolName} · {ROLE_LABELS[cls.member.role as ClassRole] || '家长'}
                      </Text>
                    </View>
                    {isCurrent ? (
                      <Badge className="bg-[#E0F5ED] text-[#4DB892] text-xs">当前</Badge>
                    ) : (
                      <Text className="text-xs text-[#5EC4A0]">切换</Text>
                    )}
                  </View>
                )
              })}
            </View>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* 邀请码弹窗 */}
      <Dialog open={showCodesDialog} onOpenChange={setShowCodesDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>班级邀请码</DialogTitle>
            <DialogDescription>将对应邀请码分享给相应角色</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-80">
            <View className="space-y-3 p-1">
              {loginData.classes
                .filter((c) => c.member.class_id === currentClass?.classId)
                .map((cls) => {
                  // 从登录缓存中获取班级详情（邀请码在 classInfo 中）
                  // 由于 mock 数据限制，这里展示 class_id 作为参考
                  return (
                    <View key={cls.member.class_id} className="space-y-3">
                      <Text className="block text-sm font-medium text-gray-700">
                        {cls.className}
                      </Text>
                      <View className="p-3 bg-[#F0F8F4] rounded-xl flex items-center justify-between">
                        <View>
                          <Text className="block text-sm text-gray-700">家长邀请码</Text>
                          <Text className="block text-xs text-gray-400 mt-1">发给家长群</Text>
                        </View>
                        <Button variant="ghost" size="sm" onClick={() => copyCode(cls.member.class_id, 'parent')}>
                          {copiedField === 'parent' ? <Check size={14} color="#10B981" /> : <Copy size={14} color="#6B7280" />}
                          <Text className="ml-1 text-xs text-gray-500">{copiedField === 'parent' ? '已复制' : '复制'}</Text>
                        </Button>
                      </View>
                    </View>
                  )
                })}
              <Text className="block text-xs text-gray-400 text-center mt-2">
                提示：完整邀请码请在微信开发者工具中查看云数据库
              </Text>
            </View>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* 编辑个人信息弹窗 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑个人信息</DialogTitle>
            <DialogDescription>姓名和手机号为必填项</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            <View className="space-y-4 p-1">
              <View>
                <Label className="text-sm text-gray-700 mb-1 block">姓名 *</Label>
                <View className="bg-gray-50 rounded-xl px-3 py-2">
                  <Input
                    className="w-full bg-transparent"
                    placeholder="请输入家长/教师姓名"
                    value={editParentName}
                    onInput={(e) => setEditParentName(e.detail.value)}
                  />
                </View>
              </View>
              <View>
                <Label className="text-sm text-gray-700 mb-1 block">手机号 *</Label>
                <View className="bg-gray-50 rounded-xl px-3 py-2">
                  <Input
                    className="w-full bg-transparent"
                    placeholder="请输入手机号"
                    type="number"
                    value={editPhone}
                    onInput={(e) => setEditPhone(e.detail.value)}
                    maxlength={11}
                  />
                </View>
              </View>
              <View>
                <Label className="text-sm text-gray-700 mb-1 block">学生姓名</Label>
                <View className="bg-gray-50 rounded-xl px-3 py-2">
                  <Input
                    className="w-full bg-transparent"
                    placeholder="请输入学生姓名（教师可不填）"
                    value={editStudentName}
                    onInput={(e) => setEditStudentName(e.detail.value)}
                  />
                </View>
              </View>
              <View>
                <Label className="text-sm text-gray-700 mb-1 block">与学生关系</Label>
                <View className="bg-gray-50 rounded-xl px-3 py-2">
                  <Input
                    className="w-full bg-transparent"
                    placeholder="如：父亲、母亲、祖父（教师可不填）"
                    value={editRelation}
                    onInput={(e) => setEditRelation(e.detail.value)}
                  />
                </View>
              </View>
              <View className="flex gap-3 pt-2">
                <Button
                  className="flex-1 bg-gray-200 text-gray-700"
                  onClick={() => setShowEditDialog(false)}
                >
                  取消
                </Button>
                <Button
                  className="flex-1 bg-[#5EC4A0] text-white"
                  onClick={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? '保存中...' : '保存'}
                </Button>
              </View>
            </View>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </View>
  )
}

export default ProfilePage
