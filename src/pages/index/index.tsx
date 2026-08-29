import { useState, useCallback } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Megaphone,
  Calendar,
  Wallet,
  CalendarDays,
  ChevronRight,
  Bell,
  Clock,
  Users,
  FileText,
  GraduationCap,
} from 'lucide-react-taro'
import {
  getAnnouncementList,
  getFeeRecordList,
  getActivityList,
  type CloudAnnouncement,
  type CloudActivity,
} from '@/services/cloud'
import { getCurrentClassId, getUserRole, getRoleLabel } from '@/store'

const IndexPage = () => {
  const [announcements, setAnnouncements] = useState<CloudAnnouncement[]>([])
  const [activities, setActivities] = useState<CloudActivity[]>([])
  const [balance, setBalance] = useState(0)
  const [studentName, setStudentName] = useState('')
  const [className, setClassName] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    const classId = getCurrentClassId()
    if (!classId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // 获取公告列表
      const announcementResult = await getAnnouncementList(classId)
      setAnnouncements(announcementResult.announcements || [])
      
      // 获取活动列表
      const activityList = await getActivityList(classId)
      setActivities(activityList || [])
      
      // 获取班费统计
      const feeResult = await getFeeRecordList(classId)
      const totalIncome = feeResult.total_income || 0
      const totalExpense = feeResult.total_expense || 0
      setBalance(totalIncome - totalExpense)
      
      // 获取用户信息
      const roleEn = getUserRole() || 'parent'
      setRole(getRoleLabel(roleEn))
      
      // 从本地缓存获取班级和学生信息
      const currentClass = Taro.getStorageSync('app_current_class')
      if (currentClass) {
        setClassName(currentClass.className || '')
        setStudentName(currentClass.studentName || '')
      }
    } catch (err) {
      console.error('加载数据失败:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useDidShow(() => {
    loadData()
  })

  const unreadCount = announcements.filter(
    (a) => a.need_confirm && !a.is_read && a.approve_status === 'approved'
  ).length

  const activeActivityCount = activities.filter(
    (a) => a.status === 'active'
  ).length

  const handleNavigate = (url: string) => {
    Taro.navigateTo({ url })
  }

  const handleSwitchTab = (url: string) => {
    Taro.switchTab({ url })
  }

  // 快捷入口 5 宫格
  const quickEntries = [
    { icon: Megaphone, label: '公告', color: '#EF4444', url: '/pages/notice/index' },
    { icon: Calendar, label: '活动', color: '#3B82F6', url: '/pages/activity/index' },
    { icon: Wallet, label: '班费', color: '#10B981', url: '/pages/finance/index' },
    { icon: CalendarDays, label: '排班', color: '#F59E0B', url: '/pages/duty/index' },
    { icon: Users, label: '名单', color: '#8B5CF6', url: '/pages/roster/index' },
  ]

  if (loading) {
    return (
      <View className="flex items-center justify-center min-h-screen bg-[#F0F8F4]">
        <Text className="text-gray-500">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="min-h-full bg-[#F0F8F4] pb-6">
      {/* 顶部班级信息卡片 */}
      <View className="bg-gradient-to-r from-[#5EC4A0] to-[#4AA886] px-4 pt-8 pb-6">
        <View className="flex items-center justify-between mb-4">
          <View className="flex-1">
            <View className="flex items-center gap-2 mb-2">
              <GraduationCap size={28} color="#fff" />
              <Text className="block text-2xl font-bold text-white">{className || '未加入班级'}</Text>
            </View>
            <Text className="block text-base text-white opacity-90">
              {studentName ? `${studentName} 的家长` : '欢迎'} · {role}
            </Text>
          </View>
          <View className="w-12 h-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
            <Bell size={24} color="#fff" />
          </View>
        </View>

        {/* 三大统计卡片 */}
        <View className="flex gap-3">
          {/* 公告概览 */}
          <View
            className="flex-1 bg-white bg-opacity-20 rounded-xl p-3"
            onClick={() => handleSwitchTab('/pages/notice/index')}
          >
            <View className="flex items-center gap-1 mb-1">
              <Megaphone size={14} color="#fff" />
              <Text className="block text-xs text-white opacity-80">公告</Text>
            </View>
            <Text className="block text-lg font-bold text-white">
              {unreadCount > 0 ? `${unreadCount}条未读` : '全部已读'}
            </Text>
          </View>

          {/* 活动概览 */}
          <View
            className="flex-1 bg-white bg-opacity-20 rounded-xl p-3"
            onClick={() => handleSwitchTab('/pages/activity/index')}
          >
            <View className="flex items-center gap-1 mb-1">
              <Calendar size={14} color="#fff" />
              <Text className="block text-xs text-white opacity-80">活动</Text>
            </View>
            <Text className="block text-lg font-bold text-white">
              {activeActivityCount > 0 ? `${activeActivityCount}个进行中` : '暂无活动'}
            </Text>
          </View>

          {/* 班费概览 */}
          <View
            className="flex-1 bg-white bg-opacity-20 rounded-xl p-3"
            onClick={() => handleSwitchTab('/pages/finance/index')}
          >
            <View className="flex items-center gap-1 mb-1">
              <Wallet size={14} color="#fff" />
              <Text className="block text-xs text-white opacity-80">班费余额</Text>
            </View>
            <Text className="block text-lg font-bold text-white">
              ¥{(balance / 100).toFixed(0)}
            </Text>
          </View>
        </View>
      </View>

      <View className="px-4 -mt-3 space-y-4">
        {/* 5宫格快捷入口 */}
        <Card className="shadow-sm border-0">
          <CardContent className="p-4">
            <Text className="block text-base font-semibold text-gray-800 mb-3">
              快捷功能
            </Text>
            <View className="flex flex-wrap justify-between">
              {quickEntries.map((entry) => (
                <View
                  key={entry.label}
                  className="flex flex-col items-center w-[18%] mb-2"
                  onClick={() => handleNavigate(entry.url)}
                >
                  <View
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-1"
                    style={{ backgroundColor: entry.color + '20' }}
                  >
                    <entry.icon size={24} color={entry.color} />
                  </View>
                  <Text className="block text-xs text-gray-700 text-center">
                    {entry.label}
                  </Text>
                </View>
              ))}
            </View>
          </CardContent>
        </Card>

        {/* 待办事项区 */}
        {unreadCount > 0 && (
          <Card className="shadow-sm border-0">
            <CardContent className="p-4">
              <View className="flex items-center gap-2 mb-3">
                <Clock size={16} color="#5EC4A0" />
                <Text className="block text-base font-semibold text-gray-800">
                  待办事项
                </Text>
              </View>

              <View
                className="flex items-center justify-between py-2"
                onClick={() => handleSwitchTab('/pages/notice/index')}
              >
                <View className="flex items-center gap-2">
                  <View className="w-2 h-2 rounded-full bg-red-500" />
                  <Text className="block text-sm text-gray-700">
                    {unreadCount} 条公告待确认
                  </Text>
                </View>
                <ChevronRight size={16} color="#9CA3AF" />
              </View>
            </CardContent>
          </Card>
        )}

        {/* 最新公告 */}
        {announcements.length > 0 && (
          <Card className="shadow-sm border-0">
            <CardContent className="p-4">
              <View className="flex items-center justify-between mb-3">
                <View className="flex items-center gap-2">
                  <FileText size={16} color="#5EC4A0" />
                  <Text className="block text-base font-semibold text-gray-800">
                    最新公告
                  </Text>
                </View>
                <View onClick={() => handleSwitchTab('/pages/notice/index')}>
                  <Text className="block text-xs text-[#5EC4A0]">查看全部</Text>
                </View>
              </View>

              {announcements.slice(0, 2).map((notice) => (
                <View
                  key={notice._id}
                  className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0"
                  onClick={() => handleSwitchTab('/pages/notice/index')}
                >
                  <View
                    className="w-1 h-12 rounded-full mt-1"
                    style={{
                      backgroundColor:
                        notice.type === 'official'
                          ? '#EF4444'
                          : notice.type === 'teacher'
                          ? '#F59E0B'
                          : '#3B82F6',
                    }}
                  />
                  <View className="flex-1">
                    <View className="flex items-center gap-2 mb-1">
                      <Text className="block text-sm font-medium text-gray-800 flex-1 truncate">
                        {notice.title}
                      </Text>
                      {notice.need_confirm && !notice.is_read && (
                        <Badge className="bg-red-500 text-white text-xs">未读</Badge>
                      )}
                    </View>
                    <Text className="block text-xs text-gray-500">
                      {notice.created_at?.slice(0, 10) || ''}
                    </Text>
                  </View>
                </View>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 空状态 */}
        {announcements.length === 0 && (
          <Card className="shadow-sm border-0">
            <CardContent className="p-8 flex flex-col items-center">
              <Bell size={48} color="#D1D5DB" />
              <Text className="block text-sm text-gray-400 mt-3">
                暂无动态信息
              </Text>
              <Text className="block text-xs text-gray-400 mt-1">
                公告和活动将在这里显示
              </Text>
            </CardContent>
          </Card>
        )}
      </View>
    </View>
  )
}

export default IndexPage
