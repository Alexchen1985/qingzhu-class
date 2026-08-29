/**
 * 班费管理页面 - 云开发版
 * 数据来源：fee 云函数
 * teacher 角色禁止访问
 */
import { useState, useCallback, useEffect } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Wallet, Plus, Trash2, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Check, X } from 'lucide-react-taro'
import {
  getFeeRecordList, addFeeRecord, deleteFeeRecord,
  getFeeCollectionList, createFeeCollection,
  type CloudFeeRecord, type CloudFeeCollection
} from '@/services/cloud'
import { getCurrentClassId, getUserRole } from '@/store'

export default function FinancePage() {
  const [records, setRecords] = useState<CloudFeeRecord[]>([])
  const [grouped, setGrouped] = useState<Record<string, CloudFeeRecord[]>>({})
  const [months, setMonths] = useState<string[]>([])
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpense, setTotalExpense] = useState(0)
  const [balance, setBalance] = useState(0)
  const [collections, setCollections] = useState<CloudFeeCollection[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddRecord, setShowAddRecord] = useState(false)
  const [showAddCollection, setShowAddCollection] = useState(false)
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set())
  const [recordForm, setRecordForm] = useState({ type: 'expense' as 'income' | 'expense', amount: '', purpose: '', handler_name: '', occurred_at: '' })
  const [collectionForm, setCollectionForm] = useState({ title: '', amount_per_student: '', deadline: '', note: '' })

  const classId = getCurrentClassId()
  const role = getUserRole()
  const isManager = role === 'head_teacher' || role === 'committee'
  const isTeacher = role === 'teacher'

  const loadData = useCallback(async () => {
    if (!classId) return
    try {
      const [recordData, collData] = await Promise.all([
        getFeeRecordList(classId),
        isManager ? getFeeCollectionList(classId) : Promise.resolve([]),
      ])
      setRecords(recordData.records)
      setGrouped(recordData.grouped)
      setMonths(recordData.months)
      setTotalIncome(recordData.total_income)
      setTotalExpense(recordData.total_expense)
      setBalance(recordData.balance)
      setCollections(collData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [classId, isManager])

  useDidShow(() => {
    if (months.length === 0) setExpandedMonths(new Set([months[0]]))
    loadData()
  })

  useEffect(() => {
    if (months.length > 0 && expandedMonths.size === 0) {
      setExpandedMonths(new Set([months[0]]))
    }
  }, [months, expandedMonths.size])

  const formatAmount = (amount: number) => `¥${(amount / 100).toFixed(2)}`

  const handleAddRecord = async () => {
    if (!recordForm.amount || parseInt(recordForm.amount) <= 0) {
      Taro.showToast({ title: '请输入有效金额', icon: 'none' }); return
    }
    try {
      await addFeeRecord({
        class_id: classId!, type: recordForm.type,
        amount: Math.round(parseFloat(recordForm.amount) * 100),
        purpose: recordForm.purpose, handler_name: recordForm.handler_name,
        occurred_at: recordForm.occurred_at || new Date().toISOString().slice(0, 10),
      })
      Taro.showToast({ title: '记录成功', icon: 'success' })
      setShowAddRecord(false)
      setRecordForm({ type: 'expense', amount: '', purpose: '', handler_name: '', occurred_at: '' })
      loadData()
    } catch (e: unknown) {
      Taro.showToast({ title: (e as Error)?.message || '操作失败', icon: 'none' })
    }
  }

  const handleDeleteRecord = (recordId: string) => {
    Taro.showModal({
      title: '确认删除', content: '删除后不可恢复，确定删除？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await deleteFeeRecord(recordId, classId!)
            Taro.showToast({ title: '已删除', icon: 'success' })
            loadData()
          } catch (e: unknown) {
            Taro.showToast({ title: (e as Error)?.message || '操作失败', icon: 'none' })
          }
        }
      }
    })
  }

  const handleCreateCollection = async () => {
    if (!collectionForm.title || !collectionForm.amount_per_student) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' }); return
    }
    try {
      const result = await createFeeCollection({
        class_id: classId!, title: collectionForm.title,
        amount_per_student: Math.round(parseFloat(collectionForm.amount_per_student) * 100),
        deadline: collectionForm.deadline, note: collectionForm.note,
      })
      Taro.showToast({ title: `已创建，${result.student_count}名学生`, icon: 'success' })
      setShowAddCollection(false)
      setCollectionForm({ title: '', amount_per_student: '', deadline: '', note: '' })
      loadData()
    } catch (e: unknown) {
      Taro.showToast({ title: (e as Error)?.message || '操作失败', icon: 'none' })
    }
  }

  const toggleMonth = (month: string) => {
    const next = new Set(expandedMonths)
    if (next.has(month)) next.delete(month)
    else next.add(month)
    setExpandedMonths(next)
  }

  // teacher 角色禁止访问
  if (isTeacher) {
    return (
      <View className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-sm">
          <CardContent className="p-8 text-center">
            <Wallet size={48} className="mx-auto mb-4" color="#9CA3AF" />
            <Text className="block text-gray-500">任课老师无班费管理权限</Text>
          </CardContent>
        </Card>
      </View>
    )
  }

  return (
    <View className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <View className="bg-gradient-to-r from-[#5EC4A0] to-[#7DD4B4] px-4 pt-8 pb-8">
        <View className="flex items-center justify-between mb-4">
          <Text className="block text-white text-xl font-bold">班费管理</Text>
          {isManager && (
            <Button size="sm" className="bg-white bg-opacity-20 text-white border-white border-opacity-30" onClick={() => setShowAddRecord(true)}>
              <Plus size={16} className="mr-1" color="#fff" />
              <Text className="text-sm text-white">记账</Text>
            </Button>
          )}
        </View>
        <Card className="bg-white bg-opacity-15 border-white border-opacity-20">
          <CardContent className="p-4">
            <Text className="block text-white text-opacity-80 text-sm">当前余额</Text>
            <Text className="block text-white text-3xl font-bold mt-1">{formatAmount(balance)}</Text>
            <View className="flex gap-6 mt-3">
              <View className="flex items-center">
                <TrendingUp size={14} className="mr-1" color="rgba(255,255,255,0.8)" />
                <Text className="text-white text-opacity-80 text-xs mr-1">收入</Text>
                <Text className="text-white text-sm font-medium">{formatAmount(totalIncome)}</Text>
              </View>
              <View className="flex items-center">
                <TrendingDown size={14} className="mr-1" color="rgba(255,255,255,0.8)" />
                <Text className="text-white text-opacity-80 text-xs mr-1">支出</Text>
                <Text className="text-white text-sm font-medium">{formatAmount(totalExpense)}</Text>
              </View>
            </View>
          </CardContent>
        </Card>
        <Text className="block text-white text-opacity-60 text-xs mt-2 text-center">
          本小程序仅做记账登记，不收取任何费用，缴费请线下联系家委
        </Text>
      </View>

      <Tabs defaultValue="records" className="mt-4">
        <View className="px-4">
          <TabsList className="bg-white">
            <TabsTrigger value="records"><Text className="text-sm">收支明细</Text></TabsTrigger>
            {isManager && <TabsTrigger value="collections"><Text className="text-sm">收费登记</Text></TabsTrigger>}
          </TabsList>
        </View>

        <TabsContent value="records" className="mt-3">
          <ScrollView scrollY className="h-[calc(100vh-420px)] px-4">
            {loading ? (
              <View className="py-12 text-center"><Text className="block text-gray-400">加载中...</Text></View>
            ) : records.length === 0 ? (
              <View className="py-12 text-center">
                <Wallet size={48} className="mx-auto mb-4" color="#D1D5DB" />
                <Text className="block text-gray-400">暂无收支记录</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {months.map(month => {
                  const items = grouped[month] || []
                  const isExpanded = expandedMonths.has(month)
                  return (
                    <Card key={month}>
                      <CardContent className="p-0">
                        <View className="flex items-center justify-between px-4 py-3" onClick={() => toggleMonth(month)}>
                          <Text className="block text-sm font-medium text-gray-700">{month}</Text>
                          <View className="flex items-center">
                            <Text className="text-xs text-gray-400 mr-2">{items.length}条</Text>
                            {isExpanded ? <ChevronUp size={16} color="#9CA3AF" /> : <ChevronDown size={16} color="#9CA3AF" />}
                          </View>
                        </View>
                        {isExpanded && (
                          <View className="border-t border-gray-100">
                            {items.map(item => (
                              <View key={item._id} className="flex items-center px-4 py-3 border-b border-gray-50 last:border-0">
                                <View className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${item.type === 'income' ? 'bg-green-50' : 'bg-red-50'}`}>
                                  {item.type === 'income'
                                    ? <TrendingUp size={16} color="#16A34A" />
                                    : <TrendingDown size={16} color="#DC2626" />}
                                </View>
                                <View className="flex-1">
                                  <Text className="block text-sm text-gray-800">{item.purpose || '未备注'}</Text>
                                  <Text className="block text-xs text-gray-400">{item.occurred_at} · {item.handler_name}</Text>
                                </View>
                                <Text className={`text-sm font-medium ml-2 ${item.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                                  {item.type === 'income' ? '+' : '-'}{formatAmount(item.amount)}
                                </Text>
                                {isManager && (
                                  <View className="ml-2" onClick={(e) => { e.stopPropagation(); handleDeleteRecord(item._id) }}>
                                    <Trash2 size={16} color="#D1D5DB" />
                                  </View>
                                )}
                              </View>
                            ))}
                          </View>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </View>
            )}
          </ScrollView>
        </TabsContent>

        {isManager && (
          <TabsContent value="collections" className="mt-3">
            <ScrollView scrollY className="h-[calc(100vh-420px)] px-4">
              <View className="mb-3">
                <Button size="sm" className="bg-[#5EC4A0] text-white" onClick={() => setShowAddCollection(true)}>
                  <Plus size={14} className="mr-1" color="#fff" />
                  <Text className="text-sm text-white">新建收费项目</Text>
                </Button>
              </View>
              {collections.length === 0 ? (
                <View className="py-12 text-center">
                  <Text className="block text-gray-400">暂无收费项目</Text>
                </View>
              ) : (
                <View className="space-y-3">
                  {collections.map(coll => (
                    <Card key={coll._id}>
                      <CardContent className="p-4">
                        <View className="flex items-start justify-between mb-2">
                          <Text className="block text-base font-bold text-gray-800">{coll.title}</Text>
                          <Text className="text-sm font-medium text-[#4DB892]">{formatAmount(coll.amount_per_student)}/人</Text>
                        </View>
                        {coll.note ? <Text className="block text-sm text-gray-500 mb-2">{coll.note}</Text> : null}
                        <View className="flex gap-4 mb-3">
                          <Badge className="bg-green-50 text-green-600 border-green-200">
                            <Check size={12} className="mr-1" color="#16A34A" />
                            <Text className="text-xs text-green-600">已缴 {coll.paid_count}人</Text>
                          </Badge>
                          <Badge className="bg-red-50 text-red-600 border-red-200">
                            <X size={12} className="mr-1" color="#DC2626" />
                            <Text className="text-xs text-red-600">未缴 {coll.unpaid_count}人</Text>
                          </Badge>
                        </View>
                        {coll.unpaid_students.length > 0 && (
                          <View>
                            <Text className="block text-xs text-gray-400 mb-1">未缴名单：</Text>
                            <Text className="block text-xs text-red-500">{coll.unpaid_students.join('、')}</Text>
                          </View>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </View>
              )}
            </ScrollView>
          </TabsContent>
        )}
      </Tabs>

      {/* 添加收支记录弹窗 */}
      <Dialog open={showAddRecord} onOpenChange={setShowAddRecord}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle><Text className="text-lg font-bold text-gray-800">登记收支</Text></DialogTitle>
            <DialogDescription><Text className="text-sm text-gray-500">记录班费收入或支出</Text></DialogDescription>
          </DialogHeader>
          <View className="space-y-3 mt-2">
            <View className="flex gap-2">
              <Button variant={recordForm.type === 'income' ? 'default' : 'outline'}
                className={`flex-1 ${recordForm.type === 'income' ? 'bg-green-500 text-white' : 'border-gray-300'}`}
                onClick={() => setRecordForm({ ...recordForm, type: 'income' })}
              >
                <Text className={`text-sm ${recordForm.type === 'income' ? 'text-white' : 'text-gray-600'}`}>收入</Text>
              </Button>
              <Button variant={recordForm.type === 'expense' ? 'default' : 'outline'}
                className={`flex-1 ${recordForm.type === 'expense' ? 'bg-red-500 text-white' : 'border-gray-300'}`}
                onClick={() => setRecordForm({ ...recordForm, type: 'expense' })}
              >
                <Text className={`text-sm ${recordForm.type === 'expense' ? 'text-white' : 'text-gray-600'}`}>支出</Text>
              </Button>
            </View>
            <View>
              <Text className="block text-sm text-gray-600 mb-1">金额（元）*</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input className="w-full bg-transparent" type="digit" placeholder="0.00"
                  value={recordForm.amount} onInput={(e) => setRecordForm({ ...recordForm, amount: e.detail.value })}
                />
              </View>
            </View>
            <View>
              <Text className="block text-sm text-gray-600 mb-1">用途说明</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input className="w-full bg-transparent" placeholder="如：运动会物资采购"
                  value={recordForm.purpose} onInput={(e) => setRecordForm({ ...recordForm, purpose: e.detail.value })}
                />
              </View>
            </View>
            <View>
              <Text className="block text-sm text-gray-600 mb-1">经手人</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input className="w-full bg-transparent" placeholder="经手人姓名"
                  value={recordForm.handler_name} onInput={(e) => setRecordForm({ ...recordForm, handler_name: e.detail.value })}
                />
              </View>
            </View>
            <View>
              <Text className="block text-sm text-gray-600 mb-1">日期</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input className="w-full bg-transparent" placeholder="2024-10-15"
                  value={recordForm.occurred_at} onInput={(e) => setRecordForm({ ...recordForm, occurred_at: e.detail.value })}
                />
              </View>
            </View>
            <Button className="w-full bg-[#5EC4A0] text-white mt-4" onClick={handleAddRecord}>
              <Text className="text-white">确认记录</Text>
            </Button>
          </View>
        </DialogContent>
      </Dialog>

      {/* 创建收费项目弹窗 */}
      <Dialog open={showAddCollection} onOpenChange={setShowAddCollection}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle><Text className="text-lg font-bold text-gray-800">新建收费项目</Text></DialogTitle>
            <DialogDescription><Text className="text-sm text-gray-500">创建后将按名单生成缴费登记</Text></DialogDescription>
          </DialogHeader>
          <View className="space-y-3 mt-2">
            <View>
              <Text className="block text-sm text-gray-600 mb-1">项目名称 *</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input className="w-full bg-transparent" placeholder="如：秋季班费"
                  value={collectionForm.title} onInput={(e) => setCollectionForm({ ...collectionForm, title: e.detail.value })}
                />
              </View>
            </View>
            <View>
              <Text className="block text-sm text-gray-600 mb-1">每人金额（元）*</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input className="w-full bg-transparent" type="digit" placeholder="200.00"
                  value={collectionForm.amount_per_student} onInput={(e) => setCollectionForm({ ...collectionForm, amount_per_student: e.detail.value })}
                />
              </View>
            </View>
            <View>
              <Text className="block text-sm text-gray-600 mb-1">截止日期</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3">
                <Input className="w-full bg-transparent" placeholder="2024-09-30"
                  value={collectionForm.deadline} onInput={(e) => setCollectionForm({ ...collectionForm, deadline: e.detail.value })}
                />
              </View>
            </View>
            <View>
              <Text className="block text-sm text-gray-600 mb-1">备注</Text>
              <View className="bg-gray-50 rounded-2xl p-4">
                <Textarea className="w-full bg-transparent" placeholder="补充说明..."
                  style={{ width: '100%', minHeight: '60px', backgroundColor: 'transparent' }}
                  value={collectionForm.note} onInput={(e) => setCollectionForm({ ...collectionForm, note: e.detail.value })}
                />
              </View>
            </View>
            <Button className="w-full bg-[#5EC4A0] text-white mt-4" onClick={handleCreateCollection}>
              <Text className="text-white">创建</Text>
            </Button>
          </View>
        </DialogContent>
      </Dialog>
    </View>
  )
}
