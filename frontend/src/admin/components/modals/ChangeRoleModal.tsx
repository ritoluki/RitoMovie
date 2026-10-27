import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import Button from '@/components/common/Button';

import {
  X,
  Loader2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  User,
  BarChart,
} from 'lucide-react';
import adminService from '../../services/adminService';
import type { AdminUser } from '../../types/admin';

interface ChangeRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUser | null;
}

type UserRole = 'user' | 'analyst' | 'moderator' | 'admin' | 'super_admin';

const roles: {
  value: UserRole;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    value: 'user',
    label: 'User',
    description: 'Regular user with standard access',
    icon: <User className="w-5 h-5" />,
    color: 'gray',
  },
  {
    value: 'analyst',
    label: 'Analyst',
    description: 'Can view analytics and reports',
    icon: <BarChart className="w-5 h-5" />,
    color: 'cyan',
  },
  {
    value: 'moderator',
    label: 'Moderator',
    description: 'Can moderate comments and handle reports',
    icon: <Shield className="w-5 h-5" />,
    color: 'green',
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Full admin access except role management',
    icon: <ShieldCheck className="w-5 h-5" />,
    color: 'blue',
  },
  {
    value: 'super_admin',
    label: 'Super Admin',
    description: 'Full system access including role management',
    icon: <ShieldAlert className="w-5 h-5" />,
    color: 'purple',
  },
];

const ChangeRoleModal: React.FC<ChangeRoleModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setSelectedRole(user.role as UserRole);
      setError('');
    }
  }, [user]);

  const changeRoleMutation = useMutation({
    mutationFn: (role: string) => adminService.changeUserRole(user!._id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      onClose();
    },
    onError: (err: Error) => {
      setError(err.message || t('admin.modals.changeRoleFailed'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole === user?.role) {
      onClose();
      return;
    }
    changeRoleMutation.mutate(selectedRole);
  };

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colors: Record<string, { bg: string; border: string; text: string }> =
      {
        gray: {
          bg: 'bg-gray-900/50',
          border: 'border-gray-600',
          text: 'text-gray-300',
        },
        cyan: {
          bg: 'bg-cyan-900/50',
          border: 'border-cyan-600',
          text: 'text-cyan-300',
        },
        green: {
          bg: 'bg-green-900/50',
          border: 'border-green-600',
          text: 'text-green-300',
        },
        blue: {
          bg: 'bg-blue-900/50',
          border: 'border-blue-600',
          text: 'text-blue-300',
        },
        purple: {
          bg: 'bg-purple-900/50',
          border: 'border-purple-600',
          text: 'text-purple-300',
        },
      };

    if (isSelected) {
      return `${colors[color].bg} ${colors[color].border} ${colors[color].text}`;
    }
    return 'bg-[#2a2a2a] border-gray-700 text-gray-400 hover:border-gray-500';
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        aria-describedby={undefined}
        className="max-w-lg max-h-[90dvh] overflow-y-auto p-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <DialogTitle className="text-lg font-semibold text-white">
            {t('admin.modals.changeRole')}
          </DialogTitle>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {/* User Info */}
            {user && (
              <div className="flex items-center gap-3 p-3 bg-[#2a2a2a] rounded-lg">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-medium">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-white font-medium">{user.name}</p>
                  <p className="text-gray-400 text-sm">{user.email}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Role Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                {t('admin.modals.selectRole')}
              </label>
              <div className="space-y-2">
                {roles.map((role) => (
                  <Button
                    key={role.value}
                    type="button"
                    onClick={() => setSelectedRole(role.value)}
                    variant="ghost"
                    aria-pressed={selectedRole === role.value}
                    className={`h-auto w-full whitespace-normal flex items-center gap-3 p-3 rounded-xl border transition-colors ${getColorClasses(
                      role.color,
                      selectedRole === role.value
                    )}`}
                  >
                    <div
                      className={
                        selectedRole === role.value ? '' : 'text-gray-500'
                      }
                    >
                      {role.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <p
                        className={`font-medium ${selectedRole === role.value ? 'text-white' : 'text-gray-300'}`}
                      >
                        {t(`admin.roles.${role.value}`)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t(`admin.roleDescriptions.${role.value}`)}
                      </p>
                    </div>
                    {selectedRole === role.value && (
                      <div className="w-2 h-2 rounded-full bg-current" />
                    )}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-4 border-t border-gray-700">
            <Button type="button" onClick={onClose} variant="outline">
              {t('admin.common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={
                changeRoleMutation.isPending || selectedRole === user?.role
              }
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {changeRoleMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {t('admin.modals.changeRole')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChangeRoleModal;
