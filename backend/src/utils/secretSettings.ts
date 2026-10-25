export const isSecretSetting = (setting: { key: string; isSecret?: boolean }) =>
  setting.key === 'smtp_password' || Boolean(setting.isSecret);

export const maskSetting = <
  T extends { key: string; value: unknown; isSecret?: boolean },
>(
  setting: T
) => ({
  ...setting,
  isSecret: isSecretSetting(setting),
  value: isSecretSetting(setting)
    ? setting.value
      ? '********'
      : ''
    : setting.value,
});

export const keepSavedSecret = (setting: {
  key: string;
  value: unknown;
  isSecret?: boolean;
}) => isSecretSetting(setting) && setting.value === '********';
