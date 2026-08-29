/**
 * 云函数调用封装
 * - weapp 端：调用 wx.cloud.callFunction
 * - H5/抖音端：返回 mock 数据，保证可预览
 */
import Taro from '@tarojs/taro'
import { CLOUD_ENV, CLOUD_FUNCTIONS } from '@/config'
import type {
  LoginResult,
  ClassCreateResult,
  ClassJoinResult,
} from './cloud-types'

/** 判断是否为微信小程序环境 */
function isWeapp(): boolean {
  return Taro.getEnv() === Taro.ENV_TYPE.WEAPP
}

/** 初始化云开发（仅 weapp 端） */
export function initCloud(): void {
  if (isWeapp()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wx = (Taro as any).cloud || (globalThis as any).wx?.cloud
    if (wx) {
      wx.init({ env: CLOUD_ENV, traceUser: true })
    }
  }
}

/** 通用云函数调用 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function callFunction<T = any>(
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: Record<string, any>
): Promise<T> {
  if (!isWeapp()) {
    return getMockData<T>(name, data)
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wx = (Taro as any).cloud || (globalThis as any).wx?.cloud
  if (!wx) {
    throw new Error('wx.cloud 不可用')
  }
  const res = await wx.callFunction({ name, data: data || {} })
  if (res.result?.code !== 0) {
    throw new Error(res.result?.message || '云函数调用失败')
  }
  return res.result.data as T
}

// ========== H5 Mock 数据 ==========

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getMockData<T>(name: string, _data?: Record<string, any>): T {
  switch (name) {
    case CLOUD_FUNCTIONS.LOGIN:
      return {
        openid: 'mock_openid_h5',
        classes: [
          {
            member: {
              _id: 'mock_member_1',
              class_id: 'mock_class_1',
              openid: 'mock_openid_h5',
              role: 'head_teacher',
              student_name: '张小明',
              parent_name: '张先生',
              phone: '13800001234',
              relation: '父亲',
              status: 'active',
              created_at: new Date().toISOString(),
            },
            className: '三（2）班',
            schoolName: '南京市XX小学',
          },
        ],
      } as T
    case CLOUD_FUNCTIONS.CLASS_CREATE:
      return {
        classInfo: {
          _id: 'mock_new_class',
          school_id: 'mock_school',
          name: (_data?.class_name as string) || '三（2）班',
          grade: (_data?.grade as string) || '三年级',
          invite_code: '888888',
          teacher_invite_code: '666666',
          committee_invite_code: '999999',
          head_teacher_openid: 'mock_openid_h5',
          settings: {
            modules: {
              announcement: true,
              activity: true,
              fee: true,
              duty: true,
            },
          },
          plan: 'free',
          created_at: new Date().toISOString(),
        },
        schoolName: (_data?.school_name as string) || '南京市XX小学',
      } as T
    case CLOUD_FUNCTIONS.CLASS_JOIN:
      return {
        member: {
          _id: 'mock_joined_member',
          class_id: 'mock_class_joined',
          openid: 'mock_openid_h5',
          role: 'parent',
          student_name: (_data?.student_name as string) || '李小红',
          parent_name: (_data?.parent_name as string) || '李女士',
          phone: (_data?.phone as string) || '13900005678',
          relation: (_data?.relation as string) || '母亲',
          status: 'active',
          created_at: new Date().toISOString(),
        },
        className: '三（1）班',
        schoolName: '南京市XX小学',
      } as T
    case CLOUD_FUNCTIONS.ROSTER_IMPORT: {
      const action = _data?.action as string
      if (action === 'list') {
        return [
          {
            _id: 'mock_roster_1',
            class_id: 'mock_class_1',
            student_name: '张小明',
            parent_name: '张先生',
            phone: '13800001234',
            relation: '父亲',
            imported_by: 'mock_openid_h5',
            created_at: new Date().toISOString(),
            joined: true,
          },
          {
            _id: 'mock_roster_2',
            class_id: 'mock_class_1',
            student_name: '李小红',
            parent_name: '李女士',
            phone: '13900005678',
            relation: '母亲',
            imported_by: 'mock_openid_h5',
            created_at: new Date().toISOString(),
            joined: false,
          },
        ] as T
      }
      if (action === 'add') {
        return { _id: 'mock_new_roster' } as T
      }
      if (action === 'delete') {
        return undefined as T
      }
      // import action
      return { imported: 3, skipped: 1 } as T
    }
    case CLOUD_FUNCTIONS.ANNOUNCEMENT: {
      const action = _data?.action as string
      if (action === 'publish') {
        return {
          _id: 'mock_announcement_new',
          type: 'official',
          approve_status: 'approved',
          tip: '发布成功',
        } as T
      }
      if (action === 'list') {
        return {
          announcements: [
            {
              _id: 'mock_ann_1',
              class_id: 'mock_class_1',
              type: 'official',
              title: '期末家长会通知',
              content: '各位家长，本周五下午2点召开期末家长会...',
              images: [],
              need_confirm: true,
              is_pinned: true,
              approve_status: 'approved',
              author_openid: 'mock_openid_h5',
              author_name: '张先生',
              created_at: new Date().toISOString(),
              is_read: false,
              read_count: 15,
            },
            {
              _id: 'mock_ann_2',
              class_id: 'mock_class_1',
              type: 'committee',
              title: '家委活动经费公示',
              content: '本次秋游活动经费使用情况如下...',
              images: [],
              need_confirm: false,
              is_pinned: false,
              approve_status: 'approved',
              author_openid: 'mock_openid_h5',
              author_name: '张先生',
              created_at: new Date(Date.now() - 86400000).toISOString(),
              is_read: true,
              read_count: 20,
            },
          ],
          role: 'head_teacher',
        } as T
      }
      if (action === 'markRead') {
        return { already_read: false } as T
      }
      if (action === 'stats') {
        return {
          read_count: 15,
          readers: [
            { member_name: '张先生', read_at: new Date().toISOString() },
            { member_name: '李女士', read_at: new Date().toISOString() },
          ],
        } as T
      }
      if (action === 'approve') {
        return { approve_status: _data?.result } as T
      }
      return {} as T
    }
    default:
      throw new Error(`未知云函数: ${name}`)
  }
}

// ========== 业务 API ==========

/** 登录：获取 openid 和已加入班级列表 */
export async function login(): Promise<LoginResult> {
  return callFunction<LoginResult>(CLOUD_FUNCTIONS.LOGIN)
}

