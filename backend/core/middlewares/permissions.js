// middleware/permissions.js
export function permissionRequired(permission) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
console.log("im called pertdf",permission,req.user)

    if (!req.user.has_perm(permission)) {
      return res.status(403).json({ error: "Permission denied" });
    }

    next();
  };
}
