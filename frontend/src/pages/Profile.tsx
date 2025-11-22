import { useState, FormEvent, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMovieStore } from '@/store/movieStore';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import AvatarSelector from '@/components/profile/AvatarSelector';
import { FiUser, FiMail, FiLock, FiList, FiClock, FiStar, FiCamera } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { watchlist, history, fetchWatchlist, fetchHistory } = useMovieStore();
  const { t } = useTranslation();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  useEffect(() => {
    fetchWatchlist();
    fetchHistory();
  }, [fetchWatchlist, fetchHistory]);

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();

    if (!name || !email) {
      toast.error(t('auth.validation.fillAllFields'));
      return;
    }

    setIsLoading(true);
    try {
      await updateProfile({ name, email, avatar });
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarSelect = (avatarUrl: string) => {
    setAvatar(avatarUrl);
  };

  const stats = [
    {
      icon: FiList,
      label: t('profile.moviesInWatchlist'),
      value: watchlist.length,
      color: 'text-blue-500',
    },
    {
      icon: FiClock,
      label: t('profile.moviesWatched'),
      value: history.length,
      color: 'text-green-500',
    },
    {
      icon: FiStar,
      label: t('profile.accountCreated'),
      value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A',
      color: 'text-yellow-500',
    },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{t('profile.title')}</h1>
          <p className="text-gray-400">{t('profile.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-2">
            <Card className="p-6 md:p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center overflow-hidden">
                      {(avatar || user?.avatar) ? (
                        <img
                          src={avatar || user.avatar}
                          alt={user?.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FiUser size={40} className="text-white" />
                      )}
                    </div>
                    {isEditingProfile && (
                      <button
                        type="button"
                        onClick={() => setShowAvatarSelector(true)}
                        className="absolute bottom-0 right-0 w-8 h-8 bg-yellow-500 hover:bg-yellow-600 rounded-full flex items-center justify-center transition-colors shadow-lg"
                        title={t('profile.changeAvatar', 'Đổi avatar')}
                      >
                        <FiCamera size={16} className="text-gray-900" />
                      </button>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{user?.name}</h2>
                    <p className="text-gray-400">{user?.email}</p>
                  </div>
                </div>

                {!isEditingProfile && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsEditingProfile(true)}
                  >
                    {t('profile.editProfile')}
                  </Button>
                )}
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <Input
                    type="text"
                    label={t('profile.name')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('profile.namePlaceholder')}
                  />

                  <Input
                    type="email"
                    label={t('profile.email')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('profile.emailPlaceholder')}
                  />

                  <div className="flex items-center space-x-4">
                    <Button type="submit" variant="primary" isLoading={isLoading}>
                      {t('common.saveChanges')}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setName(user?.name || '');
                        setEmail(user?.email || '');
                        setIsEditingProfile(false);
                      }}
                    >
                      {t('common.cancel')}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 pt-4 border-t border-gray-700">
                  <div className="flex items-center space-x-3">
                    <FiUser className="text-gray-400" size={20} />
                    <div>
                      <p className="text-gray-400 text-sm">{t('profile.fullName')}</p>
                      <p className="text-white font-medium">{user?.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <FiMail className="text-gray-400" size={20} />
                    <div>
                      <p className="text-gray-400 text-sm">{t('profile.emailAddress')}</p>
                      <p className="text-white font-medium">{user?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <FiLock className="text-gray-400" size={20} />
                    <div>
                      <p className="text-gray-400 text-sm">{t('profile.password')}</p>
                      <p className="text-white font-medium">••••••••</p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Stats Card */}
          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">{t('profile.statistics')}</h3>
              <div className="space-y-4">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-900 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={stat.color} size={24} />
                        <span className="text-gray-300">{stat.label}</span>
                      </div>
                      <span className="text-white font-bold text-lg">{stat.value}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-xl font-bold text-white mb-4">{t('profile.quickActions')}</h3>
              <div className="space-y-2">
                <Link
                  to="/my-list"
                  className="block w-full text-left px-4 py-3 bg-gray-900 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  {t('profile.viewMyList')}
                </Link>
                <Link
                  to="/browse"
                  className="block w-full text-left px-4 py-3 bg-gray-900 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  {t('profile.browseMovies')}
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Avatar Selector Modal */}
      {showAvatarSelector && (
        <AvatarSelector
          currentAvatar={avatar || user?.avatar}
          onSelect={handleAvatarSelect}
          onClose={() => setShowAvatarSelector(false)}
        />
      )}
    </div>
  );
};

export default Profile;

