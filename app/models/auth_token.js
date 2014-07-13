var mongoose 	= require('mongoose');
var Schema		= mongoose.Schema;

// Specify the data in this model
var AuthTokenSchema = new Schema({
	api: String,
	token: String
});

// Export the model by name and schema
module.exports = mongoose.model('AuthToken', AuthTokenSchema);