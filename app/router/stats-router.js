const express = require("express");
const statsController = require("../controller/stats-controller.js");

const router = express.Router();

router.get("/sync", statsController.syncStats);

module.exports = router;