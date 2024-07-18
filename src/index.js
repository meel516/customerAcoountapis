const express = require("express");
const { resolve } = require("path");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const cors = require("cors");

const uri =
  "mongodb+srv://mdsaleem516:a4dtNSbNPV1KOFHh@cluster0.npkfbjc.mongodb.net/test-db?retryWrites=true&w=majority";
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Get the connection instance
const db = mongoose.connection;

// Listen for connection events
db.on("error", console.error.bind(console, "Connection error:"));
db.once("open", () => {
  console.log("Connected successfully to MongoDB using Mongoose");

  const app = express();
  const port = 3020;

  app.use(express.static("static"));
  app.use(cors);

  app.get("/", (req, res) => {
    res.send("hi saleem");
  });

  app.get("/api/customers/accounts/:customerId", async (req, res) => {
    const customerId = req.params.customerId;
    console.log(customerId);
    try {
      const pipeline = [
        {
          $match:
            /**
             * query: The query in MQL.
             */
            {
              _id: new ObjectId(customerId),
            },
        },
        {
          $unwind: {
            path: "$accounts",
          },
        },
        {
          $lookup: {
            from: "accounts",
            localField: "accounts",
            foreignField: "account_id",
            as: "account_details",
          },
        },
        {
          $unwind: {
            path: "$account_details",
          },
        },
        {
          $group: {
            _id: "$_id",
            username: {
              $first: "$username",
            },
            account_details: {
              $push: "$account_details",
            },
          },
        },
      ];

      const result = await db
        .collection("customers")
        .aggregate(pipeline)
        .toArray();

      console.log(result);
      res.json(result);
    } catch (err) {
      console.error("Error running aggregation:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app.get("/api/getcustomers", async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 10;
    const skip = (page - 1) * size;
    try {
      const pipeline = [{ $skip: skip }, { $limit: size }];

      const result = await db
        .collection("customers")
        .aggregate(pipeline)
        .toArray();

      console.log(result);
      res.json(result);
    } catch (err) {
      console.error("Error running aggregation:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  });
}); // Make sure to close the db.once event listener properly
