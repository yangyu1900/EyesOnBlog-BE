const express = require('express');
const podController = require('../controller/pod-controller.js');

const router = express.Router();

router.get('/get', podController.getPod);

module.exports = router;