import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(__dirname, '../../db_fallback.json');

// Initialize local DB file if not exists
const initDbFile = () => {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({
      users: [],
      devices: [],
      firewallrules: [],
      tickets: [],
      vpnsessions: [],
      securityalerts: [],
      auditlogs: []
    }, null, 2));
  }
};

const readDb = (): Record<string, any[]> => {
  initDbFile();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return {
      users: [],
      devices: [],
      firewallrules: [],
      tickets: [],
      vpnsessions: [],
      securityalerts: [],
      auditlogs: []
    };
  }
};

const writeDb = (data: Record<string, any[]>) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

export const fallbackDb = {
  getCollection: (collection: string): any[] => {
    const db = readDb();
    return db[collection.toLowerCase()] || [];
  },

  setCollection: (collection: string, data: any[]) => {
    const db = readDb();
    db[collection.toLowerCase()] = data;
    writeDb(db);
  },

  find: (collection: string, filter: any = {}): any[] => {
    const list = fallbackDb.getCollection(collection);
    return list.filter(item => {
      for (const key in filter) {
        if (filter[key] !== undefined) {
          if (typeof filter[key] === 'object' && filter[key] !== null) {
            // Simple regex match support
            if (filter[key].$regex) {
              const regex = new RegExp(filter[key].$regex, filter[key].$options || '');
              if (!regex.test(item[key] || '')) return false;
              continue;
            }
            if (filter[key].$or) {
              const matchesOr = filter[key].$or.some((subFilter: any) => {
                return Object.keys(subFilter).every(subKey => {
                  if (subFilter[subKey].$regex) {
                    const r = new RegExp(subFilter[subKey].$regex, subFilter[subKey].$options || '');
                    return r.test(item[subKey] || '');
                  }
                  return item[subKey] === subFilter[subKey];
                });
              });
              if (!matchesOr) return false;
              continue;
            }
          }
          if (item[key] !== filter[key]) return false;
        }
      }
      return true;
    });
  },

  findOne: (collection: string, filter: any = {}): any => {
    const results = fallbackDb.find(collection, filter);
    return results[0] || null;
  },

  findById: (collection: string, id: string): any => {
    const list = fallbackDb.getCollection(collection);
    return list.find(item => item._id === id || item.id === id) || null;
  },

  create: (collection: string, data: any): any => {
    const list = fallbackDb.getCollection(collection);
    const newItem = {
      _id: data._id || Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };
    list.push(newItem);
    fallbackDb.setCollection(collection, list);
    return newItem;
  },

  findByIdAndUpdate: (collection: string, id: string, update: any): any => {
    const list = fallbackDb.getCollection(collection);
    const index = list.findIndex(item => item._id === id || item.id === id);
    if (index === -1) return null;

    list[index] = {
      ...list[index],
      ...update,
      updatedAt: new Date().toISOString()
    };
    fallbackDb.setCollection(collection, list);
    return list[index];
  },

  findByIdAndDelete: (collection: string, id: string): any => {
    const list = fallbackDb.getCollection(collection);
    const index = list.findIndex(item => item._id === id || item.id === id);
    if (index === -1) return null;
    const removed = list.splice(index, 1)[0];
    fallbackDb.setCollection(collection, list);
    return removed;
  },

  deleteMany: (collection: string, filter: any = {}) => {
    const list = fallbackDb.getCollection(collection);
    const remaining = list.filter(item => {
      for (const key in filter) {
        if (item[key] === filter[key]) return false;
      }
      return true;
    });
    fallbackDb.setCollection(collection, remaining);
    return { deletedCount: list.length - remaining.length };
  },

  countDocuments: (collection: string, filter: any = {}): number => {
    return fallbackDb.find(collection, filter).length;
  }
};
