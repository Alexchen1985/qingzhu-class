import { useState, useCallback } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  User,
  Shield,
  Calendar,
  Eye,
  Settings,
  ChevronRight,
  Megaphone,
  CalendarDays,
} from 'lucide-react-taro'
import {
  initStorage,
  getProfile,
  updateProfile,
  getNotices,
  getActivities,
} from '@/store'
import type { UserProfile, Notice, Activity } from '@/store/types'

const ProfilePage = () => {
  const [profile, setProfile] = useState<UserProfile>({
    studentName: '',
    parentName: '',
    contact: '',
    role: 'parent',
  })
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showMyNotices, setShowMyNotices] = useState(false)
  const [showMyActivities, setShowMyActivities] = useState(false)
  const [myNotices, setMyNotices] = useState<Notice[]>([])
  const [myActivities, setMyActivities] = useState<
    { activity: Activity; studentName: string }[]
  >([])

  // 编辑表单
  const [editStudent, setEditStudent] = useState('')
  const [editParent, setEditParent] = useState('')
  const [editContact, setEditContact] = useState('')

  const loadData = useCallback(() => {
    initStorage()
    const p = getProfile()
    setProfile(p)
    setEditStudent(p.studentName)
    setEditParent(p.parentName)
    setEditContact(p.contact)
  }, [])

  useDidShow(() => {
    loadData()
  })

  const handleSaveProfile = () => {
    updateProfile({
      studentName: editStudent.trim(),
      parentName: editParent.trim(),
      contact: editContact.trim(),
    })
    loadData()
    setShowEditDialog(false)
    Taro.showToast({ title: '保存成功', icon: 'success' })
  }

  const handleToggleRole = (checked: boolean) => {
    updateProfile({ role: checked ? 'committee' : 'parent' })
    loadData()
    Taro.showToast({
      title: checked ? '已切换为家委' : '已切换为家长',
      icon: 'success',
    })
  }

  const viewMyNotices = () => {
    const notices = getNotices().filter(
      (n) => n.needConfirm && n.readBy.includes('current')
    )
    setMyNotices(notices)
    setShowMyNotices(true)
  }

  const viewMyActivities = () => {
    const allActivities = getActivities()
    const myRegs = allActivities
      .filter((a) =>
        a.registrations.some((r) => r.studentName === profile.studentName)
      )
      .map((a) => {
        const reg = a.registrations.find(
          (r) => r.studentName === profile.studentName
        )!
        return { activity: a, studentName: reg.studentName }
      })
    setMyActivities(myRegs)
    setShowMyActivities(true)
  }

  return (
    <View className="min-h-full bg-orange-50 pb-6">
      {/* 头部 */}
      <View className="bg-gradient-to-r from-orange-500 to-orange-400 px-4 pt-8 pb-10">
        <View className="flex items-center gap-3">
          <View className="w-16 h-16 rounded-full bg-orange-300 flex items-center justify-center">
            <User size={32} color="#fff" />
          </View>
          <View>
            <Text className="block text-lg font-bold text-white">
              {profile.parentName || '家长'}
            </Text>
            <Text className="block text-sm text-orange-100">
              {profile.studentName ? `${profile.studentName} 的家长` : '未设置学生信息'}
            </Text>
            <Badge className="mt-1 bg-orange-300 text-white text-xs">
              {profile.role === 'committee' ? '家委' : '家长'}
            </Badge>
          </View>
        </View>
      </View>

      <View className="px-4 -mt-5 space-y-3">
        {/* 个人信息卡片 */}
        <Card className="shadow-sm border-0">
          <CardContent className="p-4">
            <View className="flex items-center justify-between mb-3">
              <View className="flex items-center gap-2">
                <User size={16} color="#F97316" />
                <Text className="text-base font-semibold text-gray-800">
                  个人信息
                </Text>
              </View>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditDialog(true)}
              >
                <Settings size={14} color="#6B7280" />
                <Text className="ml-1 text-xs text-gray-500">编辑</Text>
              </Button>
            </View>
            <View className="space-y-2">
              <View className="flex items-center justify-between py-1">
                <Text className="text-sm text-gray-500">学生姓名</Text>
                <Text className="text-sm text-gray-800">
                  {profile.studentName || '未设置'}
                </Text>
              </View>
              <Separator />
              <View className="flex items-center justify-between py-1">
                <Text className="text-sm text-gray-500">家长姓名</Text>
                <Text className="text-sm text-gray-800">
                  {profile.parentName || '未设置'}
                </Text>
              </View>
              <Separator />
              <View className="flex items-center justify-between py-1">
                <Text className="text-sm text-gray-500">联系方式</Text>
                <Text className="text-sm text-gray-800">
                  {profile.contact || '未设置'}
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 角色切换 */}
        <Card className="shadow-sm border-0">
          <CardContent className="p-4">
            <View className="flex items-center justify-between">
              <View className="flex items-center gap-2">
                <Shield size={16} color="#F97316" />
                <View>
                  <Text className="text-sm font-medium text-gray-800 block">
                    家委模式
                  </Text>
                  <Text className="text-xs text-gray-400">
                    开启后可发布和管理内容
                  </Text>
                </View>
              </View>
              <Switch
                checked={profile.role === 'committee'}
                onCheckedChange={handleToggleRole}
              />
            </View>
          </CardContent>
        </Card>

        {/* 我的记录 */}
        <Card className="shadow-sm border-0">
          <CardContent className="p-4">
            <Text className="text-base font-semibold text-gray-800 block mb-3">
              我的记录
            </Text>
            <View className="space-y-0">
              <View
                className="flex items-center gap-3 py-3"
                onClick={viewMyNotices}
              >
                <View className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Eye size={16} color="#3B82F6" />
                </View>
                <Text className="text-sm text-gray-700 flex-1">我的已读公告</Text>
                <ChevronRight size={16} color="#9CA3AF" />
              </View>
              <Separator />
              <View
                className="flex items-center gap-3 py-3"
                onClick={viewMyActivities}
              >
                <View className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <CalendarDays size={16} color="#10B981" />
                </View>
                <Text className="text-sm text-gray-700 flex-1">我的报名记录</Text>
                <ChevronRight size={16} color="#9CA3AF" />
              </View>
            </View>
          </CardContent>
        </Card>

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
                <View className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                  <Megaphone size={16} color="#F97316" />
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
                <View className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
                  <CalendarDays size={16} color="#F97316" />
                </View>
                <Text className="text-sm text-gray-700 flex-1">值日排班</Text>
                <ChevronRight size={16} color="#9CA3AF" />
              </View>
            </View>
          </CardContent>
        </Card>
      </View>

      {/* 编辑个人信息弹窗 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑个人信息</DialogTitle>
            <DialogDescription>修改您的基本信息</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-80">
            <View className="space-y-4 p-1">
              <View>
                <Label className="text-sm text-gray-700 mb-1 block">
                  学生姓名
                </Label>
                <View className="bg-gray-50 rounded-xl px-3 py-2">
                  <Input
                    className="w-full bg-transparent"
                    placeholder="请输入学生姓名"
                    value={editStudent}
                    onInput={(e) => setEditStudent(e.detail.value)}
                  />
                </View>
              </View>
              <View>
                <Label className="text-sm text-gray-700 mb-1 block">
                  家长姓名
                </Label>
                <View className="bg-gray-50 rounded-xl px-3 py-2">
                  <Input
                    className="w-full bg-transparent"
                    placeholder="请输入家长姓名"
                    value={editParent}
                    onInput={(e) => setEditParent(e.detail.value)}
                  />
                </View>
              </View>
              <View>
                <Label className="text-sm text-gray-700 mb-1 block">
                  联系方式
                </Label>
                <View className="bg-gray-50 rounded-xl px-3 py-2">
                  <Input
                    className="w-full bg-transparent"
                    placeholder="请输入手机号"
                    type="number"
                    value={editContact}
                    onInput={(e) => setEditContact(e.detail.value)}
                  />
                </View>
              </View>
              <Button
                className="w-full bg-orange-500 text-white"
                onClick={handleSaveProfile}
              >
                保存
              </Button>
            </View>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* 我的已读公告弹窗 */}
      <Dialog open={showMyNotices} onOpenChange={setShowMyNotices}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>我的已读公告</DialogTitle>
            <DialogDescription>已确认阅读的公告列表</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-80">
            <View className="space-y-2 p-1">
              {myNotices.length > 0 ? (
                myNotices.map((notice) => (
                  <View
                    key={notice.id}
                    className="p-3 bg-gray-50 rounded-xl"
                  >
                    <Text className="block text-sm font-medium text-gray-800">
                      {notice.title}
                    </Text>
                    <Text className="block text-xs text-gray-400 mt-1">
                      {new Date(notice.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                ))
              ) : (
                <Text className="text-sm text-gray-400 text-center py-8 block">
                  暂无已读公告
                </Text>
              )}
            </View>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* 我的报名记录弹窗 */}
      <Dialog open={showMyActivities} onOpenChange={setShowMyActivities}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>我的报名记录</DialogTitle>
            <DialogDescription>已报名的活动列表</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-80">
            <View className="space-y-2 p-1">
              {myActivities.length > 0 ? (
                myActivities.map(({ activity }) => (
                  <View
                    key={activity.id}
                    className="p-3 bg-gray-50 rounded-xl"
                  >
                    <View className="flex items-center justify-between">
                      <Text className="text-sm font-medium text-gray-800">
                        {activity.name}
                      </Text>
                      <Badge
                        className={`text-xs ${
                          activity.status === 'ongoing'
                            ? 'bg-emerald-100 text-emerald-600'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {activity.status === 'ongoing' ? '进行中' : '已结束'}
                      </Badge>
                    </View>
                    <Text className="block text-xs text-gray-400 mt-1">
                      {activity.time}
                    </Text>
                  </View>
                ))
              ) : (
                <Text className="text-sm text-gray-400 text-center py-8 block">
                  暂无报名记录
                </Text>
              )}
            </View>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </View>
  )
}

export default ProfilePage
