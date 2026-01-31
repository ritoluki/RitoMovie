import mongoose, { Document, Schema } from 'mongoose';

// Type-safe value using union types
type SettingValue = string | number | boolean | Record<string, unknown>;

export interface ISystemSetting extends Document {
  key: string;
  value: SettingValue;
  type: 'string' | 'number' | 'boolean' | 'json';
  category: 'general' | 'movie' | 'user' | 'appearance' | 'footer' | 'api' | 'email' | 'performance';
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
      enum: ['general', 'movie', 'user', 'appearance', 'footer', 'api', 'email', 'performance'],
    },
    description: {
      type: String,
      required: false,
      default: '',
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
// Note: key index is already created via unique: true in schema definition

// Virtual to mask secret values
SystemSettingSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();
  if (obj.isSecret) {
    obj.value = '********';
  }
  return obj;
};

export default mongoose.model<ISystemSetting>('SystemSetting', SystemSettingSchema);
