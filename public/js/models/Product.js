if(typeof exports  !== "undefined"){
	var Backbone = require("backbone");
}

Product = Backbone.Model.extend({
	defaults: {
		price: 0.00,
		description: "",
		email: "",
		address: "",
		images: []
	},
	
	url: "/product",
	
	validation: {
		price: {
			required: true,
			pattern: "number",
			min: 0.0,
			msg: "Invalid price"
		},
		
		description: {
			required: true,
			minLength: 10,
			maxLength: 2048,
			msg: "Description must be more than 10 characters"
		},
		
		email: {
			required: true,
			pattern: "email",
			msg: "Invalid email address"
		},
		
		address: {
			required: false,
			maxLength: 128,
			msg: "Address must be less than 128 characters"
		}
	}
});

if(typeof exports  !== "undefined"){
	module.exports.Product = Product;
}