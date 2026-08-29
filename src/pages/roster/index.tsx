import { useState, useEffect, useCallback } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Users, Plus, Upload, Trash2, CircleCheck, CircleX, Pencil } from 'lucide-react-taro'
import {
  getRosterList,
  rosterImport,
  rosterAdd,
  rosterDelete,
  type RosterItem,
} from '@/services/cloud'
import { getCurrentClassId } from '@/store'

export default function RosterPage() {
  const [rosterList, setRosterList] = useState<RosterItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showImport, setShowImport] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [importText, setImportText] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null)

  // 新增表单
  const [newStudentName, setNewStudentName] = useState('')
  const [newParentName, setNewParentName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newRelation, setNewRelation] = useState('家长')
  const [newRole, setNewRole] = useState('parent')

  // 编辑表单
  const [editingItem, setEditingItem] = useState<RosterItem | null>(null)
  const [editStudentName, setEditStudentName] = useState('')
  const [editParentName, setEditParentName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editRelation, setEditRelation] = useState('')
  const [editRole, setEditRole] = useState('parent')

  const classId = getCurrentClassId()

  const loadRoster = useCallback(async () => {
    if (!classId) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const list = await getRosterList(classId)
      setRosterList(list)
    } catch (err) {
      console.error('加载名单失败:', err)
      Taro.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }, [classId])

  useEffect(() => {
    loadRoster()
  }, [loadRoster])

  const handleImport = async () => {
    if (!importText.trim()) {
      Taro.showToast({ title: '请输入名单文本', icon: 'none' })
      return
    }
    setImporting(true)
    try {
      const result = await rosterImport({ class_id: classId, text: importText })
      setImportResult(result)
      setImportText('')
      await loadRoster()
      Taro.showToast({ title: `导入成功 ${result.imported} 条`, icon: 'success' })
    } catch (err) {
      const errMsg = (err as Error).message || '导入失败'
      console.error('导入失败:', errMsg)
      Taro.showToast({ title: errMsg, icon: 'none', duration: 3000 })
    } finally {
      setImporting(false)
    }
  }

  const handleAdd = async () => {
    if (!newStudentName || !newParentName || !newPhone) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }
    try {
      await rosterAdd({
        class_id: classId,
        student_name: newStudentName,
        parent_name: newParentName,
        phone: newPhone,
        relation: newRelation,
        role: newRole,
      })
      Taro.showToast({ title: '添加成功', icon: 'success' })
      setShowAdd(false)
      resetAddForm()
      await loadRoster()
    } catch (err) {
      console.error('添加失败:', err)
      Taro.showToast({ title: '添加失败', icon: 'none' })
    }
  }

  const handleDelete = async (rosterId: string, studentName: string) => {
    const res = await Taro.showModal({
      title: '确认删除',
      content: `确定删除学生"${studentName}"的名单记录？`,
    })
    if (!res.confirm) return

    try {
      await rosterDelete({ roster_id: rosterId, class_id: classId })
      Taro.showToast({ title: '已删除', icon: 'success' })
      await loadRoster()
    } catch (err) {
      console.error('删除失败:', err)
      Taro.showToast({ title: '删除失败', icon: 'none' })
    }
  }

  const handleEdit = (item: RosterItem) => {
    setEditingItem(item)
    setEditStudentName(item.student_name)
    setEditParentName(item.parent_name)
    setEditPhone(item.phone)
    setEditRelation(item.relation)
    setEditRole(item.role || 'parent')
  }

  const handleSaveEdit = async () => {
    if (!editStudentName || !editParentName || !editPhone) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }
    try {
      await rosterAdd({
        class_id: classId,
        student_name: editStudentName,
        parent_name: editParentName,
        phone: editPhone,
        relation: editRelation,
        role: editRole,
      })
      // 删除旧记录
      if (editingItem) {
        await rosterDelete({ roster_id: editingItem._id, class_id: classId })
      }
      Taro.showToast({ title: '修改成功', icon: 'success' })
      setEditingItem(null)
      await loadRoster()
    } catch (err) {
      console.error('修改失败:', err)
      Taro.showToast({ title: '修改失败', icon: 'none' })
    }
  }

  const resetAddForm = () => {
    setNewStudentName('')
    setNewParentName('')
    setNewPhone('')
    setNewRelation('家长')
    setNewRole('parent')
  }

  if (loading) {
    return (
      <View className="flex items-center justify-center min-h-screen bg-gray-50">
        <Text className="text-gray-500">加载中...</Text>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-8">
      {/* 头部统计 */}
      <View className="bg-white px-4 py-3 mb-3">
        <View className="flex items-center justify-between">
          <View className="flex items-center gap-2">
            <Users size={20} color="#5EC4A0" />
            <Text className="text-lg font-bold text-gray-800">家长名单</Text>
          </View>
          <Text className="text-sm text-gray-500">
            共 {rosterList.length} 人
          </Text>
        </View>
        <View className="flex items-center gap-4 mt-2">
          <View className="flex items-center gap-1">
            <CircleCheck size={14} color="#22C55E" />
            <Text className="text-xs text-gray-600">
              已加入 {rosterList.filter((r) => r.joined).length} 人
            </Text>
          </View>
          <View className="flex items-center gap-1">
            <CircleX size={14} color="#9CA3AF" />
            <Text className="text-xs text-gray-600">
              未加入 {rosterList.filter((r) => !r.joined).length} 人
            </Text>
          </View>
        </View>
      </View>

      {/* 操作按钮 */}
      <View className="flex gap-3 px-4 mb-4">
        <Button
          variant="outline"
          className="flex-1 flex items-center justify-center gap-2"
          onClick={() => setShowImport(true)}
        >
          <Upload size={16} color="#5EC4A0" />
          <Text>批量导入</Text>
        </Button>
        <Button
          className="flex-1 flex items-center justify-center gap-2 bg-[#5EC4A0]"
          onClick={() => setShowAdd(true)}
        >
          <Plus size={16} color="#fff" />
          <Text>手动添加</Text>
        </Button>
      </View>

      {/* 名单列表 */}
      <View className="px-4">
        {rosterList.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users size={48} color="#D1D5DB" />
              <Text className="block text-gray-400 mt-4">暂无名单数据</Text>
              <Text className="block text-gray-400 text-sm mt-2">
                点击上方「批量导入」或「手动添加」
              </Text>
            </CardContent>
          </Card>
        ) : (
          rosterList.map((item) => (
            <Card key={item._id} className="mb-3">
              <CardContent className="p-4">
                <View className="flex items-start justify-between">
                  <View className="flex-1">
                    <View className="flex items-center gap-2 mb-1">
                      <Text className="text-base font-bold text-gray-800">
                        {item.student_name}
                      </Text>
                      <Badge
                        variant={item.joined ? 'default' : 'secondary'}
                        className={item.joined ? 'bg-green-100 text-green-700' : ''}
                      >
                        {item.joined ? '已加入' : '未加入'}
                      </Badge>
                    </View>
                    <Text className="block text-sm text-gray-600">
                      家长：{item.parent_name}（{item.relation}）
                    </Text>
                    <Text className="block text-sm text-gray-500 mt-1">
                      手机：{item.phone}
                    </Text>
                  </View>
                  <View className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(item)}
                    >
                      <Pencil size={16} color="#5EC4A0" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item._id, item.student_name)}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </Button>
                  </View>
                </View>
              </CardContent>
            </Card>
          ))
        )}
      </View>

      {/* 批量导入弹窗 */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>批量导入名单</DialogTitle>
          </DialogHeader>
          <View className="space-y-4">
            <Text className="block text-sm text-gray-500">
              每行一条，格式：学生姓名,家长姓名,手机号,关系,角色（角色可选：parent/teacher/committee/head_teacher）
            </Text>
            <View className="bg-gray-50 rounded-xl p-3">
              <Textarea
                style={{ width: '100%', minHeight: '160px', backgroundColor: 'transparent' }}
                placeholder={'张小明,张先生,13800001234,父亲\n李小红,李女士,13900005678,母亲'}
                value={importText}
                onInput={(e) => setImportText(e.detail.value)}
              />
            </View>
            {importResult && (
              <View className="bg-green-50 rounded-lg p-3">
                <Text className="block text-sm text-green-700">
                  导入完成：新增 {importResult.imported} 人，跳过 {importResult.skipped} 人
                </Text>
              </View>
            )}
            <View className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setShowImport(false); setImportResult(null) }}>
                关闭
              </Button>
              <Button
                className="flex-1 bg-[#5EC4A0]"
                disabled={importing}
                onClick={handleImport}
              >
                {importing ? '导入中...' : '开始导入'}
              </Button>
            </View>
          </View>
        </DialogContent>
      </Dialog>

      {/* 手动添加弹窗 */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加学生信息</DialogTitle>
          </DialogHeader>
          <View className="space-y-3">
            <View>
              <Text className="block text-sm text-gray-600 mb-1">学生姓名 *</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent"
                  placeholder="请输入学生姓名"
                  value={newStudentName}
                  onInput={(e) => setNewStudentName(e.detail.value)}
                />
              </View>
            </View>
            <View>
              <Text className="block text-sm text-gray-600 mb-1">家长姓名 *</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent"
                  placeholder="请输入家长姓名"
                  value={newParentName}
                  onInput={(e) => setNewParentName(e.detail.value)}
                />
              </View>
            </View>
            <View>
              <Text className="block text-sm text-gray-600 mb-1">手机号 *</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent"
                  type="number"
                  placeholder="请输入手机号"
                  value={newPhone}
                  onInput={(e) => setNewPhone(e.detail.value)}
                />
              </View>
            </View>
            <View>
              <Text className="block text-sm text-gray-600 mb-1">与学生关系</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent"
                  placeholder="如：父亲、母亲"
                  value={newRelation}
                  onInput={(e) => setNewRelation(e.detail.value)}
                />
              </View>
            </View>
            <View>
              <Text className="block text-sm text-gray-600 mb-1">角色</Text>
              <View className="flex gap-2">
                <Button
                  variant={newRole === 'parent' ? 'default' : 'outline'}
                  size="sm"
                  className={newRole === 'parent' ? 'bg-[#5EC4A0]' : ''}
                  onClick={() => setNewRole('parent')}
                >
                  家长
                </Button>
                <Button
                  variant={newRole === 'teacher' ? 'default' : 'outline'}
                  size="sm"
                  className={newRole === 'teacher' ? 'bg-[#5EC4A0]' : ''}
                  onClick={() => setNewRole('teacher')}
                >
                  老师
                </Button>
                <Button
                  variant={newRole === 'committee' ? 'default' : 'outline'}
                  size="sm"
                  className={newRole === 'committee' ? 'bg-[#5EC4A0]' : ''}
                  onClick={() => setNewRole('committee')}
                >
                  家委
                </Button>
                <Button
                  variant={newRole === 'head_teacher' ? 'default' : 'outline'}
                  size="sm"
                  className={newRole === 'head_teacher' ? 'bg-[#5EC4A0]' : ''}
                  onClick={() => setNewRole('head_teacher')}
                >
                  班主任
                </Button>
              </View>
            </View>
            <View className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { setShowAdd(false); resetAddForm() }}>
                取消
              </Button>
              <Button className="flex-1 bg-[#5EC4A0]" onClick={handleAdd}>
                添加
              </Button>
            </View>
          </View>
        </DialogContent>
      </Dialog>

      {/* 编辑弹窗 */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑学生信息</DialogTitle>
          </DialogHeader>
          <View className="space-y-3">
            <View>
              <Text className="block text-sm text-gray-600 mb-1">学生姓名 *</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent"
                  placeholder="请输入学生姓名"
                  value={editStudentName}
                  onInput={(e) => setEditStudentName(e.detail.value)}
                />
              </View>
            </View>
            <View>
              <Text className="block text-sm text-gray-600 mb-1">家长姓名 *</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent"
                  placeholder="请输入家长姓名"
                  value={editParentName}
                  onInput={(e) => setEditParentName(e.detail.value)}
                />
              </View>
            </View>
            <View>
              <Text className="block text-sm text-gray-600 mb-1">手机号 *</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent"
                  type="number"
                  placeholder="请输入手机号"
                  value={editPhone}
                  onInput={(e) => setEditPhone(e.detail.value)}
                />
              </View>
            </View>
            <View>
              <Text className="block text-sm text-gray-600 mb-1">与学生关系</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input
                  className="w-full bg-transparent"
                  placeholder="如：父亲、母亲"
                  value={editRelation}
                  onInput={(e) => setEditRelation(e.detail.value)}
                />
              </View>
            </View>
            <View>
              <Text className="block text-sm text-gray-600 mb-1">角色</Text>
              <View className="flex gap-2">
                <Button
                  variant={editRole === 'parent' ? 'default' : 'outline'}
                  size="sm"
                  className={editRole === 'parent' ? 'bg-[#5EC4A0]' : ''}
                  onClick={() => setEditRole('parent')}
                >
                  家长
                </Button>
                <Button
                  variant={editRole === 'teacher' ? 'default' : 'outline'}
                  size="sm"
                  className={editRole === 'teacher' ? 'bg-[#5EC4A0]' : ''}
                  onClick={() => setEditRole('teacher')}
                >
                  老师
                </Button>
                <Button
                  variant={editRole === 'committee' ? 'default' : 'outline'}
                  size="sm"
                  className={editRole === 'committee' ? 'bg-[#5EC4A0]' : ''}
                  onClick={() => setEditRole('committee')}
                >
                  家委
                </Button>
                <Button
                  variant={editRole === 'head_teacher' ? 'default' : 'outline'}
                  size="sm"
                  className={editRole === 'head_teacher' ? 'bg-[#5EC4A0]' : ''}
                  onClick={() => setEditRole('head_teacher')}
                >
                  班主任
                </Button>
              </View>
            </View>
            <View className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditingItem(null)}>
                取消
              </Button>
              <Button className="flex-1 bg-[#5EC4A0]" onClick={handleSaveEdit}>
                保存
              </Button>
            </View>
          </View>
        </DialogContent>
      </Dialog>
    </View>
  )
}
