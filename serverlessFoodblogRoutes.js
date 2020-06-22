require("dotenv").config();
const serverless = require("serverless-http");
const express = require("express");
const sql = require("mysql2/promise");
const cors = require("cors");
const { response, request } = require("express");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const pool = sql.createPool({
  host: process.env.AWS_HOST,
  user: process.env.AWS_USER,
  password: process.env.AWS_PASSWORD,
});

// USER

// POST USER
app.post("/user", authorizeUser, async (req, resp) => {
  try {
    if (!req.body.username) {
      resp.status(400).send({ message: "No username entered" });
    }
    const conn = await pool.getConnection();
    const queryResponse = await conn.execute(
      `INSERT INTO foodblog.user (username, profilepic, bio) VALUES (?, ?, ?)`,
      [
        req.body.username,
        req.body.profilepic ? req.body.profilepic : null,
        req.body.bio ? req.body.bio : null,
      ]
    );
    conn.release();
    resp.status(200).send({ message: queryResponse });
  } catch (error) {
    resp.status(500).send({ message: error });
  }
});

// GET ALL USERS
app.get("/users", authorizeUser, async (req, resp) => {
  try {
    const conn = await pool.getConnection();
    const recordset = await conn.execute(`SELECT * FROM foodblog.user`);

    conn.release();
    resp.status(200).send({ message: recordset[0] });
  } catch (error) {
    resp.status(500).send({ message: error });
  }
});

// GET ONE USER
app.get("/user", async (req, resp) => {
  try {
    const conn = await pool.getConnection();
    const recordset = await conn.execute(
      `SELECT * FROM foodblog.user WHERE username = ?`,
      [req.query.username]
    );

    conn.release();
    resp.status(200).send({ message: recordset[0] });
  } catch (error) {
    resp.status(500).send({ message: error });
  }
});

// MODIFY A USER
app.put("/user", authorizeUser, async (req, resp) => {
  try {
    if (!req.body.username) {
      resp.status(400).send({ message: "No username entered" });
    }

    const selectQuery = await pool.execute(
      `SELECT * FROM foodblog.user WHERE username = ?`,
      [req.body.username]
    );

    const selectedUser = selectQuery[0][0];

    const conn = await pool.getConnection();
    const queryResponse = await conn.execute(
      `UPDATE foodblog.user SET username = ?, profilepic = ?, bio = ? WHERE username = ?`,
      [
        req.body.username,
        req.body.profilepic ? req.body.profilepic : selectedUser.profilepic,
        req.body.bio ? req.body.bio : selectedUser.bio,
        req.body.username,
      ]
    );
    conn.release();
    resp.status(200).send({ message: queryResponse });
  } catch (error) {
    resp.status(500).send({ message: error });
  }
});

// DELETE ONE USER
app.delete("/user", authorizeUser, async (req, resp) => {
  try {
    const conn = await pool.getConnection();
    const recordset = await conn.execute(
      `DELETE FROM foodblog.user WHERE username = ?`,
      [req.body.username]
    );

    conn.release();
    resp.status(200).send({ message: recordset[0] });
  } catch (error) {
    resp.status(500).send({ message: error });
  }
});

// FOOD BLOG POST

// POST FOOD BLOG POST
app.post("/foodblogpost", authorizeUser, async (req, resp) => {
  try {
    if (!req.body.username) {
      resp.status(400).send({ message: "This blog has no user" });
    }
    const conn = await pool.getConnection();
    const queryResponse = await conn.execute(
      `INSERT INTO foodblog.foodblogpost (username, title, description, date) VALUES (?, ?, ?, ?)`,
      [
        req.body.username,
        req.body.title ? req.body.title : null,
        req.body.description ? req.body.description : null,
        new Date(),
      ]
    );
    conn.release();
    resp.status(200).send({ message: queryResponse });
  } catch (error) {
    resp.status(500).send({ message: error });
  }
});

// GET ALL FOOD BLOG POSTS
app.get("/foodblogposts", authorizeUser, async (req, resp) => {
  try {
    const conn = await pool.getConnection();
    const recordset = await conn.execute(`SELECT * FROM foodblog.foodblogpost`);

    conn.release();
    resp.status(200).send({ message: recordset[0] });
  } catch (error) {
    resp.status(500).send({ message: error });
  }
});

// GET ONE FOOD BLOG POST
app.get("/foodblogpost", authorizeUser, async (req, resp) => {
  try {
    const conn = await pool.getConnection();
    const recordset = await conn.execute(
      `SELECT * FROM foodblog.foodblogpost WHERE id = ?`,
      [req.query.blogPostId]
    );

    conn.release();
    resp.status(200).send({ message: "Id does not exists" });
  } catch (error) {
    resp.status(500).send({ message: error });
  }
});

// MODIFY A FOOD BLOG POST
app.put("/foodblogpost", authorizeUser, async (req, resp) => {
  try {
    if (!req.body.blogPostId) {
      resp.status(400).send({ message: "No valid blog id entered" });
    }

    const selectQuery = await pool.execute(
      `SELECT * FROM foodblog.foodblogpost WHERE id = ?`,
      [req.body.blogPostId]
    );

    const selectedBlogPost = selectQuery[0][0];

    const conn = await pool.getConnection();
    const queryResponse = await conn.execute(
      `UPDATE foodblog.foodblogpost SET title = ?, description = ?, date = ? WHERE id = ?`,
      [
        req.body.title ? req.body.title : selectedBlogPost.title,
        req.body.description
          ? req.body.description
          : selectedBlogPost.description,
        new Date(),
        req.body.blogPostId,
      ]
    );
    conn.release();
    resp.status(200).send({ message: queryResponse });
  } catch (error) {
    resp.status(500).send({ message: error });
  }
});

// DELETE ONE FOOD BLOG POST
app.delete("/foodblogpost", authorizeUser, async (req, resp) => {
  try {
    const conn = await pool.getConnection();
    const recordset = await conn.execute(
      `DELETE FROM foodblog.foodblogpost WHERE id = ?`,
      [req.body.blogPostId]
    );

    conn.release();
    resp.status(200).send({ message: recordset[0] });
  } catch (error) {
    resp.status(500).send({ message: error });
  }
});

// FOOD PICTURE

// POST FOOD PICTURE
app.post("/foodblogpic", authorizeUser, async (req, resp) => {
  try {
    if (!req.body.s3uuid || !req.body.foodblogpost) {
      resp.status(400).send({ message: "Missing parameters" });
    }
    const conn = await pool.getConnection();
    const queryResponse = await conn.execute(
      `INSERT INTO foodblog.foodblogpic (s3uuid, description, foodblogpost) VALUES (?, ?, ?)`,
      [
        req.body.s3uuid,
        req.body.description ? req.body.descriptions : null,
        req.body.foodblogpost,
      ]
    );
    conn.release();
    resp.status(200).send({ message: queryResponse });
  } catch (error) {
    resp.status(500).send({ message: error });
  }
});

// GET ALL FOOD PICTURES
app.get("/foodblogpics", authorizeUser, async (req, resp) => {
  try {
    const conn = await pool.getConnection();
    const recordset = await conn.execute(`SELECT * FROM foodblog.foodblogpic`);

    conn.release();
    resp.status(200).send({ message: recordset[0] });
  } catch (error) {
    resp.status(500).send({ message: error });
  }
});

function authorizeUser(req, resp, next) {
  // // if (req.query.secret != "supersecret") {
  // //   resp.status(403).send("");
  // }
  next();
}

// app.listen(PORT, () => console.log(`server is running on port ${PORT}`));

module.exports.handler = serverless(app);
