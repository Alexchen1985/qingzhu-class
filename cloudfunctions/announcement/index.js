const cloud = require('wx-server-sdk')
cloud.init({ env: 'cloudbase-d4gknzarya5d2b231' })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { action } = event

  try {
    switch (action) {
      case 'publish':
        return await handlePublish(openid, event)
      case 'list':
        return await handleList(openid, event)
      case 'markRead':
        return await handleMarkRead(openid, event)
      case 'stats':
        return await handleStats(openid, event)
      case 'approve':
        return await handleApprove(openid, event)
      default:
        return { code: -1, message: '未知 action: ' + action, data: null }
    }
  } catch (err) {
    return { code: -1, message: err.message || '操作失败', data: null }
  }
}

// 发布公告
async function handlePublish(openid, event) {
  const { class_id, title, content, images, need_confirm, is_pinned } = event

  if (!class_id || !title || !content) {
    return { code: -1, message: '缺少必要参数', data: null }
  }

  // 校验角色
  const memberRes = await db
    .collection('class_members')
    .where({ class_id, openid, status: 'active' })
    .get()

  if (memberRes.data.length === 0) {
    return { code: -1, message: '您不是该班级成员', data: null }
  }

  const role = memberRes.data[0].role
  const authorName = memberRes.data[0].parent_name || memberRes.data[0].student_name

  let type, approve_status

  if (role === 'head_teacher') {
    type = 'official'
    approve_status = 'approved'
  } else if (role === 'teacher') {
    type = 'teacher'
    approve_status = 'approved'
  } else if (role === 'committee') {
    type = 'committee'
    approve_status = 'pending'
  } else {
    return { code: -1, message: '普通家长无权发布公告', data: null }
  }

  const addRes = await db.collection('announcements').add({
    data: {
      class_id,
      type,
      title,
      content,
      images: images || [],
      need_confirm: need_confirm || false,
      is_pinned: is_pinned || false,
      approve_status,
      approve_reason: '',
      author_openid: openid,
      author_name: authorName,
      created_at: db.serverDate(),
    },
  })

  return {
    code: 0,
    message: 'ok',
    data: {
      _id: addRes._id,
      type,
      approve_status,
      tip: approve_status === 'pending' ? '已提交，待班主任审批后公示' : '发布成功',
    },
  }
}

// 获取公告列表
async function handleList(openid, event) {
  const { class_id } = event
  if (!class_id) {
    return { code: -1, message: '缺少 class_id', data: null }
  }

  // 查询调用者角色
  const memberRes = await db
    .collection('class_members')
    .where({ class_id, openid, status: 'active' })
    .get()

  const role = memberRes.data.length > 0 ? memberRes.data[0].role : 'parent'
  const isManager = role === 'head_teacher' || role === 'committee'

  // 构建查询条件
  let query = { class_id }
  if (!isManager) {
    // 普通家长/老师只看已审批的
    query.approve_status = 'approved'
  }

  const announcementRes = await db
    .collection('announcements')
    .where(query)
    .orderBy('is_pinned', 'desc')
    .orderBy('created_at', 'desc')
    .limit(50)
    .get()

  const announcements = announcementRes.data

  // 查询当前用户的已读记录
  const readRes = await db
    .collection('announcement_reads')
    .where({ class_id, openid })
    .get()

  const readIds = new Set(readRes.data.map((r) => r.announcement_id))

  // 查询每条公告的已读人数
  const announcementIds = announcements.map((a) => a._id)
  let readCounts = {}
  if (announcementIds.length > 0) {
    // 分批查询已读统计
    for (const aid of announcementIds) {
      const countRes = await db
        .collection('announcement_reads')
        .where({ announcement_id: aid })
        .count()
      readCounts[aid] = countRes.total
    }
  }

  const result = announcements.map((a) => ({
    ...a,
    is_read: readIds.has(a._id),
    read_count: readCounts[a._id] || 0,
  }))

  return { code: 0, message: 'ok', data: { announcements: result, role } }
}

// 标记已读
async function handleMarkRead(openid, event) {
  const { announcement_id, class_id } = event
  if (!announcement_id || !class_id) {
    return { code: -1, message: '缺少参数', data: null }
  }

  // 幂等：检查是否已读
  const existRes = await db
    .collection('announcement_reads')
    .where({ announcement_id, openid })
    .get()

  if (existRes.data.length > 0) {
    return { code: 0, message: 'ok', data: { already_read: true } }
  }

  // 获取成员名称
  const memberRes = await db
    .collection('class_members')
    .where({ class_id, openid, status: 'active' })
    .get()

  const memberName = memberRes.data.length > 0
    ? (memberRes.data[0].parent_name || memberRes.data[0].student_name)
    : ''

  await db.collection('announcement_reads').add({
    data: {
      announcement_id,
      class_id,
      openid,
      member_name: memberName,
      read_at: db.serverDate(),
    },
  })

  return { code: 0, message: 'ok', data: { already_read: false } }
}

// 已读统计
async function handleStats(openid, event) {
  const { announcement_id, class_id } = event
  if (!announcement_id) {
    return { code: -1, message: '缺少 announcement_id', data: null }
  }

  const readRes = await db
    .collection('announcement_reads')
    .where({ announcement_id })
    .orderBy('read_at', 'desc')
    .get()

  // 查询调用者角色
  const memberRes = await db
    .collection('class_members')
    .where({ class_id, openid, status: 'active' })
    .get()

  const role = memberRes.data.length > 0 ? memberRes.data[0].role : 'parent'
  const isManager = role === 'head_teacher' || role === 'committee'

  const result = {
    read_count: readRes.data.length,
    readers: isManager
      ? readRes.data.map((r) => ({ member_name: r.member_name, read_at: r.read_at }))
      : [],
  }

  return { code: 0, message: 'ok', data: result }
}

// 审批公告（仅班主任）
async function handleApprove(openid, event) {
  const { announcement_id, result, reason } = event
  if (!announcement_id || !result) {
    return { code: -1, message: '缺少参数', data: null }
  }

  // 获取公告
  const announcementRes = await db
    .collection('announcements')
    .doc(announcement_id)
    .get()

  const announcement = announcementRes.data

  // 校验班主任身份
  const memberRes = await db
    .collection('class_members')
    .where({ class_id: announcement.class_id, openid, status: 'active' })
    .get()

  if (memberRes.data.length === 0 || memberRes.data[0].role !== 'head_teacher') {
    return { code: -1, message: '仅班主任可审批', data: null }
  }

  // 更新审批状态
  await db.collection('announcements').doc(announcement_id).update({
    data: {
      approve_status: result,
      approve_reason: reason || '',
    },
  })

  return { code: 0, message: 'ok', data: { approve_status: result } }
}
