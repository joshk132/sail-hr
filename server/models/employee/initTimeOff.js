var mongoose = require("mongoose");


var initTimeOffSchema = new mongoose.Schema({
    vacation: Number,
    sick: Number,
    personal: Number,
    breavement: Number,
    juryDuty: Number,
    shortTermDisability: Number,
    longTermDisability: Number,
    comp: Number, // used in place of paid OT
    military: Number,
    emergency: Number,
    communitySerivce: Number,
    convention: Number,
    patLeave: Number,
    matLeave: Number,
    custom: Number,
    
});


module.exports = mongoose.model("initTimeOff", initTimeOffSchema);