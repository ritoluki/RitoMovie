import mongoose, { Document, Schema } from 'mongoose';

// Define specific detail types for type safety
interface AuditDetails {
  message?: string;
  path?: string;
  requiredRoles?: string[];
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  reason?: string;
  targetEmail?: string;
  [key: string]: unknown;
}

export interface IAuditLog extends Document {
  admin?: mongoose.Types.ObjectId; // Optional for unauthenticated events
  action:
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'LOGIN'
    | 'LOGOUT'
    | 'LOGIN_FAILED'
    | 'UNAUTHORIZED_ACCESS'
    | 'INSUFFICIENT_PERMISSIONS'
    | 'SETTINGS_CHANGE'
    | 'PASSWORD_RESET'
    | 'ROLE_CHANGE'
    | 'BAN_USER'
    | 'UNBAN_USER';
  resource: 'USER' | 'MOVIE' | 'COMMENT' | 'RATING' | 'SETTINGS' | 'ADMIN_PANEL';
  resourceId?: string;
  details: AuditDetails;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    admin: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      sparse: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'CREATE',
        'UPDATE',
        'DELETE',
        'LOGIN',
        'LOGOUT',
        'LOGIN_FAILED',
        'UNAUTHORIZED_ACCESS',
        'INSUFFICIENT_PERMISSIONS',
        'SETTINGS_CHANGE',
        'PASSWORD_RESET',
        'ROLE_CHANGE',
        'BAN_USER',
        'UNBAN_USER',
      ],
    },
    resource: {
      type: String,
      required: true,
      enum: ['USER', 'MOVIE', 'COMMENT', 'RATING', 'SETTINGS', 'ADMIN_PANEL'],
    },
    resourceId: {
      type: String,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Database indexes for query performance
AuditLogSchema.index({ admin: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ resource: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: -1 }); // For chronological queries
AuditLogSchema.index({ resourceId: 1, resource: 1 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
