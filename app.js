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
    await db.run(InsertQuery);
    response.status(200);
    response.send("User created successfully");
  } else {
    const LengthPassword = password.length;
    if (LengthPassword < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      response.status(400);
      response.send("User already exists");
    }
  }
});
///login User
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const SelectQuery = `SELECT * FROM user WHERE username='${username}';`;
  const dbData = await db.get(SelectQuery);

  if (dbData === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPassword = await bcrypt.compare(password, dbData.password);
    if (isPassword === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});
///change-password
app.post("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectQuery = `SELECT * FROM user WHERE username='${username}';`;
  const dbData = await db.get(selectQuery);

  if (dbData === undefined) {
    response.status(400);
    response.send("User not registered");
  } else {
    const PasswordTrue = await bcrypt.compare(oldPassword, dbData.password);
    if (PasswordTrue === true) {
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const UpdateQueryPassword = `UPDATE user SET password='${hashedPassword}' WHERE username='${username}';`;
        await db.run(UpdateQueryPassword);
        response.send("Password Updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
module.exports = app;
