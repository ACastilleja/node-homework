const express = require("express");
const userRoutes = require("./routes/userRoutes");
const notFound = require("./middleware/not-found");
const errorHandler = require("./middleware/error-handler");

const app = express();

global.user_id = global.user_id || null;
global.users = global.users || [];
global.tasks = global.tasks || [];


app.use(express.json());

app.use("/api/users", userRoutes);
app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`Server is listening on port ${port}...`);
});


module.exports = { app, server };
