import { PropsWithChildren } from 'react';
import { LucideTaroProvider } from 'lucide-react-taro';
import { initStorage } from '@/store';
import '@/app.css';
import { Toaster } from '@/components/ui/toast';
import { Preset } from './presets';

initStorage();

const App = ({ children }: PropsWithChildren) => {
  return (
    <LucideTaroProvider defaultColor="#000" defaultSize={24}>
      <Preset>{children}</Preset>
      <Toaster />
    </LucideTaroProvider>
  );
};

export default App;
