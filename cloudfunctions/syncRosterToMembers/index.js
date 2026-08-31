const cloud = require('wx-server-sdk')
cloud.init({ env: 'cloudbase-d4gknzarya5d2b231' })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { class_id } = event

  if (!class_id) {
    return { code: -1, message: '缺少 class_id', data: null }
  }

  try {
    // 1. 验证调用者是否是班主任
    const memberRes = await db
      .collection('class_members')
      .where({ class_id, openid, role: 'head_teacher', status: 'active' })
      .get()

    if (memberRes.data.length === 0) {
      return { code: -1, message: '只有班主任可以执行同步', data: null }
    }

    // 2. 查询 roster 中所有记录
    const rosterRes = await db
      .collection('roster')
      .where({ class_id })
      .limit(100)
      .get()

    if (rosterRes.data.length === 0) {
      return { code: -1, message: 'roster 中没有记录', data: null }
    }

    // 3. 查询已存在的 class_members
    const existMembersRes = await db
      .collection('class_members')
      .where({ class_id })
      .limit(100)
      .get()

    const existPhones = new Set(existMembersRes.data.map(m => m.phone))

    // 4. 批量添加不存在的记录
    let added = 0
    let skipped = 0

    for (const rosterItem of rosterRes.data) {
      if (existPhones.has(rosterItem.phone)) {
        skipped++
        continue
      }

      await db.collection('class_members').add({
        data: {
          class_id: rosterItem.class_id,
          openid: '', // 家长登录时会更新
          role: rosterItem.role || 'parent',
          student_name: rosterItem.student_name,
          parent_name: rosterItem.parent_name,
          phone: rosterItem.phone,
          relation: rosterItem.relation || '家长',
          status: 'active',
          roster_id: rosterItem._id,
          created_at: db.serverDate(),
        },
      })
      added++
    }

    return {
      code: 0,
      message: 'ok',
      data: { added, skipped, total: rosterRes.data.length },
    }
  } catch (err) {
    return { code: -1, message: err.message || '同步失败', data: null }
  }
}
