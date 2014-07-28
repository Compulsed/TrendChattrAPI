var mongoose 	= require('mongoose');
var Schema		= mongoose.Schema;

// Specify the data in this model
var ChatroomSchema = new Schema({
	source: String,
	chatroom: String,
	joined: {type: Number, default: 0},
	lastupdated: String
});

ChatroomSchema.virtual('id').get(function(){
	return this._id.toHexString();
});

// Export the model by name and schema
module.exports = mongoose.model('Chatroom', ChatroomSchema);