/** 创建班级 */
export async function classCreate(params: {
  school_name: string
  class_name: string
  grade: string
}): Promise<ClassCreateResult> {
  return callFunction<ClassCreateResult>(CLOUD_FUNCTIONS.CLASS_CREATE, params)
}

/** 加入班级 */
export async function classJoin(params: {
  invite_code: string
  student_name: string
  parent_name: string
  phone: string
  relation: string
}): Promise<ClassJoinResult> {
  return callFunction<ClassJoinResult>(CLOUD_FUNCTIONS.CLASS_JOIN, params)
}

// ========== Roster API ==========

export interface RosterItem {
  _id: string
  class_id: string
  student_name: string
  parent_name: string
  phone: string
  relation: string
  imported_by: string
  created_at: string
  joined?: boolean
  joined_member_id?: string
}

/** 获取班级名单 */
export async function getRosterList(classId: string): Promise<RosterItem[]> {
  return callFunction<RosterItem[]>(CLOUD_FUNCTIONS.ROSTER_IMPORT, {
    action: 'list',
    class_id: classId,
  })
}

/** 批量导入名单 */
export async function rosterImport(params: {
  class_id: string
  text: string
}): Promise<{ imported: number; skipped: number }> {
  return callFunction<{ imported: number; skipped: number }>(
    CLOUD_FUNCTIONS.ROSTER_IMPORT,
    params
  )
}

