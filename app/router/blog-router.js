const express = require("express");
const blogController = require("../controller/blog-controller.js");

const router = express.Router();

router.get("/get", blogController.getBlog);

module.exports = router;