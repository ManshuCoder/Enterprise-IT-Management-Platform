import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import Ticket from '../models/Ticket';
import AuditLog from '../models/AuditLog';
import { z } from 'zod';

const createTicketSchema = z.object({
  title: z.string().min(1, 'Ticket title is required'),
  description: z.string().min(1, 'Ticket description is required'),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).default('Medium'),
  category: z.enum(['Network', 'Hardware', 'Software', 'Firewall', 'Access Control', 'Other']).default('Other')
});

const commentSchema = z.object({
  message: z.string().min(1, 'Comment text is required')
});

export const getTickets = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });
    return res.json(tickets);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch tickets' });
  }
};

export const createTicket = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = createTicketSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const { title, description, priority, category } = parseResult.data;
    const username = req.user?.username || 'Employee';

    const newTicket = new Ticket({
      title,
      description,
      priority,
      category,
      reporter: username,
      assignee: 'Unassigned',
      status: 'Open',
      timeline: [
        {
          activity: 'Ticket opened by user',
          timestamp: new Date(),
          actor: username
        }
      ]
    });

    await newTicket.save();

    await AuditLog.create({
      action: 'Ticket Raised',
      actor: username,
      category: 'Helpdesk',
      details: `Opened ticket #${newTicket._id.toString().slice(-6)}: "${title}" (Priority: ${priority})`,
      ipAddress: req.ip || '127.0.0.1',
      status: 'Success'
    });

    return res.status(201).json(newTicket);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create ticket' });
  }
};

export const updateTicket = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findById(id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const originalStatus = ticket.status;
    const originalAssignee = ticket.assignee;

    // Apply updates
    const updates = req.body;
    if (updates.status) ticket.status = updates.status;
    if (updates.assignee) ticket.assignee = updates.assignee;
    if (updates.priority) ticket.priority = updates.priority;

    const username = req.user?.username || 'System';

    // Log changes to the internal timeline
    if (updates.status && updates.status !== originalStatus) {
      ticket.timeline.push({
        activity: `Status changed from ${originalStatus} to ${updates.status}`,
        timestamp: new Date(),
        actor: username
      });
    }

    if (updates.assignee && updates.assignee !== originalAssignee) {
      ticket.timeline.push({
        activity: `Ticket assigned to ${updates.assignee}`,
        timestamp: new Date(),
        actor: username
      });
    }

    await ticket.save();

    await AuditLog.create({
      action: 'Ticket Updated',
      actor: username,
      category: 'Helpdesk',
      details: `Modified ticket #${ticket._id.toString().slice(-6)} details. Status: ${ticket.status}, Assignee: ${ticket.assignee}`,
      ipAddress: req.ip || '127.0.0.1',
      status: 'Success'
    });

    return res.json(ticket);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update ticket' });
  }
};

export const addComment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parseResult = commentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const { message } = parseResult.data;
    const ticket = await Ticket.findById(id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const username = req.user?.username || 'anonymous';
    ticket.comments.push({
      sender: username,
      message,
      timestamp: new Date()
    });

    ticket.timeline.push({
      activity: `Response submitted by ${username}`,
      timestamp: new Date(),
      actor: username
    });

    await ticket.save();

    return res.json(ticket);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to post ticket comment' });
  }
};

// Escalate Ticket automatically to Tier 2 based on category
export const escalateTicket = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findById(id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const username = req.user?.username || 'System';
    ticket.status = 'Escalated';
    ticket.priority = 'Critical';

    // Route ticket automatically to respective engineering role
    if (ticket.category === 'Network') {
      ticket.assignee = 'net_eng';
    } else if (ticket.category === 'Firewall') {
      ticket.assignee = 'firewall_eng';
    } else if (ticket.category === 'Access Control') {
      ticket.assignee = 'support_eng';
    } else {
      ticket.assignee = 'admin';
    }

    ticket.timeline.push({
      activity: `Ticket escalated. Priority raised to Critical. Rerouted to Tier 2 team (${ticket.assignee}).`,
      timestamp: new Date(),
      actor: username
    });

    await ticket.save();

    await AuditLog.create({
      action: 'Ticket Escalated',
      actor: username,
      category: 'Helpdesk',
      details: `Escalated ticket #${ticket._id.toString().slice(-6)} to ${ticket.assignee} with Critical priority.`,
      ipAddress: req.ip || '127.0.0.1',
      status: 'Success'
    });

    return res.json(ticket);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to escalate ticket' });
  }
};
