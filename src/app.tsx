import { PropsWithChildren, useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { LucideTaroProvider } from 'lucide-react-taro';
import { initStorage, setCurrentClassId, setUserRole } from '@/store';
import { initCloud, login } from '@/services/cloud';
import type { LoginResult, CurrentClass } from '@/services/cloud-types';
import '@/app.css';
import { Toaster } from '@/components/ui/toast';
import { Preset } from './presets';

initStorage();

// 初始化云开发（仅 weapp 端生效）
initCloud();

const STORAGE_KEY_LOGIN = 'app_login_result';
const STORAGE_KEY_CURRENT_CLASS = 'app_current_class';

/** 从本地缓存恢复登录态 */
function getLocalLogin(): LoginResult | null {
  try {
    const val = Taro.getStorageSync(STORAGE_KEY_LOGIN);
    return val ? (val as LoginResult) : null;
  } catch {
    return null;
  }
}

function getLocalCurrentClass(): CurrentClass | null {
  try {
    const val = Taro.getStorageSync(STORAGE_KEY_CURRENT_CLASS);
    return val ? (val as CurrentClass) : null;
  } catch {
    return null;
  }
}

const App = ({ children }: PropsWithChildren) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // 尝试静默登录
    const cached = getLocalLogin();
    if (cached && cached.classes.length > 0) {
      // 已有缓存，直接使用
      const currentClass = getLocalCurrentClass();
      if (!currentClass && cached.classes.length > 0) {
        // 自动选中第一个班级
        const first = cached.classes[0];
        const cc: CurrentClass = {
          classId: first.member.class_id,
          className: first.className,
          role: first.member.role,
          studentName: first.member.student_name,
          parentName: first.member.parent_name,
          phone: first.member.phone,
          relation: first.member.relation,
        };
        Taro.setStorageSync(STORAGE_KEY_CURRENT_CLASS, cc);
        setCurrentClassId(first.member.class_id);
        setUserRole(first.member.role);
      }
      setReady(true);
      return;
    }

    // 无缓存，调用云函数
    login()
      .then((result: LoginResult) => {
        Taro.setStorageSync(STORAGE_KEY_LOGIN, result);
        if (result.classes.length > 0) {
          const first = result.classes[0];
          const cc: CurrentClass = {
            classId: first.member.class_id,
            className: first.className,
            role: first.member.role,
            studentName: first.member.student_name,
            parentName: first.member.parent_name,
            phone: first.member.phone,
            relation: first.member.relation,
          };
          Taro.setStorageSync(STORAGE_KEY_CURRENT_CLASS, cc);
          setCurrentClassId(first.member.class_id);
          setUserRole(first.member.role);
        }
        setReady(true);
      })
      .catch(() => {
        // H5 mock 或网络失败，也放行
        setReady(true);
      });
  }, []);

  if (!ready) {
    return (
      <LucideTaroProvider defaultColor="#000" defaultSize={24}>
        <Preset>{children}</Preset>
        <Toaster />
      </LucideTaroProvider>
    );
  }

  return (
    <LucideTaroProvider defaultColor="#000" defaultSize={24}>
      <Preset>{children}</Preset>
      <Toaster />
    </LucideTaroProvider>
  );
};

export default App;
