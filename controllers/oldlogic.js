// // replaced by findOneAndUpdate
// updatePlace
// try {
//   place = await Place.findById(placeId).exec();
// } catch (err) {
//   const error = new HttpError(
//     "Something went wrong, could not query for place id you are updating",
//     500
//   ); //404?
//   return next(error);
// }

// if (!place) {
//   const error = new HttpError(
//     "Could not find a place for the provided update ID",
//     404
//   );
//   // throw error;
//   return next(error);
// }
// place.title = title;
// place.description = description;

// try {
//   await place.save();
// } catch (err) {
//   const error = new HttpError(
//     "Something went wrong, could not update. Failure during save step",
//     500
//   );
//   return next(error);
// }

// // testing populate instead
// const getPlacesByUserId = async (req, res, next) => {
//   const userId = req.params.uid;
//   let places = []; // can also have let places;
//   try {
//     places = await Place.find({ creator: userId }).exec();
//   } catch (err) {
//     const error = new HttpError(
//       "Something went wrong, could not query for places by user id",
//       500
//     );
//     return next(error);
//   }
//   if (!places || places.length === 0) {
//     const error = new HttpError(
//       "Could not find a place for the provided user ID",
//       404
//     );
//     return next(error);
//   }
//   places = places.map((place) => place.toObject({ getters: true }));

//   res.json({ place: places });
// };



// // Had to remove to be able to authenticate
// place = await Place.findByIdAndUpdate(
//   placeId,
//   { title, description },
//   { new: true }
// );