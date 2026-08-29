const cloud = require('wx-server-sdk')
cloud.init({ env: 'cloudbase-d4gknzarya5d2b231' })
const db = cloud.database()

/** 生成6位随机数字邀请码 */
function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

/** 确保邀请码不重复 */
async function ensureUniqueCode(collection, field) {
  let code = generateCode()
  let exists = await db.collection(collection).where({ [field]: code }).get()
  while (exists.data.length > 0) {
    code = generateCode()
    exists = await db.collection(collection).where({ [field]: code }).get()
  }
  return code
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { school_name, class_name, grade } = event

  // 参数校验
  if (!school_name || !class_name || !grade) {
    return { code: -1, message: '缺少必要参数', data: null }
  }

  try {
    // 1. 查找或创建学校
    let schoolRes = await db
      .collection('schools')
      .where({ name: school_name })
      .get()

    let schoolId
    if (schoolRes.data.length > 0) {
      schoolId = schoolRes.data[0]._id
    } else {
      const addSchoolRes = await db.collection('schools').add({
        data: {
          name: school_name,
          created_at: db.serverDate(),
        },
      })
      schoolId = addSchoolRes._id
    }

    // 2. 生成3个不重复的邀请码
    const inviteCode = await ensureUniqueCode('classes', 'invite_code')
    const teacherInviteCode = await ensureUniqueCode(
      'classes',
      'teacher_invite_code'
    )
    const committeeInviteCode = await ensureUniqueCode(
      'classes',
      'committee_invite_code'
    )

    // 3. 创建班级
    const addClassRes = await db.collection('classes').add({
      data: {
        school_id: schoolId,
        name: class_name,
        grade: grade,
        invite_code: inviteCode,
        teacher_invite_code: teacherInviteCode,
        committee_invite_code: committeeInviteCode,
        head_teacher_openid: openid,
        settings: {
          modules: {
            announcement: true,
            activity: true,
            fee: true,
            duty: true,
          },
        },
        plan: 'free',
        created_at: db.serverDate(),
      },
    })

    const classId = addClassRes._id

    // 4. 创建者写入 class_members，角色为 head_teacher
    await db.collection('class_members').add({
      data: {
        class_id: classId,
        openid: openid,
        role: 'head_teacher',
        student_name: '',
        parent_name: '',
        phone: '',
        relation: '',
        status: 'active',
        created_at: db.serverDate(),
      },
    })

    // 5. 返回完整班级信息
    const classDoc = await db.collection('classes').doc(classId).get()

    return {
      code: 0,
      message: 'ok',
      data: {
        classInfo: classDoc.data,
        schoolName: school_name,
      },
    }
  } catch (err) {
    return { code: -1, message: err.message || '创建失败', data: null }
  }
}
