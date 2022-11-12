const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const mongoose = require("mongoose");

const Person = require("./models/Person");

const app = express();
const PORT = process.env.PORT || 80;
const MONGODB_URI = process.env.MONGODB_URI;

const mongoConnect = mongoose.connect(MONGODB_URI);

app.use(cors());
app.use(express.json());
app.use(express.static("build"));

morgan.token("body", (req) => JSON.stringify(req.body));
app.use(morgan(":method :url :status :response-time ms - :body"));

const httpCat = (code) => `<img src="https://http.cat/${code}.jpg" />`;

app.get("/api/persons", (req, res) => {
  mongoConnect.then(() => {
    Person.find({}).then((persons) => {
      res.json(persons);
    });
  });
});

app.get("/api/persons/:id", (req, res, next) => {
  const id = req.params.id;

  mongoConnect
    .then(() => {
      return Person.findById(id).then((person) => {
        if (person) {
          res.json(person);
        } else {
          res.status(404).send(httpCat(404));
        }
      });
    })
    .catch((error) => next(error));
});

app.get("/info", (req, res) => {
  const date = new Date();

  mongoConnect.then(() => {
    Person.find({}).then((persons) => {
      res.send(
        `<p>Phonebook has info for ${persons.length} people</p><p>${date}</p>`
      );
    });
  });
});

app.delete("/api/persons/:id", (req, res) => {
  const id = req.params.id;

  mongoConnect.then(() => {
    Person.findByIdAndDelete(id)
      .then(res.status(204).end())
      .catch((error) => {
        console.log(error);
        res.status(400).send({ error: "malformatted id" });
      });
  });
});

app.post("/api/persons", async (req, res) => {
  const body = req.body;

  if (!body.name || !body.number) {
    return res.status(412).send({ error: "name or number missing" });
  }

  await mongoConnect;

  const person = new Person({
    name: body.name,
    number: body.number,
  });

  if (Person.find({ name: body.name }).length > 0) {
    res.status(409).send({ error: "name must be unique" });
  }

  try {
    const savedPerson = await person.save();
    res.json(savedPerson);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

app.put("/api/persons/:id", async (req, res) => {
  const id = req.params.id;

  if (!req.body.number) {
    return res.status(412).send({ error: "number missing" });
  }

  await mongoConnect;

  try {
    const updatedPerson = await Person.findByIdAndUpdate(
      id,
      { number: req.body.number },
      { new: true, runValidators: true, context: "query" }
    );
    res.json(updatedPerson);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

const errorHandler = (error, request, response, next) => {
  console.error(error.message);

  if (error.name === "CastError") {
    return response.status(400).send({ error: "malformatted id" });
  }

  next(error);
};

// this has to be the last loaded middleware.
app.use(errorHandler);

console.log("Server running on port " + PORT);
app.listen(PORT);
