const express = require("express");
const router = express.Router();
const   { WhisperAi, DeepGramAi, AssemblyAi }  = require("../../../controllers/generative-ai/voice/voiceController");
const  asyncHandler  =  require("../../../middlewares/asyncErrorHandler");
const upload = require("../../../middlewares/multeraudio");

router.post("/voice/whisperai", upload , asyncHandler(WhisperAi))
router.post("/voice/deepgramai", asyncHandler(DeepGramAi))
router.post("/voice/assemblyai", upload , asyncHandler(AssemblyAi))

module.exports =  router;