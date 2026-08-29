import { useState, useCallback } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sun,
  User,
} from 'lucide-react-taro'
import { initStorage, getDuties, setWeekDuty, getProfile } from '@/store'
import type { DutySchedule, DutyAssignment } from '@/store/types'

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五']

function getMonday(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

function addWeeks(monday: string, weeks: number): string {
  const d = new Date(monday)
  d.setDate(d.getDate() + weeks * 7)
  return d.toISOString().split('T')[0]
}

function getWeekDates(monday: string): string[] {
  const dates: string[] = []
  const d = new Date(monday)
  for (let i = 0; i < 5; i++) {
    const day = new Date(d)
    day.setDate(d.getDate() + i)
    dates.push(day.toISOString().split('T')[0])
  }
  return dates
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function isToday(dateStr: string): boolean {
  const today = new Date().toISOString().split('T')[0]
  return dateStr === today
}

const DutyPage = () => {
  const [duties, setDuties] = useState<DutySchedule[]>([])
  const [currentMonday, setCurrentMonday] = useState(getMonday(new Date()))
  const [showSetDialog, setShowSetDialog] = useState(false)
  const [isCommittee, setIsCommittee] = useState(false)
  const [editStudents, setEditStudents] = useState<string[]>(['', '', '', '', ''])

  const loadData = useCallback(() => {
    initStorage()
    setDuties(getDuties())
    const profile = getProfile()
    setIsCommittee(profile.role === 'committee')
  }, [])

  useDidShow(() => {
    loadData()
  })

  const currentWeek = duties.find((d) => d.weekStart === currentMonday)
  const weekDates = getWeekDates(currentMonday)

  const goToPrevWeek = () => {
    setCurrentMonday(addWeeks(currentMonday, -1))
  }

  const goToNextWeek = () => {
    setCurrentMonday(addWeeks(currentMonday, 1))
  }

  const goToToday = () => {
    setCurrentMonday(getMonday(new Date()))
  }

  const openSetDialog = () => {
    if (currentWeek) {
      const students = currentWeek.assignments.map((a) => a.students.join('、'))
      setEditStudents([...students, ...Array(5 - students.length).fill('')])
    } else {
      setEditStudents(['', '', '', '', ''])
    }
    setShowSetDialog(true)
  }

  const handleSave = () => {
    const assignments: DutyAssignment[] = weekDates.map((date, i) => ({
      date,
      students: editStudents[i]
        ? editStudents[i]
            .split(/[、，,]/)
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    }))
    setWeekDuty(currentMonday, assignments)
    setShowSetDialog(false)
    loadData()
    Taro.showToast({ title: '保存成功', icon: 'success' })
  }

  const getAssignmentForDate = (date: string): DutyAssignment | undefined => {
    return currentWeek?.assignments.find((a) => a.date === date)
  }

  const isMyDuty = (students: string[]): boolean => {
    const profile = getProfile()
    return students.includes(profile.studentName)
  }

  return (
    <View className="min-h-full bg-orange-50 pb-6">
      <View className="px-4 pt-4 space-y-4">
        {/* 周导航 */}
        <Card className="shadow-sm border-0">
          <CardContent className="p-4">
            <View className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="sm" onClick={goToPrevWeek}>
                <ChevronLeft size={18} color="#6B7280" />
              </Button>
              <View className="flex items-center gap-2">
                <CalendarDays size={16} color="#F97316" />
                <Text className="text-sm font-medium text-gray-800">
                  {currentMonday} 周
                </Text>
              </View>
              <View className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={goToToday}>
                  <Text className="text-xs text-orange-500">今天</Text>
                </Button>
                <Button variant="ghost" size="sm" onClick={goToNextWeek}>
                  <ChevronRight size={18} color="#6B7280" />
                </Button>
              </View>
            </View>

            {/* 周日历 */}
            <View className="grid grid-cols-5 gap-2">
              {weekDates.map((date, i) => {
                const assignment = getAssignmentForDate(date)
                const students = assignment?.students || []
                const today = isToday(date)
                const myDuty = isMyDuty(students)

                return (
                  <View
                    key={date}
                    className={`rounded-xl p-2 text-center ${
                      today
                        ? 'bg-orange-500'
                        : myDuty
                          ? 'bg-orange-50'
                          : 'bg-gray-50'
                    }`}
                  >
                    <Text
                      className={`block text-xs mb-1 ${
                        today ? 'text-white' : 'text-gray-500'
                      }`}
                    >
                      {WEEKDAYS[i]}
                    </Text>
                    <Text
                      className={`block text-sm font-medium mb-1 ${
                        today ? 'text-white' : 'text-gray-800'
                      }`}
                    >
                      {formatDateShort(date)}
                    </Text>
                    {students.length > 0 ? (
                      <View className="space-y-1">
                        {students.map((s) => (
                          <Text
                            key={s}
                            className={`block text-xs truncate ${
                              today ? 'text-orange-100' : 'text-gray-600'
                            }`}
                          >
                            {s}
                          </Text>
                        ))}
                      </View>
                    ) : (
                      <Text
                        className={`block text-xs ${
                          today ? 'text-orange-200' : 'text-gray-300'
                        }`}
                      >
                        未排
                      </Text>
                    )}
                    {myDuty && !today && (
                      <View className="mt-1">
                        <Badge className="bg-orange-100 text-orange-600 text-xs scale-75">
                          我的
                        </Badge>
                      </View>
                    )}
                  </View>
                )
              })}
            </View>
          </CardContent>
        </Card>

        {/* 设置排班按钮 */}
        {isCommittee && (
          <Button
            className="w-full bg-orange-500 text-white"
            onClick={openSetDialog}
          >
            <Plus size={16} color="#fff" />
            <Text className="ml-1 text-sm">设置本周排班</Text>
          </Button>
        )}

        {/* 值日详情列表 */}
        <Text className="block text-base font-semibold text-gray-800">
          本周值日详情
        </Text>
        <View className="space-y-2">
          {weekDates.map((date, i) => {
            const assignment = getAssignmentForDate(date)
            const students = assignment?.students || []
            const today = isToday(date)

            return (
              <Card key={date} className={`shadow-sm border-0 ${today ? 'ring-1 ring-orange-300' : ''}`}>
                <CardContent className="p-3">
                  <View className="flex items-center gap-3">
                    <View
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        today ? 'bg-orange-500' : 'bg-orange-50'
                      }`}
                    >
                      {today ? (
                        <Sun size={18} color="#fff" />
                      ) : (
                        <CalendarDays size={18} color="#F97316" />
                      )}
                    </View>
                    <View className="flex-1">
                      <View className="flex items-center gap-2">
                        <Text className="text-sm font-medium text-gray-800">
                          {WEEKDAYS[i]} {formatDateShort(date)}
                        </Text>
                        {today && (
                          <Badge className="bg-orange-500 text-white text-xs">
                            今天
                          </Badge>
                        )}
                      </View>
                      {students.length > 0 ? (
                        <View className="flex items-center gap-1 mt-1 flex-wrap">
                          {students.map((s) => (
                            <View
                              key={s}
                              className="flex items-center gap-1 bg-gray-50 rounded-lg px-2 py-1"
                            >
                              <User size={10} color="#6B7280" />
                              <Text className="text-xs text-gray-600">{s}</Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <Text className="text-xs text-gray-400">暂未安排</Text>
                      )}
                    </View>
                  </View>
                </CardContent>
              </Card>
            )
          })}
        </View>
      </View>

      {/* 设置排班弹窗 */}
      <Dialog open={showSetDialog} onOpenChange={setShowSetDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>设置排班</DialogTitle>
            <DialogDescription>
              {currentMonday} 周，多人用顿号分隔
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-80">
            <View className="space-y-3 p-1">
              {weekDates.map((date, i) => (
                <View key={date}>
                  <Label className="text-sm text-gray-700 mb-1 block">
                    {WEEKDAYS[i]} ({formatDateShort(date)})
                  </Label>
                  <View className="bg-gray-50 rounded-xl px-3 py-2">
                    <Input
                      className="w-full bg-transparent"
                      placeholder="如：张小明、李小红"
                      value={editStudents[i]}
                      onInput={(e) => {
                        const newStudents = [...editStudents]
                        newStudents[i] = e.detail.value
                        setEditStudents(newStudents)
                      }}
                    />
                  </View>
                </View>
              ))}
              <Button
                className="w-full bg-orange-500 text-white"
                onClick={handleSave}
              >
                保存排班
              </Button>
            </View>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </View>
  )
}

export default DutyPage
