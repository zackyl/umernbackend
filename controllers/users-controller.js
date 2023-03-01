import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import HttpError from "../models/http-error.js";
import User from "../models/User.js";

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}, "-password"); // get all fields except password, also User.find({}, "email name");

    res.json({ users: users.map((user) => user.toObject({ getters: true })) });
  } catch (err) {
    return next(
      new HttpError("Fetching users failed, please try again later", 500)
    );
  }
};

const createUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(
      new HttpError("Invalid inputs passed, please check you data"),
      500
    );
  }

  const { name, email, password } = req.body;
  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (err) {
    return next(
      new HttpError("Signing up failed, please try again later"),
      500
    );
  }
  if (existingUser) {
    return next(
      new HttpError("User exists already, please login instead", 422) // can also decide whether we should expose this
    );
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12); // also has hashsync
  } catch (err) {
    const error = new HttpError("could not create user, please try again", 500);
    return next(error); // needd to return
  }

  const createdUser = new User({
    name,
    email,
    image: req.file.path,
    password: hashedPassword, // TODO encrypt
    places: [],
  });

  try {
    createdUser.save();
  } catch (error) {
    return next(new HttpError("Signing up failed, please try again", 500));
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    return next(new HttpError("Signing up failed, please try again", 500));
  }

  res
    .status(201)
    .json({ userId: createdUser.id, email: createdUser.email, token });
};

const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (err) {
    return next(
      new HttpError("Logging in failed, please try again later"),
      500
    );
  }

  if (!existingUser) {
    return next(
      new HttpError(
        "Could not identify user, credentials seem to be wrong",
        401
      )
    );
  }

  let isValidPassword = false;
  try {
    isValidPassword = bcrypt.compare(password, existingUser.password); // also has hashsync
  } catch (err) {
    const error = new HttpError(
      "Could not validate password, please try again",
      500
    );
    return next(error); // again, need to return
  }

  if (!isValidPassword) {
    return next(
      new HttpError(
        "Could not identify user, credentials seem to be wrong",
        401
      )
    );
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (err) {
    return next(new HttpError("Signing up failed, please try again", 500));
  }

  res.json({ userId: existingUser.id, email: existingUser.email, token });
};

export { getAllUsers, createUser, loginUser };
