import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "./models/user.js";
import { defaultPermissions, customPermissions, rolePermissions} from "../../core/orm/permissionsConfig.js";
// for use in case of ORM has no requried method
// const rows = await runQuery("SELECT * FROM users WHERE id = ?", [1]);
// await runExecute("UPDATE users SET firstname = ? WHERE id = ?", ["Alice", 1]);
import { runExecute,runQuery } from "../../core/orm/db.js";
// ---------------------

import dotenv from "dotenv";
dotenv.config(); // ensure env variables loaded here too

export async function profile(req, res) {
  try {
     const { id } = req.params;
    if (!id) return res.status(400).json({ error: "User ID required" });
    const user = await User.objects.get({id:id})
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      success: true,
      user: user, 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function user(req, res) {
  try {
    res.json({
      success: true,
      user: req.user, // send back decoded user info
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}


// ✅ Get All Users
export async function users(req, res) {
  try {
    const users = await User.objects.all();
    // Safely parse permissions for frontend
    const parsedUsers = users.map(u => ({
      ...u,
      permissions: safeParse(u.permissions)
    }));

    res.json({ success: true, users: parsedUsers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ✅ Get Permission Structure
export async function permissions(req, res) {
  try {
    const perms = { defaultPermissions, customPermissions, rolePermissions };
    res.json({ success: true, perms });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ✅ Create User
export async function createUser(req, res) {
  try {
    const { username, password, role, permissions } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "Username and password required" });

    const existing = await User.objects.get({username:username});

    if (existing)
      return res.status(400).json({ error: "Username already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.objects.create({username:username,email:'@',password:hashedPassword,role:role,permissions:JSON.stringify(permissions || [])})

    res.json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ✅ Update User
export async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { username, password, role, permissions } = req.body;

    if (!id) return res.status(400).json({ error: "User ID required" });

    const existing = await User.objects.get({id:id});
    if (!existing) return res.status(404).json({ error: "User not found" });

    const updates = [];
    const values = [];

    if (username) {
      updates.push("username = ?");
      values.push(username);
    }

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      updates.push("password = ?");
      values.push(hashed);
    }

    if (role) {
      updates.push("role = ?");
      values.push(role);
    }

    if (permissions) {
      updates.push("permissions = ?");
      values.push(JSON.stringify(permissions));
    }

    if (updates.length === 0)
      return res.status(400).json({ error: "No fields to update" });

    // runExecute(sql, values);

    await User.objects.update({id:id}, {username:username,role:role,permissions:JSON.stringify(permissions || [])})

    res.json({ message: "User updated successfully" });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ✅ Utility: safely parse permissions
function safeParse(str) {
  try {
    const val = JSON.parse(str);
    return Array.isArray(val) ? val : [];
  } catch {
    return [];
  }
}

// REGISTER
export async function register(req, res) {
  const { username, password,firstname,lastname,email } = req.body;

  const permissions=rolePermissions['user']; // default role permissions
  console.log('permisions',typeof JSON.stringify(permissions || []))
  console.log("register",username,password,firstname,lastname,email)
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }
 
  try {
    const existingUser =  await User.objects.get({username:username});
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.objects.create({username:username,password:hashedPassword,firstname:firstname,lastname:lastname,email:email || "email@example.com",rele:'user',permissions:JSON.stringify(permissions || [])});

    res.json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// LOGIN

export async function login(req, res) {
  const { username, password } = req.body;

  try {
    // const users = runQuery("SELECT * FROM users WHERE username = ?", [username]);
    const user= await User.objects.get({username:username})
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }
    // Compare passwords if hashed
    const isMatch = password === user.password || await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // ✅ Ensure this matches Authmiddleware.js
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}

// LOGOUT (client deletes token)
export function logout(req, res) {
  res.json({ message: "Logout successful (delete token on client)" });
}
