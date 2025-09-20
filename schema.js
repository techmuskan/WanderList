// schema.js
const Joi = require("joi");

const categories = [
  "Trending",
  "Rooms",
  "Iconic Cities",
  "Mountains",
  "Castles",
  "Arctic Pools",
  "Camping",
  "Farms",
  "Snow",
  "Desserts",
  "Beachfront",
  "Tiny Homes"
];

module.exports.listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    price: Joi.number().min(0).required(),
    location: Joi.string().required(),
    country: Joi.string().required(),
    category: Joi.string().valid(...categories).required(), // ✅ add this
    image: Joi.object({
      url: Joi.string().uri().allow('').optional()
    }).optional()
  }).required()
});

module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().required()
  }).required()
});
