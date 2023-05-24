const express = require("express");
const router = express.Router();
const   {OpenAi}  = require("../../../controllers/generative-ai/text/textController");
const  asyncHandler  =  require("../../../middlewares/asyncErrorHandler");

router.post("/text/openai", asyncHandler(OpenAi)) 

module.exports =  router;