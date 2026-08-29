const cloud = require('wx-server-sdk')
cloud.init({ env: 'cloudbase-d4gknzarya5d2b231' })
const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { class_id, avatar_url } = event

  if (!class_id || !avatar_url) {
    return { code: -1, message: '缺少必要参数', data: null }
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

    // 更新头像
    await db.collection('class_members').doc(memberId).update({
      data: {
        avatar_url,
        updated_at: db.serverDate(),
      },
    })

    return { code: 0, message: '头像更新成功', data: { avatar_url } }
  } catch (err) {
    return { code: -1, message: err.message || '头像更新失败', data: null }
  }
}
