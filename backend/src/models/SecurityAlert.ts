import mongoose, { Schema, Document } from 'mongoose';

export interface ISecurityAlert extends Document {
  title: string;
  type: 'Brute Force' | 'Malware Alert' | 'Intrusion Detection' | 'CVE Alert' | 'Failed Logins' | 'Unauthorized Scan';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  sourceIp?: string;
  destDevice?: string;
  description: string;
  status: 'Active' | 'Investigating' | 'Mitigated';
  threatScore: number; // 0-100 scale
  timestamp: Date;
}

const SecurityAlertSchema = new Schema<ISecurityAlert>({
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ['Brute Force', 'Malware Alert', 'Intrusion Detection', 'CVE Alert', 'Failed Logins', 'Unauthorized Scan'],
    required: true,
    index: true
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    required: true,
    index: true
  },
  sourceIp: { type: String },
  destDevice: { type: String },
  description: { type: String, required: true },
  status: {
    type: String,
    enum: ['Active', 'Investigating', 'Mitigated'],
    default: 'Active',
    index: true
  },
  threatScore: { type: Number, min: 0, max: 100, required: true },
  timestamp: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

import { wrapModel } from './modelWrapper';
const SecurityAlertModel = mongoose.model<ISecurityAlert>('SecurityAlert', SecurityAlertSchema);
export default wrapModel(SecurityAlertModel, 'securityalerts');
