
import { runExecute } from './db.js';
import bcrypt from 'bcrypt';
import { getAllModels } from './models.js';


const allModels = await getAllModels();

// Initialize the database with default values
export async function initDB() {
  // Loop through models and create tables
  for (const model of allModels) {
    console.log(`📦 Creating table: ${model.name}`);
    runExecute(model.query);
  }

}

// ✅ Call the function
initDB();
