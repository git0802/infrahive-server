const express = require("express");
const router = express.Router();
const   {Imgdalle , Imgdream}  = require("../../../controllers/generative-ai/image/imageController");
const  asyncHandler  =  require("../../../middlewares/asyncErrorHandler");

router.post("/image/dalle", asyncHandler(Imgdalle))
router.post("/image/dream", asyncHandler(Imgdream))

module.exports =  router;