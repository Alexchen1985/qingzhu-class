const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { action } = event

  try {
    switch (action) {
      case 'create': return await createAction(event, openid)
      case 'list': return await listActivities(event, openid)
      case 'signup': return await signupActivity(event, openid)
      case 'mySignups': return await mySignups(event, openid)
      case 'signupList': return await signupList(event, openid)
      case 'cancel': return await cancelActivity(event, openid)
      default: return { code: -1, msg: 'Unknown action: ' + action }
    }
  } catch (err) {
    console.error('[activity] error:', action, err)
    return { code: -1, msg: err.message || '服务器错误' }
  }
}

async function getMemberRole(classId, openid) {
  const res = await db.collection('class_members')
    .where({ class_id: classId, openid, status: 'active' }).limit(1).get()
  return res.data.length > 0 ? res.data[0].role : null
}

async function isManager(classId, openid) {
  const role = await getMemberRole(classId, openid)
  return role === 'admin' || role === 'head_teacher' || role === 'committee'
}

// 创建活动
async function createAction(event, openid) {
  const { class_id, title, description, location, start_time, deadline, max_participants, images } = event
  if (!class_id || !title) return { code: -1, msg: '缺少必要参数' }
  if (!await isManager(class_id, openid)) return { code: -1, msg: 'NO_PERMISSION' }

  const memberRes = await db.collection('class_members')
    .where({ class_id, openid, status: 'active' }).limit(1).get()
  const authorName = memberRes.data[0]?.parent_name || memberRes.data[0]?.student_name || ''

  const now = new Date()
  const result = await db.collection('activities').add({
    data: {
      class_id, title, description: description || '',
      location: location || '', start_time: start_time || '',
      deadline: deadline || '',
      max_participants: max_participants || 0,
      images: images || [],
      status: 'open',
      created_by: openid, created_at: now, author_name: authorName
    }
  })
  return { code: 0, msg: 'ok', data: { activity_id: result._id } }
}

// 活动列表
async function listActivities(event, openid) {
  const { class_id } = event
  if (!class_id) return { code: -1, msg: '缺少class_id' }

  const activitiesRes = await db.collection('activities')
    .where({ class_id })
    .orderBy('created_at', 'desc').limit(100).get()
  const activities = activitiesRes.data

  // 自动更新状态（截止/结束）
  const now = new Date()
  for (const act of activities) {
    if (act.status === 'open' && act.deadline && new Date(act.deadline) < now) {
      act.status = 'closed'
      await db.collection('activities').doc(act._id).update({ data: { status: 'closed' } })
    }
  }

  // 获取每个活动的报名人数和当前用户是否已报
  const result = []
  for (const act of activities) {
    const countRes = await db.collection('activity_signups')
      .where({ activity_id: act._id }).count()
    const myRes = await db.collection('activity_signups')
      .where({ activity_id: act._id, openid }).limit(1).get()

    result.push({
      ...act,
      current_count: countRes.total,
      is_signed_up: myRes.data.length > 0
    })
  }
  return { code: 0, data: { activities: result } }
}

// 报名
async function signupActivity(event, openid) {
  const { activity_id, class_id, student_name, contact, note } = event
  if (!activity_id || !class_id || !student_name) return { code: -1, msg: '缺少必要参数' }

  const actRes = await db.collection('activities').doc(activity_id).get()
  const act = actRes.data
  if (!act) return { code: -1, msg: '活动不存在' }
  if (act.status !== 'open') return { code: -1, msg: '活动已截止或已结束' }
  if (act.deadline && new Date(act.deadline) < new Date()) {
    await db.collection('activities').doc(activity_id).update({ data: { status: 'closed' } })
    return { code: -1, msg: '活动已截止' }
  }

  // 检查重复报名
  const dupRes = await db.collection('activity_signups')
    .where({ activity_id, openid }).limit(1).get()
  if (dupRes.data.length > 0) return { code: -1, msg: 'ALREADY_SIGNED_UP' }

  // 检查人数上限
  if (act.max_participants > 0) {
    const countRes = await db.collection('activity_signups')
      .where({ activity_id }).count()
    if (countRes.total >= act.max_participants) return { code: -1, msg: 'FULL' }
  }

  const now = new Date()
  const result = await db.collection('activity_signups').add({
    data: {
      activity_id, class_id, openid,
      student_name, contact: contact || '', note: note || '',
      created_at: now
    }
  })
  return { code: 0, msg: '报名成功', data: { signup_id: result._id } }
}

// 我的报名记录
async function mySignups(event, openid) {
  const { class_id } = event
  if (!class_id) return { code: -1, msg: '缺少class_id' }

  const signupsRes = await db.collection('activity_signups')
    .where({ class_id, openid })
    .orderBy('created_at', 'desc').limit(100).get()
  const signups = signupsRes.data

  // 关联活动信息
  const result = []
  for (const s of signups) {
    try {
      const actRes = await db.collection('activities').doc(s.activity_id).get()
      result.push({ ...s, activity: actRes.data })
    } catch (e) {
      result.push({ ...s, activity: null })
    }
  }
  return { code: 0, data: { signups: result } }
}

// 报名名单（仅管理角色）
async function signupList(event, openid) {
  const { activity_id, class_id } = event
  if (!activity_id) return { code: -1, msg: '缺少activity_id' }
  if (!await isManager(class_id, openid)) return { code: -1, msg: 'NO_PERMISSION' }

  const res = await db.collection('activity_signups')
    .where({ activity_id })
    .orderBy('created_at', 'asc').limit(200).get()
  return { code: 0, data: { signups: res.data } }
}

// 取消活动或取消报名
async function cancelActivity(event, openid) {
  const { activity_id, class_id, cancel_type } = event
  if (!activity_id) return { code: -1, msg: '缺少activity_id' }

  if (cancel_type === 'signup') {
    // 家长取消自己的报名
    const actRes = await db.collection('activities').doc(activity_id).get()
    const act = actRes.data
    if (act.status !== 'open') return { code: -1, msg: '活动已截止，无法取消' }
    await db.collection('activity_signups')
      .where({ activity_id, openid }).remove()
    return { code: 0, msg: '已取消报名' }
  }

  // 管理角色取消活动
  if (!await isManager(class_id, openid)) return { code: -1, msg: 'NO_PERMISSION' }
  await db.collection('activities').doc(activity_id).update({
    data: { status: 'cancelled' }
  })
  return { code: 0, msg: '活动已取消' }
}
