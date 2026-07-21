import { Server } from 'socket.io';
import Device from '../models/Device';
import FirewallRule from '../models/FirewallRule';
import VpnSession from '../models/VpnSession';
import SecurityAlert from '../models/SecurityAlert';
import AuditLog from '../models/AuditLog';

// Helper to generate a random IP address
const getRandomIp = () => {
  return `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`;
};

// Helper to pick a random item from array
const pickRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const initSimulator = (io: Server) => {
  console.log('[Simulation Service] Initializing live metric & syslog worker...');

  // 1. Device metrics simulator (runs every 4 seconds)
  setInterval(async () => {
    try {
      const devices = await Device.find({ status: 'Online' });
      const updatedDevices = [];

      for (const dev of devices) {
        // Randomly swing CPU/RAM/Bandwidth metrics slightly
        const cpuDelta = (Math.random() * 10 - 5); // -5% to +5%
        const ramDelta = (Math.random() * 6 - 3);   // -3% to +3%
        const bwDelta = (Math.random() * 20 - 10);  // -10Mbps to +10Mbps

        dev.cpuUsage = Math.min(100, Math.max(1, Math.round(dev.cpuUsage + cpuDelta)));
        dev.ramUsage = Math.min(100, Math.max(5, Math.round(dev.ramUsage + ramDelta)));
        dev.bandwidth = Math.max(0.1, parseFloat((dev.bandwidth + bwDelta).toFixed(2)));
        dev.uptime += 4;
        dev.lastSeen = new Date();

        // Simulate high resource CPU alert for Server type
        if (dev.cpuUsage > 85 && Math.random() > 0.7) {
          const alertTitle = `High CPU Usage on ${dev.name}`;
          const alertExists = await SecurityAlert.findOne({ title: alertTitle, status: 'Active' });
          if (!alertExists) {
            const newAlert = await SecurityAlert.create({
              title: alertTitle,
              type: 'Intrusion Detection', // Generic infrastructure category
              severity: 'Medium',
              destDevice: dev.name,
              description: `Critical resource usage threshold breached: CPU at ${dev.cpuUsage}% on ${dev.name}. Investigating standard server daemon processes.`,
              status: 'Active',
              threatScore: 40
            });
            io.emit('securityAlert', newAlert);
            console.log(`[Simulator Alert] Triggered CPU breach for ${dev.name}`);
          }
        }

        await dev.save();
        updatedDevices.push(dev);
      }

      // Broadcast devices to clients
      io.emit('metricsUpdate', updatedDevices);
    } catch (err) {
      console.error('[Simulator Error] Failed simulating device metrics:', err);
    }
  }, 4000);

  // 2. Firewall traffic simulator (runs every 3 seconds)
  setInterval(async () => {
    try {
      const rules = await FirewallRule.find({ enabled: true });
      if (rules.length === 0) return;

      // Select a random active rule to process a packet hit
      const rule = pickRandom(rules);
      const hitIncrement = Math.floor(Math.random() * 5) + 1;
      rule.hitCount += hitIncrement;
      await rule.save();

      // Formulate a packet log record
      let srcIp = getRandomIp();
      let dstIp = rule.dstIp === 'Any' ? getRandomIp() : rule.dstIp.split('/')[0];
      let protocol = rule.protocol === 'ANY' ? pickRandom(['TCP', 'UDP']) : rule.protocol;
      let port = rule.port === 'Any' ? String(pickRandom([80, 443, 22, 53, 3389])) : rule.port.split(',')[0];

      // Match details corresponding to the rule type
      if (rule.category === 'VPN') {
        srcIp = '10.0.8.' + (Math.floor(Math.random() * 250) + 2);
      } else if (rule.category === 'Geo Blocking') {
        srcIp = '95.' + Math.floor(Math.random() * 254) + '.' + Math.floor(Math.random() * 254) + '.12';
      }

      const packetLog = {
        timestamp: new Date(),
        ruleName: rule.name,
        action: rule.action,
        srcZone: rule.srcZone,
        dstZone: rule.dstZone,
        srcIp,
        dstIp,
        protocol,
        port,
        size: Math.floor(Math.random() * 1500) + 64, // Packet size in bytes
        hits: hitIncrement
      };

      // Emit traffic log to connected browsers
      io.emit('packetLog', packetLog);
    } catch (err) {
      console.error('[Simulator Error] Failed simulating firewall packet:', err);
    }
  }, 3000);

  // 3. VPN traffic and session simulator (runs every 5 seconds)
  setInterval(async () => {
    try {
      const sessions = await VpnSession.find({ status: 'Active' });
      for (const sess of sessions) {
        // Increment sent/received byte counters
        sess.bytesSent += Math.floor(Math.random() * 1024 * 100);
        sess.bytesReceived += Math.floor(Math.random() * 1024 * 500);
        await sess.save();
      }
      io.emit('vpnUpdate', sessions);
    } catch (err) {
      console.error('[Simulator Error] Failed simulating VPN bytes:', err);
    }
  }, 5000);

  // 4. Security anomaly simulator (runs every 15 seconds)
  setInterval(async () => {
    try {
      // 10% chance to simulate a security incident: e.g. failed admin login lockout threat
      if (Math.random() > 0.85) {
        const sourceIp = getRandomIp();
        const targetServer = pickRandom(['Windows-DC01', 'Linux-WebServer01']);
        
        const newAlert = await SecurityAlert.create({
          title: `Brute Force Attempt from ${sourceIp}`,
          type: 'Brute Force',
          severity: 'High',
          sourceIp,
          destDevice: targetServer,
          description: `Intrusion detection flagged 15 consecutive authentication failures over SSH/RDP from ${sourceIp} targeting system administrator root credentials.`,
          status: 'Active',
          threatScore: 78
        });

        // Log this to central audit trail too
        await AuditLog.create({
          action: 'Brute Force Alert Logged',
          actor: 'IPS-Engine',
          category: 'Active Directory',
          details: `Threat alert raised: Brute force login failures targeting ${targetServer} from ${sourceIp}`,
          ipAddress: sourceIp,
          status: 'Failed'
        });

        io.emit('securityAlert', newAlert);
        io.emit('auditLog', {
          action: 'Brute Force Alert Logged',
          actor: 'IPS-Engine',
          category: 'Active Directory',
          details: `Threat alert raised: Brute force login failures targeting ${targetServer} from ${sourceIp}`,
          ipAddress: sourceIp,
          status: 'Failed',
          createdAt: new Date()
        });

        console.log(`[Simulator Alert] Triggered Brute Force Alert from ${sourceIp}`);
      }
    } catch (err) {
      console.error('[Simulator Error] Failed simulating security alerts:', err);
    }
  }, 15000);
};
