import { useState, useCallback } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Calendar,
  Plus,
  MapPin,
  Clock,
  Users,
  UserPlus,
  List,
  CircleX,
} from 'lucide-react-taro'
import {
  initStorage,
  getActivities,
  addActivity,
  registerActivity,
  cancelActivity,
  getProfile,
} from '@/store'
import type { Activity } from '@/store/types'

const ActivityPage = () => {
  const [activities, setActivities] = useState<Activity[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showRegisterDialog, setShowRegisterDialog] = useState(false)
  const [showListDialog, setShowListDialog] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [isCommittee, setIsCommittee] = useState(false)

  // 创建活动表单
  const [formName, setFormName] = useState('')
  const [formTime, setFormTime] = useState('')
  const [formLocation, setFormLocation] = useState('')
  const [formMaxCount, setFormMaxCount] = useState('')
  const [formDeadline, setFormDeadline] = useState('')
  const [formRemark, setFormRemark] = useState('')

  // 报名表单
  const [regStudent, setRegStudent] = useState('')
  const [regContact, setRegContact] = useState('')
  const [regRemark, setRegRemark] = useState('')

  const loadData = useCallback(() => {
    initStorage()
    setActivities(getActivities())
    const profile = getProfile()
    setIsCommittee(profile.role === 'committee')
  }, [])

  useDidShow(() => {
    loadData()
  })

  const handleCreate = () => {
    if (!formName.trim() || !formTime.trim() || !formMaxCount.trim()) {
      Taro.showToast({ title: '请填写必要信息', icon: 'none' })
      return
    }
    addActivity({
      name: formName.trim(),
      time: formTime.trim(),
      location: formLocation.trim(),
      maxCount: parseInt(formMaxCount) || 30,
      deadline: formDeadline.trim() || new Date().toISOString(),
      remark: formRemark.trim(),
    })
    resetCreateForm()
    setShowCreateDialog(false)
    loadData()
    Taro.showToast({ title: '创建成功', icon: 'success' })
  }

  const resetCreateForm = () => {
    setFormName('')
    setFormTime('')
    setFormLocation('')
    setFormMaxCount('')
    setFormDeadline('')
    setFormRemark('')
  }

  const handleRegister = () => {
    if (!selectedActivity || !regStudent.trim()) {
      Taro.showToast({ title: '请填写学生姓名', icon: 'none' })
      return
    }
    const result = registerActivity(selectedActivity.id, {
      studentName: regStudent.trim(),
      parentContact: regContact.trim(),
      remark: regRemark.trim(),
    })
    if (result) {
      setRegStudent('')
      setRegContact('')
      setRegRemark('')
      setShowRegisterDialog(false)
      loadData()
      Taro.showToast({ title: '报名成功', icon: 'success' })
    } else {
      Taro.showToast({ title: '报名人数已满', icon: 'none' })
    }
  }

  const handleCancel = (activityId: string) => {
    Taro.showModal({
      title: '确认取消',
      content: '确定要取消这个活动吗？',
      success: (res) => {
        if (res.confirm) {
          cancelActivity(activityId)
          loadData()
          Taro.showToast({ title: '已取消活动', icon: 'success' })
        }
      },
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ongoing':
        return <Badge className="bg-emerald-100 text-emerald-600 text-xs">进行中</Badge>
      case 'closed':
        return <Badge className="bg-orange-100 text-orange-600 text-xs">已截止</Badge>
      case 'ended':
        return <Badge className="bg-gray-100 text-gray-500 text-xs">已结束</Badge>
      default:
        return null
    }
  }

  const ongoingActivities = activities.filter((a) => a.status === 'ongoing')
  const otherActivities = activities.filter((a) => a.status !== 'ongoing')

  return (
    <View className="min-h-full bg-orange-50 pb-6">
      <View className="px-4 pt-4 space-y-3">
        {/* 创建按钮 */}
        {isCommittee && (
          <Button
            className="w-full bg-orange-500 text-white"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus size={16} color="#fff" />
            <Text className="ml-1 text-sm">创建活动</Text>
          </Button>
        )}

        <Tabs defaultValue="ongoing" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="ongoing">进行中</TabsTrigger>
            <TabsTrigger value="other">已截止/已结束</TabsTrigger>
          </TabsList>

          <TabsContent value="ongoing">
            {ongoingActivities.length > 0 ? (
              <View className="space-y-3 mt-3">
                {ongoingActivities.map((activity) => {
                  const progress = (activity.registrations.length / activity.maxCount) * 100
                  return (
                    <Card key={activity.id} className="shadow-sm border-0">
                      <CardContent className="p-4">
                        <View className="flex items-start justify-between mb-2">
                          <Text className="block text-base font-semibold text-gray-800 flex-1">
                            {activity.name}
                          </Text>
                          {getStatusBadge(activity.status)}
                        </View>
                        <View className="space-y-1 mb-3">
                          <View className="flex items-center gap-1">
                            <Clock size={13} color="#6B7280" />
                            <Text className="text-xs text-gray-500">{activity.time}</Text>
                          </View>
                          <View className="flex items-center gap-1">
                            <MapPin size={13} color="#6B7280" />
                            <Text className="text-xs text-gray-500">{activity.location}</Text>
                          </View>
                          <View className="flex items-center gap-1">
                            <Users size={13} color="#6B7280" />
                            <Text className="text-xs text-gray-500">
                              已报名 {activity.registrations.length}/{activity.maxCount} 人
                            </Text>
                          </View>
                        </View>
                        {/* 进度条 */}
                        <View className="mb-3">
                          <Progress value={progress} className="h-2" />
                        </View>
                        {activity.remark && (
                          <Text className="block text-xs text-gray-400 mb-3">
                            备注：{activity.remark}
                          </Text>
                        )}
                        <View className="flex items-center gap-2">
                          <Button
                            size="sm"
                            className="bg-blue-500 text-white flex-1"
                            onClick={() => {
                              setSelectedActivity(activity)
                              setShowRegisterDialog(true)
                            }}
                          >
                            <UserPlus size={14} color="#fff" />
                            <Text className="ml-1 text-xs">报名</Text>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setSelectedActivity(activity)
                              setShowListDialog(true)
                            }}
                          >
                            <List size={14} color="#6B7280" />
                            <Text className="ml-1 text-xs">名单</Text>
                          </Button>
                          {isCommittee && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCancel(activity.id)}
                            >
                              <CircleX size={14} color="#EF4444" />
                            </Button>
                          )}
                        </View>
                      </CardContent>
                    </Card>
                  )
                })}
              </View>
            ) : (
              <View className="flex flex-col items-center py-16">
                <Calendar size={48} color="#D1D5DB" />
                <Text className="text-sm text-gray-400 mt-3">暂无进行中的活动</Text>
              </View>
            )}
          </TabsContent>

          <TabsContent value="other">
            {otherActivities.length > 0 ? (
              <View className="space-y-3 mt-3">
                {otherActivities.map((activity) => (
                  <Card key={activity.id} className="shadow-sm border-0 opacity-75">
                    <CardContent className="p-4">
                      <View className="flex items-start justify-between mb-2">
                        <Text className="block text-base font-semibold text-gray-800 flex-1">
                          {activity.name}
                        </Text>
                        {getStatusBadge(activity.status)}
                      </View>
                      <View className="space-y-1">
                        <View className="flex items-center gap-1">
                          <Clock size={13} color="#6B7280" />
                          <Text className="text-xs text-gray-500">{activity.time}</Text>
                        </View>
                        <View className="flex items-center gap-1">
                          <Users size={13} color="#6B7280" />
                          <Text className="text-xs text-gray-500">
                            共 {activity.registrations.length} 人报名
                          </Text>
                        </View>
                      </View>
                    </CardContent>
                  </Card>
                ))}
              </View>
            ) : (
              <View className="flex flex-col items-center py-16">
                <Calendar size={48} color="#D1D5DB" />
                <Text className="text-sm text-gray-400 mt-3">暂无已结束的活动</Text>
              </View>
            )}
          </TabsContent>
        </Tabs>
      </View>

      {/* 创建活动弹窗 */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>创建活动</DialogTitle>
            <DialogDescription>创建班级活动，家长可在线报名</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            <View className="space-y-4 p-1">
              <View>
                <Label className="text-sm text-gray-700 mb-1 block">活动名称 *</Label>
                <View className="bg-gray-50 rounded-xl px-3 py-2">
                  <Input className="w-full bg-transparent" placeholder="如：秋季运动会志愿者" value={formName} onInput={(e) => setFormName(e.detail.value)} />
                </View>
              </View>
              <View>
                <Label className="text-sm text-gray-700 mb-1 block">活动时间 *</Label>
                <View className="bg-gray-50 rounded-xl px-3 py-2">
                  <Input className="w-full bg-transparent" placeholder="如：2025-10-15 08:00-16:00" value={formTime} onInput={(e) => setFormTime(e.detail.value)} />
                </View>
              </View>
              <View>
                <Label className="text-sm text-gray-700 mb-1 block">活动地点</Label>
                <View className="bg-gray-50 rounded-xl px-3 py-2">
                  <Input className="w-full bg-transparent" placeholder="如：学校操场" value={formLocation} onInput={(e) => setFormLocation(e.detail.value)} />
                </View>
              </View>
              <View>
                <Label className="text-sm text-gray-700 mb-1 block">人数上限 *</Label>
                <View className="bg-gray-50 rounded-xl px-3 py-2">
                  <Input className="w-full bg-transparent" placeholder="如：5" type="number" value={formMaxCount} onInput={(e) => setFormMaxCount(e.detail.value)} />
                </View>
              </View>
              <View>
                <Label className="text-sm text-gray-700 mb-1 block">报名截止时间</Label>
                <View className="bg-gray-50 rounded-xl px-3 py-2">
                  <Input className="w-full bg-transparent" placeholder="如：2025-10-10 18:00" value={formDeadline} onInput={(e) => setFormDeadline(e.detail.value)} />
                </View>
              </View>
              <View>
                <Label className="text-sm text-gray-700 mb-1 block">备注</Label>
                <View className="bg-gray-50 rounded-xl p-3">
                  <Textarea style={{ width: '100%', minHeight: '80px', backgroundColor: 'transparent' }} placeholder="活动备注说明" value={formRemark} onInput={(e) => setFormRemark(e.detail.value)} maxlength={200} />
                </View>
              </View>
              <Button className="w-full bg-orange-500 text-white" onClick={handleCreate}>
                创建
              </Button>
            </View>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* 报名弹窗 */}
      <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>活动报名</DialogTitle>
            <DialogDescription>{selectedActivity?.name || ''}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-80">
            <View className="space-y-4 p-1">
              <View>
                <Label className="text-sm text-gray-700 mb-1 block">学生姓名 *</Label>
                <View className="bg-gray-50 rounded-xl px-3 py-2">
                  <Input className="w-full bg-transparent" placeholder="请输入学生姓名" value={regStudent} onInput={(e) => setRegStudent(e.detail.value)} />
                </View>
              </View>
              <View>
                <Label className="text-sm text-gray-700 mb-1 block">家长联系方式</Label>
                <View className="bg-gray-50 rounded-xl px-3 py-2">
                  <Input className="w-full bg-transparent" placeholder="请输入手机号" type="number" value={regContact} onInput={(e) => setRegContact(e.detail.value)} />
                </View>
              </View>
              <View>
                <Label className="text-sm text-gray-700 mb-1 block">备注</Label>
                <View className="bg-gray-50 rounded-xl p-3">
                  <Textarea style={{ width: '100%', minHeight: '60px', backgroundColor: 'transparent' }} placeholder="如有特殊说明请填写" value={regRemark} onInput={(e) => setRegRemark(e.detail.value)} maxlength={200} />
                </View>
              </View>
              <Button className="w-full bg-blue-500 text-white" onClick={handleRegister}>
                提交报名
              </Button>
            </View>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* 报名名单弹窗 */}
      <Dialog open={showListDialog} onOpenChange={setShowListDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>报名名单</DialogTitle>
            <DialogDescription>
              {selectedActivity?.name || ''} - 共{selectedActivity?.registrations.length || 0}人
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-80">
            <View className="space-y-2 p-1">
              {selectedActivity?.registrations.length ? (
                selectedActivity.registrations.map((reg, idx) => (
                  <View key={reg.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <View className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <Text className="text-xs font-semibold text-orange-600">{idx + 1}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="block text-sm font-medium text-gray-800">{reg.studentName}</Text>
                      <Text className="block text-xs text-gray-500">{reg.parentContact || '未填写联系方式'}</Text>
                    </View>
                    {reg.remark && (
                      <Text className="text-xs text-gray-400">{reg.remark}</Text>
                    )}
                  </View>
                ))
              ) : (
                <Text className="text-sm text-gray-400 text-center py-8 block">暂无报名</Text>
              )}
            </View>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </View>
  )
}

export default ActivityPage
