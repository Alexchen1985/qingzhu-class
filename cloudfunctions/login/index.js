const cloud = require('wx-server-sdk')
cloud.init({ env: 'cloudbase-d4gknzarya5d2b231' })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { phone } = event

  if (!phone || phone.length !== 11) {
    return { code: -1, message: '请输入正确的手机号', data: null }
  }

  try {
    // 1. 查找该手机号对应的所有班级成员记录
    const memberRes = await db
      .collection('class_members')
      .where({
        phone: phone,
        status: 'active',
      })
      .get()

    // 2. 如果找到了，直接返回
    if (memberRes.data.length > 0) {
      // 批量查询班级和学校信息
      const classIds = [...new Set(memberRes.data.map((m) => m.class_id))]
      const classRes = await db
        .collection('classes')
        .where({ _id: _.in(classIds) })
        .get()

      const classMap = {}
      classRes.data.forEach((c) => {
        classMap[c._id] = c
      })

      // 查询学校信息
      const schoolIds = [
        ...new Set(classRes.data.map((c) => c.school_id).filter(Boolean)),
      ]
      const schoolMap = {}
      if (schoolIds.length > 0) {
        const schoolRes = await db
          .collection('schools')
          .where({ _id: _.in(schoolIds) })
          .get()
        schoolRes.data.forEach((s) => {
          schoolMap[s._id] = s
        })
      }

      // 组装返回数据
      const classes = memberRes.data.map((m) => {
        const cls = classMap[m.class_id] || {}
        const school = schoolMap[cls.school_id] || {}
        return {
          member: m,
          className: cls.name || '未知班级',
          schoolName: school.name || '未知学校',
        }
      })

      return { code: 0, message: 'ok', data: { openid, phone, classes } }
    }

    // 3. 如果没找到，尝试在 roster 中查找并自动添加
    const rosterRes = await db
      .collection('roster')
      .where({ phone: phone })
      .get()

    if (rosterRes.data.length === 0) {
      return { code: -1, message: '该手机号未加入任何班级', data: null }
    }

    // 4. 自动添加到 class_members
    const addedClasses = []
    for (const rosterItem of rosterRes.data) {
      const classRes = await db
        .collection('classes')
        .doc(rosterItem.class_id)
        .get()

      if (!classRes.data) continue

      const memberData = {
        class_id: rosterItem.class_id,
        openid: openid,
        role: rosterItem.role || 'parent',
        student_name: rosterItem.student_name,
        parent_name: rosterItem.parent_name,
        phone: phone,
        relation: rosterItem.relation || '家长',
        status: 'active',
        roster_id: rosterItem._id,
        created_at: db.serverDate(),
      }

      const addRes = await db.collection('class_members').add({
        data: memberData,
      })

      addedClasses.push({
        member: { _id: addRes._id, ...memberData },
        className: classRes.data.name || '未知班级',
        schoolName: '',
      })
    }

    if (addedClasses.length === 0) {
      return { code: -1, message: '自动加入失败', data: null }
    }

    return {
      code: 0,
      message: 'ok',
      data: { openid, phone, classes: addedClasses },
    }
  } catch (err) {
    return { code: -1, message: err.message || '登录失败', data: null }
  }
}
