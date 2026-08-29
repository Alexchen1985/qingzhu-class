import { useState, useCallback } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Megaphone,
  Calendar,
  Wallet,
  CalendarDays,
  ChevronRight,
  Bell,
  Clock,
  Users,
} from 'lucide-react-taro'
import {
  initStorage,
  getNotices,
  getActivities,
  getFinanceSummary,
  getProfile,
} from '@/store'
import type { Notice, Activity } from '@/store/types'

const IndexPage = () => {
  const [notices, setNotices] = useState<Notice[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [balance, setBalance] = useState(0)
  const [studentName, setStudentName] = useState('')

  const loadData = useCallback(() => {
    initStorage()
    const allNotices = getNotices()
    setNotices(allNotices.slice(0, 3))
    const allActivities = getActivities().filter((a) => a.status === 'ongoing')
    setActivities(allActivities.slice(0, 2))
    const summary = getFinanceSummary()
    setBalance(summary.balance)
    const profile = getProfile()
    setStudentName(profile.studentName)
  }, [])

  useDidShow(() => {
    loadData()
  })

  const unreadCount = notices.filter(
    (n) => n.needConfirm && !n.readBy.includes('current')
  ).length

  const navigateTo = (url: string) => {
    Taro.navigateTo({ url })
  }

  const switchTab = (url: string) => {
    Taro.switchTab({ url })
  }

  return (
    <View className="min-h-full bg-orange-50 pb-6">
      {/* 顶部欢迎 */}
      <View className="bg-gradient-to-r from-orange-500 to-orange-400 px-4 pt-6 pb-8">
        <Text className="block text-xl font-bold text-white">
          家委助手
        </Text>
        <Text className="block text-sm text-orange-100 mt-1">
          {studentName ? `${studentName} 家长，您好` : '欢迎使用'}
        </Text>
      </View>

      <View className="px-4 -mt-4 space-y-4">
        {/* 最新公告 */}
        <Card className="shadow-sm border-0">
          <CardContent className="p-4">
            <View className="flex items-center justify-between mb-3">
              <View className="flex items-center gap-2">
                <Megaphone size={18} color="#F97316" />
                <Text className="text-base font-semibold text-gray-800">
                  最新公告
                </Text>
                {unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white text-xs px-2 py-0">
                    {unreadCount}
                  </Badge>
                )}
              </View>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => switchTab('/pages/notice/index')}
              >
                <Text className="text-xs text-gray-500">查看全部</Text>
                <ChevronRight size={14} color="#9CA3AF" />
              </Button>
            </View>
            {notices.length > 0 ? (
              <View className="space-y-2">
                {notices.map((notice) => (
                  <View
                    key={notice.id}
                    className="flex items-center gap-2 py-2"
                  >
                    {notice.isTop && (
                      <Badge className="bg-orange-100 text-orange-600 text-xs flex-shrink-0">
                        置顶
                      </Badge>
                    )}
                    <Text className="text-sm text-gray-700 flex-1 truncate block">
                      {notice.title}
                    </Text>
                    {notice.needConfirm &&
                      !notice.readBy.includes('current') && (
                        <View className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                      )}
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-sm text-gray-400 text-center py-4 block">
                暂无公告
              </Text>
            )}
          </CardContent>
        </Card>

        {/* 活动报名 */}
        <Card className="shadow-sm border-0">
          <CardContent className="p-4">
            <View className="flex items-center justify-between mb-3">
              <View className="flex items-center gap-2">
                <Calendar size={18} color="#3B82F6" />
                <Text className="text-base font-semibold text-gray-800">
                  活动报名
                </Text>
              </View>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => switchTab('/pages/activity/index')}
              >
                <Text className="text-xs text-gray-500">查看全部</Text>
                <ChevronRight size={14} color="#9CA3AF" />
              </Button>
            </View>
            {activities.length > 0 ? (
              <View className="space-y-3">
                {activities.map((activity) => (
                  <View
                    key={activity.id}
                    className="bg-blue-50 rounded-xl p-3"
                  >
                    <Text className="block text-sm font-medium text-gray-800 mb-1">
                      {activity.name}
                    </Text>
                    <View className="flex items-center gap-1 mb-1">
                      <Clock size={12} color="#6B7280" />
                      <Text className="text-xs text-gray-500">
                        {activity.time}
                      </Text>
                    </View>
                    <View className="flex items-center justify-between">
                      <View className="flex items-center gap-1">
                        <Users size={12} color="#6B7280" />
                        <Text className="text-xs text-gray-500">
                          已报名 {activity.registrations.length}/
                          {activity.maxCount} 人
                        </Text>
                      </View>
                      <Badge className="bg-emerald-100 text-emerald-600 text-xs">
                        进行中
                      </Badge>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-sm text-gray-400 text-center py-4 block">
                暂无进行中的活动
              </Text>
            )}
          </CardContent>
        </Card>

        {/* 班费概览 */}
        <Card className="shadow-sm border-0">
          <CardContent className="p-4">
            <View className="flex items-center justify-between mb-2">
              <View className="flex items-center gap-2">
                <Wallet size={18} color="#10B981" />
                <Text className="text-base font-semibold text-gray-800">
                  班费余额
                </Text>
              </View>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => switchTab('/pages/finance/index')}
              >
                <Text className="text-xs text-gray-500">详情</Text>
                <ChevronRight size={14} color="#9CA3AF" />
              </Button>
            </View>
            <Text className="block text-2xl font-bold text-orange-500">
              ¥{balance.toFixed(2)}
            </Text>
            <Text className="block text-xs text-gray-400 mt-1">
              收支透明公开，随时可查
            </Text>
          </CardContent>
        </Card>

        {/* 快捷功能 */}
        <Card className="shadow-sm border-0">
          <CardContent className="p-4">
            <Text className="block text-base font-semibold text-gray-800 mb-3">
              快捷功能
            </Text>
            <View className="grid grid-cols-4 gap-3">
              <View
                className="flex flex-col items-center gap-1"
                onClick={() => navigateTo('/pages/duty/index')}
              >
                <View className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center">
                  <CalendarDays size={22} color="#F97316" />
                </View>
                <Text className="text-xs text-gray-600">值日排班</Text>
              </View>
              <View
                className="flex flex-col items-center gap-1"
                onClick={() => switchTab('/pages/notice/index')}
              >
                <View className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <Megaphone size={22} color="#3B82F6" />
                </View>
                <Text className="text-xs text-gray-600">班级公告</Text>
              </View>
              <View
                className="flex flex-col items-center gap-1"
                onClick={() => switchTab('/pages/activity/index')}
              >
                <View className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <Calendar size={22} color="#10B981" />
                </View>
                <Text className="text-xs text-gray-600">活动报名</Text>
              </View>
              <View
                className="flex flex-col items-center gap-1"
                onClick={() => switchTab('/pages/finance/index')}
              >
                <View className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center">
                  <Wallet size={22} color="#8B5CF6" />
                </View>
                <Text className="text-xs text-gray-600">班费管理</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        <Separator className="my-2" />

        {/* 底部提示 */}
        <View className="flex items-center justify-center gap-1 py-2">
          <Bell size={12} color="#9CA3AF" />
          <Text className="text-xs text-gray-400">
            家委助手 — 让班级管理更高效
          </Text>
        </View>
      </View>
    </View>
  )
}

export default IndexPage
