var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var nthingSchema = new Schema({
    factory:String,
    gateway:String,
    date:Date,
    humidity1:Number,
    humidity2 : Number,
    humidity3 : Number,
    humidity4 : Number,
    humidity5 : Number,
    temperature1:Number,
    temperature2:Number,
    light1 : Number,
    light2 : Number

});


var Nthing = mongoose.model("Nthing", nthingSchema);

module.exports = Nthing;