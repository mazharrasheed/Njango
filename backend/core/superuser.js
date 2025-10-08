import readline from "readline";
import bcrypt from "bcrypt";
import { runExecute } from "./db.js";
import { User } from "../auth/models/user.js";

export async function createSuperUser() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

  const username = await ask("Username: ");
  const password = await ask("Password: ");
  const email = await ask("Email: ");
  rl.close();
  
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.objects.create({ username: username,email:email, password:hashedPassword, is_superuser:1 });
  console.log(`Superuser '${username}' created successfully 👑`);
}
