import mongoose, { Schema, Document } from 'mongoose';

export interface IDevice extends Document {
  name: string;
  type: 'Firewall' | 'Router' | 'Core Switch' | 'Access Switch' | 'Server' | 'Client' | 'WiFi' | 'Printer' | 'IP Phone' | 'Camera';
  ip: string;
  mac: string;
  status: 'Online' | 'Offline';
  cpuUsage: number; // percentage
  ramUsage: number; // percentage
  diskUsage: number; // percentage
  bandwidth: number; // Mbps
  location: string;
  vendor: string;
  os: string;
  uptime: number; // seconds
  lastSeen: Date;
  services: string[];
}

const DeviceSchema = new Schema<IDevice>({
  name: { type: String, required: true, unique: true },
  type: {
    type: String,
    enum: ['Firewall', 'Router', 'Core Switch', 'Access Switch', 'Server', 'Client', 'WiFi', 'Printer', 'IP Phone', 'Camera'],
    required: true
  },
  ip: { type: String, required: true, unique: true, index: true },
  mac: { type: String, required: true, unique: true },
  status: { type: String, enum: ['Online', 'Offline'], default: 'Online' },
  cpuUsage: { type: Number, default: 0 },
  ramUsage: { type: Number, default: 0 },
  diskUsage: { type: Number, default: 0 },
  bandwidth: { type: Number, default: 0 },
  location: { type: String, required: true },
  vendor: { type: String, required: true },
  os: { type: String, required: true },
  uptime: { type: Number, default: 0 },
  lastSeen: { type: Date, default: Date.now },
  services: { type: [String], default: [] }
}, { timestamps: true });

import { wrapModel } from './modelWrapper';
const DeviceModel = mongoose.model<IDevice>('Device', DeviceSchema);
export default wrapModel(DeviceModel, 'devices');
