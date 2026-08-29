const cloud = require('wx-server-sdk')
cloud.init({ env: 'cloudbase-d4gknzarya5d2b231' })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { class_id, text } = event

  if (!class_id || !text) {
    return { code: -1, message: '缺少必要参数', data: null }
  }

  try {
    // 校验调用者角色
    const memberRes = await db
      .collection('class_members')
      .where({ class_id, openid, status: 'active' })
      .get()

    if (memberRes.data.length === 0) {
      return { code: -1, message: '您不是该班级成员', data: null }
    }

    const role = memberRes.data[0].role
    if (role !== 'admin' && role !== 'head_teacher' && role !== 'committee') {
      return { code: -1, message: '仅管理员、班主任和家委可导入名单', data: null }
    }

    // 解析文本
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
    let imported = 0
    let skipped = 0

    for (const line of lines) {
      // 支持中英文逗号
      const parts = line.split(/[,，]/).map((p) => p.trim())
      if (parts.length < 2) continue

      const student_name = parts[0]
      const parent_name = parts[1]
      const phone = parts[2] || ''
      const relation = parts[3] || '家长'

      if (!student_name || !parent_name) continue

      // 去重：同 class_id + student_name + phone
      const existRes = await db
        .collection('roster')
        .where({ class_id, student_name, phone })
        .get()

      if (existRes.data.length > 0) {
        skipped++
        continue
      }

      await db.collection('roster').add({
        data: {
          class_id,
          student_name,
          parent_name,
          phone,
          relation,
          imported_by: openid,
          created_at: db.serverDate(),
        },
      })
      imported++
    }

    return { code: 0, message: 'ok', data: { imported, skipped } }
  } catch (err) {
    return { code: -1, message: err.message || '导入失败', data: null }
  }
}
