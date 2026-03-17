import mongoose, { Document, Model, Schema } from 'mongoose';
import { Permission, DEFAULT_ROLE_PERMISSIONS } from '@/types/permissions';

export interface IRole extends Document {
  name: string;
  description?: string;
  permissions: Permission[];
  isSystem: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRoleModel extends Model<IRole> {
  getPermissionsForRole(roleName: string): Promise<Permission[]>;
}

const RoleSchema = new Schema<IRole, IRoleModel>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
  },
  permissions: [{
    type: String,
  }],
  isSystem: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

RoleSchema.statics.getPermissionsForRole = async function (roleName: string): Promise<Permission[]> {
  // Check system defaults first
  if (DEFAULT_ROLE_PERMISSIONS[roleName]) {
    return DEFAULT_ROLE_PERMISSIONS[roleName];
  }

  // Then check DB
  const role = await this.findOne({ name: roleName, isActive: true }).lean();
  if (role && role.permissions && role.permissions.length > 0) {
    return role.permissions as Permission[];
  }

  // Fallback to employee
  return DEFAULT_ROLE_PERMISSIONS['employee'];
};

const Role = mongoose.models.Role as IRoleModel || mongoose.model<IRole, IRoleModel>('Role', RoleSchema);

export default Role;
