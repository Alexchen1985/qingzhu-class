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
