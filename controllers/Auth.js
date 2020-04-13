const User = require("../models/User");
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array()[0].msg,
    });
  }

  const { name, email, password } = req.body;
  try {
    //isUser exist Validation
    let user = await User.findOne({
      email,
    });
    if (user) {
      return res.status(400).json({
        msg: "User Already Exists with this email",
      });
    }

    //start saving to the database
    user = new User({
      name,
      email,
      password,
    });

    //hashing the password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    //data saved
    await user.save();

    res.json({
      name: user.name,
      email: user.email,
      id: user._id,
    });
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Error in Saving");
  }
};

exports.login = async (req, res) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array()[0].msg,
    });
  }
  //  destructor the email and password
  const { email, password } = req.body;

  // find user in DB
  try {
    let user = await User.findOne({
      email,
    });

    // if user not found
    if (!user)
      return res.status(400).json({
        message: "User Not Exist",
      });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({
        message: "Incorrect Password !",
      });

    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.SECRETE,
      {
        expiresIn: 999999,
      },
      (err, token) => {
        if (err) throw err;

        // send response to frontend
        res.status(200).json({
          token,
        });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Server Error",
    });
  }
};
