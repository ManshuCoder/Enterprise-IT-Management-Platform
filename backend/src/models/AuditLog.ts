import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;
  actor: string; // Username or system
  category: 'Auth' | 'Firewall' | 'Network' | 'Active Directory' | 'Server Management' | 'Helpdesk' | 'VPN' | 'System';
  details: string;
  ipAddress: string;
  status: 'Success' | 'Failed';
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  action: { type: String, required: true },
  actor: { type: String, required: true, index: true },
  category: {
    type: String,
    enum: ['Auth', 'Firewall', 'Network', 'Active Directory', 'Server Management', 'Helpdesk', 'VPN', 'System'],
    required: true,
    index: true
  },
  details: { type: String, required: true },
  ipAddress: { type: String, required: true },
  status: { type: String, enum: ['Success', 'Failed'], required: true },
  timestamp: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

import { wrapModel } from './modelWrapper';
const AuditLogModel = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
export default wrapModel(AuditLogModel, 'auditlogs');
