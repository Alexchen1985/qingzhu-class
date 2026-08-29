/** 公告 */
export interface Notice {
  id: string
  title: string
  content: string
  type?: 'official' | 'teacher' | 'committee'
  needConfirm: boolean
  isTop: boolean
  images: string[]
  createdAt: string
  readBy: string[]
}

/** 活动 */
export interface Activity {
  id: string
  name: string
  title?: string
  time: string
  location: string
  maxCount: number
  deadline: string
  remark: string
  status: 'ongoing' | 'closed' | 'ended'
  createdAt: string
  registrations: Registration[]
}

/** 报名记录 */
export interface Registration {
  id: string
  studentName: string
  parentContact: string
  remark: string
  createdAt: string
}

/** 班费记录 */
export interface FinanceRecord {
  id: string
  type: 'income' | 'expense'
  amount: number
  date: string
  purpose: string
  handler: string
  createdAt: string
}

/** 值日排班 */
export interface DutySchedule {
  id: string
  weekStart: string
  assignments: DutyAssignment[]
}

/** 单日值日 */
export interface DutyAssignment {
  date: string
  students: string[]
}

/** 用户信息 */
export interface UserProfile {
  studentName: string
  parentName: string
  contact: string
  className?: string
  role: 'committee' | 'parent'
}
