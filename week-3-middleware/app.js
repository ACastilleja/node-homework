const express = require("express");
const path = require("path");
const dogsRouter = require("./routes/dogs");
const { randomUUID } = require("crypto");

const app = express();

// Assignment 3b and 3c ask you to add middleware in this file.

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  req.requestId = randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
});

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}]: ${req.method} ${req.path} (${req.requestId})`)
  next();
});

app.use("/", dogsRouter);// Do not remove this line

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    requestId: req.requestId
  });
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.satus(statusCode).json({
    error: err.message || "Inernal Server Error",
    requestId: req.requestId
  });
});

if (require.main === module) {
  app.listen(3000, () => {
    console.log("Dog rescue app is listening on port 3000...");
  });
}

module.exports = app;

