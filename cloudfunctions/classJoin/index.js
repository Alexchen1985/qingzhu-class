const cloud = require('wx-server-sdk')
cloud.init({ env: 'cloudbase-d4gknzarya5d2b231' })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { invite_code, student_name, parent_name, phone, relation } = event

  // 参数校验
  if (!invite_code) {
    return { code: -1, message: '请输入邀请码', data: null }
  }
  if (!student_name || !parent_name || !phone) {
    return { code: -1, message: '请填写完整信息', data: null }
  }

  try {
    // 1. 查找邀请码对应的班级
    const classRes = await db
      .collection('classes')
      .where({ invite_code: invite_code })
      .get()

    let role = 'parent'
    let targetClass = null
    let isParentCode = false

    if (classRes.data.length > 0) {
      targetClass = classRes.data[0]
      role = 'parent'
      isParentCode = true
    } else {
      // 尝试教师码
      const teacherRes = await db
        .collection('classes')
        .where({ teacher_invite_code: invite_code })
        .get()

      if (teacherRes.data.length > 0) {
        targetClass = teacherRes.data[0]
        role = 'teacher'
      } else {
        // 尝试家委码
        const committeeRes = await db
          .collection('classes')
          .where({ committee_invite_code: invite_code })
          .get()

        if (committeeRes.data.length > 0) {
          targetClass = committeeRes.data[0]
          role = 'committee'
        }
      }
    }

    if (!targetClass) {
      return { code: -1, message: '邀请码无效', data: null }
    }

    // 2. 检查是否已加入该班级（防重复）
    const existRes = await db
      .collection('class_members')
      .where({
        class_id: targetClass._id,
        openid: openid,
        status: 'active',
      })
      .get()

    if (existRes.data.length > 0) {
      return { code: -1, message: '您已加入该班级', data: null }
    }

    // 3. 家长码需要 roster 校验
    let rosterId = ''
    if (isParentCode) {
      const rosterRes = await db
        .collection('roster')
        .where({
          class_id: targetClass._id,
          student_name: student_name,
          parent_name: parent_name,
          phone: phone,
        })
        .get()

      if (rosterRes.data.length === 0) {
        return {
          code: -2,
          message: 'ROSTER_NOT_MATCHED',
          data: null,
        }
      }
      rosterId = rosterRes.data[0]._id
    }

    // 4. 写入 class_members
    const memberData = {
      class_id: targetClass._id,
      openid: openid,
      role: role,
      student_name: student_name,
      parent_name: parent_name,
      phone: phone,
      relation: relation || '',
      status: 'active',
      created_at: db.serverDate(),
    }
    if (rosterId) {
      memberData.roster_id = rosterId
    }

    const addRes = await db.collection('class_members').add({
      data: memberData,
    })

    // 5. 查询学校名称
    let schoolName = ''
    if (targetClass.school_id) {
      try {
        const schoolRes = await db
          .collection('schools')
          .doc(targetClass.school_id)
          .get()
        schoolName = schoolRes.data.name || ''
      } catch (e) {
        // ignore
      }
    }

    // 6. 返回结果
    const memberDoc = await db.collection('class_members').doc(addRes._id).get()

    return {
      code: 0,
      message: 'ok',
      data: {
        member: memberDoc.data,
        className: targetClass.name,
        schoolName: schoolName,
      },
    }
  } catch (err) {
    return { code: -1, message: err.message || '加入失败', data: null }
  }
}
