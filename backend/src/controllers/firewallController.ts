import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import FirewallRule from '../models/FirewallRule';
import AuditLog from '../models/AuditLog';
import { z } from 'zod';

const firewallRuleSchema = z.object({
  name: z.string().min(1, 'Rule name is required'),
  description: z.string().default(''),
  action: z.enum(['Allow', 'Deny']),
  srcZone: z.enum(['WAN', 'LAN', 'DMZ', 'VPN']),
  dstZone: z.enum(['WAN', 'LAN', 'DMZ', 'VPN']),
  srcIp: z.string().default('Any'),
  dstIp: z.string().default('Any'),
  protocol: z.enum(['TCP', 'UDP', 'ICMP', 'ANY']),
  port: z.string().default('Any'),
  priority: z.number().int().positive('Priority must be a positive integer'),
  enabled: z.boolean().default(true),
  category: z.enum(['General', 'NAT', 'PAT', 'VPN', 'Geo Blocking', 'Application Control']).default('General')
});

const simulatePacketSchema = z.object({
  srcIp: z.string().min(1, 'Source IP is required'),
  dstIp: z.string().min(1, 'Destination IP is required'),
  srcZone: z.enum(['WAN', 'LAN', 'DMZ', 'VPN']).default('LAN'),
  dstZone: z.enum(['WAN', 'LAN', 'DMZ', 'VPN']).default('WAN'),
  protocol: z.enum(['TCP', 'UDP', 'ICMP']),
  port: z.number().int().positive('Port must be a positive integer')
});

export const getRules = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rules = await FirewallRule.find().sort({ priority: 1 });
    return res.json(rules);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch firewall rules' });
  }
};

export const createRule = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = firewallRuleSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    // Check for unique priority and name
    const existingName = await FirewallRule.findOne({ name: parseResult.data.name });
    if (existingName) {
      return res.status(400).json({ error: 'A firewall rule with this name already exists.' });
    }

    const existingPriority = await FirewallRule.findOne({ priority: parseResult.data.priority });
    if (existingPriority) {
      return res.status(400).json({ error: 'A firewall rule with this priority already exists.' });
    }

    const newRule = new FirewallRule({
      ...parseResult.data,
      createdBy: req.user?.userId
    });

    await newRule.save();

    // Log action to audit logs
    await AuditLog.create({
      action: 'Create Firewall Rule',
      actor: req.user?.username || 'unknown',
      category: 'Firewall',
      details: `Created rule: [${newRule.name}] (${newRule.action}) from ${newRule.srcZone} to ${newRule.dstZone}`,
      ipAddress: req.ip || '127.0.0.1',
      status: 'Success'
    });

    return res.status(201).json(newRule);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create rule' });
  }
};

export const updateRule = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parseResult = firewallRuleSchema.partial().safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const rule = await FirewallRule.findById(id);
    if (!rule) {
      return res.status(404).json({ error: 'Firewall rule not found.' });
    }

    // If priority is changing, check uniqueness
    if (parseResult.data.priority !== undefined && parseResult.data.priority !== rule.priority) {
      const duplicatePriority = await FirewallRule.findOne({ priority: parseResult.data.priority });
      if (duplicatePriority) {
        return res.status(400).json({ error: 'A firewall rule with this priority already exists.' });
      }
    }

    // If name is changing, check uniqueness
    if (parseResult.data.name !== undefined && parseResult.data.name !== rule.name) {
      const duplicateName = await FirewallRule.findOne({ name: parseResult.data.name });
      if (duplicateName) {
        return res.status(400).json({ error: 'A firewall rule with this name already exists.' });
      }
    }

    Object.assign(rule, parseResult.data);
    await rule.save();

    // Log action
    await AuditLog.create({
      action: 'Modify Firewall Rule',
      actor: req.user?.username || 'unknown',
      category: 'Firewall',
      details: `Modified rule: [${rule.name}]. Active: ${rule.enabled}`,
      ipAddress: req.ip || '127.0.0.1',
      status: 'Success'
    });

    return res.json(rule);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update rule' });
  }
};

export const deleteRule = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const rule = await FirewallRule.findByIdAndDelete(id);

    if (!rule) {
      return res.status(404).json({ error: 'Firewall rule not found.' });
    }

    // Log action
    await AuditLog.create({
      action: 'Delete Firewall Rule',
      actor: req.user?.username || 'unknown',
      category: 'Firewall',
      details: `Deleted rule: [${rule.name}]`,
      ipAddress: req.ip || '127.0.0.1',
      status: 'Success'
    });

    return res.json({ message: 'Firewall rule deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete rule' });
  }
};

