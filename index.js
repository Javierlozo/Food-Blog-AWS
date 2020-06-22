require("dotenv").config();
const express = require("express");
const sql = require("mysql2/promise");
const cors = require("cors");
const { response, request } = require("express");

const PORT = 4000;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const pool = sql.createPool({
  host: process.env.AWS_HOST,
  user: process.env.AWS_USER,
  password: process.env.AWS_PASSWORD,
});

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

// GET ALL TABLES
app.get("/everything", authorizeUser, async (req, resp) => {
  try {
    const conn = await pool.getConnection();
    const recordset = await conn.execute(
      `SELECT * FROM foodblog.foodblogpic pics 
      JOIN foodblog.foodblogpost posts 
      ON pics.foodblogpost = posts.id
      JOIN foodblog.user users
      ON posts.username = users.username`
    );

    conn.release();
    resp.status(200).send({ message: recordset[0] });
  } catch (error) {
    resp.status(500).send({ message: error });
  }
});

// GET ONE FOOD BLOG POST
app.get("/foodblogpic", authorizeUser, async (req, resp) => {
  try {
    const conn = await pool.getConnection();
    const recordset = await conn.execute(
      `SELECT * FROM foodblog.foodblogpic WHERE fooblogpostId = ?`,
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

function authorizeUser(req, resp, next) {
  next();
}

app.listen(PORT, () => console.log(`server is running on port ${PORT}`));
