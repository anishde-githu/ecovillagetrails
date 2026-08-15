'use client';

import { useRouter } from 'next/navigation';
import {
  Home,
  Compass,
  CalendarClock,
  User
} from 'lucide-react';

import Dock from './Dock';

export default function MobileDock() {
  const router = useRouter();

  const items = [
    {
      label: 'Home',
      icon: <Home size={22} />,
      onClick: () => router.push('/legacy/index.html')
    },
    {
      label: 'Explore',
      icon: <Compass size={22} />,
      onClick: () => {
        window.location.href = '/legacy/index.html#destinations';
      }
    },
    {
      label: 'Plan',
      icon: <CalendarClock size={22} />,
      onClick: () => {
        window.location.href = '/legacy/index.html#planner';
      }
    },
    {
      label: 'Account',
      icon: <User size={22} />,
      onClick: () => router.push('/my-account')
    }
  ];

  return (
    <div className='md:hidden'>
      <Dock
        items={items}
        baseItemSize={52}
        magnification={78}
        distance={180}
        panelHeight={72}
      />
    </div>
  );
}