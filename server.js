const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const Schema = new mongoose.Schema({
  username: String,
  count: Number,
  logs: [
    {
      description: String,
      duration: Number,
      date: Date,
    },
  ],
});
const Person = new mongoose.model("Person", Schema);

app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", async (req, res) => {
  let { username } = req.body;
  let people = new Person({ username: username, count: 0, logs: [] });
  await people.save();
  return res.json({ username: people.username, _id: people._id });
});

app.get("/api/users", (req, res) => {
  Person.find({}, async (err, data) => {
    let newData = await data.map((e) => ({ username: e.username, _id: e._id }));
    return res.json(newData);
  });
});

app.post("/api/users/:_id/exercises", async (req, res) => {
  let { description, duration, date } = req.body;
  duration = +duration;
  if (!date) date = new Date();
  let id = req.params._id;
  let person = await Person.findById(id);
  person.logs.push({
    description: description,
    duration: duration,
    date: new Date(date),
  });
  person.count = person.logs.length;
  person = await Person.findByIdAndUpdate(id, person);
  let obj = {
    _id: id,
    username: person.username,
    date: new Date(date).toDateString(),
    duration: duration,
    description: description,
  };
  return res.json(obj);
});

app.get("/api/users/:_id/logs", (req, res) => {
  let from = req.query.from ? new Date(req.query.from) : null;
  let to = req.query.to ? new Date(req.query.to) : null;
  let limit = req.query.limit;
  let id = req.params._id;
  console.log(from, to, limit,id);
  Person.findById(id, (err, d) => {
    let logs = d.logs;
    if (from) {
      logs = logs.filter((elem) => elem.date >= from);
      console.log("from");
    }
    if (to) {
      logs = logs.filter((elem) => elem.date <= to);
      console.log("to");
    }
    console.log(logs);
    logs = logs.map((e) => ({
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString(),
    }));

    let count = limit ? limit : logs.length;
    return res.json({
      _id: d._id,
      username: d.username,
      count: count,
      log: logs.slice(0, count),
      to: req.query.to,
      from: req.query.from,
    });
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
