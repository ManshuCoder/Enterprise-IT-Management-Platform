import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import Device from '../models/Device';
import AuditLog from '../models/AuditLog';

export const getDevices = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const devices = await Device.find();
    return res.json(devices);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch network devices' });
  }
};

export const getDeviceById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) return res.status(404).json({ error: 'Device not found' });
    return res.json(device);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch device details' });
  }
};

export const createDevice = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const device = new Device(req.body);
    await device.save();

    await AuditLog.create({
      action: 'Asset Registered',
      actor: req.user?.username || 'unknown',
      category: 'Network',
      details: `Registered new asset node: ${device.name} (IP: ${device.ip}, Type: ${device.type})`,
      ipAddress: req.ip || '127.0.0.1',
      status: 'Success'
    });

    return res.status(201).json(device);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create device' });
  }
};

export const updateDevice = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const device = await Device.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!device) return res.status(404).json({ error: 'Device not found' });

    await AuditLog.create({
      action: 'Asset Updated',
      actor: req.user?.username || 'unknown',
      category: 'Network',
      details: `Updated details for asset node: ${device.name}`,
      ipAddress: req.ip || '127.0.0.1',
      status: 'Success'
    });

    return res.json(device);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update device' });
  }
};

// Toggle Device Power state (Online/Offline)
export const toggleDevicePower = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const device = await Device.findById(id);
    if (!device) return res.status(404).json({ error: 'Device not found' });

    device.status = device.status === 'Online' ? 'Offline' : 'Online';
    // If going offline, wipe telemetry metrics
    if (device.status === 'Offline') {
      device.cpuUsage = 0;
      device.ramUsage = 0;
      device.bandwidth = 0;
    } else {
      device.cpuUsage = 5;
      device.ramUsage = 20;
      device.bandwidth = 1.0;
    }
    await device.save();

    await AuditLog.create({
      action: device.status === 'Online' ? 'Asset Powered On' : 'Asset Powered Off',
      actor: req.user?.username || 'unknown',
      category: 'Network',
      details: `State toggled to ${device.status} for device: ${device.name}`,
      ipAddress: req.ip || '127.0.0.1',
      status: 'Success'
    });

    return res.json(device);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to toggle device power' });
  }
};

