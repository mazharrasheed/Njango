import { useState, useEffect, useRef } from "react";
import api from "../api"; // axios instance

export default function UserManagement() {
  const [form, setForm] = useState({
    id: null,
    username: "",
    password: "",
    role: "user",
    permissions: []
  });

  const [permissionsData, setPermissionsData] = useState({
    defaultPermissions: [],
    customPermissions: [],
    rolePermissions: {}
  });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // 🔹 To track original role during edit
  const initialRoleRef = useRef(null);

  // Fetch permissions
  useEffect(() => {
    api
      .get("/permissions")
      .then((res) => setPermissionsData(res.data.perms))
      .catch((err) => console.error("Failed to fetch permissions", err));
  }, []);

  // Fetch users
  const fetchUsers = () => {
    setLoading(true);
    api
      .get("auth/users")
      .then((res) => {
        const cleanUsers = res.data.users.map((user) => ({
          ...user,
          permissions:
            typeof user.permissions === "string"
              ? (() => {
                try {
                  return JSON.parse(user.permissions);
                } catch {
                  return user.permissions.split(",").map((p) => p.trim());
                }
              })()
              : user.permissions || []
        }));
        setUsers(cleanUsers);
      })
      .catch((err) => console.error("Failed to fetch users", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const allPermissions = [
    ...permissionsData.defaultPermissions,
    ...permissionsData.customPermissions
  ];

  // 🔹 Role-based permission handling
  useEffect(() => {
    if (!permissionsData.rolePermissions || !form.role) return;

    const rolePerms = permissionsData.rolePermissions[form.role] || [];

    setForm((prev) => {
      const current =
        Array.isArray(prev.permissions) ||
          prev.permissions === null ||
          prev.permissions === undefined
          ? prev.permissions || []
          : JSON.parse(prev.permissions || "[]");

      // 🔸 Case 1: Creating new user
      if (!isEditing && !prev.id) {
        return { ...prev, permissions: [...rolePerms] };
      }

      // 🔸 Case 2: Editing - role actually changed
      if (isEditing && form.role !== initialRoleRef.current) {
        // Merge existing and new role perms
        const merged = Array.from(new Set([...rolePerms]));
        return { ...prev, permissions: merged };
      }

      // 🔸 Case 3: Editing same role - keep existing perms
      return prev;
    });
  }, [form.role, permissionsData.rolePermissions, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handlePermissionToggle = (perm) => {
    setForm((prev) => {
      const hasPerm = prev.permissions.includes(perm);
      return {
        ...prev,
        permissions: hasPerm
          ? prev.permissions.filter((p) => p !== perm)
          : [...prev.permissions, perm]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (form.id) {
        await api.put(`/auth/updateuser/${form.id}`, form);
        alert("✅ User updated successfully");
      } else {
        await api.post("/auth/createuser", form);
        alert("✅ User created successfully");
      }
      resetForm();
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "❌ Failed to save user");
    }
  };

  const handleEdit = (user) => {
    initialRoleRef.current = user.role; // store original role
    setIsEditing(true);
    setForm({
      id: user.id,
      username: user.username,
      password: "",
      role: user.role,
      permissions: Array.isArray(user.permissions)
        ? user.permissions
        : (() => {
          try {
            return JSON.parse(user.permissions || "[]");
          } catch {
            return user.permissions.split(",").map((p) => p.trim());
          }
        })()
    });
  };

  const resetForm = () => {
    initialRoleRef.current = null;
    setIsEditing(false);
    setForm({
      id: null,
      username: "",
      password: "",
      role: "user",
      permissions: [...(permissionsData.rolePermissions["user"] || [])]
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/users/${id}`);
      alert("✅ User deleted successfully");
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "❌ Failed to delete user");
    }
  };

  return (
    <div className="container mt-4">
      <h2>User Management</h2>

      <form onSubmit={handleSubmit} className="mb-4">
        {/* Username */}
        <div className="row">
          <div className="mb-3 col-md-4">
            <label className="form-label">Username</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              className="form-control"
              required
            />
          </div>

          {/* Password (only for new user) */}
          {!form.id && (
            <div className="mb-3 col-md-4">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>
          )}

          {/* Role */}
          <div className="mb-3 col-md-4">
            <label className="form-label">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="form-select"
            >
              {Object.keys(permissionsData.rolePermissions || {}).map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* Permissions */}
        <div className="mb-3 container">
          <label className="form-label">Permissions</label>
          <div className="border rounded p-3 d-flex overflow-auto row">
            {allPermissions.map((perm) => (
              <div key={perm} className="form-check col-md-3">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id={perm}
                  checked={form.permissions.includes(perm)}
                  onChange={() => handlePermissionToggle(perm)}
                />
                <label className="form-check-label" htmlFor={perm}>
                  {perm}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <button type="submit" className="btn btn-primary">
          {form.id ? "Update User" : "Create User"}
        </button>
        {form.id && (
          <button
            type="button"
            className="btn btn-secondary ms-2"
            onClick={resetForm}
          >
            Cancel
          </button>
        )}
      </form>

      {/* User List */}
      <h3>User List</h3>
      {loading ? (
        <p>Loading users...</p>
      ) : (
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Permissions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.role}</td>
                  <td style={{ maxWidth: "250px", whiteSpace: "normal" }}>
                    {Array.isArray(user.permissions)
                      ? user.permissions.map((perm, i) => (
                        <span key={i} className="badge bg-secondary me-1">
                          {perm}
                        </span>
                      ))
                      : ""}
                  </td>
                  <td className="d-flex justify-content-end">
                    <button
                      className="btn btn-sm btn-warning me-2"
                      onClick={() => handleEdit(user)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(user.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
