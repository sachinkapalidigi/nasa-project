const axios = require("axios");

const launchesDatabase = require("./launches.mongo");
const planetsDatabase = require("./planets.mongo");

const DEFAULT_FLIGHT_NUMBER = 100;

async function findLaunch(filter) {
  return await launchesDatabase.findOne(filter);
}

async function existsLaunchWithId(launchId) {
  return await findLaunch({ flightNumber: launchId });
}

async function getLatestFlightNumber() {
  const latestLaunch = await launchesDatabase.findOne().sort("-flightNumber"); // highest flight number
  if (!latestLaunch) return DEFAULT_FLIGHT_NUMBER;
  return latestLaunch.flightNumber;
}

async function getAllLaunches(skip, limit) {
  return await launchesDatabase
    .find({}, { __v: 0, _id: 0 })
    .sort({ flightNumber: 1 }) // -1 for descending
    .skip(skip)
    .limit(limit);
}

async function saveLaunch(launch) {
  try {
    await launchesDatabase.findOneAndUpdate(
      {
        flightNumber: launch.flightNumber,
      },
      launch,
      {
        upsert: true,
      }
    );
  } catch (err) {
    console.error(`There was an error saving launches ${err}`);
  }
}

async function scheduleNewLaunch(launch) {
  const planet = await planetsDatabase.findOne({
    keplerName: launch.target,
  });

  if (!planet) {
    throw new Error("No matching planet found");
  }

  const latestFlightNumber = await getLatestFlightNumber();
  const newLaunch = Object.assign(launch, {
    flightNumber: latestFlightNumber + 1,
    success: true,
    upcoming: true,
    customers: ["Zero to Mastery", "Nasa"],
  });

  return await saveLaunch(newLaunch);
}

async function abortLaunchById(launchId) {
  const aborted = await launchesDatabase.updateOne(
    {
      flightNumber: launchId,
    },
    {
      upcoming: false,
      success: false,
    }
  );
  return aborted.matchedCount === 1 && aborted.modifiedCount === 1;
}

const SPACEX_LAUNCH_WITH_QUERY_URL =
  "https://api.spacexdata.com/v4/launches/query";

/** Spacex api to DB model mapping
 * flightNumber: flight_number
 * mission: name
 * rocket: rocket.name
 * launchDate: date_local
 * target: not applicable
 * upcoming
 * success
 * customers: payload.customers
 */
async function populateLaunches() {
  const response = await axios.post(SPACEX_LAUNCH_WITH_QUERY_URL, {
    query: {},
    options: {
      pagination: false,
      populate: [
        {
          path: "rocket",
          select: {
            name: 1,
          },
        },
        {
          path: "payloads",
          select: {
            customers: 1,
          },
        },
      ],
    },
  });
  if (response.status !== 200) {
    console.log("Could not download spacex launch data");
    throw new Error(`Couldnot download launches data`);
  }
  const launchDocs = response.data.docs.map((launchDoc) => ({
    flightNumber: launchDoc.flight_number,
    mission: launchDoc.name,
    rocket: launchDoc.rocket.name,
    launchDate: launchDoc.date_local,
    upcoming: launchDoc.upcoming,
    success: launchDoc.success,
    customers: launchDoc.payloads.flatMap((payload) => payload.customers),
  }));
  // Populate launches collection
  launchDocs.forEach(async (launchDoc) => {
    await saveLaunch(launchDoc);
  });
}

async function loadLaunchData() {
  const firstLaunch = await findLaunch({
    flightNumber: 1,
    rocket: "Falcon 1",
    mission: "FalconSat",
  });
  if (firstLaunch) {
    console.log("Launch data already loaded");
    return;
  } else {
    await populateLaunches();
  }
}

module.exports = {
  getAllLaunches,
  existsLaunchWithId,
  abortLaunchById,
  scheduleNewLaunch,
  loadLaunchData,
};

// This file acts as data access layer and hides the mongo implementation.
