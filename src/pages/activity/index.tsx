/**
 * 活动报名页面 - 云开发版
 * 数据来源：activity 云函数
 */
import { useState, useCallback } from 'react'
import { View, Text, ScrollView, Picker } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, MapPin, Users, Clock, Plus, X, UserCheck, ChevronRight } from 'lucide-react-taro'
import {
  getActivityList, createActivity, signupActivity,
  getActivitySignupList, cancelActivity,
  type CloudActivity, type CloudSignup
} from '@/services/cloud'
import { getCurrentClassId, getUserRole } from '@/store'

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: '进行中', color: 'text-green-600', bg: 'bg-green-50' },
  closed: { label: '已截止', color: 'text-gray-500', bg: 'bg-gray-50' },
  finished: { label: '已结束', color: 'text-gray-400', bg: 'bg-gray-50' },
  cancelled: { label: '已取消', color: 'text-red-500', bg: 'bg-red-50' },
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<CloudActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [showSignups, setShowSignups] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<CloudActivity | null>(null)
  const [signupList, setSignupList] = useState<CloudSignup[]>([])
  const [form, setForm] = useState({ title: '', description: '', location: '', start_time: '', deadline: '', max_participants: '' })
  const [signupForm, setSignupForm] = useState({ student_name: '', contact: '', note: '' })
  const [startTimePicker, setStartTimePicker] = useState('')
  const [deadlinePicker, setDeadlinePicker] = useState('')

  const classId = getCurrentClassId()
  const role = getUserRole()
  const isManager = role === 'admin' || role === 'head_teacher' || role === 'committee'
  const isTeacher = role === 'teacher'

  const loadActivities = useCallback(async () => {
    if (!classId) return
    try {
      const list = await getActivityList(classId)
      setActivities(list)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [classId])

  useDidShow(() => { loadActivities() })

  const handleCreate = async () => {
    if (!form.title) { Taro.showToast({ title: '请输入活动名称', icon: 'none' }); return }
    try {
      await createActivity({
        class_id: classId!, title: form.title, description: form.description,
        location: form.location, start_time: form.start_time,
        deadline: form.deadline, max_participants: parseInt(form.max_participants) || 0,
      })
      Taro.showToast({ title: '创建成功', icon: 'success' })
      setShowCreate(false)
      setForm({ title: '', description: '', location: '', start_time: '', deadline: '', max_participants: '' })
      setStartTimePicker('')
      setDeadlinePicker('')
      loadActivities()
    } catch (e: unknown) {
      Taro.showToast({ title: (e as Error)?.message || '创建失败', icon: 'none' })
    }
  }

  const handleStartTimeChange = (e: any) => {
    const value = e.detail.value
    setStartTimePicker(value)
    setForm({ ...form, start_time: value })
  }

  const handleDeadlineChange = (e: any) => {
    const value = e.detail.value
    setDeadlinePicker(value)
    setForm({ ...form, deadline: value })
  }

  const handleSignup = async () => {
    if (!signupForm.student_name) { Taro.showToast({ title: '请输入学生姓名', icon: 'none' }); return }
    if (!selectedActivity) return
    try {
      await signupActivity({
        activity_id: selectedActivity._id, class_id: classId!,
        student_name: signupForm.student_name, contact: signupForm.contact, note: signupForm.note,
      })
      Taro.showToast({ title: '报名成功', icon: 'success' })
      setShowSignup(false)
      setSignupForm({ student_name: '', contact: '', note: '' })
      loadActivities()
    } catch (e: unknown) {
      const msg = (e as Error)?.message || '报名失败'
      if (msg.includes('ALREADY')) Taro.showToast({ title: '您已报名', icon: 'none' })
      else if (msg.includes('FULL')) Taro.showToast({ title: '名额已满', icon: 'none' })
      else Taro.showToast({ title: msg, icon: 'none' })
    }
  }

  const handleViewSignups = async (activity: CloudActivity) => {
    try {
      const list = await getActivitySignupList(activity._id, classId!)
      setSignupList(list)
      setSelectedActivity(activity)
      setShowSignups(true)
    } catch (e: unknown) {
      Taro.showToast({ title: (e as Error)?.message || '获取失败', icon: 'none' })
    }
  }

  const handleCancelActivity = async (activityId: string) => {
    Taro.showModal({
      title: '确认取消', content: '取消后所有报名将失效，确定取消此活动？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await cancelActivity(activityId, classId!)
            Taro.showToast({ title: '已取消', icon: 'success' })
            loadActivities()
          } catch (e: unknown) {
            Taro.showToast({ title: (e as Error)?.message || '操作失败', icon: 'none' })
          }
        }
      }
    })
  }

  const handleCancelSignup = async (activityId: string) => {
    try {
      await cancelActivity(activityId, classId!, 'signup')
      Taro.showToast({ title: '已取消报名', icon: 'success' })
      loadActivities()
    } catch (e: unknown) {
      Taro.showToast({ title: (e as Error)?.message || '操作失败', icon: 'none' })
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  // teacher 角色隐藏整个班费模块提示
  if (isTeacher) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-sm">
          <CardContent className="p-8 text-center">
            <Users size={48} className="mx-auto mb-4" color="#9CA3AF" />
            <Text className="block text-gray-500">任课老师无需管理活动</Text>
          </CardContent>
        </Card>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <View className="bg-gradient-to-r from-[#5EC4A0] to-[#7DD4B4] px-4 pt-8 pb-6">
        <View className="flex items-center justify-between">
          <View>
            <Text className="block text-white text-xl font-bold">活动报名</Text>
            <Text className="block text-white text-opacity-80 text-sm mt-1">{activities.filter(a => a.status === 'open').length} 个活动进行中</Text>
          </View>
          {isManager && (
            <Button size="sm" className="bg-white bg-opacity-20 text-white border-white border-opacity-30" onClick={() => setShowCreate(true)}>
              <Plus size={16} className="mr-1" color="#fff" />
              <Text className="text-sm text-white">发布</Text>
            </Button>
          )}
        </View>
      </View>

      <ScrollView scrollY className="h-[calc(100vh-280px)] px-4 -mt-2">
        {loading ? (
          <View className="py-12 text-center">
            <Text className="block text-gray-400">加载中...</Text>
          </View>
        ) : activities.length === 0 ? (
          <View className="py-12 text-center">
            <Calendar size={48} className="mx-auto mb-4" color="#D1D5DB" />
            <Text className="block text-gray-400">暂无活动</Text>
            {isManager && <Text className="block text-gray-400 text-sm mt-1">点击右上角发布新活动</Text>}
          </View>
        ) : (
          <View className="space-y-3">
            {activities.map(activity => {
              const st = STATUS_MAP[activity.status] || STATUS_MAP.open
              const progress = activity.max_participants > 0
                ? Math.min(100, (activity.current_count / activity.max_participants) * 100) : 0

              return (
                <Card key={activity._id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <View className="flex items-start justify-between mb-2">
                      <Text className="block text-base font-bold text-gray-800 flex-1 mr-2">{activity.title}</Text>
                      <View className={`px-2 py-1 rounded-full ${st.bg}`}>
                        <Text className={`text-xs ${st.color}`}>{st.label}</Text>
                      </View>
                    </View>

                    {activity.description ? (
                      <Text className="block text-sm text-gray-500 mb-3">{activity.description}</Text>
                    ) : null}

                    <View className="space-y-2 mb-3">
                      {activity.start_time ? (
                        <View className="flex items-center text-xs text-gray-500">
                          <Clock size={14} className="mr-2" color="#9CA3AF" />
                          <Text className="text-gray-500">{formatDate(activity.start_time)}</Text>
                        </View>
                      ) : null}
                      {activity.location ? (
                        <View className="flex items-center text-xs text-gray-500">
                          <MapPin size={14} className="mr-2" color="#9CA3AF" />
                          <Text className="text-gray-500">{activity.location}</Text>
                        </View>
                      ) : null}
                    </View>

                    {activity.max_participants > 0 && (
                      <View className="mb-3">
                        <View className="flex justify-between mb-1">
                          <Text className="text-xs text-gray-500">报名进度</Text>
                          <Text className="text-xs font-medium text-[#4DB892]">
                            {activity.current_count}/{activity.max_participants}
                          </Text>
                        </View>
                        <Progress value={progress} className="h-2" />
                      </View>
                    )}

                    <View className="flex gap-2">
                      {activity.status === 'open' && !activity.is_signed_up && (
                        <Button size="sm" className="flex-1 bg-[#5EC4A0] text-white"
                          onClick={() => { setSelectedActivity(activity); setShowSignup(true) }}
                        >
                          <Text className="text-sm text-white">我要报名</Text>
                        </Button>
                      )}
                      {activity.is_signed_up && activity.status === 'open' && (
                        <Button size="sm" variant="outline" className="flex-1 border-gray-300"
                          onClick={() => handleCancelSignup(activity._id)}
                        >
                          <X size={14} className="mr-1" color="#6B7280" />
                          <Text className="text-sm text-gray-600">取消报名</Text>
                        </Button>
                      )}
                      {activity.is_signed_up && (
                        <Badge className="bg-green-50 text-green-600 border-green-200">
                          <UserCheck size={12} className="mr-1" color="#16A34A" />
                          <Text className="text-xs text-green-600">已报名</Text>
                        </Badge>
                      )}
                      {isManager && activity.status === 'open' && (
                        <Button size="sm" variant="outline" className="border-gray-300"
                          onClick={() => handleViewSignups(activity)}
                        >
                          <Text className="text-sm text-gray-600">名单</Text>
                          <ChevronRight size={14} className="ml-1" color="#6B7280" />
                        </Button>
                      )}
                      {isManager && (activity.status === 'open' || activity.status === 'closed') && (
                        <Button size="sm" variant="outline" className="border-red-200"
                          onClick={() => handleCancelActivity(activity._id)}
                        >
                          <Text className="text-sm text-red-500">取消</Text>
                        </Button>
                      )}
                    </View>
                  </CardContent>
                </Card>
              )
            })}
          </View>
        )}
      </ScrollView>

      {/* 创建活动弹窗 */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle><Text className="text-lg font-bold text-gray-800">发布新活动</Text></DialogTitle>
            <DialogDescription><Text className="text-sm text-gray-500">填写活动信息，发布后家长可报名</Text></DialogDescription>
          </DialogHeader>
          <View className="space-y-3 mt-2">
            <View>
              <Text className="block text-sm text-gray-600 mb-1">活动名称 *</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input className="w-full bg-transparent" placeholder="如：春季运动会志愿者招募"
                  value={form.title} onInput={(e) => setForm({ ...form, title: e.detail.value })}
                />
              </View>
            </View>
            <View>
              <Text className="block text-sm text-gray-600 mb-1">活动说明</Text>
              <View className="bg-gray-50 rounded-2xl p-4">
                <Textarea className="w-full bg-transparent" placeholder="活动详情..."
                  style={{ width: '100%', minHeight: '60px', backgroundColor: 'transparent' }}
                  value={form.description} onInput={(e) => setForm({ ...form, description: e.detail.value })}
                />
              </View>
            </View>
            <View className="grid grid-cols-2 gap-3">
              <View>
                <Text className="block text-sm text-gray-600 mb-1">开始时间</Text>
                <Picker mode="date" value={startTimePicker} onChange={handleStartTimeChange}>
                  <View className="bg-gray-50 rounded-xl px-4 py-3">
                    <Text className="block text-sm">
                      {startTimePicker || '选择日期'}
                    </Text>
                  </View>
                </Picker>
              </View>
              <View>
                <Text className="block text-sm text-gray-600 mb-1">报名截止</Text>
                <Picker mode="date" value={deadlinePicker} onChange={handleDeadlineChange}>
                  <View className="bg-gray-50 rounded-xl px-4 py-3">
                    <Text className="block text-sm">
                      {deadlinePicker || '选择日期'}
                    </Text>
                  </View>
                </Picker>
              </View>
            </View>
            <View>
              <Text className="block text-sm text-gray-600 mb-1">活动地点</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input className="w-full bg-transparent" placeholder="如：学校操场"
                  value={form.location} onInput={(e) => setForm({ ...form, location: e.detail.value })}
                />
              </View>
            </View>
            <View>
              <Text className="block text-sm text-gray-600 mb-1">人数上限（0=不限）</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input className="w-full bg-transparent" type="number" placeholder="10"
                  value={form.max_participants} onInput={(e) => setForm({ ...form, max_participants: e.detail.value })}
                />
              </View>
            </View>
            <Button className="w-full bg-[#5EC4A0] text-white mt-4" onClick={handleCreate}>
              <Text className="text-white">发布活动</Text>
            </Button>
          </View>
        </DialogContent>
      </Dialog>

      {/* 报名弹窗 */}
      <Dialog open={showSignup} onOpenChange={setShowSignup}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle><Text className="text-lg font-bold text-gray-800">活动报名</Text></DialogTitle>
            <DialogDescription>
              <Text className="text-sm text-gray-500">{selectedActivity?.title}</Text>
            </DialogDescription>
          </DialogHeader>
          <View className="space-y-3 mt-2">
            <View>
              <Text className="block text-sm text-gray-600 mb-1">学生姓名 *</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input className="w-full bg-transparent" placeholder="请输入学生姓名"
                  value={signupForm.student_name} onInput={(e) => setSignupForm({ ...signupForm, student_name: e.detail.value })}
                />
              </View>
            </View>
            <View>
              <Text className="block text-sm text-gray-600 mb-1">联系电话</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input className="w-full bg-transparent" type="number" placeholder="请输入手机号"
                  value={signupForm.contact} onInput={(e) => setSignupForm({ ...signupForm, contact: e.detail.value })}
                />
              </View>
            </View>
            <View>
              <Text className="block text-sm text-gray-600 mb-1">备注</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input className="w-full bg-transparent" placeholder="如有特殊说明请填写"
                  value={signupForm.note} onInput={(e) => setSignupForm({ ...signupForm, note: e.detail.value })}
                />
              </View>
            </View>
            <Button className="w-full bg-[#5EC4A0] text-white mt-4" onClick={handleSignup}>
              <Text className="text-white">确认报名</Text>
            </Button>
          </View>
        </DialogContent>
      </Dialog>

      {/* 报名名单弹窗 */}
      <Dialog open={showSignups} onOpenChange={setShowSignups}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle><Text className="text-lg font-bold text-gray-800">报名名单</Text></DialogTitle>
            <DialogDescription>
              <Text className="text-sm text-gray-500">{selectedActivity?.title} · {signupList.length}人</Text>
            </DialogDescription>
          </DialogHeader>
          <ScrollView scrollY className="max-h-80 mt-2">
            <View className="space-y-2">
              {signupList.map((s, i) => (
                <View key={s._id} className="flex items-center bg-gray-50 rounded-xl px-4 py-3">
                  <Text className="block text-sm font-medium text-gray-800 w-6">{i + 1}.</Text>
                  <View className="flex-1">
                    <Text className="block text-sm font-medium text-gray-800">{s.student_name}</Text>
                    {s.contact ? <Text className="block text-xs text-gray-500">{s.contact}</Text> : null}
                  </View>
                  {s.note ? <Text className="text-xs text-[#5EC4A0] ml-2">{s.note}</Text> : null}
                </View>
              ))}
            </View>
          </ScrollView>
        </DialogContent>
      </Dialog>
    </View>
  )
}
