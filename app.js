const express = require("express");
const bcrypt = require("bcrypt");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");

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

///Registration
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const SelectQuery = `SELECT * FROM user WHERE username='${username}';`;
  const dbData = await db.get(SelectQuery);
  if (dbData === undefined) {
    const InsertQuery = `INSERT INTO user(username,name,password,gender,location)VALUES(
          '${username}',
          '${name}',
          '${hashedPassword}',
          '${gender}',
          '${location}'
      );`;
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      let createdQuery = await db.run(InsertQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});
///login User
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const SelectQuery = `SELECT * FROM user WHERE username='${username}';`;
  const dbData = await db.get(SelectQuery);

  if (dbData !== undefined) {
    const isPassword = await bcrypt.compare(password, dbData.password);
    if (isPassword === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  } else {
    response.status(400);
    response.send("Invalid user");
  }
});
///change-password
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  // check user
  const checkUserQuery = `select * from user where username = '${username}';`;
  const userDetails = await db.get(checkUserQuery);
  if (userDetails !== undefined) {
    const isPasswordValid = await bcrypt.compare(
      oldPassword,
      userDetails.password
    );
    if (isPasswordValid) {
      if (newPassword.length > 5) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatePasswordQuery = `update user set 
        password = '${hashedPassword}' where username = '${username}';`;
        const updatePasswordResponse = await db.run(updatePasswordQuery);
        response.status(200);
        response.send("Password updated"); //Scenario 3
      } else {
        response.status(400);
        response.send("Password is too short"); //Scenario 2
      }
    } else {
      response.status(400);
      response.send("Invalid current password"); //Scenario 1
    }
  } else {
    response.status(400);
    response.send(`Invalid user`); // Scenario 4
  }
});
module.exports = app;
