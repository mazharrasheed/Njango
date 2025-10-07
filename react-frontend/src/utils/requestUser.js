// src/utils/requestUser.js

class RequestUser {
  constructor(user) {
    this.user = user || {};

    // 👇 Handle string case safely
    let perms = user?.permissions;
    if (typeof perms === 'string') {
      try {
        perms = JSON.parse(perms);
      } catch {
        perms = [];
      }
    }

    this.permissions = perms || [];
  }

  hasPerm(perm) {
    return this.permissions.includes(perm);
  }

  hasAnyPerm(perms = []) {
    return perms.some(p => this.permissions.includes(p));
  }

  hasAllPerms(perms = []) {
    return perms.every(p => this.permissions.includes(p));
  }
}

export default RequestUser;
