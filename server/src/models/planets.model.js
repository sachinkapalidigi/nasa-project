const { parse } = require("csv-parse");
const fs = require("fs");
const path = require("path");

const planets = require("./planets.mongo");

// const habitablePlanets = [];

function isHabitablePlanet(planet) {
  return (
    planet["koi_disposition"] === "CONFIRMED" &&
    planet["koi_insol"] > 0.36 &&
    planet["koi_insol"] < 1.11 &&
    planet["koi_prad"] < 1.6
  );
}

/*
const promise = new Promise((resolve, reject)=>{
    resolve(42);
});
promise.then((result)=> {

})
const result = await promise;
console.log(result);
*/

function loadPlanetsData() {
  return new Promise((resolve, reject) => {
    fs.createReadStream(
      path.join(__dirname, "..", "..", "data", "kepler_data.csv")
    )
      .pipe(
        parse({
          comment: "#",
          columns: true,
        })
      )
      .on("data", async (data) => {
        // console.log(++readCount, ' stream data ');
        if (isHabitablePlanet(data)) {
          // habitablePlanets.push(data);
          // Replace below create with upsert
          // insert + update = upsert
          // insert if doesnt exist
          // await planets.create({
          //   keplerName: data.kepler_name,
          // });
          await savePlanet(data);
        }
      })
      .on("error", (err) => {
        console.log(err);
        reject(err);
      })
      .on("end", async () => {
        // console.log(`${habitablePlanets.length} habitable planets found`);
        // console.log(habitablePlanets.map((planet) => planet["kepler_name"]));
        // Not passing habitable planets as we are setting it and exporting it
        const countPlanetsFound = (await getAllPlanets()).length;
        console.log(`${countPlanetsFound} habitable planets found`);
        resolve();
      });
  });
}

async function getAllPlanets() {
  return await planets.find({}, {
    // '_id': 0,
    // '__v': 0 // donot include these 2
    keplerName: 1, // with just this even id will come along with this.
  });
}

async function savePlanet(data) {
  try {
    await planets.updateOne(
      {
        keplerName: data.kepler_name, // find
      },
      {
        keplerName: data.kepler_name, // if not found update with this only when upsert: true
      },
      {
        upsert: true, // if not found create a new record
      }
    );
  } catch (err) {
    console.error(`Could not save planet ${err}`);
  }
}

module.exports = {
  loadPlanetsData,
  getAllPlanets,
};
