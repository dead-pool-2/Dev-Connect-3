const mongoose = require('mongoose');
const colors = require('colors');
const config = require('config');
const db = config.get('mongoURI')




const connectDB = async() => {
   
   const conn = await mongoose.connect(db,{
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify : false,
    useUnifiedTopology: true

});
console.log(`MongooDB Connected: ${conn.connection.host} !!!`.green.underline.bold.italic)
}

module.exports = connectDB;