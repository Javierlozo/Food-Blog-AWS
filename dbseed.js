require("dotenv").config();
const sql = require("mysql2/promise");

const pool = sql.createPool({
  host: process.env.AWS_HOST,
  user: process.env.AWS_USER,
  password: process.env.AWS_PASSWORD,
});

//CREATE USER TABLE

(async function createUserTable() {
  try {
    const conn = await pool.getConnection();

    conn.query("CREATE DATABASE IF NOT EXISTS foodblog");
    conn.query("USE foodblog");

    const userDB = await conn.query(
      "CREATE TABLE IF NOT EXISTS user (username VARCHAR(255) UNIQUE NOT NULL, profilepic VARCHAR(255), bio VARCHAR(3000), PRIMARY KEY(username)) "
    );

    console.log(userDB);

    conn.release();
  } catch (error) {
    console.log("error");
  }
})();

//CREATE BLOG POST TABLE

(async function createBlogPostTable() {
  try {
    const conn = await pool.getConnection();

    conn.query("USE foodblog");

    const foodblogpostDB = await conn.query(
      "CREATE TABLE IF NOT EXISTS foodblogpost (id INT UNIQUE NOT NULL AUTO_INCREMENT, title VARCHAR(255), description VARCHAR(4095), username VARCHAR(255) NOT NULL, date DATETIME NOT NULL, PRIMARY KEY(id), FOREIGN KEY(username) REFERENCES user(username))"
    );

    console.log(foodblogpostDB);

    conn.release();
  } catch (error) {
    console.log("error");
  }
})();

//CREATE BLOG PIC TABLE

(async function createBlogPicTable() {
  try {
    const conn = await pool.getConnection();

    conn.query("USE foodblog");

    const foodblogpicDB = await conn.query(
      "CREATE TABLE IF NOT EXISTS foodblogpic (s3uuid VARCHAR(255) NOT NULL UNIQUE, description VARCHAR(4095), foodblogpost INT NOT NULL, PRIMARY KEY(s3uuid), FOREIGN KEY(foodblogpost) REFERENCES foodblogpost(id))"
    );

    conn.release();
  } catch (error) {
    console.log("error");
  }
})();
