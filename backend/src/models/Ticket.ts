import mongoose, { Schema, Document } from 'mongoose';

export interface ITicketComment {
  sender: string;
  message: string;
  timestamp: Date;
}

export interface ITicketTimeline {
  activity: string;
  timestamp: Date;
  actor: string;
}

export interface ITicket extends Document {
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Escalated' | 'Resolved' | 'Closed';
  reporter: mongoose.Types.ObjectId | string;
  assignee?: mongoose.Types.ObjectId | string;
  category: 'Network' | 'Hardware' | 'Software' | 'Firewall' | 'Access Control' | 'Other';
  comments: ITicketComment[];
  timeline: ITicketTimeline[];
}

const TicketCommentSchema = new Schema<ITicketComment>({
  sender: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const TicketTimelineSchema = new Schema<ITicketTimeline>({
  activity: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  actor: { type: String, required: true }
});

const TicketSchema = new Schema<ITicket>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium',
    index: true
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Escalated', 'Resolved', 'Closed'],
    default: 'Open',
    index: true
  },
  reporter: { type: String, required: true },
  assignee: { type: String, default: 'Unassigned' },
  category: {
    type: String,
    enum: ['Network', 'Hardware', 'Software', 'Firewall', 'Access Control', 'Other'],
    default: 'Other'
  },
  comments: [TicketCommentSchema],
  timeline: [TicketTimelineSchema]
}, { timestamps: true });

import { wrapModel } from './modelWrapper';
const TicketModel = mongoose.model<ITicket>('Ticket', TicketSchema);
export default wrapModel(TicketModel, 'tickets');