// Reorder priority helper
export const reorderRules = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { ruleIds } = req.body; // Array of rule IDs in the preferred order
    if (!Array.isArray(ruleIds)) {
      return res.status(400).json({ error: 'ruleIds must be an array of string IDs' });
    }

    for (let i = 0; i < ruleIds.length; i++) {
      // Set priority values starting at 10, increments of 10
      await FirewallRule.findByIdAndUpdate(ruleIds[i], { priority: (i + 1) * 10 });
    }

    await AuditLog.create({
      action: 'Reorder Firewall Rules',
      actor: req.user?.username || 'unknown',
      category: 'Firewall',
      details: `Reordered priority indexes for ${ruleIds.length} firewall rules.`,
      ipAddress: req.ip || '127.0.0.1',
      status: 'Success'
    });

    const updatedRules = await FirewallRule.find().sort({ priority: 1 });
    return res.json(updatedRules);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to reorder firewall rules' });
  }
};

// Check firewall rules sequentially to see which rule allows or denies this simulation packet
export const simulatePacket = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = simulatePacketSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const { srcIp, dstIp, srcZone, dstZone, protocol, port } = parseResult.data;
    const rules = await FirewallRule.find({ enabled: true }).sort({ priority: 1 });

    let matchingRule = null;

    // Helper to evaluate IP matching (matches simple IP, CIDR matching or Any)
    const matchesIp = (ruleIp: string, targetIp: string) => {
      if (ruleIp === 'Any') return true;
      if (ruleIp.includes('/')) {
        // Basic CIDR prefix check (e.g. 10.0.2.0/24 -> checks if targetIp starts with 10.0.2.)
        const [subnet, mask] = ruleIp.split('/');
        const subnetParts = subnet.split('.');
        const targetParts = targetIp.split('.');
        if (mask === '24') {
          return subnetParts[0] === targetParts[0] && subnetParts[1] === targetParts[1] && subnetParts[2] === targetParts[2];
        }
        if (mask === '8') {
          return subnetParts[0] === targetParts[0];
        }
        return subnet === targetIp;
      }
      return ruleIp === targetIp;
    };

    // Helper to check port match
    const matchesPort = (rulePort: string, targetPort: number) => {
      if (rulePort === 'Any') return true;
      const ports = rulePort.split(',').map(p => p.trim());
      if (ports.includes(String(targetPort))) return true;
      // Handle ranges like 80-90
      for (const p of ports) {
        if (p.includes('-')) {
          const [start, end] = p.split('-').map(Number);
          if (targetPort >= start && targetPort <= end) return true;
        }
      }
      return false;
    };

    for (const rule of rules) {
      const zoneMatch = (rule.srcZone === srcZone || rule.srcZone === 'ANY' as any) &&
                        (rule.dstZone === dstZone || rule.dstZone === 'ANY' as any);
      
      const ipMatch = matchesIp(rule.srcIp, srcIp) && matchesIp(rule.dstIp, dstIp);
      
      const protoMatch = rule.protocol === 'ANY' || rule.protocol === protocol;
      
      const portMatch = matchesPort(rule.port, port);

      if (zoneMatch && ipMatch && protoMatch && portMatch) {
        matchingRule = rule;
        break;
      }
    }

    const decision = matchingRule ? matchingRule.action : 'Deny'; // Default Deny
    const matchedRuleName = matchingRule ? matchingRule.name : 'Implicit Default Deny';

    if (matchingRule) {
      matchingRule.hitCount += 1;
      await matchingRule.save();
    }

    // Log the simulation event inside Audit Logs
    await AuditLog.create({
      action: 'Simulated Packet Processed',
      actor: req.user?.username || 'Packet-Simulator',
      category: 'Firewall',
      details: `Packet: [${srcZone}:${srcIp} -> ${dstZone}:${dstIp}] [${protocol}/${port}]. Result: ${decision}. Matched Rule: ${matchedRuleName}`,
      ipAddress: req.ip || '127.0.0.1',
      status: decision === 'Allow' ? 'Success' : 'Failed'
    });

    return res.json({
      decision,
      matchedRule: matchedRuleName,
      ruleDetails: matchingRule,
      packet: { srcIp, dstIp, srcZone, dstZone, protocol, port }
    });

  } catch (error) {
    console.error('[Packet Simulator Error]:', error);
    return res.status(500).json({ error: 'Packet simulation processing failed' });
  }
};
