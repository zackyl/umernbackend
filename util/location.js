import axios from "axios";
import HttpError from "../models/http-error.js";
const API_KEY = process.env.GOOGLE_API_KEY;

async function getCoordsForAddress(address) {
  // NOTE This can also fail, should try catch in real application?
  const response = await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${API_KEY}`
  );
  const data = response.data;
  console.log("data before error!!!!", data);
  if (!data || data.status === "ZERO_RESULTS") {
    const error = new HttpError(
      "could not find location for the specified address",
      422
    );
    throw error;
  }
  console.log("data!!!!!!", data);

  const coordinates = data.results[0].geometry.location;
  return coordinates;
}

export default getCoordsForAddress;

// "location": {
//     "lat": 40.7069,
//     "lng": -74.0113
// },
