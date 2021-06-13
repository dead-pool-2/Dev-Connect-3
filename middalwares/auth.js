const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function(req,res,next){
    const token = req.header('x-auth-token');

    if(!token){
        res.status(401).json({msg : "No token, authorization denied!"});
    }
    try{
       //verify token
       const decoded = jwt.verify(token,config.get('jwtSecret'));
       req.user = decoded.user;
       console.log(req.user)
       next();
    }catch(err){
       res.status(401).json({
       msg :'Token is not Valid!1'
       });
    };
};