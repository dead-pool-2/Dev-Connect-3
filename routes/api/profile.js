const express = require("express");
const Profile = require("../../models/Profile");
const router = express.Router();
const auth = require("../../middalwares/auth");
const User = require("../../models/User");
const mongoose = require("mongoose");
const { check, validationResult } = require("express-validator");
const { findOneAndRemove, findByIdAndRemove } = require("../../models/User");
const request = require("request");
const config = require("config");

//@route    GET api/profile/me
//@desc     get current user profile
//@access   Private
router.get("/me", auth, async (req, res) => {
  try {
    console.log(req.user);

    const profile = await Profile.findOne({ user: req.user.id }).populate(
      "user",
      ["name", "avatar"]
    );
    console.log(profile.avatar);

    if (!profile) {
      return res.status(400).json({ msg: "No Profile for User is Found!!" });
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error!!");
  }
});

//@route    POST api/profile/me
//@desc     create or update user profile
//@access   Private

router.post(
  "/me",
  [
    auth,
    [
      check("status", "Status is Required!!").not().isEmpty(),
      check("skills", "Skills is Required!!").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    //check for errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      company,
      location,
      bio,
      status,
      githubusername,
      website,
      skills,
      github,
      twitter,
      instagram,
      linkedin,
      facebook,
    } = req.body;

    const profileFilds = {};
    profileFilds.user = req.user.id;
    if (company) profileFilds.company = company;
    if (website) profileFilds.website = website;
    if (location) profileFilds.location = location;
    if (status) profileFilds.status = status;
    if (githubusername) profileFilds.githubusername = githubusername;
    if (bio) profileFilds.bio = bio;

    if (skills) {
      profileFilds.skills = skills.split(",").map((skill) => skill.trim());
    }

    profileFilds.social = {};
    if (github) profileFilds.social.github = github;
    if (twitter) profileFilds.social.twitter = twitter;
    if (facebook) profileFilds.social.facebook = facebook;
    if (linkedin) profileFilds.social.linkedin = linkedin;
    if (instagram) profileFilds.social.instagram = instagram;
    console.log(profileFilds);

    try {
      let profile = await Profile.findOne({ user: req.user.id });

      if (profile) {
        //update profile'
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFilds },
          { new: true }
        );
        return res.json(profile);
      }

      //create profile
      profile = new Profile(profileFilds);
      await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error!");
    }
  }
);

//@route    GET api/profile
//@desc     get all profiles
//@access   Public

router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error!!");
  }
});

//@route    GET api/profile/user/:user_id
//@desc     get profile by user id
//@access   Public

router.get("/user/:user_id", async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate("user", ["name", "avatar"]);

    if (!profile) {
      return res.status(404).json({ msg: "Profile not found!!" });
    }
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Profile not found!!" });
    }
    res.status(500).send("Server Error!!");
  }
});

//@route     DELETE api/profile
//@desc      delete profile,user,posts
//@access    Private

router.delete("/", auth, async (req, res) => {
  try {
    //remove profile
    await Profile.findOneAndRemove({ user: req.user.id });
    //remove user
    await User.findOneAndRemove({ _id: req.user.id });

    res.json({ msg: "User Removed!!" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Profile not found!!" });
    }
    res.status(500).send("Server Error!!");
  }
});

//@route     PUT api/profile/experiance
//@desc      Add profile experiance
//@access    Private

router.put(
  "/experiance",
  [
    auth,
    [
      check("title", "Title is Required!!").not().isEmpty(),
      check("company", "Company is Required!!").not().isEmpty(),
      check("from", "From Date is Required!!").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, company, location, from, to, current, description } =
      req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      if (!profile) {
        return res.status(404).json({ msg: "Profile not found!!" });
      }
      profile.experience.unshift(newExp);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.satatus(500).send("Server Error!!");
    }
  }
);

//@route     DELETE api/profile/experiance/:exep_id
//@desc      delete profile experiance
//@access    Private

router.delete("/experiance/:exp_id", auth, async (req, res) => {
  try {
    const foundProfile = await Profile.findOne({ user: req.user.id });

    foundProfile.experience = foundProfile.experience.filter(
      (exp) => exp._id.toString() !== req.params.exp_id
    );

    await foundProfile.save();
    return res.status(200).json(foundProfile);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Server error" });
  }
});

//@route     PUT api/profile/education
//@desc      Add profile education
//@access    Private

router.put(
  "/education",
  [
    auth,
    [
      check("collage", "Collage is Required!!").not().isEmpty(),
      check("fieldofstudy", "Field of Study is Required!!").not().isEmpty(),
      check("degree", "Degree is Required!!").not().isEmpty(),

      check("from", "From Date is Required!!").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { collage, degree, fieldofstudy, from, to, current, description } =
      req.body;

    const newEdu = {
      collage,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      if (!profile) {
        return res.status(404).json({ msg: "Profile not found!!" });
      }
      profile.education.unshift(newEdu);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.satatus(500).send("Server Error!!");
    }
  }
);

//@route     DELETE api/profile/education/:edu_id
//@desc      delete profile educcation
//@access    Private

router.delete("/education/:edu_id", auth, async (req, res) => {
  try {
    const foundProfile = await Profile.findOne({ user: req.user.id });
    foundProfile.education = foundProfile.education.filter(
      (edu) => edu._id.toString() !== req.params.edu_id
    );
    await foundProfile.save();
    return res.status(200).json(foundProfile);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Server error" });
  }
});

//@route     GET api/profile/github/:username
//@desc      Add github repos
//@access    Public

router.get("/github/:username", async (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        "Github_Client_ID"
      )}&client_secret=${config.get("Github_Client_SECRET")}`,
      method: "GET",
      headers: { "user-agent": "node.js" },
    };
    request(options, (error, response, body) => {
      if (error) console.error(error);
      if (response.statusCode !== 200) {
        return res.status(404).json({
          msg: "No Github Profile Found!!",
        });
      }
      res.json(JSON.parse(body));
    });
  } catch (err) {
    console.error(err.message);
    res.satatus(500).send("Server Error!!");
  }
});

module.exports = router;
