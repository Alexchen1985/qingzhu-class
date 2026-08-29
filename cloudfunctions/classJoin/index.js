const cloud = require('wx-server-sdk')
cloud.init({ env: 'cloudbase-d4gknzarya5d2b231' })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { invite_code, phone } = event

  // 参数校验
  if (!invite_code) {
    return { code: -1, message: '请输入邀请码', data: null }
  }
  if (!phone || phone.length !== 11) {
    return { code: -1, message: '请输入正确的手机号', data: null }
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

    // 3. 根据手机号在 roster 中查找学生信息
    let student_name = ''
    let parent_name = ''
    let relation = '家长'
    let rosterId = ''

    // 无论使用什么邀请码，都先检查手机号是否在 roster 中
    const rosterRes = await db
      .collection('roster')
      .where({
        class_id: targetClass._id,
        phone: phone,
      })
      .get()

    if (rosterRes.data.length > 0) {
      // 手机号在名单中，说明是家长
      const rosterItem = rosterRes.data[0]
      student_name = rosterItem.student_name
      parent_name = rosterItem.parent_name
      relation = rosterItem.relation || '家长'
      rosterId = rosterItem._id
      
      // 如果使用家长码，角色为 parent
      // 如果使用教师码/家委码，但手机号在名单中，也设置为 parent
      if (!isParentCode) {
        role = 'parent'
      }
    } else {
      // 手机号不在名单中
      if (isParentCode) {
        // 使用家长码但不在名单中，拒绝加入
        return {
          code: -2,
          message: '该手机号不在班级名单中，请联系管理员导入名单',
          data: null,
        }
      } else {
        // 使用教师码/家委码，不在名单中也可以加入
        parent_name = phone
      }
    }

    // 4. 写入 class_members
    const memberData = {
      class_id: targetClass._id,
      openid: openid,
      role: role,
      student_name: student_name,
      parent_name: parent_name,
      phone: phone,
      relation: relation,
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
        // 忽略学校查询错误
      }
    }

    return {
      code: 0,
      message: 'ok',
      data: {
        member: {
          _id: addRes._id,
          ...memberData,
        },
        className: targetClass.name,
        schoolName: schoolName,
      },
    }
  } catch (err) {
    return { code: -1, message: err.message || '加入失败', data: null }
  }
}
