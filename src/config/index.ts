/**
 * 云开发环境配置
 * 集中管理云开发相关配置，便于切换环境
 */

/** 微信云开发环境 ID */
export const CLOUD_ENV = 'cloudbase-d4gknzarya5d2b231'

/** 云函数名称常量 */
export const CLOUD_FUNCTIONS = {
  LOGIN: 'login',
  CLASS_CREATE: 'classCreate',
  CLASS_JOIN: 'classJoin',
  ROSTER_IMPORT: 'rosterImport',
  ANNOUNCEMENT: 'announcement',
  ACTIVITY: 'activity',
  FEE: 'fee',
  DUTY: 'duty',
  UPDATE_PROFILE: 'updateProfile',
  UPLOAD_AVATAR: 'uploadAvatar',
} as const

/** 数据库集合名称 */
export const COLLECTIONS = {
  SCHOOLS: 'schools',
  CLASSES: 'classes',
  CLASS_MEMBERS: 'class_members',
  ROSTER: 'roster',
  ANNOUNCEMENTS: 'announcements',
  ANNOUNCEMENT_READS: 'announcement_reads',
  ACTIVITIES: 'activities',
  ACTIVITY_SIGNUPS: 'activity_signups',
  FEE_RECORDS: 'fee_records',
  FEE_COLLECTIONS: 'fee_collections',
  FEE_PAYMENTS: 'fee_payments',
  DUTY_SCHEDULES: 'duty_schedules',
} as const
