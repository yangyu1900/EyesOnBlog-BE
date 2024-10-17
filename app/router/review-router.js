const express = require("express");
const reviewController = require("../controller/review-controller.js");

const router = express.Router();

router.post("/request", reviewController.requestReview);

module.exports = router;