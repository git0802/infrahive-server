const express = require("express");
const router = express.Router();
const   {OpenAi , Anthropic , Cohere}  = require("../../../controllers/generative-ai/text/textController");
const  asyncHandler  =  require("../../../middlewares/asyncErrorHandler");

router.post("/text/openai", asyncHandler(OpenAi))
router.post("/text/anthropic", asyncHandler(Anthropic))
router.post("/text/cohere", asyncHandler(Cohere)) 

module.exports =  router;