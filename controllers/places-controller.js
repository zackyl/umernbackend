import { validationResult } from "express-validator";

import HttpError from "../models/http-error.js";
import getCoordsForAddress from "../util/location.js";
import Place from "../models/place.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import fs from "fs";

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId).exec();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not query for place id",
      500
    ); //404?
    return next(error);
  }
  if (!place) {
    const error = new HttpError(
      "Could not find a place for the provided ID",
      404
    );
    return next(error);
  }
  res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userId).populate("places");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not query for places by user id",
      500
    );
    return next(error);
  }
  if (!userWithPlaces) {
    //|| userWithPlaces.places.length === 0 not a bug?
    const error = new HttpError(
      "Could not find a place for the provided user ID",
      404
    );
    return next(error);
  }
  const places = userWithPlaces.places.map((place) =>
    place.toObject({ getters: true })
  );

  res.json({ places: places });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    // res.status() add errors in response if we want
    return next(
      new HttpError("invalid inputs passed, please check your data", 422)
    );
  }

  const { title, description, address } = req.body; // don't need creator anymore
  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }
  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    return next(new HttpError("Creating palce failed, please try agian", 500));
  }

  if (!user) {
    return next(new HttpError("Could not find user for provided ID", 404));
  }

  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: req.file.path,
    // "https://cdn.britannica.com/73/114973-050-2DC46083/Midtown-Manhattan-Empire-State-Building-New-York.jpg",
    creator: req.userData.userId,
  });

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace); // push to array?
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError("Creating place failed, please try again", 500);
    return next(error);
  }
  res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    throw new HttpError("Invalid inputs passed, please check your data", 422);
  }
  const { title, description } = req.body;

  const placeId = req.params.pid;
  let place;
  // { title, description },
  // { new: true }

  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError("Something went wrong, could not update", 500);
    return next(error);
  }
  console.log(req.userData.userId, place.creator.toString());
  if (place.creator.toString() !== req.userData.userId) {
    const error = new HttpError("You are not allowed to edit this place", 403);
    return next(error);
  }

  place.title = title;
  place.description = description;

  try {
    place = await place.save();
  } catch (err) {
    const error = new HttpError("Something went wrong, could not update", 500);
    return next(error);
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const pid = req.params.pid;
  let place;
  try {
    place = await Place.findById(pid).populate("creator");
    // place = await Place.findByIdAndDelete(pid);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete place",
      500 // 500?
    );
    return next(error);
  }
  if (!place) {
    return next(new HttpError("could not find place for this id", 404));
  }

  if (place.creator.id !== req.userData.userId) {
    const error = new HttpError("You are not allowed to edit this place", 403);
    return next(error);
  }

  const imagePath = place.image;
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({ session: sess });
    place.creator.places.pull(place);
    await place.creator.save({ session: sess }); // missed this here
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError("Something went wrong, could not delete place");
    return next(error);
  }

  fs.unlink(imagePath, (err) => {
    console.log(err);
  });

  res.status(200).json({ deleted: place });
};

export {
  getPlaceById,
  getPlacesByUserId,
  createPlace,
  updatePlace,
  deletePlace,
};
