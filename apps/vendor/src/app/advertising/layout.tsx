import { VendorAdvertisingNav } from '@/components/VendorAdvertisingNav';

export default function VendorAdvertisingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <VendorAdvertisingNav />
      {children}
    </>
  );
}
