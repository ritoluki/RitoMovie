import mongoose, { Document, Schema } from 'mongoose';

// Type-safe value using union types
type SettingValue = string | number | boolean | Record<string, unknown>;

export interface ISystemSetting extends Document {
  key: string;
  value: SettingValue;
  type: 'string' | 'number' | 'boolean' | 'json';
  category: 'general' | 'appearance' | 'email' | 'seo' | 'security' | 'content';
  description: string;
  isSecret?: boolean; // Hide value in logs (passwords, API keys)
  isPublic?: boolean; // Expose to frontend without auth
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SystemSettingSchema = new Schema<ISystemSetting>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['string', 'number', 'boolean', 'json'],
    },
    category: {
      type: String,
      required: true,
      enum: ['general', 'appearance', 'email', 'seo', 'security', 'content'],
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    isSecret: {
      type: Boolean,
      default: false,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Index for category-based queries
SystemSettingSchema.index({ category: 1 });
SystemSettingSchema.index({ key: 1 }, { unique: true });

// Virtual to mask secret values
SystemSettingSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();
  if (obj.isSecret) {
    obj.value = '********';
  }
  return obj;
};

export default mongoose.model<ISystemSetting>('SystemSetting', SystemSettingSchema);
