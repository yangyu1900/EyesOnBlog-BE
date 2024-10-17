const express = require('express');
const userController = require('../controller/user-controller.js');

const router = express.Router();

router.post('/register', userController.registerUser);
router.get('/get', userController.getUser);

module.exports = router;