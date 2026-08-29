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

    if (memberRes.data.length === 0) {
      return { code: -1, message: '该手机号未加入任何班级', data: null }
    }

    // 2. 批量查询班级和学校信息
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
  } catch (err) {
    return { code: -1, message: err.message || '登录失败', data: null }
  }
}
