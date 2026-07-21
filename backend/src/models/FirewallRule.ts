import mongoose, { Schema, Document } from 'mongoose';

export interface IFirewallRule extends Document {
  name: string;
  description: string;
  action: 'Allow' | 'Deny';
  srcZone: 'WAN' | 'LAN' | 'DMZ' | 'VPN' | 'ANY';
  dstZone: 'WAN' | 'LAN' | 'DMZ' | 'VPN' | 'ANY';
  srcIp: string; // CIDR or 'Any'
  dstIp: string; // CIDR or 'Any'
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'ANY';
  port: string; // number list, range or 'Any'
  priority: number; // lower numbers are evaluated first
  enabled: boolean;
  hitCount: number;
  category: 'General' | 'NAT' | 'PAT' | 'VPN' | 'Geo Blocking' | 'Application Control';
  createdBy?: mongoose.Types.ObjectId | string;
}

const FirewallRuleSchema = new Schema<IFirewallRule>({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  action: { type: String, enum: ['Allow', 'Deny'], required: true },
  srcZone: { type: String, enum: ['WAN', 'LAN', 'DMZ', 'VPN', 'ANY'], required: true },
  dstZone: { type: String, enum: ['WAN', 'LAN', 'DMZ', 'VPN', 'ANY'], required: true },
  srcIp: { type: String, default: 'Any' },
  dstIp: { type: String, default: 'Any' },
  protocol: { type: String, enum: ['TCP', 'UDP', 'ICMP', 'ANY'], default: 'ANY' },
  port: { type: String, default: 'Any' },
  priority: { type: Number, required: true, unique: true, index: true },
  enabled: { type: Boolean, default: true },
  hitCount: { type: Number, default: 0 },
  category: {
    type: String,
    enum: ['General', 'NAT', 'PAT', 'VPN', 'Geo Blocking', 'Application Control'],
    default: 'General'
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

import { wrapModel } from './modelWrapper';
const FirewallRuleModel = mongoose.model<IFirewallRule>('FirewallRule', FirewallRuleSchema);
export default wrapModel(FirewallRuleModel, 'firewallrules');
