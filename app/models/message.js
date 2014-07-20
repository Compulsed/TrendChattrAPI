var mongoose 	= require('mongoose');
var Schema		= mongoose.Schema;

// Specify the data in this model
var MessageSchema = new Schema({
	trend: {type: String, ref: 'Trend'},
	user: {type: String, ref: 'User'},
	message: String,
	sent: {type: Date, default: Date.now}
});

// Export the model by name and schema
module.exports = mongoose.model('Message', MessageSchema);