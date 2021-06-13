const express = require("express");
const morgan = require("morgan");
const connectDB = require("./config/db");
const colors = require('colors')

const app = express();
connectDB();

//middalwares
app.use(express.json({extended:false}));
app.use(morgan('dev'))

app.get('/', (req, res) => res.send('API Running'));

//route files 
app.use('/api/users',require('./routes/api/users'));
app.use('/api/auth',require('./routes/api/auth'));
app.use('/api/profile',require('./routes/api/profile'));
app.use('/api/posts',require('./routes/api/posts'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`.bgBlack.bold.italic));