// SIMULATE TERMINAL COMMAND EXECUTION
export const executeCommand = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { command } = req.body;

    if (!command) {
      return res.status(400).json({ error: 'Command prompt input is required' });
    }

    const device = await Device.findById(id);
    if (!device) return res.status(404).json({ error: 'Device not found' });

    if (device.status === 'Offline') {
      return res.json({
        output: `ssh: connect to host ${device.ip} port 22: Connection refused\nHost is currently powered off or unreachable.`
      });
    }

    const cleanCommand = command.trim().toLowerCase();
    let consoleOutput = '';

    // Handle commands based on the device and operating system
    if (device.name === 'Linux-WebServer01') {
      if (cleanCommand.includes('systemctl status nginx')) {
        consoleOutput = `● nginx.service - A high performance web server and a reverse proxy server
     Loaded: loaded (/lib/systemd/system/nginx.service; enabled; vendor preset: enabled)
     Active: active (running) since Tue 2026-07-21 08:12:44 UTC; 6h ago
     Docs: man:nginx(8)
     Main PID: 12489 (nginx)
     Tasks: 3 (limit: 4663)
     Memory: 8.4M
     CGroup: /system.slice/nginx.service
             ├─12489 nginx: master process /usr/sbin/nginx -g daemon on; master_process on;
             ├─12490 nginx: worker process
             └─12491 nginx: worker process

Jul 21 08:12:44 Linux-WebServer01 systemd[1]: Starting A high performance web server...
Jul 21 08:12:44 Linux-WebServer01 systemd[1]: Started A high performance web server.`;
      } else if (cleanCommand.includes('docker ps')) {
        consoleOutput = `CONTAINER ID   IMAGE          COMMAND                  CREATED        STATUS        PORTS                               NAMES
7abf304d9c42   nginx:alpine   "/docker-entrypoint.…"   2 hours ago    Up 2 hours    0.0.0.0:80->80/tcp, :::80->80/tcp   nginx-container
bf034d284a1e   redis:latest   "docker-entrypoint.s…"   4 days ago     Up 24 hours   6379/tcp                            redis-cache
8104dfbe9102   postgres:15    "docker-entrypoint.s…"   1 week ago     Up 3 days     5432/tcp                            db-backend`;
      } else if (cleanCommand.includes('df -h')) {
        consoleOutput = `Filesystem      Size  Used Avail Use% Mounted on
tmpfs           794M  1.8M  792M   1% /run
/dev/sda1        49G   29G   18G  62% /
tmpfs           3.9G     0  3.9G   0% /dev/shm
tmpfs           5.0M     0  5.0M   0% /run/lock
/dev/sda15      105M  6.1M   99M   6% /boot/efi`;
      } else if (cleanCommand.includes('cron') || cleanCommand.includes('crontab')) {
        consoleOutput = `# m h  dom mon dow   command
0 2 * * * /usr/local/bin/backup_webserver.sh >/dev/null 2>&1
*/10 * * * * /usr/local/bin/log_rotation.sh
30 4 1 * * apt-get update && apt-get upgrade -y`;
      } else if (cleanCommand === 'clear') {
        consoleOutput = '';
      } else {
        consoleOutput = `ubuntu@Linux-WebServer01:~$ ${command}
bash: ${command.split(' ')[0]}: command not found.
Supported simulation commands: 'systemctl status nginx', 'docker ps', 'df -h', 'crontab -l'`;
      }
    } else if (device.name === 'Windows-DC01') {
      if (cleanCommand.includes('get-dhcpserverv4scope')) {
        consoleOutput = `ScopeId         SubnetMask      Name           State    StartRange      EndRange        LeaseDuration
-------         ----------      ----           -----    ----------      --------        -------------
10.0.1.0        255.255.255.0   ServerSubnet   Active   10.0.1.20       10.0.1.200      8.00:00:00
10.0.2.0        255.255.255.0   WorkstationSub Active   10.0.2.10       10.0.2.250      8.00:00:00`;
      } else if (cleanCommand.includes('get-dnsserverresourcerecord')) {
        consoleOutput = `HostName                  RecordType Timestamp            Address
--------                  ---------- ---------            -------
@                         NS         0                    windows-dc01.eimp.enterprise.
@                         SOA        0                    [1],[windows-dc01.eimp.enterprise]
windows-dc01              A          0                    10.0.1.10
linux-webserver01         A          0                    10.0.1.20
hq-wifi-ap01              A          0                    10.0.3.1
finance-workstation       A          2026-07-21 12:00:00  10.0.2.30`;
      } else if (cleanCommand.includes('gpupdate')) {
        consoleOutput = `Updating policy...
User Policy update has completed successfully.
Computer Policy update has completed successfully.

To check details, review the Event Viewer log or run GPResult /h.`;
      } else if (cleanCommand.includes('get-service')) {
        consoleOutput = `Status   Name               DisplayName
------   ----               -----------
Running  ADWS               Active Directory Web Services
Running  DNS                DNS Server
Running  DHCPServer         DHCP Server
Running  EventLog           Windows Event Log
Stopped  PrintSpooler       Print Spooler
Running  RemoteRegistry     Remote Registry`;
      } else if (cleanCommand === 'clear') {
        consoleOutput = '';
      } else {
        consoleOutput = `PS C:\\Users\\Administrator> ${command}
${command.split(' ')[0]} : The term '${command.split(' ')[0]}' is not recognized as the name of a cmdlet, function, script file, or operable program.
Supported simulation cmdlets: 'Get-DhcpServerv4Scope', 'Get-DnsServerResourceRecord', 'gpupdate /force', 'Get-Service'`;
      }
    } else {
      // Default router or access switch shell commands
      if (cleanCommand.includes('show version') || cleanCommand.includes('uname')) {
        consoleOutput = `${device.name} OS: ${device.os}\nHardware Vendor: ${device.vendor}\nUptime: ${Math.round(device.uptime / 3600)} hours.`;
      } else if (cleanCommand.startsWith('ping')) {
        const parts = command.split(' ');
        const host = parts[1] || '8.8.8.8';
        consoleOutput = `PING ${host} (${host}) 56(84) bytes of data.
64 bytes from ${host}: icmp_seq=1 ttl=56 time=12.4 ms
64 bytes from ${host}: icmp_seq=2 ttl=56 time=10.9 ms
64 bytes from ${host}: icmp_seq=3 ttl=56 time=11.2 ms

--- ${host} ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2003ms
rtt min/avg/max/mdev = 10.9/11.5/12.4/0.65 ms`;
      } else {
        consoleOutput = `${device.name}> ${command}
% Invalid input detected at '^' marker.
Supported commands: 'show version', 'ping <ip_address>'`;
      }
    }

    // Log the cmdlet run into global audits
    await AuditLog.create({
      action: 'Simulated Command Executed',
      actor: req.user?.username || 'unknown',
      category: 'Server Management',
      details: `Ran command [${command}] on node ${device.name}`,
      ipAddress: req.ip || '127.0.0.1',
      status: 'Success'
    });

    return res.json({ output: consoleOutput });
  } catch (error) {
    console.error('[Console Command Error]:', error);
    return res.status(500).json({ error: 'Command execution failed' });
  }
};
