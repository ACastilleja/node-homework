const express = require("express");

const userRoutes = require("./routes/userRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const notFound = require("./middleware/not-found");
const errorHandler = require("./middleware/error-handler");
const authMiddleware = require("./middleware/auth");
const taskRouter = require("./routes/taskRoutes");
const prisma = require("./db/prisma");

const app = express();

global.user_id = global.user_id || null;
global.users = global.users || [];
global.tasks = global.tasks || [];


app.use(express.json());

app.get("/health", async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: "ok", db: "connected"});
    }catch (err) {
        res.status(500).json({ status: 'error', db: 'not connected' , error: err.message });
    }
});

app.use("/api/users", userRoutes);
app.use("/api/tasks", authMiddleware, taskRouter);
app.use("/api/analytics", authMiddleware, analyticsRoutes);

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`Server is listening on port ${port}...`);
});

let isShuttingDown = false;

const shutdown = async () => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log("Shutting down server...");
    server.close(async () => {
        
        await prisma.$disconnect();
        console.log("Prisma disconnected");
        console.log("Server closed.");
        process.exit(0);
    });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

module.exports = { app, server };
