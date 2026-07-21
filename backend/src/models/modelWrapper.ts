import { dbState } from '../config/db';
import { fallbackDb } from '../utils/fallbackDb';
import bcrypt from 'bcryptjs';

const makeQueryChain = (results: any[]) => {
  const chain: any = [...results];
  
  chain.sort = function(sorter: any) {
    if (sorter) {
      const key = Object.keys(sorter)[0];
      const order = sorter[key]; // 1 for asc, -1 for desc
      Array.prototype.sort.call(chain, (a: any, b: any) => {
        const valA = a[key];
        const valB = b[key];
        if (valA === undefined || valB === undefined) return 0;
        if (valA < valB) return order === 1 ? -1 : 1;
        if (valA > valB) return order === 1 ? 1 : -1;
        return 0;
      });
    }
    return makeQueryChain(chain);
  };

  chain.limit = function(num: number) {
    return makeQueryChain(chain.slice(0, num));
  };

  chain.select = function(fields: string) {
    // Return same list, mock implementation
    return makeQueryChain(chain);
  };

  return chain;
};

export const wrapModel = (mongooseModel: any, collectionName: string) => {
  // Define instance prototype simulator
  const createInstance = (data: any) => {
    const instance = {
      _id: data._id || Math.random().toString(36).substring(2, 9),
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
      ...data,
      save: async function() {
        const existing = fallbackDb.findById(collectionName, this._id);
        if (existing) {
          const updated = fallbackDb.findByIdAndUpdate(collectionName, this._id, this);
          Object.assign(this, updated);
        } else {
          const created = fallbackDb.create(collectionName, this);
          Object.assign(this, created);
        }
        return this;
      },
      comparePassword: async function(candidate: string) {
        if (!this.password) return false;
        // Check if stored password is raw or hashed (seed script hashes it, but this acts as fallback)
        if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
          return bcrypt.compare(candidate, this.password);
        }
        return candidate === this.password;
      }
    };
    return instance;
  };

  const handler = {
    // Construct handler for 'new Model(data)' calls
    construct(target: any, args: any[]) {
      if (dbState.isMock) {
        return createInstance(args[0] || {});
      }
      return new target(...args);
    },

    // Get handler for static methods
    get(target: any, prop: string, receiver: any) {
      if (dbState.isMock) {
        switch (prop) {
          case 'find':
            return (filter: any) => {
              const res = fallbackDb.find(collectionName, filter);
              return makeQueryChain(res.map(createInstance));
            };
          case 'findOne':
            return (filter: any) => {
              const res = fallbackDb.findOne(collectionName, filter);
              return res ? createInstance(res) : null;
            };
          case 'findById':
            return (id: string) => {
              const res = fallbackDb.findById(collectionName, id);
              return res ? createInstance(res) : null;
            };
          case 'create':
            return async (data: any | any[]) => {
              if (Array.isArray(data)) {
                return data.map(item => {
                  // If seeding runs, passwords must be encrypted
                  if (collectionName.toLowerCase() === 'users' && item.password) {
                    const salt = bcrypt.genSaltSync(10);
                    item.password = bcrypt.hashSync(item.password, salt);
                  }
                  return fallbackDb.create(collectionName, item);
                });
              }
              if (collectionName.toLowerCase() === 'users' && data.password) {
                const salt = bcrypt.genSaltSync(10);
                data.password = bcrypt.hashSync(data.password, salt);
              }
              const created = fallbackDb.create(collectionName, data);
              return createInstance(created);
            };
          case 'findByIdAndUpdate':
            return async (id: string, update: any, options?: any) => {
              const updated = fallbackDb.findByIdAndUpdate(collectionName, id, update);
              return updated ? createInstance(updated) : null;
            };
          case 'findByIdAndDelete':
            return async (id: string) => {
              const deleted = fallbackDb.findByIdAndDelete(collectionName, id);
              return deleted ? createInstance(deleted) : null;
            };
          case 'deleteMany':
            return async (filter: any) => {
              return fallbackDb.deleteMany(collectionName, filter);
            };
          case 'countDocuments':
            return async (filter: any) => {
              return fallbackDb.countDocuments(collectionName, filter);
            };
          default:
            // fallback to raw target property if not mapped
            return target[prop];
        }
      }
      return Reflect.get(target, prop, receiver);
    }
  };

  return new Proxy(mongooseModel, handler);
};
