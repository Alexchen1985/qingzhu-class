const cloud = require('wx-server-sdk')
cloud.init({ env: 'cloudbase-d4gknzarya5d2b231' })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 查询该用户加入的所有班级成员记录
    const memberRes = await db
      .collection('class_members')
      .where({ openid, status: 'active' })
      .get()

    const members = memberRes.data

    if (members.length === 0) {
      return { code: 0, message: 'ok', data: { openid, classes: [] } }
    }

    // 批量查询班级信息和学校信息
    const classIds = [...new Set(members.map((m) => m.class_id))]
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
    const classes = members.map((m) => {
      const cls = classMap[m.class_id] || {}
      const school = schoolMap[cls.school_id] || {}
      return {
        member: m,
        className: cls.name || '未知班级',
        schoolName: school.name || '未知学校',
      }
    })

    return { code: 0, message: 'ok', data: { openid, classes } }
  } catch (err) {
    return { code: -1, message: err.message || '查询失败', data: null }
  }
}
