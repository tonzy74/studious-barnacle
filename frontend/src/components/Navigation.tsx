'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  HomeIcon,
  BriefcaseIcon,
  AdjustmentsHorizontalIcon,
  DocumentTextIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  BriefcaseIcon as BriefcaseIconSolid,
  AdjustmentsHorizontalIcon as AdjustmentsIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  UserCircleIcon as UserCircleIconSolid,
} from '@heroicons/react/24/solid';

const tabs = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
    activeIcon: HomeIconSolid,
  },
  {
    name: 'Jobs',
    href: '/jobs',
    icon: BriefcaseIcon,
    activeIcon: BriefcaseIconSolid,
  },
  {
    name: 'Criteria',
    href: '/criteria',
    icon: AdjustmentsHorizontalIcon,
    activeIcon: AdjustmentsIconSolid,
  },
  {
    name: 'Applied',
    href: '/applications',
    icon: DocumentTextIcon,
    activeIcon: DocumentTextIconSolid,
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: UserCircleIcon,
    activeIcon: UserCircleIconSolid,
  },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 pb-safe z-50">
      <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = isActive ? tab.activeIcon : tab.icon;

          return (
            <button
              key={tab.name}
              onClick={() => router.push(tab.href)}
              className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl transition-colors min-w-[56px] ${
                isActive
                  ? 'text-brand-blue'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[10px] font-medium">{tab.name}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
