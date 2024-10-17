require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const statsRouter = require('./app/router/stats-router');
const blogRouter = require('./app/router/blog-router');
const userRouter = require('./app/router/user-router');
const reviewRouter = require('./app/router/review-router');
const analyticsRouter = require('./app/router/analytics-router');
const podRouter = require('./app/router/pod-router');
const path = require('path');

const statsController = require('./app/controller/stats-controller');

const port = process.env.PORT || 8000;

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

app.use('/api/stats', statsRouter);
app.use('/api/blog', blogRouter);
app.use('/api/user', userRouter);
app.use('/api/review', reviewRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/pod', podRouter);

app.use('/', express.static(path.join(__dirname, './www')));

setInterval(async () => {
    await statsController.syncStats();
}, 1000 * 60 * 60);

app.listen(port, '0.0.0.0');