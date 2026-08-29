/**
 * 云开发相关类型定义
 */

/** 班级角色 */
export type ClassRole = 'head_teacher' | 'teacher' | 'committee' | 'parent'

/** 角色中文映射 */
export const ROLE_LABELS: Record<ClassRole, string> = {
  head_teacher: '班主任',
  teacher: '任课老师',
  committee: '家委',
  parent: '家长',
}

/** 成员状态 */
export type MemberStatus = 'active' | 'pending'

/** 学校 */
export interface School {
  _id: string
  name: string
  created_at: string
}

/** 班级设置 */
export interface ClassSettings {
  modules: {
    announcement: boolean
    activity: boolean
    fee: boolean
    duty: boolean
  }
}

/** 班级 */
export interface ClassInfo {
  _id: string
  school_id: string
  name: string
  grade: string
  invite_code: string
  teacher_invite_code: string
  committee_invite_code: string
  head_teacher_openid: string
  settings: ClassSettings
  plan: 'free' | 'premium'
  created_at: string
}

/** 班级成员 */
export interface ClassMember {
  _id: string
  class_id: string
  openid: string
  role: ClassRole
  student_name: string
  parent_name: string
  phone: string
  relation: string
  status: MemberStatus
  created_at: string
}

/** 登录返回的用户信息 */
export interface UserInfo {
  openid: string
  classes: ClassMemberWithClass[]
}

/** 带班级信息的成员记录 */
export interface ClassMemberWithClass {
  member: ClassMember
  className: string
  schoolName: string
}

/** login 云函数返回 */
export interface LoginResult {
  openid: string
  classes: ClassMemberWithClass[]
}

/** classCreate 云函数返回 */
export interface ClassCreateResult {
  classInfo: ClassInfo
  schoolName: string
}

/** classJoin 云函数返回 */
export interface ClassJoinResult {
  member: ClassMember
  className: string
  schoolName: string
}

/** 本地缓存的当前班级 */
export interface CurrentClass {
  classId: string
  className: string
  role: ClassRole
  studentName: string
  parentName: string
  phone: string
  relation: string
}
