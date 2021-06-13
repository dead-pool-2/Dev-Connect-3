const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name : {
        type : String,
        required : [true,'Please,add name!']
    },
    email : {
        type : String,
        required : [true,'Please,add email!'],
        unique : true
    },
    password : {
        type : String,
        required : [true,'Please,add password!']
    },
    avatar : {
        type : String
    },
    date : {
        type : Date,
        default : Date.now 
    }
});

module.exports =  mongoose.model('user',UserSchema)

