var mongoose 	= require('mongoose');
var Schema		= mongoose.Schema;

// Specify the data in this model
var TrendSchema = new Schema({
	_id: String,
	source: String,
	lastupdated: String
});

// Export the model by name and schema
module.exports = mongoose.model('Trend', TrendSchema);