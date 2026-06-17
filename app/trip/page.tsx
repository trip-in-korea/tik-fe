import { Suspense } from 'react';
import TripList from '@/components/TripList';

export const revalidate = 86400;

export default function TripPage() {
  return (
    <Suspense fallback={<div className="p-5 text-center text-xs text-gray-400">로딩 중...</div>}>
      <TripList />
    </Suspense>
  );
}
