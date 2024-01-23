// app.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const productRoutes = require('./routes/routers');
const config = require('./database/database');
const multerMiddleware = require('./middleware/multer')
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, '/public')));

mongoose.connect(config.url, config.options)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api', productRoutes);

app.use(multerMiddleware.customErrorHandler);