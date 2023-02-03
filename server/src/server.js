const http = require("http");
const dotenv = require("dotenv");
dotenv.config(); // important to load above all else

const app = require("./app");

const { mongoConnect } = require("./services/mongo");

const { loadPlanetsData } = require("./models/planets.model");
const { loadLaunchData } = require("./models/launches.model");

// "start": "PORT=5000 node src/server.js"
const PORT = process.env.PORT || 8001;

const server = http.createServer(app);

async function startServer() {
  await mongoConnect();
  // await loadPlanetsData();
  // await loadLaunchData();

  server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
}

startServer();
