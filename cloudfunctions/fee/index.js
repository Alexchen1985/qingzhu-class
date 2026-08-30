const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { action } = event

  try {
    // teacher 角色一律拒绝
    const memberRes = await db.collection('class_members')
      .where({ class_id: event.class_id, openid, status: 'active' }).limit(1).get()
    if (memberRes.data.length === 0) return { code: -1, msg: 'NO_PERMISSION' }
    const role = memberRes.data[0].role
    if (role === 'teacher') return { code: -1, msg: 'NO_FEE_PERMISSION' }

    switch (action) {
      case 'recordAdd': return await recordAdd(event, openid, role)
      case 'recordDelete': return await recordDelete(event, openid, role)
      case 'recordList': return await recordList(event, openid)
      case 'collectionCreate': return await collectionCreate(event, openid, role)
      case 'collectionList': return await collectionList(event, openid)
      case 'paymentMark': return await paymentMark(event, openid, role)
      case 'paymentList': return await paymentList(event, openid)
      default: return { code: -1, msg: 'Unknown action: ' + action }
    }
  } catch (err) {
    console.error('[fee] error:', action, err)
    return { code: -1, msg: err.message || '服务器错误' }
  }
}

async function isManager(classId, openid) {
  const res = await db.collection('class_members')
    .where({ class_id: classId, openid, status: 'active' }).limit(1).get()
  const role = res.data.length > 0 ? res.data[0].role : null
  return role === 'admin' || role === 'head_teacher' || role === 'committee'
}

// 添加收支记录
async function recordAdd(event, openid, role) {
  const { class_id, type, amount, purpose, handler_name, voucher_images, occurred_at } = event
  if (!class_id || !type || !amount) return { code: -1, msg: '缺少必要参数' }
  if (role !== 'admin' && role !== 'head_teacher' && role !== 'committee') return { code: -1, msg: 'NO_PERMISSION' }

  const now = new Date()
  const result = await db.collection('fee_records').add({
    data: {
      class_id, type, amount: parseInt(amount),
      purpose: purpose || '', handler_name: handler_name || '',
      voucher_images: voucher_images || [],
      occurred_at: occurred_at || now.toISOString().slice(0, 10),
      created_by: openid, created_at: now
    }
  })
  return { code: 0, msg: 'ok', data: { record_id: result._id } }
}

// 删除收支记录
async function recordDelete(event, openid, role) {
  const { record_id, class_id } = event
  if (!record_id) return { code: -1, msg: '缺少record_id' }
  if (role !== 'admin' && role !== 'head_teacher' && role !== 'committee') return { code: -1, msg: 'NO_PERMISSION' }

  await db.collection('fee_records').doc(record_id).remove()
  return { code: 0, msg: '已删除' }
}

// 收支流水列表（按月分组）
async function recordList(event, openid) {
  const { class_id } = event
  if (!class_id) return { code: -1, msg: '缺少class_id' }

  const res = await db.collection('fee_records')
    .where({ class_id })
    .orderBy('occurred_at', 'desc').limit(500).get()
  const records = res.data

  // 按月分组
  const grouped = {}
  let totalIncome = 0
  let totalExpense = 0
  for (const r of records) {
    const month = (r.occurred_at || '').slice(0, 7) || '未知'
    if (!grouped[month]) grouped[month] = []
    grouped[month].push(r)
    if (r.type === 'income') totalIncome += r.amount
    else totalExpense += r.amount
  }

  const months = Object.keys(grouped).sort().reverse()
  return {
    code: 0,
    data: {
      records, grouped, months,
      total_income: totalIncome,
      total_expense: totalExpense,
      balance: totalIncome - totalExpense
    }
  }
}

// 创建收费项目
async function collectionCreate(event, openid, role) {
  const { class_id, title, amount_per_student, deadline, note } = event
  if (!class_id || !title || !amount_per_student) return { code: -1, msg: '缺少必要参数' }
  if (role !== 'admin' && role !== 'head_teacher' && role !== 'committee') return { code: -1, msg: 'NO_PERMISSION' }

  const now = new Date()
  const collResult = await db.collection('fee_collections').add({
    data: {
      class_id, title, amount_per_student: parseInt(amount_per_student),
      deadline: deadline || '', note: note || '',
      created_by: openid, created_at: now
    }
  })
  const collectionId = collResult._id

  // 自动按 roster 生成 unpaid 的 fee_payments
  const rosterRes = await db.collection('roster')
    .where({ class_id }).limit(200).get()
  const payments = rosterRes.data.map(s => ({
    collection_id: collectionId, class_id,
    roster_id: s._id, student_name: s.student_name,
    amount: parseInt(amount_per_student),
    status: 'unpaid', paid_at: null,
    recorded_by: openid, created_at: now
  }))

  // 批量写入（每次最多20条）
  for (let i = 0; i < payments.length; i += 20) {
    const batch = payments.slice(i, i + 20)
    const tasks = batch.map(p => db.collection('fee_payments').add({ data: p }))
    await Promise.all(tasks)
  }

  return { code: 0, msg: 'ok', data: { collection_id: collectionId, student_count: rosterRes.data.length } }
}

// 收费项目列表
async function collectionList(event, openid) {
  const { class_id } = event
  if (!class_id) return { code: -1, msg: '缺少class_id' }

  const collRes = await db.collection('fee_collections')
    .where({ class_id })
    .orderBy('created_at', 'desc').limit(100).get()
  const collections = collRes.data

  const result = []
  for (const c of collections) {
    const paidRes = await db.collection('fee_payments')
      .where({ collection_id: c._id, status: 'paid' }).count()
    const unpaidRes = await db.collection('fee_payments')
      .where({ collection_id: c._id, status: 'unpaid' }).limit(100).get()
    result.push({
      ...c,
      paid_count: paidRes.total,
      unpaid_count: unpaidRes.data.length,
      unpaid_students: unpaidRes.data.map(p => p.student_name)
    })
  }
  return { code: 0, data: { collections: result } }
}

// 标记缴费状态
async function paymentMark(event, openid, role) {
  const { payment_ids, status, class_id } = event
  if (!payment_ids || !Array.isArray(payment_ids)) return { code: -1, msg: '缺少payment_ids' }
  if (role !== 'admin' && role !== 'head_teacher' && role !== 'committee') return { code: -1, msg: 'NO_PERMISSION' }

  const updateData = status === 'paid'
    ? { status: 'paid', paid_at: new Date() }
    : { status: 'unpaid', paid_at: null }

  for (const pid of payment_ids) {
    await db.collection('fee_payments').doc(pid).update({ data: updateData })
  }
  return { code: 0, msg: 'ok', data: { updated: payment_ids.length } }
}

// 获取缴费记录列表
async function paymentList(event, openid) {
  const { collection_id } = event
  if (!collection_id) return { code: -1, msg: '缺少collection_id' }

  const res = await db.collection('fee_payments')
    .where({ collection_id, status: 'unpaid' })
    .limit(200).get()

  return { code: 0, data: { payments: res.data } }
}
