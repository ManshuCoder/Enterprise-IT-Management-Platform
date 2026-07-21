import mongoose, { Schema, Document } from 'mongoose';

export interface IVpnSession extends Document {
  username: string;
  ip: string;
  location: string;
  connectedAt: Date;
  disconnectedAt?: Date;
  status: 'Active' | 'Disconnected';
  protocol: 'OpenVPN' | 'IPsec' | 'WireGuard';
  bytesSent: number;
  bytesReceived: number;
}

const VpnSessionSchema = new Schema<IVpnSession>({
  username: { type: String, required: true, index: true },
  ip: { type: String, required: true },
  location: { type: String, required: true },
  connectedAt: { type: Date, default: Date.now },
  disconnectedAt: { type: Date },
  status: { type: String, enum: ['Active', 'Disconnected'], default: 'Active', index: true },
  protocol: { type: String, enum: ['OpenVPN', 'IPsec', 'WireGuard'], required: true },
  bytesSent: { type: Number, default: 0 },
  bytesReceived: { type: Number, default: 0 }
}, { timestamps: true });

import { wrapModel } from './modelWrapper';
const VpnSessionModel = mongoose.model<IVpnSession>('VpnSession', VpnSessionSchema);
export default wrapModel(VpnSessionModel, 'vpnsessions');
