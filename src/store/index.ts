import Taro from '@tarojs/taro'
import type {
  Notice,
  Activity,
  Registration,
  FinanceRecord,
  DutySchedule,
  DutyAssignment,
  UserProfile,
} from './types'

const KEYS = {
  notices: 'app_notices',
  activities: 'app_activities',
  finances: 'app_finances',
  duties: 'app_duties',
  profile: 'app_profile',
  initialized: 'app_initialized',
  currentClassId: 'app_current_class_id',
  currentUserRole: 'app_current_user_role',
  currentStudentName: 'app_current_student_name',
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function getStorage<T>(key: string, fallback: T): T {
  try {
    const val = Taro.getStorageSync(key)
    return val ? (val as T) : fallback
  } catch {
    return fallback
  }
}

function setStorage<T>(key: string, value: T): void {
  Taro.setStorageSync(key, value)
}

// ---- 初始化 ----

const DEFAULT_NOTICES: Notice[] = [
  {
    id: 'n1',
    title: '欢迎加入三年级二班大家庭',
    content:
      '各位家长好！新学期开始了，家委会已经就位。本学期我们将继续做好班级服务工作，欢迎大家积极参与班级事务。如有任何建议，请随时联系家委会成员。',
    needConfirm: true,
    isTop: true,
    images: [],
    createdAt: '2025-09-01T08:00:00',
    readBy: ['parent1', 'parent2', 'parent3'],
  },
  {
    id: 'n2',
    title: '关于秋季运动会的通知',
    content:
      '学校将于10月15日举行秋季运动会，请家长们为孩子准备好运动服和运动鞋。当天需要5名家长志愿者协助，有意愿的家长请在活动报名页面报名。',
    needConfirm: false,
    isTop: false,
    images: [],
    createdAt: '2025-09-10T10:00:00',
    readBy: ['parent1'],
  },
]

const DEFAULT_ACTIVITIES: Activity[] = [
  {
    id: 'a1',
    name: '秋季运动会志愿者招募',
    time: '2025-10-15 08:00-16:00',
    location: '学校操场',
    maxCount: 5,
    deadline: '2025-10-10T18:00:00',
    remark: '需要协助维持秩序和拍照',
    status: 'ongoing',
    createdAt: '2025-09-10T10:00:00',
    registrations: [
      {
        id: 'r1',
        studentName: '张小明',
        parentContact: '138****1234',
        remark: '可以全天参与',
        createdAt: '2025-09-11T09:00:00',
      },
      {
        id: 'r2',
        studentName: '李小红',
        parentContact: '139****5678',
        remark: '上午可以参与',
        createdAt: '2025-09-12T14:00:00',
      },
    ],
  },
  {
    id: 'a2',
    name: '班级图书角捐书活动',
    time: '2025-09-20 09:00-17:00',
    location: '教室',
    maxCount: 30,
    deadline: '2025-09-18T20:00:00',
    remark: '每人可捐1-3本适合小学生阅读的课外书',
    status: 'ongoing',
    createdAt: '2025-09-08T08:00:00',
    registrations: [],
  },
]

const DEFAULT_FINANCES: FinanceRecord[] = [
  {
    id: 'f1',
    type: 'income',
    amount: 5000,
    date: '2025-09-01',
    purpose: '本学期班费收缴（每人100元，共50人）',
    handler: '王妈妈',
    createdAt: '2025-09-01T10:00:00',
  },
  {
    id: 'f2',
    type: 'expense',
    amount: 320,
    date: '2025-09-05',
    purpose: '教室布置材料采购（气球、彩带、贴纸等）',
    handler: '李爸爸',
    createdAt: '2025-09-05T15:00:00',
  },
  {
    id: 'f3',
    type: 'expense',
    amount: 150,
    date: '2025-09-08',
    purpose: '班级图书角书架购买',
    handler: '张妈妈',
    createdAt: '2025-09-08T11:00:00',
  },
]

const DEFAULT_DUTIES: DutySchedule[] = [
  {
    id: 'd1',
    weekStart: '2025-09-15',
    assignments: [
      { date: '2025-09-15', students: ['张小明', '李小红'] },
      { date: '2025-09-16', students: ['王小华', '赵小丽'] },
      { date: '2025-09-17', students: ['孙小强', '周小美'] },
      { date: '2025-09-18', students: ['吴小龙', '郑小凤'] },
      { date: '2025-09-19', students: ['陈小明', '林小燕'] },
    ],
  },
  {
    id: 'd2',
    weekStart: '2025-09-22',
    assignments: [
      { date: '2025-09-22', students: ['刘小杰', '黄小玲'] },
      { date: '2025-09-23', students: ['杨小伟', '许小芳'] },
      { date: '2025-09-24', students: ['何小军', '吕小琴'] },
      { date: '2025-09-25', students: ['朱小波', '徐小兰'] },
      { date: '2025-09-26', students: ['马小飞', '胡小菊'] },
    ],
  },
]

const DEFAULT_PROFILE: UserProfile = {
  studentName: '张小明',
  parentName: '张先生',
  contact: '138****1234',
  role: 'committee',
}

export function initStorage(): void {
  const initialized = Taro.getStorageSync(KEYS.initialized)
  if (initialized) return
  setStorage(KEYS.notices, DEFAULT_NOTICES)
  setStorage(KEYS.activities, DEFAULT_ACTIVITIES)
  setStorage(KEYS.finances, DEFAULT_FINANCES)
  setStorage(KEYS.duties, DEFAULT_DUTIES)
  setStorage(KEYS.profile, DEFAULT_PROFILE)
  Taro.setStorageSync(KEYS.initialized, true)
}

// ---- 公告 ----

export function getNotices(): Notice[] {
  return getStorage<Notice[]>(KEYS.notices, DEFAULT_NOTICES)
}

export function addNotice(notice: Omit<Notice, 'id' | 'createdAt' | 'readBy'>): Notice {
  const notices = getNotices()
  const newNotice: Notice = {
    ...notice,
    id: genId(),
    createdAt: new Date().toISOString(),
    readBy: [],
  }
  notices.unshift(newNotice)
  setStorage(KEYS.notices, notices)
  return newNotice
}

export function confirmReadNotice(noticeId: string, parentId: string): void {
  const notices = getNotices()
  const notice = notices.find((n) => n.id === noticeId)
  if (notice && !notice.readBy.includes(parentId)) {
    notice.readBy.push(parentId)
    setStorage(KEYS.notices, notices)
  }
}

export function toggleNoticeTop(noticeId: string): void {
  const notices = getNotices()
  const notice = notices.find((n) => n.id === noticeId)
  if (notice) {
    notice.isTop = !notice.isTop
    setStorage(KEYS.notices, notices)
  }
}

export function deleteNotice(noticeId: string): void {
  const notices = getNotices().filter((n) => n.id !== noticeId)
  setStorage(KEYS.notices, notices)
}

// ---- 活动 ----

export function getActivities(): Activity[] {
  return getStorage<Activity[]>(KEYS.activities, DEFAULT_ACTIVITIES)
}

export function addActivity(
  activity: Omit<Activity, 'id' | 'createdAt' | 'registrations' | 'status'>
): Activity {
  const activities = getActivities()
  const newActivity: Activity = {
    ...activity,
    id: genId(),
    createdAt: new Date().toISOString(),
    registrations: [],
    status: 'ongoing',
  }
  activities.unshift(newActivity)
  setStorage(KEYS.activities, activities)
  return newActivity
}

export function registerActivity(
  activityId: string,
  registration: Omit<Registration, 'id' | 'createdAt'>
): Registration | null {
  const activities = getActivities()
  const activity = activities.find((a) => a.id === activityId)
  if (!activity || activity.registrations.length >= activity.maxCount) return null
  const newReg: Registration = {
    ...registration,
    id: genId(),
    createdAt: new Date().toISOString(),
  }
  activity.registrations.push(newReg)
  setStorage(KEYS.activities, activities)
  return newReg
}

export function cancelActivity(activityId: string): void {
  const activities = getActivities()
  const activity = activities.find((a) => a.id === activityId)
  if (activity) {
    activity.status = 'ended'
    setStorage(KEYS.activities, activities)
  }
}

// ---- 班费 ----

export function getFinances(): FinanceRecord[] {
  return getStorage<FinanceRecord[]>(KEYS.finances, DEFAULT_FINANCES)
}

export function addFinance(
  record: Omit<FinanceRecord, 'id' | 'createdAt'>
): FinanceRecord {
  const finances = getFinances()
  const newRecord: FinanceRecord = {
    ...record,
    id: genId(),
    createdAt: new Date().toISOString(),
  }
  finances.unshift(newRecord)
  setStorage(KEYS.finances, finances)
  return newRecord
}

export function deleteFinance(recordId: string): void {
  const finances = getFinances().filter((f) => f.id !== recordId)
  setStorage(KEYS.finances, finances)
}

export function getFinanceSummary(): {
  totalIncome: number
  totalExpense: number
  balance: number
} {
  const finances = getFinances()
  const totalIncome = finances
    .filter((f) => f.type === 'income')
    .reduce((sum, f) => sum + f.amount, 0)
  const totalExpense = finances
    .filter((f) => f.type === 'expense')
    .reduce((sum, f) => sum + f.amount, 0)
  return { totalIncome, totalExpense, balance: totalIncome - totalExpense }
}

// ---- 值日 ----

export function getDuties(): DutySchedule[] {
  return getStorage<DutySchedule[]>(KEYS.duties, DEFAULT_DUTIES)
}

export function setWeekDuty(weekStart: string, assignments: DutyAssignment[]): void {
  const duties = getDuties()
  const existing = duties.find((d) => d.weekStart === weekStart)
  if (existing) {
    existing.assignments = assignments
  } else {
    duties.push({ id: genId(), weekStart, assignments })
  }
  duties.sort((a, b) => a.weekStart.localeCompare(b.weekStart))
  setStorage(KEYS.duties, duties)
}

// ---- 用户 ----

/** 角色英文→中文映射 */
export function getRoleLabel(role: string): string {
  const map: Record<string, string> = {
    head_teacher: '班主任',
    teacher: '任课老师',
    committee: '家委',
    parent: '家长',
  }
  return map[role] || role
}

export function getProfile(): UserProfile {
  return getStorage<UserProfile>(KEYS.profile, DEFAULT_PROFILE)
}

export function updateProfile(profile: Partial<UserProfile>): UserProfile {
  const current = getProfile()
  const updated = { ...current, ...profile }
  setStorage(KEYS.profile, updated)
  return updated
}

/** 获取当前班级 ID */
export function getCurrentClassId(): string {
  return getStorage<string>(KEYS.currentClassId, '')
}

/** 设置当前班级 ID */
export function setCurrentClassId(classId: string): void {
  setStorage(KEYS.currentClassId, classId)
}

/** 获取当前用户在当前班级的角色 */
export function getUserRole(): string {
  return getStorage<string>(KEYS.currentUserRole, 'parent')
}

/** 设置当前用户角色 */
export function setUserRole(role: string): void {
  setStorage(KEYS.currentUserRole, role)
}

/** 获取当前学生姓名 */
export function getCurrentStudentName(): string {
  return getStorage<string>(KEYS.currentStudentName, '')
}

/** 设置当前学生姓名 */
export function setCurrentStudentName(name: string): void {
  setStorage(KEYS.currentStudentName, name)
}
