import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, Mail, Calendar, Shield, Film, MessageCircle, Star, Clock } from 'lucide-react';
import adminService from '../../services/adminService';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ isOpen, onClose, userId }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'user', userId],
    queryFn: () => adminService.getUserDetails(userId!),
    enabled: !!userId && isOpen,
  });

  const user = data?.data;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-xl bg-[#1a1a1a] border border-gray-700 shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                  <Dialog.Title className="text-lg font-semibold text-white">
                    User Details
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6">
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner />
                    </div>
                  ) : user ? (
                    <div className="space-y-6">
                      {/* User Profile */}
                      <div className="flex items-center space-x-4">
                        {user.user?.avatar ? (
                          <img
                            src={user.user.avatar}
                            alt={user.user.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-2xl font-bold">
                            {user.user?.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                        )}
                        <div>
                          <h3 className="text-xl font-semibold text-white">{user.user?.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                user.user?.role === 'super_admin'
                                  ? 'bg-purple-900/50 text-purple-300'
                                  : user.user?.role === 'admin'
                                  ? 'bg-blue-900/50 text-blue-300'
                                  : user.user?.role === 'moderator'
                                  ? 'bg-green-900/50 text-green-300'
                                  : 'bg-gray-700 text-gray-300'
                              }`}
                            >
                              {user.user?.role}
                            </span>
                            {user.user?.isBanned && (
                              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-900/50 text-red-300">
                                Banned
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* User Info */}
                      <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-center gap-3 text-gray-300">
                          <Mail className="w-5 h-5 text-gray-500" />
                          <span>{user.user?.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-300">
                          <Calendar className="w-5 h-5 text-gray-500" />
                          <span>Joined {new Date(user.user?.createdAt).toLocaleDateString()}</span>
                        </div>
                        {user.user?.lastLoginAt && (
                          <div className="flex items-center gap-3 text-gray-300">
                            <Clock className="w-5 h-5 text-gray-500" />
                            <span>Last login: {new Date(user.user.lastLoginAt).toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      {/* User Stats */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-[#2a2a2a] rounded-lg p-4 text-center">
                          <Film className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-white">{user.stats?.watchHistoryCount || 0}</div>
                          <div className="text-xs text-gray-400">Movies Watched</div>
                        </div>
                        <div className="bg-[#2a2a2a] rounded-lg p-4 text-center">
                          <MessageCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-white">{user.stats?.commentsCount || 0}</div>
                          <div className="text-xs text-gray-400">Comments</div>
                        </div>
                        <div className="bg-[#2a2a2a] rounded-lg p-4 text-center">
                          <Star className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-white">{user.stats?.ratingsCount || 0}</div>
                          <div className="text-xs text-gray-400">Ratings</div>
                        </div>
                      </div>

                      {/* Ban Info */}
                      {user.user?.isBanned && (
                        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                          <h4 className="text-red-400 font-medium mb-2">Ban Information</h4>
                          <p className="text-gray-300 text-sm">
                            <strong>Reason:</strong> {user.user.banReason || 'No reason provided'}
                          </p>
                          {user.user.bannedAt && (
                            <p className="text-gray-400 text-sm mt-1">
                              Banned on: {new Date(user.user.bannedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-8">User not found</p>
                  )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-4 border-t border-gray-700">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default UserDetailsModal;
