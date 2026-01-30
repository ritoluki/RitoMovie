import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { MoreVertical } from 'lucide-react';

interface ActionItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

interface ActionDropdownProps {
  actions: ActionItem[];
  className?: string;
}

const ActionDropdown: React.FC<ActionDropdownProps> = ({ actions, className = '' }) => {
  return (
    <Menu as="div" className={`relative inline-block text-left ${className}`}>
      <Menu.Button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
        <MoreVertical className="h-5 w-5" />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-[#2a2a2a] border border-gray-700 shadow-lg focus:outline-none overflow-hidden">
          <div className="py-1">
            {actions.map((action, index) => (
              <Menu.Item key={index} disabled={action.disabled}>
                {({ active }) => (
                  <button
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className={`
                      w-full flex items-center px-4 py-2 text-sm
                      ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                      ${active ? 'bg-gray-700' : ''}
                      ${action.variant === 'danger' 
                        ? 'text-red-400 hover:text-red-300' 
                        : 'text-gray-300 hover:text-white'
                      }
                    `}
                  >
                    {action.icon && (
                      <span className="mr-3 h-5 w-5">{action.icon}</span>
                    )}
                    {action.label}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default ActionDropdown;
