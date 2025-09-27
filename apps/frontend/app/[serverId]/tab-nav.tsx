'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface TabNavProps {
  serverId: string;
}

export function TabNav({ serverId }: TabNavProps) {
  const pathname = usePathname();

  const tabs = [
    { name: 'Overview', href: `/${serverId}`, current: pathname === `/${serverId}` },
    { name: 'Tool Evaluation', href: `/${serverId}/tool`, current: pathname === `/${serverId}/tool` },
    { name: 'Security Analysis', href: `/${serverId}/security`, current: pathname === `/${serverId}/security` },
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <Link
            key={tab.name}
            href={tab.href}
            className={`
              whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm
              ${
                tab.current
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            {tab.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}