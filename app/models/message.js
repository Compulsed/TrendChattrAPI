var mongoose 	= require('mongoose');
var Schema		= mongoose.Schema;

// Specify the data in this model
var MessageSchema = new Schema({
	chatroom: {type: String, ref: 'Chatroom'},
	username: {type: String, ref: 'User'},
	message: String,
	sent: {type: Date, default: Date.now}
});

// Export the model by name and schema
module.exports = mongoose.model('Message', MessageSchema);