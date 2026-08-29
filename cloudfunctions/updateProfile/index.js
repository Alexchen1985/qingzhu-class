const cloud = require('wx-server-sdk')
cloud.init({ env: 'cloudbase-d4gknzarya5d2b231' })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { class_id, parent_name, phone, student_name, relation } = event

  if (!class_id) {
    return { code: -1, message: '缺少 class_id', data: null }
  }

  try {
    // 查找当前用户的成员记录
    const memberRes = await db
      .collection('class_members')
      .where({ class_id, openid, status: 'active' })
      .get()

    if (memberRes.data.length === 0) {
      return { code: -1, message: '您不是该班级成员', data: null }
    }

    const memberId = memberRes.data[0]._id

    // 构建更新数据
    const updateData = {}
    if (parent_name !== undefined) updateData.parent_name = parent_name
    if (phone !== undefined) updateData.phone = phone
    if (student_name !== undefined) updateData.student_name = student_name
    if (relation !== undefined) updateData.relation = relation
    updateData.updated_at = db.serverDate()

    // 更新成员记录
    await db.collection('class_members').doc(memberId).update({
      data: updateData,
    })

    return { code: 0, message: '更新成功', data: updateData }
  } catch (err) {
    return { code: -1, message: err.message || '更新失败', data: null }
  }
}
