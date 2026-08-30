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
      case 'weekList': return await weekList(event)
      case 'batchSet': return await batchSet(event, openid)
      case 'autoRotate': return await autoRotate(event, openid)
      case 'myDuty': return await myDuty(event)
      default: return { code: -1, msg: 'Unknown action: ' + action }
    }
  } catch (err) {
    console.error('[duty] error:', action, err)
    return { code: -1, msg: err.message || '服务器错误' }
  }
}

async function isManager(classId, openid) {
  const res = await db.collection('class_members')
    .where({ class_id: classId, openid, status: 'active' }).limit(1).get()
  const role = res.data.length > 0 ? res.data[0].role : null
  return role === 'admin' || role === 'head_teacher' || role === 'committee'
}

// 获取某周排班
async function weekList(event) {
  const { class_id, week_start } = event
  if (!class_id || !week_start) return { code: -1, msg: '缺少参数' }

  // 计算周日日期
  const start = new Date(week_start)
  const dates = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    dates.push(d.toISOString().slice(0, 10))
  }

  const res = await db.collection('duty_schedules')
    .where({
      class_id,
      duty_date: _.gte(dates[0]).and(_.lte(dates[6]))
    })
    .orderBy('duty_date', 'asc').limit(100).get()

  // 按日期分组
  const scheduleMap = {}
  for (const d of dates) scheduleMap[d] = []
  for (const item of res.data) {
    if (scheduleMap[item.duty_date]) {
      scheduleMap[item.duty_date].push(item)
    }
  }

  return { code: 0, data: { dates, schedule: scheduleMap } }
}

// 批量设置排班
async function batchSet(event, openid) {
  const { class_id, week_start, schedules } = event
  // schedules: [{ date: '2024-01-01', student_name: '张小明' }, ...]
  if (!class_id || !week_start || !schedules) return { code: -1, msg: '缺少参数' }
  if (!await isManager(class_id, openid)) return { code: -1, msg: 'NO_PERMISSION' }

  const now = new Date()
  for (const s of schedules) {
    if (!s.date || !s.student_name) continue
    // 删除该日期已有排班
    await db.collection('duty_schedules')
      .where({ class_id, duty_date: s.date }).remove()
    // 写入新排班
    await db.collection('duty_schedules').add({
      data: {
        class_id, duty_date: s.date,
        student_name: s.student_name,
        created_by: openid, created_at: now
      }
    })
  }
  return { code: 0, msg: 'ok' }
}

// 自动轮换排班
async function autoRotate(event, openid) {
  const { class_id, week_start, student_names, start_index } = event
  if (!class_id || !week_start) return { code: -1, msg: '缺少参数' }
  if (!await isManager(class_id, openid)) return { code: -1, msg: 'NO_PERMISSION' }

  // 如果没有传入学生名单，从 roster 获取
  let names = student_names
  if (!names || names.length === 0) {
    const rosterRes = await db.collection('roster')
      .where({ class_id }).limit(200).get()
    names = rosterRes.data.map(r => r.student_name)
  }
  if (names.length === 0) return { code: -1, msg: '名单为空，请先导入家长名单' }

  const idx = start_index || 0
  const now = new Date()
  const start = new Date(week_start)
  const schedules = []

  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().slice(0, 10)
    const nameIdx = (idx + i) % names.length
    const studentName = names[nameIdx]

    // 删除该日期已有排班
    await db.collection('duty_schedules')
      .where({ class_id, duty_date: dateStr }).remove()
    // 写入新排班
    await db.collection('duty_schedules').add({
      data: {
        class_id, duty_date: dateStr,
        student_name: studentName,
        created_by: openid, created_at: now
      }
    })
    schedules.push({ date: dateStr, student_name: studentName })
  }

  // 返回下次轮换的起始下标
  const nextIndex = (idx + 7) % names.length
  return { code: 0, msg: 'ok', data: { schedules, next_index: nextIndex } }
}

// 我的值日（未来30天）
async function myDuty(event) {
  const { class_id, student_name } = event
  if (!class_id || !student_name) return { code: -1, msg: '缺少参数' }

  const now = new Date()
  const future = new Date()
  future.setDate(future.getDate() + 30)
  const nowStr = now.toISOString().slice(0, 10)
  const futureStr = future.toISOString().slice(0, 10)

  const res = await db.collection('duty_schedules')
    .where({
      class_id, student_name,
      duty_date: _.gte(nowStr).and(_.lte(futureStr))
    })
    .orderBy('duty_date', 'asc').limit(30).get()

  return { code: 0, data: { duties: res.data } }
}
