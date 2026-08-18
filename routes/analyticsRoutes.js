const express = require("express");
const router = express.Router();

const {
    getUserAnalytics,
    getUsersAnalytics,
    searchTasks,
} = require("../controllers/analyticsController");

router.get("/users/:id", getUserAnalytics);
router.get("/users", getUsersAnalytics);
router.get("/tasks/search", searchTasks);

module.exports = router;