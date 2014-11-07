var mongoose 	= require('mongoose');
var Schema		= mongoose.Schema;

// // Specify the data in this model
// var UserSchema = new Schema({
// 	_id: String,
// 	online: Boolean,
// 	messages: [{type: Schema.Types.ObjectId, ref: 'Message'}]
// });

var UserSchema = new Schema({
	fullname: String,
	username: String,
	passwordhash: String,
	email: String,
	token: String
});

// Export the model by name and schema
module.exports = mongoose.model('User', UserSchema);
