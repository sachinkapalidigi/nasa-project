const mongoose = require("mongoose");

const MONGO_URL = process.env.MONGO_URL;

mongoose.connection.on("open", () => {
  console.log("MongoDB connection ready!");
});

mongoose.connection.on("error", (err) => {
  console.error(err);
});

async function mongoConnect() {
  await mongoose.connect(MONGO_URL);
}

async function mongoDisconnect() {
  await mongoose.disconnect();
}

module.exports = {
  mongoConnect,
  mongoDisconnect,
};

// Not needed in mongoose 6 and higher
// await mongoose.connect(MONGO_URL, { // deprication warnings if not passed
//     useNewUrlParser: true, // how mongoose parses connection string
//     useFindAndModify: false, // disables outdated way of modifying data
//     useCreateIndex: true, // instead of older approach
//     useUnifiedTopology: true, // updated way of talking to clusters
// });
