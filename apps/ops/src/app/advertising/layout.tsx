import { OpsAdvertisingNav } from '@/components/OpsAdvertisingNav';

export default function OpsAdvertisingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OpsAdvertisingNav />
      {children}
    </>
  );
}
