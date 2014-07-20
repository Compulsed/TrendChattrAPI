var mongoose 	= require('mongoose');
var Schema		= mongoose.Schema;

// Specify the data in this model
var TrendSchema = new Schema({
	source: String,
	name: String,
	lastupdated: String
	messages: [{type: Schema.Types.ObjectId, ref: 'Message'}]
});

// Export the model by name and schema
module.exports = mongoose.model('Trend', TrendSchema);