const express = require("express");
const analyticsController = require("../controller/analytics-controller.js");

const router = express.Router();

router.get("/get", analyticsController.getAnalytics);

module.exports = router;