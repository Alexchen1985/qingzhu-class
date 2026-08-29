/**
 * 值日排班页面 - 云开发版
 * 数据来源：duty 云函数
 */
import { useState, useCallback, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ChevronLeft, ChevronRight, Star, Users, RotateCw } from 'lucide-react-taro'
import { getDutyWeekList, batchSetDuty, autoRotateDuty, getMyDuty, type CloudDutySchedule } from '@/services/cloud'
import { getCurrentClassId, getUserRole, getCurrentStudentName } from '@/store'

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export default function DutyPage() {
  const [weekStart, setWeekStart] = useState<Date>(getMonday(new Date()))
  const [dates, setDates] = useState<string[]>([])
  const [schedule, setSchedule] = useState<Record<string, CloudDutySchedule[]>>({})
  const [loading, setLoading] = useState(true)
  const [showSet, setShowSet] = useState(false)
  const [setForm, setSetForm] = useState<Record<string, string>>({})
  const [myDutyDates, setMyDutyDates] = useState<Set<string>>(new Set())

  const classId = getCurrentClassId()
  const role = getUserRole()
  const studentName = getCurrentStudentName()
  const isManager = role === 'admin' || role === 'head_teacher' || role === 'committee'

  const loadWeekData = useCallback(async () => {
    if (!classId) return
    try {
      const weekStartStr = formatDate(weekStart)
      const result = await getDutyWeekList(classId, weekStartStr)
      setDates(result.dates)
      setSchedule(result.schedule)

      // 加载我的值日
      if (studentName) {
        const myDuties = await getMyDuty(classId, studentName)
        const mySet = new Set(myDuties.map(d => d.duty_date))
        setMyDutyDates(mySet)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [classId, weekStart, studentName])

  useDidShow(() => { loadWeekData() })
  useEffect(() => { loadWeekData() }, [loadWeekData])

  const prevWeek = () => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() - 7)
    setWeekStart(d)
  }

  const nextWeek = () => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 7)
    setWeekStart(d)
  }

  const goToday = () => {
    setWeekStart(getMonday(new Date()))
  }

  const handleOpenSet = () => {
    const form: Record<string, string> = {}
    dates.forEach(date => {
      const existing = schedule[date]?.[0]
      form[date] = existing?.student_name || ''
    })
    setSetForm(form)
    setShowSet(true)
  }

  const handleBatchSet = async () => {
    const schedules = dates
      .filter(date => setForm[date]?.trim())
      .map(date => ({ date, student_name: setForm[date].trim() }))
    if (schedules.length === 0) {
      Taro.showToast({ title: '请至少填写一天的值日生', icon: 'none' }); return
    }
    try {
      await batchSetDuty(classId!, formatDate(weekStart), schedules)
      Taro.showToast({ title: '排班成功', icon: 'success' })
      setShowSet(false)
      loadWeekData()
    } catch (e: unknown) {
      Taro.showToast({ title: (e as Error)?.message || '操作失败', icon: 'none' })
    }
  }

  const handleAutoRotate = async () => {
    try {
      const result = await autoRotateDuty(classId!, formatDate(weekStart))
      if (result.schedules.length > 0) {
        Taro.showToast({ title: '自动排班成功', icon: 'success' })
        loadWeekData()
      } else {
        Taro.showToast({ title: '名单为空，请先导入家长名单', icon: 'none' })
      }
    } catch (e: unknown) {
      Taro.showToast({ title: (e as Error)?.message || '操作失败', icon: 'none' })
    }
  }

  const weekLabel = `${weekStart.getMonth() + 1}月${weekStart.getDate()}日`

  return (
    <View className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <View className="bg-gradient-to-r from-[#5EC4A0] to-[#7DD4B4] px-4 pt-8 pb-6">
        <View className="flex items-center justify-between mb-4">
          <View>
            <Text className="block text-white text-xl font-bold">值日排班</Text>
            <Text className="block text-white text-opacity-80 text-sm mt-1">{weekLabel} 所在周</Text>
          </View>
          {isManager && (
            <View className="flex gap-2">
              <Button size="sm" className="bg-white bg-opacity-20 text-white border-white border-opacity-30" onClick={handleAutoRotate}>
                <RotateCw size={14} className="mr-1" color="#fff" />
                <Text className="text-sm text-white">轮换</Text>
              </Button>
              <Button size="sm" className="bg-white bg-opacity-20 text-white border-white border-opacity-30" onClick={handleOpenSet}>
                <Text className="text-sm text-white">设置</Text>
              </Button>
            </View>
          )}
        </View>

        {/* Week Navigation */}
        <View className="flex items-center justify-between">
          <Button variant="ghost" size="sm" className="text-white p-2" onClick={prevWeek}>
            <ChevronLeft size={20} color="#fff" />
          </Button>
          <Button variant="ghost" size="sm" className="text-white text-sm" onClick={goToday}>
            <Text className="text-white text-sm">今天</Text>
          </Button>
          <Button variant="ghost" size="sm" className="text-white p-2" onClick={nextWeek}>
            <ChevronRight size={20} color="#fff" />
          </Button>
        </View>
      </View>

      <ScrollView scrollY className="h-[calc(100vh-280px)] px-4 -mt-2">
        {loading ? (
          <View className="py-12 text-center"><Text className="block text-gray-400">加载中...</Text></View>
        ) : (
          <View className="space-y-2">
            {dates.map((date, index) => {
              const weekday = WEEKDAYS[index]
              const daySchedule = schedule[date] || []
              const isMyDuty = myDutyDates.has(date)
              const d = new Date(date)
              const dayNum = d.getDate()
              const isToday = date === formatDate(new Date())

              return (
                <Card key={date} className={`overflow-hidden ${isMyDuty ? 'ring-2 ring-[#7DD4B4]' : ''}`}>
                  <CardContent className="p-4">
                    <View className="flex items-center">
                      <View className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center mr-3 ${
                        isToday ? 'bg-[#5EC4A0]' : isMyDuty ? 'bg-[#F0F8F4]' : 'bg-gray-100'
                      }`}
                      >
                        <Text className={`text-xs ${isToday ? 'text-white text-opacity-80' : 'text-gray-400'}`}>{weekday}</Text>
                        <Text className={`text-lg font-bold ${isToday ? 'text-white' : isMyDuty ? 'text-[#4DB892]' : 'text-gray-700'}`}>{dayNum}</Text>
                      </View>
                      <View className="flex-1">
                        {daySchedule.length > 0 ? (
                          <View>
                            <View className="flex items-center">
                              <Users size={14} className="mr-2" color="#5EC4A0" />
                              <Text className="text-sm font-medium text-gray-800">
                                {daySchedule.map(s => s.student_name).join('、')}
                              </Text>
                              {isMyDuty && (
                                <View className="ml-2 flex items-center bg-[#F0F8F4] px-2 py-1 rounded-full">
                                  <Star size={12} className="mr-1" color="#5EC4A0" />
                                  <Text className="text-xs text-[#4DB892]">我的值日</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        ) : (
                          <Text className="text-sm text-gray-400">未安排</Text>
                        )}
                      </View>
                    </View>
                  </CardContent>
                </Card>
              )
            })}
          </View>
        )}
      </ScrollView>

      {/* 设置排班弹窗 */}
      <Dialog open={showSet} onOpenChange={setShowSet}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle><Text className="text-lg font-bold text-gray-800">设置本周排班</Text></DialogTitle>
            <DialogDescription><Text className="text-sm text-gray-500">{weekLabel} 所在周</Text></DialogDescription>
          </DialogHeader>
          <ScrollView scrollY className="max-h-80 mt-2">
            <View className="space-y-3">
              {dates.map((date, index) => {
                const d = new Date(date)
                return (
                  <View key={date} className="flex items-center gap-3">
                    <View className="w-16 text-center">
                      <Text className="block text-sm font-medium text-gray-700">{WEEKDAYS[index]}</Text>
                      <Text className="block text-xs text-gray-400">{d.getMonth() + 1}/{d.getDate()}</Text>
                    </View>
                    <View className="flex-1 bg-gray-50 rounded-xl px-4 py-2">
                      <Input className="w-full bg-transparent" placeholder="值日学生姓名"
                        value={setForm[date] || ''}
                        onInput={(e) => setSetForm({ ...setForm, [date]: e.detail.value })}
                      />
                    </View>
                  </View>
                )
              })}
            </View>
          </ScrollView>
          <Button className="w-full bg-[#5EC4A0] text-white mt-4" onClick={handleBatchSet}>
            <Text className="text-white">保存排班</Text>
          </Button>
        </DialogContent>
      </Dialog>
    </View>
  )
}
