/**
 * 青竹班数据导入脚本
 * 
 * 使用方法：
 * 1. npm install @cloudbase/node-sdk
 * 2. 修改下方的 ENV_ID 和 CLASS_ID
 * 3. node import-data.js
 */

const cloudbase = require('@cloudbase/node-sdk');

// ========== 配置区 ==========
const ENV_ID = 'cloudbase-d4gknzarya5d2b231'; // 云开发环境 ID
const CLASS_ID = ''; // 填入你的班级 ID（在云开发控制台 → 数据库 → classes 集合中查看）
// ============================

const app = cloudbase.init({ env: ENV_ID });
const db = app.database();

// 39 名学生名单
const students = [
  { student_name: '陈一晴', parent_name: '侯琴', phone: '15951884433', relation: '妈妈' },
  { student_name: '陈羽兮', parent_name: '陈家长', phone: '15205160994', relation: '家长' },
  { student_name: '丁七安', parent_name: '丁家长', phone: '15850553312', relation: '家长' },
  { student_name: '付宁庭', parent_name: '付家长', phone: '19962033277', relation: '家长' },
  { student_name: '韩思颖', parent_name: '韩家长', phone: '18724109502', relation: '家长' },
  { student_name: '金琪悦', parent_name: '金家长', phone: '15261876992', relation: '家长' },
  { student_name: '李沐妍', parent_name: '李家长', phone: '18020135625', relation: '家长' },
  { student_name: '李若瑜', parent_name: '李家长', phone: '18851051321', relation: '家长' },
  { student_name: '孟晋熙', parent_name: '孟家长', phone: '13913011740', relation: '家长' },
  { student_name: '倪字彤', parent_name: '倪家长', phone: '13770700864', relation: '家长' },
  { student_name: '钱槿辰', parent_name: '钱家长', phone: '15005143068', relation: '家长' },
  { student_name: '钱昭昭', parent_name: '钱家长', phone: '13851439012', relation: '家长' },
  { student_name: '任安琪', parent_name: '任家长', phone: '15365179101', relation: '家长' },
  { student_name: '徐稷斐', parent_name: '徐家长', phone: '15062224036', relation: '家长' },
  { student_name: '徐贤轶', parent_name: '徐家长', phone: '15952081713', relation: '家长' },
  { student_name: '姚嘉', parent_name: '姚家长', phone: '13611595735', relation: '家长' },
  { student_name: '于千芮', parent_name: '于家长', phone: '18510669376', relation: '家长' },
  { student_name: '张羽箫', parent_name: '张家长', phone: '15895821093', relation: '家长' },
  { student_name: '郑昕怡', parent_name: '郑家长', phone: '18136659808', relation: '家长' },
  { student_name: '房敬凯', parent_name: '房家长', phone: '18551825625', relation: '家长' },
  { student_name: '葛沐行', parent_name: '葛家长', phone: '15298350312', relation: '家长' },
  { student_name: '顾希诚', parent_name: '顾家长', phone: '18021532426', relation: '家长' },
  { student_name: '顾奕安', parent_name: '顾家长', phone: '13770694940', relation: '家长' },
  { student_name: '江皓晨', parent_name: '江家长', phone: '13914495296', relation: '家长' },
  { student_name: '李嘉烨', parent_name: '李家长', phone: '18251819830', relation: '家长' },
  { student_name: '李科锦', parent_name: '李家长', phone: '18851051321', relation: '家长' },
  { student_name: '刘绍', parent_name: '刘家长', phone: '15852911802', relation: '家长' },
  { student_name: '钱弘至', parent_name: '钱家长', phone: '19962006725', relation: '家长' },
  { student_name: '秦骁', parent_name: '秦家长', phone: '15261461358', relation: '家长' },
  { student_name: '沈奕辰', parent_name: '沈家长', phone: '15673387717', relation: '家长' },
  { student_name: '宋梓卓', parent_name: '宋家长', phone: '15951651698', relation: '家长' },
  { student_name: '汤睿辰', parent_name: '汤家长', phone: '15861364335', relation: '家长' },
  { student_name: '王璟程', parent_name: '王家长', phone: '17625909751', relation: '家长' },
  { student_name: '王煜恒', parent_name: '王家长', phone: '15050526630', relation: '家长' },
  { student_name: '薛帆', parent_name: '薛家长', phone: '18020108108', relation: '家长' },
  { student_name: '衣子维', parent_name: '衣家长', phone: '18900663907', relation: '家长' },
  { student_name: '张子涵', parent_name: '张家长', phone: '15951084699', relation: '家长' },
  { student_name: '甄永哲', parent_name: '甄家长', phone: '15851870216', relation: '家长' },
  { student_name: '郑嘉懿', parent_name: '郑家长', phone: '18651688326', relation: '家长' },
];

async function importRoster() {
  if (!CLASS_ID) {
    console.error('❌ 请先设置 CLASS_ID（班级 ID）');
    process.exit(1);
  }

  console.log(`📋 开始导入名单到班级：${CLASS_ID}`);
  console.log(`👥 共 ${students.length} 名学生\n`);

  let imported = 0;
  let skipped = 0;

  for (const student of students) {
    try {
      // 检查是否已存在
      const existing = await db.collection('roster')
        .where({
          class_id: CLASS_ID,
          student_name: student.student_name,
          phone: student.phone
        })
        .get();

      if (existing.data.length > 0) {
        console.log(`⏭️  跳过：${student.student_name}（已存在）`);
        skipped++;
        continue;
      }

      // 插入新记录
      await db.collection('roster').add({
        class_id: CLASS_ID,
        student_name: student.student_name,
        parent_name: student.parent_name,
        phone: student.phone,
        relation: student.relation,
        imported_by: 'script',
        created_at: new Date().toISOString(),
      });

      console.log(`✅ 导入：${student.student_name} - ${student.parent_name} (${student.phone})`);
      imported++;
    } catch (err) {
      console.error(`❌ 失败：${student.student_name} - ${err.message}`);
    }
  }

  console.log(`\n========== 导入完成 ==========`);
  console.log(`✅ 新增：${imported} 人`);
  console.log(`⏭️  跳过：${skipped} 人`);
  console.log(`📊 总计：${students.length} 人`);
}

// 运行导入
importRoster().catch(err => {
  console.error('导入失败:', err);
  process.exit(1);
});
