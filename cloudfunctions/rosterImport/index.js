const cloud = require('wx-server-sdk')
cloud.init({ env: 'cloudbase-d4gknzarya5d2b231' })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { action, class_id, text } = event

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
      return { code: -1, message: '仅管理员、班主任和家委可操作名单', data: null }
    }

    // 根据 action 处理不同操作
    switch (action) {
      case 'list':
        return await handleList(class_id)
      case 'add':
        return await handleAdd(event, openid)
      case 'delete':
        return await handleDelete(event, openid)
      default:
        // 默认处理批量导入
        return await handleImport(event, openid)
    }
  } catch (err) {
    return { code: -1, message: err.message || '操作失败', data: null }
  }
}

// 查询名单列表
async function handleList(class_id) {
  const res = await db
    .collection('roster')
    .where({ class_id })
    .orderBy('created_at', 'desc')
    .limit(100)
    .get()

  return { code: 0, message: 'ok', data: res.data }
}

// 手动添加单条
async function handleAdd(event, openid) {
  const { class_id, student_name, parent_name, phone, relation, role } = event
  if (!class_id || !student_name || !parent_name || !phone) {
    return { code: -1, message: '缺少必要参数', data: null }
  }

  await db.collection('roster').add({
    data: {
      class_id,
      student_name,
      parent_name,
      phone,
      relation: relation || '家长',
      role: role || 'parent',  // 新增：角色字段
      imported_by: openid,
      created_at: db.serverDate(),
    },
  })

  return { code: 0, message: 'ok', data: { _id: 'added' } }
}

// 删除单条
async function handleDelete(event, openid) {
  const { roster_id, class_id } = event
  if (!roster_id) {
    return { code: -1, message: '缺少 roster_id', data: null }
  }

  await db.collection('roster').doc(roster_id).remove()
  return { code: 0, message: 'ok', data: null }
}

// 批量导入
async function handleImport(event, openid) {
  const { class_id, text } = event

  if (!class_id || !text) {
    return { code: -1, message: '缺少必要参数', data: null }
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
    const role = parts[4] || 'parent'  // 新增：角色字段

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
        role,  // 新增：角色字段
        imported_by: openid,
        created_at: db.serverDate(),
      },
    })
    imported++
  }

  return { code: 0, message: 'ok', data: { imported, skipped } }
}
