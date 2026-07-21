import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface ILoginHistory {
  timestamp: Date;
  ip: string;
  userAgent: string;
  success: boolean;
}

export interface IUser extends Document {
  username: string;
  email: string;
  password?: string;
  role: 'Admin' | 'Firewall Engineer' | 'System Support Engineer' | 'Network Engineer' | 'Security Engineer' | 'Employee' | 'HR' | 'Manager';
  department: string;
  status: 'Active' | 'Locked';
  loginAttempts: number;
  lockUntil?: Date;
  lastLogin?: Date;
  loginHistory: ILoginHistory[];
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const LoginHistorySchema = new Schema<ILoginHistory>({
  timestamp: { type: Date, default: Date.now },
  ip: { type: String, required: true },
  userAgent: { type: String, required: true },
  success: { type: Boolean, required: true }
});

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  role: {
    type: String,
    enum: ['Admin', 'Firewall Engineer', 'System Support Engineer', 'Network Engineer', 'Security Engineer', 'Employee', 'HR', 'Manager'],
    required: true
  },
  department: { type: String, required: true },
  status: { type: String, enum: ['Active', 'Locked'], default: 'Active' },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  lastLogin: { type: Date },
  loginHistory: [LoginHistorySchema]
}, { timestamps: true });

// Pre-save hook to hash passwords
UserSchema.pre<IUser>('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

import { wrapModel } from './modelWrapper';
const UserModel = mongoose.model<IUser>('User', UserSchema);
export default wrapModel(UserModel, 'users');
