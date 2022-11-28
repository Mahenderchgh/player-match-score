const express = require("express");

const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertPlayerDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
const convertMatchDetailsDbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT
      *
    FROM
      player_details
    ORDER BY
      player_id;`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((each) => convertPlayerDbObjectToResponseObject(each))
  );
});

//get player API

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT
      *
    FROM
      player_details
    WHERE
      player_id = ${playerId};`;
  const dbObject = await db.get(getPlayerQuery);

  response.send(convertPlayerDbObjectToResponseObject(dbObject));
});

// update player API

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
  UPDATE
    player_details
  SET
    player_name = '${playerName}'
  WHERE
    player_id = ${playerId};`;

  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//get matchdetails

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT * FROM match_details
    WHERE match_id = ${matchId};`;

  const dbObject = await db.get(getMatchQuery);

  response.send(convertMatchDetailsDbObjectToResponseObject(dbObject));
});

//get all matches

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchQuery = `
    SELECT * FROM player_match_score NATURAL JOIN match_details
    WHERE player_id = ${playerId};`;

  const playerMatches = await db.all(getPlayerMatchQuery);
  response.send(
    playerMatches.map((eachMatch) =>
      convertMatchDetailsDbObjectToResponseObject(eachMatch)
    )
  );
});

//get list of players specific match

app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayerQuery = `
    SELECT * FROM player_match_score NATURAL JOIN player_details
    WHERE match_id = ${matchId};`;

  const playersArray = await db.all(getMatchPlayerQuery);
  response.send(
    playersArray.map((eachplayer) =>
      convertPlayerDbObjectToResponseObject(eachplayer)
    )
  );
});

//get totalscore specific id

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchPlayersQuery = `
    SELECT player_id AS playerId,
    player_name AS playerName,
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes
    FROM player_match_score NATURAL JOIN player_details
    WHERE player_id = ${playerId};`;

  const playerMatchDetails = await db.get(getMatchPlayersQuery);
  response.send(playerMatchDetails);
});

module.exports = app;
