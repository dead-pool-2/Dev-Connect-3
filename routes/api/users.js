const express = require('express');
const router = express.Router();
const {check ,validationResult} = require('express-validator');
const User = require('../../models/User');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const normalize = require('normalize-url');

//@route    POST api/users
//@desc     Register User
//@access   Public

router.post('/',
[
check('name','Name is Required!').not().isEmpty(),
check('email','Please include a valid Email!').isEmail(),
check('password','Please enter password with 6 or more charaters').isLength({min:6})
],


 async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors : errors.array()});
    }

    const {name,email,password}= req.body;
   
    try{
        //check user is already exists
         let user = await User.findOne({email});
         if(user){
             return res.status(400).json({errors:[{msg:'User Already Exists!!'}]})
         }
        const avatar = normalize(
            gravatar.url(email, {
              s: '200',
              r: 'pg',
              d: 'mm'
            }),
            { forceHttps: true }
          );
         user = new User({
             name,
             email,
             password,
             avatar
         })

         //encrypt the pasword 
         const salt = await bcrypt.genSalt(10);
         user.password = await bcrypt.hash(password,salt)
         await user.save();

         //generate jwt token
         const payload = {
             user : {
                 id : user.id
             }
         }
         jwt.sign(payload,config.get('jwtSecret'),
         {expiresIn : 360000 },
         (err,token)=> {
             if(err) throw err;
             res.json({success:true,token})
         })

     
    }catch(err){
        console.log(err.message);
        res.status(500).send('Server Error!!')
    }
    
 });

module.exports = router;