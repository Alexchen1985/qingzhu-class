import { useState, useCallback } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Megaphone,
  Plus,
  Check,
  Pin,
  Eye,
  Trash2,
  Users,
} from 'lucide-react-taro'
import {
  initStorage,
  getNotices,
  addNotice,
  confirmReadNotice,
  toggleNoticeTop,
  deleteNotice,
  getProfile,
} from '@/store'
import type { Notice } from '@/store/types'

const NoticePage = () => {
  const [notices, setNotices] = useState<Notice[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newNeedConfirm, setNewNeedConfirm] = useState(true)
  const [newIsTop, setNewIsTop] = useState(false)
  const [isCommittee, setIsCommittee] = useState(false)

  const loadData = useCallback(() => {
    initStorage()
    setNotices(getNotices())
    const profile = getProfile()
    setIsCommittee(profile.role === 'committee')
  }, [])

  useDidShow(() => {
    loadData()
  })

  const handleAdd = () => {
    if (!newTitle.trim() || !newContent.trim()) {
      Taro.showToast({ title: '请填写标题和内容', icon: 'none' })
      return
    }
    addNotice({
      title: newTitle.trim(),
      content: newContent.trim(),
      needConfirm: newNeedConfirm,
      isTop: newIsTop,
      images: [],
    })
    setNewTitle('')
    setNewContent('')
    setNewNeedConfirm(true)
    setNewIsTop(false)
    setShowAddDialog(false)
    loadData()
    Taro.showToast({ title: '发布成功', icon: 'success' })
  }

  const handleConfirmRead = (noticeId: string) => {
    confirmReadNotice(noticeId, 'current')
    loadData()
    Taro.showToast({ title: '已确认阅读', icon: 'success' })
  }

  const handleToggleTop = (noticeId: string) => {
    toggleNoticeTop(noticeId)
    loadData()
  }

  const handleDelete = (noticeId: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '删除后不可恢复，确定要删除吗？',
      success: (res) => {
        if (res.confirm) {
          deleteNotice(noticeId)
          loadData()
          Taro.showToast({ title: '已删除', icon: 'success' })
        }
      },
    })
  }

  const openDetail = (notice: Notice) => {
    setSelectedNotice(notice)
    setShowDetailDialog(true)
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  return (
    <View className="min-h-full bg-orange-50 pb-6">
      <View className="px-4 pt-4 space-y-3">
        {/* 发布按钮（仅家委可见） */}
        {isCommittee && (
          <Button
            className="w-full bg-orange-500 text-white"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus size={16} color="#fff" />
            <Text className="ml-1 text-sm">发布公告</Text>
          </Button>
        )}

        {/* 公告列表 */}
        {notices.length > 0 ? (
          notices.map((notice) => {
            const isRead = notice.readBy.includes('current')
            return (
              <Card key={notice.id} className="shadow-sm border-0">
                <CardContent className="p-4">
                  <View className="flex items-start gap-2">
                    <View className="flex-1" onClick={() => openDetail(notice)}>
                      <View className="flex items-center gap-2 mb-1">
                        {notice.isTop && (
                          <Badge className="bg-orange-100 text-orange-600 text-xs flex-shrink-0">
                            置顶
                          </Badge>
                        )}
                        {notice.needConfirm && !isRead && (
                          <Badge className="bg-red-100 text-red-500 text-xs flex-shrink-0">
                            未读
                          </Badge>
                        )}
                        {notice.needConfirm && isRead && (
                          <Badge className="bg-emerald-100 text-emerald-600 text-xs flex-shrink-0">
                            已读
                          </Badge>
                        )}
                      </View>
                      <Text className="block text-base font-semibold text-gray-800 mb-1">
                        {notice.title}
                      </Text>
                      <Text className="block text-sm text-gray-500 line-clamp-2">
                        {notice.content}
                      </Text>
                      <Text className="block text-xs text-gray-400 mt-2">
                        {formatDate(notice.createdAt)}
                      </Text>
                    </View>
                  </View>

                  {/* 操作区 */}
                  <View className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    {notice.needConfirm && !isRead && (
                      <Button
                        size="sm"
                        className="bg-emerald-500 text-white"
                        onClick={() => handleConfirmRead(notice.id)}
                      >
                        <Check size={14} color="#fff" />
                        <Text className="ml-1 text-xs">确认已读</Text>
                      </Button>
                    )}
                    {isCommittee && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleTop(notice.id)}
                        >
                          <Pin size={14} color={notice.isTop ? '#F97316' : '#9CA3AF'} />
                          <Text className="ml-1 text-xs text-gray-500">
                            {notice.isTop ? '取消置顶' : '置顶'}
                          </Text>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(notice.id)}
                        >
                          <Trash2 size={14} color="#EF4444" />
                          <Text className="ml-1 text-xs text-red-500">删除</Text>
                        </Button>
                      </>
                    )}
                    {notice.needConfirm && (
                      <View className="flex items-center gap-1 ml-auto">
                        <Users size={12} color="#9CA3AF" />
                        <Text className="text-xs text-gray-400">
                          {notice.readBy.length}人已读
                        </Text>
                      </View>
                    )}
                  </View>
                </CardContent>
              </Card>
            )
          })
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
            <DialogDescription>发布班级通知，家长可查看并确认</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            <View className="space-y-4 p-1">
              <View>
                <Label className="text-sm text-gray-700 mb-1 block">
                  公告标题
                </Label>
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
                <Label className="text-sm text-gray-700 mb-1 block">
                  公告内容
                </Label>
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
              <View className="flex items-center justify-between">
                <View className="flex items-center gap-2">
                  <Text className="text-sm text-gray-700">需要确认阅读</Text>
                </View>
                <Switch
                  checked={newNeedConfirm}
                  onCheckedChange={setNewNeedConfirm}
                />
              </View>
              <View className="flex items-center justify-between">
                <View className="flex items-center gap-2">
                  <Text className="text-sm text-gray-700">置顶公告</Text>
                </View>
                <Switch checked={newIsTop} onCheckedChange={setNewIsTop} />
              </View>
              <Button
                className="w-full bg-orange-500 text-white"
                onClick={handleAdd}
              >
                发布
              </Button>
            </View>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* 公告详情弹窗 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {selectedNotice?.title || ''}
            </DialogTitle>
            <DialogDescription>
              {selectedNotice ? formatDate(selectedNotice.createdAt) : ''}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-80">
            <View className="p-1">
              <Text className="block text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {selectedNotice?.content || ''}
              </Text>
              {selectedNotice?.needConfirm && (
                <View className="mt-4 p-3 bg-gray-50 rounded-xl">
                  <View className="flex items-center gap-1 mb-1">
                    <Eye size={14} color="#6B7280" />
                    <Text className="text-xs text-gray-500">
                      已读统计：{selectedNotice.readBy.length}人已读
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </View>
  )
}

export default NoticePage