/** 手动添加单条名单 */
export async function rosterAdd(params: {
  class_id: string
  student_name: string
  parent_name: string
  phone: string
  relation: string
}): Promise<{ _id: string }> {
  return callFunction<{ _id: string }>(CLOUD_FUNCTIONS.ROSTER_IMPORT, {
    action: 'add',
    ...params,
  })
}

/** 删除名单 */
export async function rosterDelete(params: {
  roster_id: string
  class_id: string
}): Promise<void> {
  return callFunction<void>(CLOUD_FUNCTIONS.ROSTER_IMPORT, {
    action: 'delete',
    ...params,
  })
}

// ========== Announcement API ==========

export interface CloudAnnouncement {
  _id: string
  class_id: string
  type: 'official' | 'teacher' | 'committee'
  title: string
  content: string
  images: string[]
  need_confirm: boolean
  is_pinned: boolean
  approve_status: 'pending' | 'approved' | 'rejected'
  approve_reason?: string
  author_openid: string
  author_name: string
  created_at: string
  is_read?: boolean
  read_count?: number
}

export interface AnnouncementStats {
  read_count: number
  readers: Array<{ member_name: string; read_at: string }>
}

/** 发布公告 */
export async function publishAnnouncement(params: {
  class_id: string
  title: string
  content: string
  images?: string[]
  need_confirm?: boolean
  is_pinned?: boolean
}): Promise<{ _id: string; type: string; approve_status: string; tip: string }> {
  return callFunction(CLOUD_FUNCTIONS.ANNOUNCEMENT, {
    action: 'publish',
    ...params,
  })
}

/** 获取公告列表 */
export async function getAnnouncementList(classId: string): Promise<{
  announcements: CloudAnnouncement[]
  role: string
}> {
  return callFunction(CLOUD_FUNCTIONS.ANNOUNCEMENT, {
    action: 'list',
    class_id: classId,
  })
}

/** 标记已读 */
export async function markAnnouncementRead(params: {
  announcement_id: string
  class_id: string
}): Promise<{ already_read: boolean }> {
  return callFunction(CLOUD_FUNCTIONS.ANNOUNCEMENT, {
    action: 'markRead',
    ...params,
  })
}

/** 获取已读统计 */
export async function getAnnouncementStats(params: {
  announcement_id: string
  class_id: string
}): Promise<AnnouncementStats> {
  return callFunction<AnnouncementStats>(CLOUD_FUNCTIONS.ANNOUNCEMENT, {
    action: 'stats',
    ...params,
  })
}

/** 审批公告 */
export async function approveAnnouncement(params: {
  announcement_id: string
  result: 'approved' | 'rejected'
  reason?: string
}): Promise<{ approve_status: string }> {
  return callFunction(CLOUD_FUNCTIONS.ANNOUNCEMENT, {
    action: 'approve',
    ...params,
  })
}

/** 上传图片到云存储 */
export async function uploadImageToCloud(
  filePath: string,
  classId: string
): Promise<string> {
  if (!isWeapp()) {
    throw new Error('H5 端不支持云存储上传')
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cloudApi = (Taro as any).cloud || (globalThis as any).wx?.cloud
  if (!cloudApi) {
    throw new Error('云开发未初始化')
  }
  const timestamp = Date.now()
  const cloudPath = `announcements/${classId}/${timestamp}.jpg`
  const res = await cloudApi.uploadFile({
    cloudPath,
    filePath,
  })
  return res.fileID
}

/** 获取云文件临时链接 */
export async function getTempFileURL(fileIDs: string[]): Promise<string[]> {
  if (!isWeapp() || fileIDs.length === 0) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cloudApi = (Taro as any).cloud || (globalThis as any).wx?.cloud
  if (!cloudApi) return []
  const res = await cloudApi.getTempFileURL({ fileList: fileIDs })
  return res.fileList
    .filter((f: { status: number }) => f.status === 0)
    .map((f: { tempFileURL: string }) => f.tempFileURL)
}
