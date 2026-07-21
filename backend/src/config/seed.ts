import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User';
import Device from '../models/Device';
import FirewallRule from '../models/FirewallRule';
import Ticket from '../models/Ticket';
import VpnSession from '../models/VpnSession';
import SecurityAlert from '../models/SecurityAlert';
import AuditLog from '../models/AuditLog';

import { connectDB, dbState } from './db';

dotenv.config();

const seedDatabase = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await connectDB();
    if (dbState.isMock) {
      console.log('Using in-memory/JSON filesystem database fallback for seeding...');
    } else {
      console.log('Connected. Cleaning existing data...');
    }

    // Clear existing collections
    await User.deleteMany({});
    await Device.deleteMany({});
    await FirewallRule.deleteMany({});
    await Ticket.deleteMany({});
    await VpnSession.deleteMany({});
    await SecurityAlert.deleteMany({});
    await AuditLog.deleteMany({});

    console.log('Seeding users...');
    // Seed users with encrypted passwords
    const defaultPassword = 'Password123!';
    const hashed = await bcrypt.hash(defaultPassword, 10);

    const users = await User.create([
      {
        username: 'admin',
        email: 'admin@eimp.enterprise',
        password: defaultPassword, // pre-save will rehash if saved through Mongoose. Wait! In create, it runs pre-save.
        role: 'Admin',
        department: 'IT Administration',
        status: 'Active'
      },
      {
        username: 'firewall_eng',
        email: 'firewall.eng@eimp.enterprise',
        password: defaultPassword,
        role: 'Firewall Engineer',
        department: 'Information Security',
        status: 'Active'
      },
      {
        username: 'sec_eng',
        email: 'security.eng@eimp.enterprise',
        password: defaultPassword,
        role: 'Security Engineer',
        department: 'Information Security',
        status: 'Active'
      },
      {
        username: 'net_eng',
        email: 'network.eng@eimp.enterprise',
        password: defaultPassword,
        role: 'Network Engineer',
        department: 'Network Operations',
        status: 'Active'
      },
      {
        username: 'support_eng',
        email: 'support.eng@eimp.enterprise',
        password: defaultPassword,
        role: 'System Support Engineer',
        department: 'IT Helpdesk',
        status: 'Active'
      },
      {
        username: 'jdoe',
        email: 'jdoe@eimp.enterprise',
        password: defaultPassword,
        role: 'Employee',
        department: 'Human Resources',
        status: 'Active'
      },
      {
        username: 'manager_smith',
        email: 'smith@eimp.enterprise',
        password: defaultPassword,
        role: 'Manager',
        department: 'Finance',
        status: 'Active'
      }
    ]);

    console.log(`Seeded ${users.length} users successfully. Default password is 'Password123!'`);

    console.log('Seeding network devices...');
    const devices = await Device.create([
      {
        name: 'Core-Firewall',
        type: 'Firewall',
        ip: '10.0.0.1',
        mac: '00:0A:95:9D:68:16',
        status: 'Online',
        cpuUsage: 12,
        ramUsage: 35,
        diskUsage: 22,
        bandwidth: 124.5,
        location: 'HQ Server Room Rack A',
        vendor: 'Palo Alto Networks',
        os: 'PAN-OS 11.0',
        uptime: 2592000,
        services: ['IPsec VPN', 'IDS/IPS', 'SSL Decryption']
      },
      {
        name: 'Internet-Gateway',
        type: 'Router',
        ip: '192.168.1.1',
        mac: '00:14:22:01:23:45',
        status: 'Online',
        cpuUsage: 8,
        ramUsage: 18,
        diskUsage: 5,
        bandwidth: 850.2,
        location: 'HQ Server Room Rack A',
        vendor: 'Cisco',
        os: 'IOS-XE 17.9',
        uptime: 5184000,
        services: ['BGP', 'NAT', 'DHCP Server']
      },
      {
        name: 'Core-Switch',
        type: 'Core Switch',
        ip: '10.0.0.2',
        mac: '00:14:22:01:23:46',
        status: 'Online',
        cpuUsage: 5,
        ramUsage: 25,
        diskUsage: 10,
        bandwidth: 412.0,
        location: 'HQ Server Room Rack B',
        vendor: 'Aruba Networks',
        os: 'AOS-CX 10.12',
        uptime: 3888000,
        services: ['VLAN Routing', 'OSPF', 'LACP']
      },
      {
        name: 'Access-Switch-LAN',
        type: 'Access Switch',
        ip: '10.0.0.3',
        mac: '00:14:22:01:23:47',
        status: 'Online',
        cpuUsage: 3,
        ramUsage: 14,
        diskUsage: 8,
        bandwidth: 45.3,
        location: 'Building B Wiring Closet',
        vendor: 'Cisco Catalyst',
        os: 'IOS 15.2',
        uptime: 1296000,
        services: ['PoE', '802.1X Auth']
      },
      {
        name: 'Windows-DC01',
        type: 'Server',
        ip: '10.0.1.10',
        mac: '00:50:56:A1:B2:C3',
        status: 'Online',
        cpuUsage: 15,
        ramUsage: 64,
        diskUsage: 45,
        bandwidth: 12.8,
        location: 'HQ Server Room Rack C',
        vendor: 'VMware ESXi Host 01',
        os: 'Windows Server 2022 Datacenter',
        uptime: 864000,
        services: ['Active Directory Domain Services', 'DNS Server', 'DHCP Server']
      },
      {
        name: 'Linux-WebServer01',
        type: 'Server',
        ip: '10.0.1.20',
        mac: '00:50:56:A1:B2:C4',
        status: 'Online',
        cpuUsage: 24,
        ramUsage: 48,
        diskUsage: 60,
        bandwidth: 85.5,
        location: 'DMZ Rack D',
        vendor: 'Dell PowerEdge R750',
        os: 'Ubuntu Server 22.04 LTS',
        uptime: 1728000,
        services: ['Nginx 1.24', 'Docker 24.0', 'SSH Server']
      },
      {
        name: 'HR-Workstation',
        type: 'Client',
        ip: '10.0.2.15',
        mac: '3C:D9:2B:A1:E2:0F',
        status: 'Online',
        cpuUsage: 4,
        ramUsage: 42,
        diskUsage: 30,
        bandwidth: 2.1,
        location: 'Building B HR Department Office 12',
        vendor: 'HP EliteBook',
        os: 'Windows 11 Enterprise',
        uptime: 28800,
        services: ['Windows Defender', 'OneDrive Sync']
      },
      {
        name: 'Finance-Workstation',
        type: 'Client',
        ip: '10.0.2.30',
        mac: '3C:D9:2B:A1:E2:10',
        status: 'Online',
        cpuUsage: 7,
        ramUsage: 55,
        diskUsage: 48,
        bandwidth: 5.6,
        location: 'Building B Finance Dept Office 04',
        vendor: 'Dell OptiPlex',
        os: 'Windows 11 Enterprise',
        uptime: 14400,
        services: ['SAP Client', 'Windows Defender']
      },
      {
        name: 'HQ-WiFi-AP01',
        type: 'WiFi',
        ip: '10.0.3.1',
        mac: 'E0:3F:49:FF:AA:BB',
        status: 'Online',
        cpuUsage: 14,
        ramUsage: 30,
        diskUsage: 12,
        bandwidth: 154.2,
        location: 'HQ Lobby Ceiling',
        vendor: 'Cisco Meraki',
        os: 'Meraki AP-OS 28.5',
        uptime: 259200,
        services: ['WPA3 Enterprise SSID', 'Guest Portal']
      },
      {
        name: 'Main-Office-Printer',
        type: 'Printer',
        ip: '10.0.1.150',
        mac: '00:25:90:12:34:56',
        status: 'Online',
        cpuUsage: 1,
        ramUsage: 8,
        diskUsage: 2,
        bandwidth: 0.1,
        location: 'Building B Corridor East',
        vendor: 'Xerox AltaLink',
        os: 'Xerox LinkOS v5',
        uptime: 604800,
        services: ['JetDirect Port 9100', 'HTTPS Admin Web UI']
      },
      {
        name: 'CEO-Desk-IPPhone',
        type: 'IP Phone',
        ip: '10.0.1.160',
        mac: '00:08:2F:55:66:77',
        status: 'Online',
        cpuUsage: 2,
        ramUsage: 12,
        diskUsage: 1,
        bandwidth: 0.08,
        location: 'HQ Penthouse Suite',
        vendor: 'Polycom VVX 411',
        os: 'SIP Phone software v6.4',
        uptime: 1209600,
        services: ['SIP Registration', 'PoE Status Checked']
      },
      {
        name: 'Server-Room-Cam',
        type: 'Camera',
        ip: '10.0.1.170',
        mac: '00:40:8F:AA:BB:CC',
        status: 'Online',
        cpuUsage: 18,
        ramUsage: 20,
        diskUsage: 15,
        bandwidth: 4.8,
        location: 'HQ Server Room Entryway',
        vendor: 'Axis Communications',
        os: 'Axis Embedded Linux v10',
        uptime: 950400,
        services: ['RTSP Video Stream', 'SSH Server (Disabled)']
      }
    ]);

    console.log(`Seeded ${devices.length} network devices.`);

    console.log('Seeding firewall rules...');
    const rules = await FirewallRule.create([
      {
        name: 'WAN-to-DMZ-HTTP',
        description: 'Allow public HTTP/HTTPS traffic to Linux-WebServer01 in DMZ zone',
        action: 'Allow',
        srcZone: 'WAN',
        dstZone: 'DMZ',
        srcIp: 'Any',
        dstIp: '10.0.1.20/32',
        protocol: 'TCP',
        port: '80,443',
        priority: 100,
        enabled: true,
        hitCount: 54109,
        category: 'General'
      },
      {
        name: 'LAN-to-WAN-General',
        description: 'Allow standard LAN workstation outbound access to WAN',
        action: 'Allow',
        srcZone: 'LAN',
        dstZone: 'WAN',
        srcIp: '10.0.2.0/24',
        dstIp: 'Any',
        protocol: 'ANY',
        port: 'Any',
        priority: 200,
        enabled: true,
        hitCount: 148910,
        category: 'General'
      },
      {
        name: 'Block-WAN-to-LAN-SSH',
        description: 'Strictly deny external direct SSH connections into LAN subnet',
        action: 'Deny',
        srcZone: 'WAN',
        dstZone: 'LAN',
        srcIp: 'Any',
        dstIp: '10.0.2.0/24',
        protocol: 'TCP',
        port: '22',
        priority: 50,
        enabled: true,
        hitCount: 1205,
        category: 'General'
      },
      {
        name: 'VPN-to-Internal-DC',
        description: 'Allow VPN users full access to AD Domain Controller resources',
        action: 'Allow',
        srcZone: 'VPN',
        dstZone: 'LAN',
        srcIp: '10.0.8.0/24',
        dstIp: '10.0.1.10/32',
        protocol: 'ANY',
        port: 'Any',
        priority: 150,
        enabled: true,
        hitCount: 1845,
        category: 'VPN'
      },
      {
        name: 'Block-Russian-IP-Block',
        description: 'Geo-block known malicious subnets originating in RU region',
        action: 'Deny',
        srcZone: 'WAN',
        dstZone: 'ANY',
        srcIp: '95.0.0.0/8',
        dstIp: 'Any',
        protocol: 'ANY',
        port: 'Any',
        priority: 10,
        enabled: true,
        hitCount: 20500,
        category: 'Geo Blocking'
      },
      {
        name: 'Default-Deny-All',
        description: 'Implicit default drop for unmatched clean network traffic',
        action: 'Deny',
        srcZone: 'WAN',
        dstZone: 'LAN',
        srcIp: 'Any',
        dstIp: 'Any',
        protocol: 'ANY',
        port: 'Any',
        priority: 999,
        enabled: true,
        hitCount: 14022,
        category: 'General'
      }
    ]);

    console.log(`Seeded ${rules.length} firewall rules.`);

    console.log('Seeding ticketing database...');
    const tickets = await Ticket.create([
      {
        title: 'Building B VLAN 20 Latency Spikes',
        description: 'HR and Finance users are experiencing substantial packet loss when pinging the core switch gateway. Suspected loop or broadcasting storm.',
        priority: 'High',
        status: 'In Progress',
        reporter: 'support_eng',
        assignee: 'net_eng',
        category: 'Network',
        comments: [
          {
            sender: 'support_eng',
            message: 'First reported around 9 AM this morning. Spoke with HR manager, files are loading very slowly.',
            timestamp: new Date(Date.now() - 3600000 * 4)
          },
          {
            sender: 'net_eng',
            message: 'I have logged into Access-Switch-LAN. CPU is normal but port utilization on G1/0/12 is extremely high. Investigating interface counters.',
            timestamp: new Date(Date.now() - 3600000 * 2)
          }
        ],
        timeline: [
          {
            activity: 'Ticket Created',
            timestamp: new Date(Date.now() - 3600000 * 4),
            actor: 'support_eng'
          },
          {
            activity: 'Assigned to net_eng',
            timestamp: new Date(Date.now() - 3600000 * 3),
            actor: 'support_eng'
          },
          {
            activity: 'Status changed to In Progress',
            timestamp: new Date(Date.now() - 3600000 * 2),
            actor: 'net_eng'
          }
        ]
      },
      {
        title: 'Unlock Active Directory Account - jdoe',
        description: 'Employee jdoe locked out of their workstation after 5 incorrect password attempts. Verify identity and unlock.',
        priority: 'Medium',
        status: 'Open',
        reporter: 'jdoe',
        assignee: 'support_eng',
        category: 'Access Control',
        comments: [],
        timeline: [
          {
            activity: 'Ticket Created',
            timestamp: new Date(Date.now() - 3600000 * 1),
            actor: 'jdoe'
          },
          {
            activity: 'Assigned to support_eng',
            timestamp: new Date(Date.now() - 300000 * 50),
            actor: 'support_eng'
          }
        ]
      },
      {
        title: 'Open Port 8443 WAN to DMZ WebServer',
        description: 'New microservice API dashboard requires port 8443 opened on Core Firewall pointing to the Nginx server in DMZ.',
        priority: 'Low',
        status: 'Open',
        reporter: 'manager_smith',
        assignee: 'firewall_eng',
        category: 'Firewall',
        comments: [],
        timeline: [
          {
            activity: 'Ticket Created',
            timestamp: new Date(Date.now() - 3600000 * 10),
            actor: 'manager_smith'
          }
        ]
      }
    ]);

    console.log(`Seeded ${tickets.length} tickets.`);

    console.log('Seeding VPN connections...');
    const vpn = await VpnSession.create([
      {
        username: 'manager_smith',
        ip: '197.45.10.88',
        location: 'New York, USA',
        connectedAt: new Date(Date.now() - 14400000), // 4 hours ago
        status: 'Active',
        protocol: 'WireGuard',
        bytesSent: 4120980,
        bytesReceived: 35091230
      },
      {
        username: 'firewall_eng',
        ip: '82.102.40.12',
        location: 'London, UK',
        connectedAt: new Date(Date.now() - 7200000), // 2 hours ago
        status: 'Active',
        protocol: 'OpenVPN',
        bytesSent: 1890040,
        bytesReceived: 5120090
      }
    ]);

    console.log(`Seeded ${vpn.length} active VPN sessions.`);

    console.log('Seeding Security Alerts...');
    const alerts = await SecurityAlert.create([
      {
        title: 'Brute-force Login Attempt Blocked',
        type: 'Brute Force',
        severity: 'High',
        sourceIp: '185.220.101.44',
        destDevice: 'Windows-DC01',
        description: 'Multiple RDP connections failed within 30 seconds. Source IP flagged by firewall geoblocking and IP drop filter applied.',
        status: 'Active',
        threatScore: 82,
        timestamp: new Date(Date.now() - 1800000)
      },
      {
        title: 'Malware Alert: EICAR Test Signature',
        type: 'Malware Alert',
        severity: 'Medium',
        sourceIp: '10.0.2.15',
        destDevice: 'HR-Workstation',
        description: 'Host-based antivirus triggered quarantine on download of standardized EICAR test signature file. Incident logged.',
        status: 'Mitigated',
        threatScore: 45,
        timestamp: new Date(Date.now() - 3600000 * 3)
      },
      {
        title: 'Critical CVE-2024-21626 Container Escape',
        type: 'CVE Alert',
        severity: 'Critical',
        destDevice: 'Linux-WebServer01',
        description: 'A runc vulnerability allowing docker escape has been flagged on active package list. System patch update required.',
        status: 'Investigating',
        threatScore: 95,
        timestamp: new Date(Date.now() - 3600000 * 24)
      }
    ]);

    console.log(`Seeded ${alerts.length} security alerts.`);

    console.log('Database successfully seeded!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
