
import { startServer } from "./backend/core/server.js";
import { createSuperUser } from "./backend/core/superuser.js";
import { migrate, makemigrations } from "./backend/core/orm/migrations.js";
import { loadModels } from "./backend/core/orm/loader.js";


const models = await loadModels(); // auto-load all models from /models folder

const command = process.argv[2];

switch (command) {
  case "runserver":
    console.log("Starting Njango server... 🚀");
    startServer();
    break;

  case "makemigrations":
    console.log("creating migrations... 📦");
    await makemigrations(models);

    break;

  case "migrate":
    console.log("Applying migrations... 📦");
    await migrate(models);
    break;

  case "createsuperuser":
    console.log("Creating superuser... 👑");
    await createSuperUser();
    break;

  default:
    console.log(`
Unknown command: ${command}

Available commands:
  runserver        Start the development server
  migrate          Apply database migrations
  createsuperuser  Create an admin user
`);
}
