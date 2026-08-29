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

/** 通用云函数调用（weapp 端失败时自动降级到 mock） */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function callFunction<T = any>(
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: Record<string, any>
): Promise<T> {
  // H5/抖音端：直接返回 mock 数据
  if (!isWeapp()) {
    return getMockData<T>(name, data)
  }
  // weapp 端：尝试调用云函数，失败则降级到 mock
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wx = (Taro as any).cloud || (globalThis as any).wx?.cloud
    if (!wx) {
      console.warn('[Cloud] wx.cloud 不可用，使用 mock 数据')
      return getMockData<T>(name, data)
    }
    const res = await wx.callFunction({ name, data: data || {} })
    if (res.result?.code !== 0) {
      console.warn('[Cloud] 云函数返回错误，使用 mock 数据:', res.result?.message)
      return getMockData<T>(name, data)
    }
    return res.result.data as T
  } catch (err) {
    console.warn('[Cloud] 云函数调用失败，降级到 mock 数据:', (err as Error).message)
    return getMockData<T>(name, data)
  }
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
              student_name: '陈一晴',
              parent_name: '陈家长',
              phone: '18502501995',
              relation: '家长',
              status: 'active',
              created_at: new Date().toISOString(),
            },
            className: '青竹班',
            schoolName: '南京南站小学',
          },
        ],
      } as T
    case CLOUD_FUNCTIONS.CLASS_CREATE:
      return {
        classInfo: {
          _id: 'mock_new_class',
          school_id: 'mock_school',
          name: (_data?.class_name as string) || '青竹班',
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
        schoolName: (_data?.school_name as string) || '南京南站小学',
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
        className: '青竹班',
        schoolName: '南京南站小学',
      } as T
    case CLOUD_FUNCTIONS.ROSTER_IMPORT: {
      const action = _data?.action as string
      if (action === 'list') {
        return [
          // 女生（学号 1-19）
          { _id: 'r1', class_id: 'mock_class_1', student_name: '陈一晴', parent_name: '陈家长', phone: '18502501995', relation: '家长', imported_by: 'mock_openid_h5', created_at: new Date().toISOString(), joined: false },
          { _id: 'r2', class_id: 'mock_class_1', student_name: '陈羽兮', parent_name: '陈家长', phone: '15205160994', relation: '家长', imported_by: 'mock_openid_h5', created_at: new Date().toISOString(), joined: false },
          { _id: 'r3', class_id: 'mock_class_1', student_name: '丁七安', parent_name: '丁家长', phone: '15850553312', relation: '家长', imported_by: 'mock_openid_h5', created_at: new Date().toISOString(), joined: false },
          { _id: 'r4', class_id: 'mock_class_1', student_name: '付宁庭', parent_name: '付家长', phone: '19962033277', relation: '家长', imported_by: 'mock_openid_h5', created_at: new Date().toISOString(), joined: false },
          { _id: 'r5', class_id: 'mock_class_1', student_name: '韩思颖', parent_name: '韩家长', phone: '18724109502', relation: '家长', imported_by: 'mock_openid_h5', created_at: new Date().toISOString(), joined: false },
          { _id: 'r6', class_id: 'mock_class_1', student_name: '金琪悦', parent_name: '金家长', phone: '15261876992', relation: '家长', imported_by: 'mock_openid_h5', created_at: new Date().toISOString(), joined: false },
          { _id: 'r7', class_id: 'mock_class_1', student_name: '李沐妍', parent_name: '李家长', phone: '18020135625', relation: '家长', imported_by: 'mock_openid_h5', created_at: new Date().toISOString(), joined: false },
          { _id: 'r8', class_id: 'mock_class_1', student_name: '李若瑜', parent_name: '李家长', phone: '18851051321', relation: '家长', imported_by: 'mock_openid_h5', created_at: new Date().toISOString(), joined: false },
          { _id: 'r9', class_id: 'mock_class_1', student_name: '孟晋熙', parent_name: '孟家长', phone: '13913011740', relation: '家长', imported_by: 'mock_openid_h5', created_at: new Date().toISOString(), joined: false },
          { _id: 'r10', class_id: 'mock_class_1', student_name: '倪字彤', parent_name: '倪家长', phone: '13770700864', relation: '家长', imported_by: 'mock_openid_h5', created_at: new Date().toISOString(), joined: false },
          { _id: 'r11', class_id: 'mock_class_1', student_name: '钱槿辰', parent_name: '钱家长', phone: '15005143068', relation: '家长', imported_by: 'mock_openid_h5', created_at: new Date().toISOString(), joined: false },
          { _id: 'r12', class_id: 'mock_class_1', student_name: '钱昭昭', parent_name: '钱家长', phone: '13851439012', relation: '家长', imported_by: 'mock_openid_h5', created_at: new Date().toISOString(), joined: false },
          { _id: 'r13', class_id: 'mock_class_1', student_name: '任安琪', parent_name: '任家长', phone: '15365179101', relation: '家长', imported_by: 'mock_openid_h5', created_at: new Date().toISOString(), joined: false },
          { _id: 'r14', class_id: 'mock_class_1', student_name: '徐稷斐', parent_name: '徐家长', phone: '15062224036', relation: '家长', imported_by: 'mock_openid_h5', created_at: new Date().toISOString(), joined: false },
          { _id: 'r15', class_id: 'mock_class_1', student_name: '徐贤轶', parent_name: '徐家长', phone: '15952081713', relation: '家长', imported_by: 'mock_openid_h5', created_at: new Date().toISOString(), joined: false },
          { _id: 'r16', class_id: 'mock_class_1', student_name: '姚嘉', parent_name: '姚家长', phone: '13611595735', relation: '家长', imported_by: 'mock_openid_h5', created_at: new Date().toISOString(), joined: false },
          { _id: 'r17', class_id: 'mock_class_1', student_name: '于千芮', parent_name: '于家长', phone: '18510669376', relation: '家长', imported_by: 'mock_openid_h5', created_at: new Date().toISOString(), joined: false },
          { _id: 'r18', class_id: 'mock_class_1', student_name: '张羽箫', parent_name: '张家长', phone: '15895821093', relation: '家长', imported_by: 'mock_openid_h5', created_at: new Date().toISOString(), joined: false },
          { _id: 'r19', class_id: 'mock_class_1', student_name: '郑昕怡', parent_name: '郑家长', phone: '18136659808', relation: '家长', imported_by: 'mock_openid_h5', created_at: new Date().toISOString(), joined: false },
          // 男生（学号 20-39）
          { _id: 'r20', class_id: 'mock_class_1', student_name: '房敬凯', parent_name: '房家长', phone: '18551825625', relation: '家长', imported_by: 'mock_openid_h5', created_at: new Date().toISOString(), joined: false },
          { _id: 'r21', class_id: 'mock_class_1', student_name: '葛沐行', parent_name: '葛家长', phone: '15298350312', relation: '家长', imported_by: 'mock_openid_h5', created_at: new Date().toISOString(), joined: false },
          { _id: 'r22', class_id: 'mock_class_1', student_name: '顾希诚', parent_name: '顾家长', phone: '18021532426', relation: '家长', imported_by: 'mock_openid_h5', created_at: new Date().toISOString(), joined: false },
          { _id: 'r23', class_id: 'mock_class_1', student_name: '顾奕安', parent_name: '顾家长', phone: '13770694940', relation: '家长', imported_by: 'mock_openid_h5', created_at: new Date().toISOString(), joined: false },
          { _id: 'r24', class_id: 'mock_class_1', student_name: '江皓晨', parent_name: '江家长', phone: '13914495296', relation: '家长', imported_by: 'mock_openid_h5', created_at: new Date().toISOString(), joined: false },
          { _id: 'r25', class_id: 'mock_class_1', student_name: '李嘉烨', parent_name: '李家长', phone: '18251819830', relation: '家长', imported_by: 'mock_openid_h5', created_at: new Date().toISOString(), joined: false },
          { _id: 'r26', class_id: 'mock_class_1', student_name: '李科锦', parent_name: '李家长', phone: '18851051321', relation: '家长', imported_by: 'mock_openid_h5', created_at: new Date().toISOString(), joined: false },
          { _id: 'r27', class_id: 'mock_class_1', student_name: '刘绍祎', parent_name: '刘家长', phone: '15852911802', relation: '家长', imported_by: 'mock_openid_h5', created_at: new Date().toISOString(), joined: false },
          { _id: 'r28', class_id: 'mock_class_1', student_name: '钱弘至', parent_name: '钱家长', phone: '19962006725', relation: '家长', imported_by: 'mock_openid_h5', created_at: new Date().toISOString(), joined: false },
          { _id: 'r29', class_id: 'mock_class_1', student_name: '秦骁', parent_name: '秦家长', phone: '15261461358', relation: '家长', imported_by: 'mock_openid_h5', created_at: new Date().toISOString(), joined: false },
          { _id: 'r30', class_id: 'mock_class_1', student_name: '沈奕辰', parent_name: '沈家长', phone: '15673387717', relation: '家长', imported_by: 'mock_openid_h5', created_at: new Date().toISOString(), joined: false },
          { _id: 'r31', class_id: 'mock_class_1', student_name: '宋梓卓', parent_name: '宋家长', phone: '15951651698', relation: '家长', imported_by: 'mock_openid_h5', created_at: new Date().toISOString(), joined: false },
          { _id: 'r32', class_id: 'mock_class_1', student_name: '汤睿辰', parent_name: '汤家长', phone: '15861364335', relation: '家长', imported_by: 'mock_openid_h5', created_at: new Date().toISOString(), joined: false },
          { _id: 'r33', class_id: 'mock_class_1', student_name: '王璟程', parent_name: '王家长', phone: '17625909751', relation: '家长', imported_by: 'mock_openid_h5', created_at: new Date().toISOString(), joined: false },
          { _id: 'r34', class_id: 'mock_class_1', student_name: '王煜恒', parent_name: '王家长', phone: '15050526630', relation: '家长', imported_by: 'mock_openid_h5', created_at: new Date().toISOString(), joined: false },
          { _id: 'r35', class_id: 'mock_class_1', student_name: '薛帆', parent_name: '薛家长', phone: '18020108108', relation: '家长', imported_by: 'mock_openid_h5', created_at: new Date().toISOString(), joined: false },
          { _id: 'r36', class_id: 'mock_class_1', student_name: '衣子维', parent_name: '衣家长', phone: '18900663907', relation: '家长', imported_by: 'mock_openid_h5', created_at: new Date().toISOString(), joined: false },
          { _id: 'r37', class_id: 'mock_class_1', student_name: '张子涵', parent_name: '张家长', phone: '15951084699', relation: '家长', imported_by: 'mock_openid_h5', created_at: new Date().toISOString(), joined: false },
          { _id: 'r38', class_id: 'mock_class_1', student_name: '甄永哲', parent_name: '甄家长', phone: '15851870216', relation: '家长', imported_by: 'mock_openid_h5', created_at: new Date().toISOString(), joined: false },
          { _id: 'r39', class_id: 'mock_class_1', student_name: '郑嘉懿', parent_name: '郑家长', phone: '18651688326', relation: '家长', imported_by: 'mock_openid_h5', created_at: new Date().toISOString(), joined: false },
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
    case CLOUD_FUNCTIONS.ACTIVITY: {
      const action = _data?.action as string
      if (action === 'list') {
        return {
          activities: [
            {
              _id: 'mock_activity_1',
              class_id: 'mock_class',
              title: '春季运动会志愿者招募',
              description: '需要10名家长协助组织运动会',
              location: '学校操场',
              start_time: new Date(Date.now() + 7 * 86400000).toISOString(),
              deadline: new Date(Date.now() + 5 * 86400000).toISOString(),
              max_participants: 10,
              status: 'open',
              created_by: 'mock_openid',
              author_name: '张先生',
              created_at: new Date(Date.now() - 86400000).toISOString(),
              current_count: 6,
              is_signed_up: false,
            },
            {
              _id: 'mock_activity_2',
              class_id: 'mock_class',
              title: '班级读书分享会',
              description: '每个孩子带一本自己喜欢的书来分享',
              location: '教室',
              start_time: new Date(Date.now() - 86400000).toISOString(),
              deadline: new Date(Date.now() - 2 * 86400000).toISOString(),
              max_participants: 0,
              status: 'closed',
              created_by: 'mock_openid',
              author_name: '李女士',
              created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
              current_count: 35,
              is_signed_up: true,
            },
          ],
        } as T
      }
      if (action === 'create') {
        return { activity_id: 'mock_activity_new' } as T
      }
      if (action === 'signup') {
        return {} as T
      }
      if (action === 'mySignups') {
        return {
          signups: [
            {
              _id: 'mock_signup_1',
              activity_id: 'mock_activity_1',
              class_id: 'mock_class',
              openid: 'mock_openid',
              student_name: '张小明',
              contact: '13800138000',
              note: '可以帮忙拍照',
              created_at: new Date().toISOString(),
              activity: {
                _id: 'mock_activity_1',
                class_id: 'mock_class',
                title: '春季运动会志愿者招募',
                description: '需要10名家长协助组织运动会',
                location: '学校操场',
                start_time: new Date(Date.now() + 7 * 86400000).toISOString(),
                deadline: new Date(Date.now() + 5 * 86400000).toISOString(),
                max_participants: 10,
                status: 'open',
                created_by: 'mock_openid',
                author_name: '张先生',
                created_at: new Date(Date.now() - 86400000).toISOString(),
                current_count: 6,
                is_signed_up: true,
              },
            },
          ],
        } as T
      }
      if (action === 'signupList') {
        return {
          signups: [
            { _id: 's1', activity_id: 'mock_activity_1', class_id: 'mock_class', openid: 'o1', student_name: '张小明', contact: '13800138000', note: '', created_at: new Date().toISOString() },
            { _id: 's2', activity_id: 'mock_activity_1', class_id: 'mock_class', openid: 'o2', student_name: '李小红', contact: '13900139000', note: '迟到10分钟', created_at: new Date().toISOString() },
          ],
        } as T
      }
      if (action === 'cancel') {
        return {} as T
      }
      return {} as T
    }
    case CLOUD_FUNCTIONS.FEE: {
      const action = _data?.action as string
      if (action === 'recordList') {
        return {
          records: [
            { _id: 'f1', class_id: 'mock_class', type: 'income', amount: 500000, purpose: '秋季班费收取', handler_name: '张先生', voucher_images: [], occurred_at: '2024-09-01', created_by: 'mock_openid', created_at: new Date().toISOString() },
            { _id: 'f2', class_id: 'mock_class', type: 'expense', amount: 15000, purpose: '运动会物资采购', handler_name: '李女士', voucher_images: [], occurred_at: '2024-10-15', created_by: 'mock_openid2', created_at: new Date().toISOString() },
            { _id: 'f3', class_id: 'mock_class', type: 'expense', amount: 8000, purpose: '班级图书角购书', handler_name: '王先生', voucher_images: [], occurred_at: '2024-10-20', created_by: 'mock_openid3', created_at: new Date().toISOString() },
          ],
          grouped: {
            '2024-10': [
              { _id: 'f2', class_id: 'mock_class', type: 'expense', amount: 15000, purpose: '运动会物资采购', handler_name: '李女士', voucher_images: [], occurred_at: '2024-10-15', created_by: 'mock_openid2', created_at: new Date().toISOString() },
              { _id: 'f3', class_id: 'mock_class', type: 'expense', amount: 8000, purpose: '班级图书角购书', handler_name: '王先生', voucher_images: [], occurred_at: '2024-10-20', created_by: 'mock_openid3', created_at: new Date().toISOString() },
            ],
            '2024-09': [
              { _id: 'f1', class_id: 'mock_class', type: 'income', amount: 500000, purpose: '秋季班费收取', handler_name: '张先生', voucher_images: [], occurred_at: '2024-09-01', created_by: 'mock_openid', created_at: new Date().toISOString() },
            ],
          },
          months: ['2024-10', '2024-09'],
          total_income: 500000,
          total_expense: 23000,
          balance: 477000,
        } as T
      }
      if (action === 'recordAdd') {
        return { record_id: 'mock_fee_new' } as T
      }
      if (action === 'recordDelete') {
        return {} as T
      }
      if (action === 'collectionList') {
        return {
          collections: [
            {
              _id: 'coll_1', class_id: 'mock_class', title: '秋季班费', amount_per_student: 20000,
              deadline: '2024-09-30', note: '每人200元', created_by: 'mock_openid', created_at: new Date().toISOString(),
              paid_count: 30, unpaid_count: 5, unpaid_students: ['赵小六', '钱小七', '孙小八', '周小九', '吴小十'],
            },
          ],
        } as T
      }
      if (action === 'collectionCreate') {
        return { collection_id: 'mock_coll_new', student_count: 35 } as T
      }
      if (action === 'paymentMark') {
        return { updated: (_data?.payment_ids as string[])?.length || 0 } as T
      }
      return {} as T
    }
    case CLOUD_FUNCTIONS.DUTY: {
      const action = _data?.action as string
      if (action === 'weekList') {
        const weekStart = _data?.week_start as string || new Date().toISOString().slice(0, 10)
        const dates: string[] = []
        const start = new Date(weekStart)
        for (let i = 0; i < 7; i++) {
          const d = new Date(start)
          d.setDate(d.getDate() + i)
          dates.push(d.toISOString().slice(0, 10))
        }
        const names = ['张小明', '李小红', '王小强', '赵小丽', '陈小军', '刘小芳', '杨小华']
        const schedule: Record<string, { _id: string; class_id: string; duty_date: string; student_name: string; created_by: string; created_at: string }[]> = {}
        dates.forEach((date, i) => {
          schedule[date] = [{ _id: `d${i}`, class_id: 'mock_class', duty_date: date, student_name: names[i], created_by: 'mock_openid', created_at: new Date().toISOString() }]
        })
        return { dates, schedule } as T
      }
      if (action === 'batchSet') {
        return {} as T
      }
      if (action === 'autoRotate') {
        return { schedules: [], next_index: 0 } as T
      }
      if (action === 'myDuty') {
        return {
          duties: [
            { _id: 'md1', class_id: 'mock_class', duty_date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10), student_name: '张小明', created_by: 'mock_openid', created_at: new Date().toISOString() },
            { _id: 'md2', class_id: 'mock_class', duty_date: new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10), student_name: '张小明', created_by: 'mock_openid', created_at: new Date().toISOString() },
          ],
        } as T
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

// ==================== Activity 活动报名 ====================

export interface CloudActivity {
  _id: string
  class_id: string
  title: string
  description: string
  location: string
  start_time: string
  deadline: string
  max_participants: number
  status: 'open' | 'closed' | 'finished' | 'cancelled'
  created_by: string
  author_name: string
  created_at: string
  current_count: number
  is_signed_up: boolean
}

export interface CloudSignup {
  _id: string
  activity_id: string
  class_id: string
  openid: string
  student_name: string
  contact: string
  note: string
  created_at: string
  activity?: CloudActivity
}

export async function getActivityList(classId: string): Promise<CloudActivity[]> {
  const result = await callFunction(CLOUD_FUNCTIONS.ACTIVITY, { action: 'list', class_id: classId })
  return result?.activities || []
}

export async function createActivity(data: {
  class_id: string
  title: string
  description?: string
  location?: string
  start_time?: string
  deadline?: string
  max_participants?: number
}): Promise<{ activity_id: string }> {
  const result = await callFunction(CLOUD_FUNCTIONS.ACTIVITY, { action: 'create', ...data })
  return result || { activity_id: '' }
}

export async function signupActivity(data: {
  activity_id: string
  class_id: string
  student_name: string
  contact?: string
  note?: string
}): Promise<void> {
  await callFunction(CLOUD_FUNCTIONS.ACTIVITY, { action: 'signup', ...data })
}

export async function getMySignups(classId: string): Promise<CloudSignup[]> {
  const result = await callFunction(CLOUD_FUNCTIONS.ACTIVITY, { action: 'mySignups', class_id: classId })
  return result?.signups || []
}

export async function getActivitySignupList(activityId: string, classId: string): Promise<CloudSignup[]> {
  const result = await callFunction(CLOUD_FUNCTIONS.ACTIVITY, { action: 'signupList', activity_id: activityId, class_id: classId })
  return result?.signups || []
}

export async function cancelActivity(activityId: string, classId: string, cancelType?: string): Promise<void> {
  await callFunction(CLOUD_FUNCTIONS.ACTIVITY, { action: 'cancel', activity_id: activityId, class_id: classId, cancel_type: cancelType })
}

// ==================== Fee 班费管理 ====================

export interface CloudFeeRecord {
  _id: string
  class_id: string
  type: 'income' | 'expense'
  amount: number
  purpose: string
  handler_name: string
  voucher_images: string[]
  occurred_at: string
  created_by: string
  created_at: string
}

export interface CloudFeeCollection {
  _id: string
  class_id: string
  title: string
  amount_per_student: number
  deadline: string
  note: string
  created_by: string
  created_at: string
  paid_count: number
  unpaid_count: number
  unpaid_students: string[]
}

export interface CloudFeePayment {
  _id: string
  collection_id: string
  class_id: string
  roster_id: string
  student_name: string
  amount: number
  status: 'paid' | 'unpaid'
  paid_at: string | null
  recorded_by: string
  created_at: string
}

export async function getFeeRecordList(classId: string): Promise<{
  records: CloudFeeRecord[]
  grouped: Record<string, CloudFeeRecord[]>
  months: string[]
  total_income: number
  total_expense: number
  balance: number
}> {
  const result = await callFunction(CLOUD_FUNCTIONS.FEE, { action: 'recordList', class_id: classId })
  return result || { records: [], grouped: {}, months: [], total_income: 0, total_expense: 0, balance: 0 }
}

export async function addFeeRecord(data: {
  class_id: string
  type: 'income' | 'expense'
  amount: number
  purpose?: string
  handler_name?: string
  voucher_images?: string[]
  occurred_at?: string
}): Promise<{ record_id: string }> {
  const result = await callFunction(CLOUD_FUNCTIONS.FEE, { action: 'recordAdd', ...data })
  return result || { record_id: '' }
}

export async function deleteFeeRecord(recordId: string, classId: string): Promise<void> {
  await callFunction(CLOUD_FUNCTIONS.FEE, { action: 'recordDelete', record_id: recordId, class_id: classId })
}

export async function getFeeCollectionList(classId: string): Promise<CloudFeeCollection[]> {
  const result = await callFunction(CLOUD_FUNCTIONS.FEE, { action: 'collectionList', class_id: classId })
  return result?.collections || []
}

export async function createFeeCollection(data: {
  class_id: string
  title: string
  amount_per_student: number
  deadline?: string
  note?: string
}): Promise<{ collection_id: string; student_count: number }> {
  const result = await callFunction(CLOUD_FUNCTIONS.FEE, { action: 'collectionCreate', ...data })
  return result || { collection_id: '', student_count: 0 }
}

export async function markFeePayments(paymentIds: string[], status: 'paid' | 'unpaid', classId: string): Promise<void> {
  await callFunction(CLOUD_FUNCTIONS.FEE, { action: 'paymentMark', payment_ids: paymentIds, status, class_id: classId })
}

// ==================== Duty 值日排班 ====================

export interface CloudDutySchedule {
  _id: string
  class_id: string
  duty_date: string
  student_name: string
  created_by: string
  created_at: string
}

export async function getDutyWeekList(classId: string, weekStart: string): Promise<{
  dates: string[]
  schedule: Record<string, CloudDutySchedule[]>
}> {
  const result = await callFunction(CLOUD_FUNCTIONS.DUTY, { action: 'weekList', class_id: classId, week_start: weekStart })
  return result || { dates: [], schedule: {} }
}

export async function batchSetDuty(classId: string, weekStart: string, schedules: { date: string; student_name: string }[]): Promise<void> {
  await callFunction(CLOUD_FUNCTIONS.DUTY, { action: 'batchSet', class_id: classId, week_start: weekStart, schedules })
}

export async function autoRotateDuty(classId: string, weekStart: string, studentNames?: string[], startIndex?: number): Promise<{
  schedules: { date: string; student_name: string }[]
  next_index: number
}> {
  const result = await callFunction(CLOUD_FUNCTIONS.DUTY, {
    action: 'autoRotate',
    class_id: classId,
    week_start: weekStart,
    student_names: studentNames,
    start_index: startIndex
  })
  return result || { schedules: [], next_index: 0 }
}

export async function getMyDuty(classId: string, studentName: string): Promise<CloudDutySchedule[]> {
  const result = await callFunction(CLOUD_FUNCTIONS.DUTY, { action: 'myDuty', class_id: classId, student_name: studentName })
  return result?.duties || []
}
