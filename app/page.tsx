import ImmersiveLayout from '@/components/ImmersiveLayout';
import ExclusiveRoster from '@/components/ExclusiveRoster';
import CtaBanner from '@/components/CtaBanner';

export default function Home() {
  return (
    <main>
      <ImmersiveLayout />
      <ExclusiveRoster />
      <CtaBanner />
    </main>
  );
}
