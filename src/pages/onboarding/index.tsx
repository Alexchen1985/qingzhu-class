import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  School,
  Users,
  Copy,
  Check,
  GraduationCap,
} from 'lucide-react-taro'
import { classCreate, classJoin } from '@/services/cloud'
import type { ClassCreateResult, CurrentClass } from '@/services/cloud-types'

const STORAGE_KEY_LOGIN = 'app_login_result'
const STORAGE_KEY_CURRENT_CLASS = 'app_current_class'

const OnboardingPage = () => {
  const [activeTab, setActiveTab] = useState('join')

  // 创建班级表单
  const [schoolName, setSchoolName] = useState('')
  const [className, setClassName] = useState('')
  const [grade, setGrade] = useState('')
  const [createResult, setCreateResult] = useState<ClassCreateResult | null>(null)
  const [creating, setCreating] = useState(false)

  // 加入班级表单
  const [inviteCode, setInviteCode] = useState('')
  const [studentName, setStudentName] = useState('')
  const [parentName, setParentName] = useState('')
  const [phone, setPhone] = useState('')
  const [relation, setRelation] = useState('')
  const [joining, setJoining] = useState(false)

  const [copiedField, setCopiedField] = useState('')

  const handleCreate = async () => {
    if (!schoolName.trim() || !className.trim() || !grade.trim()) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }
    setCreating(true)
    try {
      const result = await classCreate({
        school_name: schoolName.trim(),
        class_name: className.trim(),
        grade: grade.trim(),
      })
      setCreateResult(result)

      // 设置当前班级
      const cc: CurrentClass = {
        classId: result.classInfo._id,
        className: result.classInfo.name,
        role: 'head_teacher',
        studentName: '',
        parentName: '',
        phone: '',
        relation: '',
      }
      Taro.setStorageSync(STORAGE_KEY_CURRENT_CLASS, cc)

      // 更新登录缓存
      const loginData = Taro.getStorageSync(STORAGE_KEY_LOGIN) || { openid: '', classes: [] }
      loginData.classes.push({
        member: {
          _id: '',
          class_id: result.classInfo._id,
          openid: loginData.openid,
          role: 'head_teacher',
          student_name: '',
          parent_name: '',
          phone: '',
          relation: '',
          status: 'active',
          created_at: new Date().toISOString(),
        },
        className: result.classInfo.name,
        schoolName: result.schoolName,
      })
      Taro.setStorageSync(STORAGE_KEY_LOGIN, loginData)
    } catch (err) {
      Taro.showToast({ title: (err as Error).message || '创建失败', icon: 'none' })
    } finally {
      setCreating(false)
    }
  }

  const handleJoin = async () => {
    if (!inviteCode.trim() || !studentName.trim() || !parentName.trim() || !phone.trim()) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }
    setJoining(true)
    try {
      const result = await classJoin({
        invite_code: inviteCode.trim(),
        student_name: studentName.trim(),
        parent_name: parentName.trim(),
        phone: phone.trim(),
        relation: relation.trim(),
      })

      // 设置当前班级
      const cc: CurrentClass = {
        classId: result.member.class_id,
        className: result.className,
        role: result.member.role,
        studentName: result.member.student_name,
        parentName: result.member.parent_name,
        phone: result.member.phone,
        relation: result.member.relation,
      }
      Taro.setStorageSync(STORAGE_KEY_CURRENT_CLASS, cc)

      // 更新登录缓存
      const loginData = Taro.getStorageSync(STORAGE_KEY_LOGIN) || { openid: '', classes: [] }
      loginData.classes.push({
        member: result.member,
        className: result.className,
        schoolName: result.schoolName,
      })
      Taro.setStorageSync(STORAGE_KEY_LOGIN, loginData)

      Taro.showToast({ title: '加入成功', icon: 'success' })
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/index/index' })
      }, 1500)
    } catch (err) {
      Taro.showToast({ title: (err as Error).message || '加入失败', icon: 'none' })
    } finally {
      setJoining(false)
    }
  }

  const copyCode = (code: string, label: string) => {
    Taro.setClipboardData({
      data: code,
      success: () => {
        setCopiedField(label)
        setTimeout(() => setCopiedField(''), 2000)
      },
    })
  }

  // 创建成功后的展示
  if (createResult) {
    return (
      <View className="min-h-full bg-orange-50 px-4 pt-8">
        <View className="flex flex-col items-center mb-6">
          <View className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
            <Check size={32} color="#10B981" />
          </View>
          <Text className="block text-xl font-bold text-gray-800">班级创建成功</Text>
          <Text className="block text-sm text-gray-500 mt-1">
            {createResult.schoolName} {createResult.classInfo.name}
          </Text>
        </View>

        <Card className="shadow-sm border-0 mb-4">
          <CardContent className="p-4">
            <Text className="block text-base font-semibold text-gray-800 mb-4">
              邀请码（分享给对应角色）
            </Text>
            <View className="space-y-3">
              <View className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
                <View>
                  <Text className="block text-sm font-medium text-gray-700">家长邀请码</Text>
                  <Text className="block text-xs text-gray-400 mt-1">发给家长群</Text>
                </View>
                <View className="flex items-center gap-2">
                  <Text className="text-lg font-bold text-orange-500">{createResult.classInfo.invite_code}</Text>
                  <Button variant="ghost" size="sm" onClick={() => copyCode(createResult.classInfo.invite_code, 'parent')}>
                    <Copy size={14} color="#6B7280" />
                    <Text className="ml-1 text-xs text-gray-500">{copiedField === 'parent' ? '已复制' : '复制'}</Text>
                  </Button>
                </View>
              </View>
              <View className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                <View>
                  <Text className="block text-sm font-medium text-gray-700">教师邀请码</Text>
                  <Text className="block text-xs text-gray-400 mt-1">发给任课老师</Text>
                </View>
                <View className="flex items-center gap-2">
                  <Text className="text-lg font-bold text-blue-500">{createResult.classInfo.teacher_invite_code}</Text>
                  <Button variant="ghost" size="sm" onClick={() => copyCode(createResult.classInfo.teacher_invite_code, 'teacher')}>
                    <Copy size={14} color="#6B7280" />
                    <Text className="ml-1 text-xs text-gray-500">{copiedField === 'teacher' ? '已复制' : '复制'}</Text>
                  </Button>
                </View>
              </View>
              <View className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                <View>
                  <Text className="block text-sm font-medium text-gray-700">家委邀请码</Text>
                  <Text className="block text-xs text-gray-400 mt-1">发给家委成员</Text>
                </View>
                <View className="flex items-center gap-2">
                  <Text className="text-lg font-bold text-emerald-500">{createResult.classInfo.committee_invite_code}</Text>
                  <Button variant="ghost" size="sm" onClick={() => copyCode(createResult.classInfo.committee_invite_code, 'committee')}>
                    <Copy size={14} color="#6B7280" />
                    <Text className="ml-1 text-xs text-gray-500">{copiedField === 'committee' ? '已复制' : '复制'}</Text>
                  </Button>
                </View>
              </View>
            </View>
          </CardContent>
        </Card>

        <Button
          className="w-full bg-orange-500 text-white"
          onClick={() => Taro.switchTab({ url: '/pages/index/index' })}
        >
          进入首页
        </Button>
      </View>
    )
  }

  return (
    <View className="min-h-full bg-orange-50 px-4 pt-8">
      <View className="flex flex-col items-center mb-6">
        <View className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-3">
          <GraduationCap size={32} color="#F97316" />
        </View>
        <Text className="block text-xl font-bold text-gray-800">欢迎使用家委助手</Text>
        <Text className="block text-sm text-gray-500 mt-1">创建或加入班级开始使用</Text>
      </View>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="join">加入班级</TabsTrigger>
          <TabsTrigger value="create">创建班级</TabsTrigger>
        </TabsList>

        <TabsContent value="join">
          <Card className="shadow-sm border-0 mt-3">
            <CardContent className="p-4">
              <ScrollArea className="max-h-full">
                <View className="space-y-4">
                  <View>
                    <Label className="text-sm text-gray-700 mb-1 block">邀请码 *</Label>
                    <View className="bg-gray-50 rounded-xl px-3 py-2">
                      <Input className="w-full bg-transparent" placeholder="请输入6位邀请码" value={inviteCode} onInput={(e) => setInviteCode(e.detail.value)} maxlength={6} />
                    </View>
                  </View>
                  <View>
                    <Label className="text-sm text-gray-700 mb-1 block">学生姓名 *</Label>
                    <View className="bg-gray-50 rounded-xl px-3 py-2">
                      <Input className="w-full bg-transparent" placeholder="请输入学生姓名" value={studentName} onInput={(e) => setStudentName(e.detail.value)} />
                    </View>
                  </View>
                  <View>
                    <Label className="text-sm text-gray-700 mb-1 block">家长姓名 *</Label>
                    <View className="bg-gray-50 rounded-xl px-3 py-2">
                      <Input className="w-full bg-transparent" placeholder="请输入家长姓名" value={parentName} onInput={(e) => setParentName(e.detail.value)} />
                    </View>
                  </View>
                  <View>
                    <Label className="text-sm text-gray-700 mb-1 block">手机号 *</Label>
                    <View className="bg-gray-50 rounded-xl px-3 py-2">
                      <Input className="w-full bg-transparent" placeholder="请输入手机号" type="number" value={phone} onInput={(e) => setPhone(e.detail.value)} maxlength={11} />
                    </View>
                  </View>
                  <View>
                    <Label className="text-sm text-gray-700 mb-1 block">与学生关系</Label>
                    <View className="bg-gray-50 rounded-xl px-3 py-2">
                      <Input className="w-full bg-transparent" placeholder="如：父亲、母亲、祖父" value={relation} onInput={(e) => setRelation(e.detail.value)} />
                    </View>
                  </View>
                  <Button className="w-full bg-orange-500 text-white" onClick={handleJoin} disabled={joining}>
                    <Users size={16} color="#fff" />
                    <Text className="ml-1 text-sm">{joining ? '加入中...' : '加入班级'}</Text>
                  </Button>
                </View>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create">
          <Card className="shadow-sm border-0 mt-3">
            <CardContent className="p-4">
              <ScrollArea className="max-h-full">
                <View className="space-y-4">
                  <View>
                    <Label className="text-sm text-gray-700 mb-1 block">学校名称 *</Label>
                    <View className="bg-gray-50 rounded-xl px-3 py-2">
                      <Input className="w-full bg-transparent" placeholder="如：南京市XX小学" value={schoolName} onInput={(e) => setSchoolName(e.detail.value)} />
                    </View>
                  </View>
                  <View>
                    <Label className="text-sm text-gray-700 mb-1 block">班级名称 *</Label>
                    <View className="bg-gray-50 rounded-xl px-3 py-2">
                      <Input className="w-full bg-transparent" placeholder="如：三（2）班" value={className} onInput={(e) => setClassName(e.detail.value)} />
                    </View>
                  </View>
                  <View>
                    <Label className="text-sm text-gray-700 mb-1 block">年级 *</Label>
                    <View className="bg-gray-50 rounded-xl px-3 py-2">
                      <Input className="w-full bg-transparent" placeholder="如：三年级" value={grade} onInput={(e) => setGrade(e.detail.value)} />
                    </View>
                  </View>
                  <Button className="w-full bg-orange-500 text-white" onClick={handleCreate} disabled={creating}>
                    <School size={16} color="#fff" />
                    <Text className="ml-1 text-sm">{creating ? '创建中...' : '创建班级'}</Text>
                  </Button>
                  <Text className="block text-xs text-gray-400 text-center">
                    创建后您将成为班主任，可生成邀请码邀请老师和家长加入
                  </Text>
                </View>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </View>
  )
}

export default OnboardingPage
