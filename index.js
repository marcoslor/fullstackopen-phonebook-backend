const express = require("express");
const morgan = require("morgan");

const app = express();

app.use(express.json());

morgan.token("body", req => JSON.stringify(req.body));
app.use(
  morgan(
    ":method :url :status :response-time ms - :body"
  )
);

const httpCat = (code) => `<img src="https://http.cat/${code}.jpg" />`;

let phonebok = [
  {
    id: 1,
    name: "Arto Hellas",
    number: "040-123456",
  },
  {
    id: 2,
    name: "Ada Lovelace",
    number: "39-44-5323523",
  },
  {
    id: 3,
    name: "Dan Abramov",
    number: "12-43-234345",
  },
  {
    id: 4,
    name: "Mary Poppendieck",
    number: "39-23-6423122",
  },
];

app.get("/api/persons", (req, res) => {
  res.json(phonebok);
});

app.get("/api/persons/:id", (req, res) => {
  const id = Number(req.params.id);
  const person = phonebok.find((person) => person.id === id);
  if (person) {
    res.json(person);
  } else {
    res.status(404).send(httpCat(404));
  }
});

app.get("/info", (req, res) => {
  const date = new Date();
  const info = `Phonebook has info for ${phonebok.length} people <br> ${date}`;
  res.send(info);
});

app.delete("/api/persons/:id", (req, res) => {
  const id = Number(req.params.id);
  phonebok = phonebok.filter((person) => person.id !== id);
  res.status(204).end();
});

app.post("/api/persons", (req, res) => {
  const body = req.body;
  
  if (!body.name || !body.number) {
    return res.status(412).send({ error: "name or number missing" });
  }

  if (phonebok.find((person) => person.name === body.name)) {
    return res.status(409).send({ error: "name must be unique" });
  }

  const person = {
    id: Math.floor(Math.random() * 10e8),
    name: body.name,
    number: body.number,
  };
  phonebok = phonebok.concat(person);
  res.json(person);
});

console.log("Server running on port 3001");
console.log("http://localhost:3001");
app.listen(3001);
