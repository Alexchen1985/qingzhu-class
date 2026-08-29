import { useState, useCallback } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Wallet,
  Plus,
  TrendingUp,
  TrendingDown,
  Trash2,
  CircleArrowUp,
  CircleArrowDown,
} from 'lucide-react-taro'
import {
  initStorage,
  getFinances,
  addFinance,
  deleteFinance,
  getFinanceSummary,
  getProfile,
} from '@/store'
import type { FinanceRecord } from '@/store/types'

const FinancePage = () => {
  const [finances, setFinances] = useState<FinanceRecord[]>([])
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 })
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [isCommittee, setIsCommittee] = useState(false)

  // 新增记录表单
  const [formType, setFormType] = useState<'income' | 'expense'>('expense')
  const [formAmount, setFormAmount] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formPurpose, setFormPurpose] = useState('')
  const [formHandler, setFormHandler] = useState('')

  const loadData = useCallback(() => {
    initStorage()
    setFinances(getFinances())
    setSummary(getFinanceSummary())
    const profile = getProfile()
    setIsCommittee(profile.role === 'committee')
  }, [])

  useDidShow(() => {
    loadData()
  })

  const handleAdd = () => {
    if (!formAmount.trim() || !formPurpose.trim()) {
      Taro.showToast({ title: '请填写金额和用途', icon: 'none' })
      return
    }
    addFinance({
      type: formType,
      amount: parseFloat(formAmount) || 0,
      date: formDate.trim() || new Date().toISOString().split('T')[0],
      purpose: formPurpose.trim(),
      handler: formHandler.trim(),
    })
    resetForm()
    setShowAddDialog(false)
    loadData()
    Taro.showToast({ title: '添加成功', icon: 'success' })
  }

  const resetForm = () => {
    setFormType('expense')
    setFormAmount('')
    setFormDate('')
    setFormPurpose('')
    setFormHandler('')
  }

  const handleDelete = (id: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          deleteFinance(id)
          loadData()
          Taro.showToast({ title: '已删除', icon: 'success' })
        }
      },
    })
  }

  // 按月分组
  const groupByMonth = (records: FinanceRecord[]) => {
    const groups: Record<string, FinanceRecord[]> = {}
    records.forEach((r) => {
      const month = r.date.substring(0, 7)
      if (!groups[month]) groups[month] = []
      groups[month].push(r)
    })
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
  }

  const monthGroups = groupByMonth(finances)

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}月${d.getDate()}日`
  }

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-')
    return `${year}年${parseInt(month)}月`
  }

  return (
    <View className="min-h-full bg-orange-50 pb-6">
      <View className="px-4 pt-4 space-y-4">
        {/* 余额卡片 */}
        <Card className="shadow-sm border-0 bg-gradient-to-r from-orange-500 to-orange-400">
          <CardContent className="p-5">
            <View className="flex items-center gap-2 mb-2">
              <Wallet size={18} color="#fff" />
              <Text className="text-sm text-orange-100">当前余额</Text>
            </View>
            <Text className="block text-3xl font-bold text-white mb-4">
              ¥{summary.balance.toFixed(2)}
            </Text>
            <View className="flex items-center justify-between">
              <View className="flex items-center gap-1">
                <TrendingUp size={14} color="#BBF7D0" />
                <Text className="text-xs text-orange-100">收入</Text>
                <Text className="text-sm font-semibold text-white">
                  ¥{summary.totalIncome.toFixed(2)}
                </Text>
              </View>
              <View className="flex items-center gap-1">
                <TrendingDown size={14} color="#FED7AA" />
                <Text className="text-xs text-orange-100">支出</Text>
                <Text className="text-sm font-semibold text-white">
                  ¥{summary.totalExpense.toFixed(2)}
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* 添加按钮 */}
        {isCommittee && (
          <Button
            className="w-full bg-orange-500 text-white"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus size={16} color="#fff" />
            <Text className="ml-1 text-sm">新增记录</Text>
          </Button>
        )}

        {/* 收支明细 */}
        <Text className="block text-base font-semibold text-gray-800">
          收支明细
        </Text>

        {monthGroups.length > 0 ? (
          monthGroups.map(([month, records]) => (
            <View key={month}>
              <Text className="block text-sm font-medium text-gray-500 mb-2">
                {formatMonth(month)}
              </Text>
              <View className="space-y-2">
                {records.map((record) => (
                  <Card key={record.id} className="shadow-sm border-0">
                    <CardContent className="p-3">
                      <View className="flex items-center gap-3">
                        <View
                          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            record.type === 'income' ? 'bg-emerald-50' : 'bg-orange-50'
                          }`}
                        >
                          {record.type === 'income' ? (
                            <CircleArrowUp size={18} color="#10B981" />
                          ) : (
                            <CircleArrowDown size={18} color="#F97316" />
                          )}
                        </View>
                        <View className="flex-1">
                          <Text className="block text-sm text-gray-800">
                            {record.purpose}
                          </Text>
                          <View className="flex items-center gap-2 mt-1">
                            <Text className="text-xs text-gray-400">
                              {formatDate(record.date)}
                            </Text>
                            {record.handler && (
                              <Text className="text-xs text-gray-400">
                                经手人：{record.handler}
                              </Text>
                            )}
                          </View>
                        </View>
                        <View className="flex items-center gap-1">
                          <Text
                            className={`text-base font-semibold ${
                              record.type === 'income'
                                ? 'text-emerald-500'
                                : 'text-orange-500'
                            }`}
                          >
                            {record.type === 'income' ? '+' : '-'}¥
                            {record.amount.toFixed(2)}
                          </Text>
                          {isCommittee && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-auto"
                              onClick={() => handleDelete(record.id)}
                            >
                              <Trash2 size={13} color="#EF4444" />
                            </Button>
                          )}
                        </View>
                      </View>
                    </CardContent>
                  </Card>
                ))}
              </View>
              <Separator className="my-3" />
            </View>
          ))
        ) : (
          <View className="flex flex-col items-center py-16">
            <Wallet size={48} color="#D1D5DB" />
            <Text className="text-sm text-gray-400 mt-3">暂无收支记录</Text>
          </View>
        )}
      </View>

      {/* 新增记录弹窗 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新增收支记录</DialogTitle>
            <DialogDescription>记录班费收入或支出</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            <View className="space-y-4 p-1">
              {/* 类型选择 */}
              <View>
                <Label className="text-sm text-gray-700 mb-2 block">类型</Label>
                <View className="flex gap-2">
                  <Button
                    variant={formType === 'income' ? 'default' : 'outline'}
                    size="sm"
                    className={formType === 'income' ? 'bg-emerald-500 text-white' : ''}
                    onClick={() => setFormType('income')}
                  >
                    <TrendingUp size={14} color={formType === 'income' ? '#fff' : '#6B7280'} />
                    <Text className="ml-1 text-xs">收入</Text>
                  </Button>
                  <Button
                    variant={formType === 'expense' ? 'default' : 'outline'}
                    size="sm"
                    className={formType === 'expense' ? 'bg-orange-500 text-white' : ''}
                    onClick={() => setFormType('expense')}
                  >
                    <TrendingDown size={14} color={formType === 'expense' ? '#fff' : '#6B7280'} />
                    <Text className="ml-1 text-xs">支出</Text>
                  </Button>
                </View>
              </View>
              <View>
                <Label className="text-sm text-gray-700 mb-1 block">金额 *</Label>
                <View className="bg-gray-50 rounded-xl px-3 py-2">
                  <Input className="w-full bg-transparent" placeholder="请输入金额" type="digit" value={formAmount} onInput={(e) => setFormAmount(e.detail.value)} />
                </View>
              </View>
              <View>
                <Label className="text-sm text-gray-700 mb-1 block">日期</Label>
                <View className="bg-gray-50 rounded-xl px-3 py-2">
                  <Input className="w-full bg-transparent" placeholder="如：2025-09-15" value={formDate} onInput={(e) => setFormDate(e.detail.value)} />
                </View>
              </View>
              <View>
                <Label className="text-sm text-gray-700 mb-1 block">用途说明 *</Label>
                <View className="bg-gray-50 rounded-xl px-3 py-2">
                  <Input className="w-full bg-transparent" placeholder="如：教室布置材料采购" value={formPurpose} onInput={(e) => setFormPurpose(e.detail.value)} />
                </View>
              </View>
              <View>
                <Label className="text-sm text-gray-700 mb-1 block">经手人</Label>
                <View className="bg-gray-50 rounded-xl px-3 py-2">
                  <Input className="w-full bg-transparent" placeholder="如：李爸爸" value={formHandler} onInput={(e) => setFormHandler(e.detail.value)} />
                </View>
              </View>
              <Button className="w-full bg-orange-500 text-white" onClick={handleAdd}>
                添加
              </Button>
            </View>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </View>
  )
}

export default FinancePage
