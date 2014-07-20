var mongoose 	= require('mongoose');
var Schema		= mongoose.Schema;

// Specify the data in this model
var MessageSchema = new Schema({
	trend: {type: Schema.Types.ObjectId, ref: 'Trend'},
	user: {type: Schema.Types.ObjectId, ref: 'User'},
	message: String
});

// Export the model by name and schema
module.exports = mongoose.model('Message', MessageSchema);