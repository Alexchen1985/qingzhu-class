import { useState, useCallback } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Megaphone,
  Plus,
  Check,
  Pin,
  Eye,
  Users,
  Camera,
  CircleCheck,
  CircleX,
} from 'lucide-react-taro'
import {
  getAnnouncementList,
  publishAnnouncement,
  markAnnouncementRead,
  getAnnouncementStats,
  approveAnnouncement,
  uploadImageToCloud,
  getTempFileURL,
  type CloudAnnouncement,
  type AnnouncementStats,
} from '@/services/cloud'

const TYPE_COLORS: Record<string, { bar: string; label: string; bg: string; text: string }> = {
  official: { bar: 'bg-red-500', label: '官方通知', bg: 'bg-red-50', text: 'text-red-700' },
  teacher: { bar: 'bg-yellow-500', label: '学科通知', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  committee: { bar: 'bg-blue-500', label: '家委通知', bg: 'bg-blue-50', text: 'text-blue-700' },
}

const NoticePage = () => {
  const [announcements, setAnnouncements] = useState<CloudAnnouncement[]>([])
  const [role, setRole] = useState('parent')
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showStatsDialog, setShowStatsDialog] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<CloudAnnouncement | null>(null)
  const [stats, setStats] = useState<AnnouncementStats | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newNeedConfirm, setNewNeedConfirm] = useState(true)
  const [newIsTop, setNewIsTop] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)

  const classId = Taro.getStorageSync('current_class_id') || ''
  const isWeapp = Taro.getEnv() === Taro.ENV_TYPE.WEAPP

  const isManager = role === 'head_teacher' || role === 'committee'
  const canPublish = role === 'head_teacher' || role === 'teacher' || role === 'committee'

  const pendingList = announcements.filter((a) => a.approve_status === 'pending')
  const approvedList = announcements.filter(
    (a) => a.approve_status === 'approved' || (isManager && a.approve_status !== 'pending')
  )

  const loadData = useCallback(async () => {
    if (!classId) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const result = await getAnnouncementList(classId)
      setAnnouncements(result.announcements || [])
      setRole(result.role || 'parent')
    } catch (err) {
      console.error('加载公告失败:', err)
    } finally {
      setLoading(false)
    }
  }, [classId])

  useDidShow(() => {
    loadData()
  })

  const handlePublish = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      Taro.showToast({ title: '请填写标题和内容', icon: 'none' })
      return
    }
    setPublishing(true)
    try {
      const result = await publishAnnouncement({
        class_id: classId,
        title: newTitle.trim(),
        content: newContent.trim(),
        need_confirm: newNeedConfirm,
        is_pinned: newIsTop,
      })
      Taro.showToast({ title: result.tip || '发布成功', icon: 'none', duration: 2000 })
      setNewTitle('')
      setNewContent('')
      setNewNeedConfirm(true)
      setNewIsTop(false)
      setShowAddDialog(false)
      await loadData()
    } catch (err) {
      console.error('发布失败:', err)
      Taro.showToast({ title: '发布失败', icon: 'none' })
    } finally {
      setPublishing(false)
    }
  }

  const handleMarkRead = async (announcementId: string) => {
    try {
      await markAnnouncementRead({
        announcement_id: announcementId,
        class_id: classId,
      })
      Taro.showToast({ title: '已确认阅读', icon: 'success' })
      await loadData()
    } catch (err) {
      console.error('标记已读失败:', err)
    }
  }

  const handleApprove = async (announcementId: string) => {
    try {
      await approveAnnouncement({
        announcement_id: announcementId,
        result: 'approved',
      })
      Taro.showToast({ title: '已通过', icon: 'success' })
      await loadData()
    } catch (err) {
      console.error('审批失败:', err)
    }
  }

  const handleReject = async () => {
    if (!rejectTarget) return
    try {
      await approveAnnouncement({
        announcement_id: rejectTarget,
        result: 'rejected',
        reason: rejectReason,
      })
      Taro.showToast({ title: '已驳回', icon: 'none' })
      setShowRejectDialog(false)
      setRejectReason('')
      setRejectTarget(null)
      await loadData()
    } catch (err) {
      console.error('驳回失败:', err)
    }
  }

  const openDetail = async (announcement: CloudAnnouncement) => {
    setSelectedAnnouncement(announcement)
    setShowDetailDialog(true)
  }

  const openStats = async (announcement: CloudAnnouncement) => {
    try {
      const result = await getAnnouncementStats({
        announcement_id: announcement._id,
        class_id: classId,
      })
      setStats(result)
      setSelectedAnnouncement(announcement)
      setShowStatsDialog(true)
    } catch (err) {
      console.error('获取统计失败:', err)
    }
  }

  const handleChooseImage = async () => {
    if (!isWeapp) {
      Taro.showToast({ title: '仅小程序支持图片上传', icon: 'none' })
      return
    }
    try {
      const res = await Taro.chooseImage({
        count: 3,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
      })
      const fileIDs: string[] = []
      for (const path of res.tempFilePaths) {
        const fileID = await uploadImageToCloud(path, classId)
        fileIDs.push(fileID)
      }
      if (fileIDs.length > 0) {
        const urls = await getTempFileURL(fileIDs)
        Taro.showToast({ title: `已上传${urls.length}张图片`, icon: 'success' })
      }
    } catch (err) {
      console.error('图片上传失败:', err)
      Taro.showToast({ title: '图片上传失败', icon: 'none' })
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  const renderAnnouncementCard = (item: CloudAnnouncement) => {
    const typeConfig = TYPE_COLORS[item.type] || TYPE_COLORS.official
    const isRead = item.is_read

    return (
      <Card key={item._id} className="shadow-sm border-0 mb-3 overflow-hidden">
        <View className="flex">
          {/* 左侧色条 */}
          <View className={`w-1 ${typeConfig.bar}`} />
          <View className="flex-1">
            <CardContent className="p-4">
              <View onClick={() => openDetail(item)}>
                <View className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge className={`${typeConfig.bg} ${typeConfig.text} text-xs`}>
                    {typeConfig.label}
                  </Badge>
                  {item.is_pinned && (
                    <Badge className="bg-[#E0F5ED] text-[#4DB892] text-xs">
                      置顶
                    </Badge>
                  )}
                  {item.approve_status === 'pending' && (
                    <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                      待审批
                    </Badge>
                  )}
                  {item.approve_status === 'rejected' && (
                    <Badge className="bg-red-100 text-red-600 text-xs">
                      已驳回
                    </Badge>
                  )}
                  {item.need_confirm && !isRead && item.approve_status === 'approved' && (
                    <Badge className="bg-red-100 text-red-500 text-xs">
                      未读
                    </Badge>
                  )}
                  {item.need_confirm && isRead && (
                    <Badge className="bg-emerald-100 text-emerald-600 text-xs">
                      已读
                    </Badge>
                  )}
                </View>
                <Text className="block text-base font-semibold text-gray-800 mb-1">
                  {item.title}
                </Text>
                <Text className="block text-sm text-gray-500 line-clamp-2">
                  {item.content}
                </Text>
                <Text className="block text-xs text-gray-400 mt-2">
                  {item.author_name} · {formatDate(item.created_at)}
                </Text>
              </View>

              {/* 操作区 */}
              <View className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 flex-wrap">
                {item.need_confirm && !isRead && item.approve_status === 'approved' && (
                  <Button
                    size="sm"
                    className="bg-emerald-500 text-white"
                    onClick={() => handleMarkRead(item._id)}
                  >
                    <Check size={14} color="#fff" />
                    <Text className="ml-1 text-xs">确认已读</Text>
                  </Button>
                )}
                {role === 'head_teacher' && item.approve_status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      className="bg-green-500 text-white"
                      onClick={() => handleApprove(item._id)}
                    >
                      <CircleCheck size={14} color="#fff" />
                      <Text className="ml-1 text-xs">通过</Text>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setRejectTarget(item._id)
                        setShowRejectDialog(true)
                      }}
                    >
                      <CircleX size={14} color="#EF4444" />
                      <Text className="ml-1 text-xs text-red-500">驳回</Text>
                    </Button>
                  </>
                )}
                {item.need_confirm && (
                  <View className="flex items-center gap-1 ml-auto">
                    <Users size={12} color="#9CA3AF" />
                    <Text className="text-xs text-gray-400">
                      {item.read_count || 0}人已读
                    </Text>
                    {isManager && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openStats(item)}
                      >
                        <Eye size={12} color="#6B7280" />
                        <Text className="ml-1 text-xs text-gray-500">名单</Text>
                      </Button>
                    )}
                  </View>
                )}
              </View>
            </CardContent>
          </View>
        </View>
      </Card>
    )
  }

  if (loading) {
    return (
      <View className="flex items-center justify-center min-h-screen bg-[#F0F8F4]">
        <Text className="text-gray-500">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="min-h-full bg-[#F0F8F4] pb-6">
      <View className="px-4 pt-4 space-y-3">
        {/* 发布按钮 */}
        {canPublish && (
          <Button
            className="w-full bg-[#5EC4A0] text-white"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus size={16} color="#fff" />
            <Text className="ml-1 text-sm">发布公告</Text>
          </Button>
        )}

        {/* 待审批区（仅班主任可见） */}
        {role === 'head_teacher' && pendingList.length > 0 && (
          <View className="mb-4">
            <View className="flex items-center gap-2 mb-2">
              <Pin size={16} color="#F59E0B" />
              <Text className="text-sm font-bold text-gray-700">
                待审批 ({pendingList.length})
              </Text>
            </View>
            {pendingList.map(renderAnnouncementCard)}
          </View>
        )}

        {/* 公告列表 */}
        {approvedList.length > 0 ? (
          approvedList.map(renderAnnouncementCard)
        ) : (
          <View className="flex flex-col items-center py-16">
            <Megaphone size={48} color="#D1D5DB" />
            <Text className="text-sm text-gray-400 mt-3">暂无公告</Text>
          </View>
        )}
      </View>

      {/* 发布公告弹窗 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>发布公告</DialogTitle>
            <DialogDescription>
              {role === 'committee'
                ? '家委通知需班主任审批后公示'
                : '发布班级通知，家长可查看并确认'}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            <View className="space-y-4 p-1">
              <View>
                <Label className="text-sm text-gray-700 mb-1 block">公告标题</Label>
                <View className="bg-gray-50 rounded-xl px-3 py-2">
                  <Input
                    className="w-full bg-transparent"
                    placeholder="请输入公告标题"
                    value={newTitle}
                    onInput={(e) => setNewTitle(e.detail.value)}
                  />
                </View>
              </View>
              <View>
                <Label className="text-sm text-gray-700 mb-1 block">公告内容</Label>
                <View className="bg-gray-50 rounded-xl p-3">
                  <Textarea
                    style={{
                      width: '100%',
                      minHeight: '120px',
                      backgroundColor: 'transparent',
                    }}
                    placeholder="请输入公告内容"
                    value={newContent}
                    onInput={(e) => setNewContent(e.detail.value)}
                    maxlength={500}
                  />
                </View>
              </View>
              {/* 图片上传（仅小程序端） */}
              {isWeapp && (
                <Button variant="outline" onClick={handleChooseImage}>
                  <Camera size={16} color="#6B7280" />
                  <Text className="ml-2 text-sm text-gray-600">添加图片</Text>
                </Button>
              )}
              <View className="flex items-center justify-between">
                <Text className="text-sm text-gray-700">需要确认阅读</Text>
                <Switch checked={newNeedConfirm} onCheckedChange={setNewNeedConfirm} />
              </View>
              {(role === 'head_teacher') && (
                <View className="flex items-center justify-between">
                  <Text className="text-sm text-gray-700">置顶公告</Text>
                  <Switch checked={newIsTop} onCheckedChange={setNewIsTop} />
                </View>
              )}
              <Button
                className="w-full bg-[#5EC4A0] text-white"
                disabled={publishing}
                onClick={handlePublish}
              >
                {publishing ? '发布中...' : '发布'}
              </Button>
            </View>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* 公告详情弹窗 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedAnnouncement?.title || ''}</DialogTitle>
            <DialogDescription>
              {selectedAnnouncement ? formatDate(selectedAnnouncement.created_at) : ''}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-80">
            <View className="p-1">
              {selectedAnnouncement?.approve_status === 'rejected' && (
                <View className="bg-red-50 rounded-lg p-3 mb-3">
                  <Text className="text-sm text-red-600">
                    已驳回{selectedAnnouncement.approve_reason ? `：${selectedAnnouncement.approve_reason}` : ''}
                  </Text>
                </View>
              )}
              <Text className="block text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {selectedAnnouncement?.content || ''}
              </Text>
              {selectedAnnouncement?.images && selectedAnnouncement.images.length > 0 && (
                <View className="flex flex-wrap gap-2 mt-3">
                  {selectedAnnouncement.images.map((img, idx) => (
                    <Image
                      key={idx}
                      src={img}
                      className="rounded-lg"
                      style={{ width: '100px', height: '100px' }}
                      mode="aspectFill"
                    />
                  ))}
                </View>
              )}
              {selectedAnnouncement?.need_confirm && (
                <View className="mt-4 p-3 bg-gray-50 rounded-xl">
                  <View className="flex items-center gap-1">
                    <Eye size={14} color="#6B7280" />
                    <Text className="text-xs text-gray-500">
                      已读统计：{selectedAnnouncement.read_count || 0}人已读
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* 已读名单弹窗 */}
      <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>已读名单</DialogTitle>
            <DialogDescription>
              {selectedAnnouncement?.title || ''} - 共{stats?.read_count || 0}人已读
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-64">
            <View className="space-y-2 p-1">
              {stats?.readers && stats.readers.length > 0 ? (
                stats.readers.map((reader, idx) => (
                  <View
                    key={idx}
                    className="flex items-center justify-between py-2 border-b border-gray-100"
                  >
                    <Text className="text-sm text-gray-700">{reader.member_name}</Text>
                    <Text className="text-xs text-gray-400">
                      {reader.read_at ? formatDate(reader.read_at) : ''}
                    </Text>
                  </View>
                ))
              ) : (
                <Text className="block text-center text-gray-400 py-4">暂无已读记录</Text>
              )}
            </View>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* 驳回原因弹窗 */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>驳回公告</DialogTitle>
            <DialogDescription>请填写驳回原因（可选）</DialogDescription>
          </DialogHeader>
          <View className="space-y-4">
            <View className="bg-gray-50 rounded-xl p-3">
              <Textarea
                style={{
                  width: '100%',
                  minHeight: '80px',
                  backgroundColor: 'transparent',
                }}
                placeholder="请输入驳回原因..."
                value={rejectReason}
                onInput={(e) => setRejectReason(e.detail.value)}
              />
            </View>
            <View className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowRejectDialog(false)}>
                取消
              </Button>
              <Button className="flex-1 bg-red-500" onClick={handleReject}>
                确认驳回
              </Button>
            </View>
          </View>
        </DialogContent>
      </Dialog>
    </View>
  )
}

export default NoticePage
