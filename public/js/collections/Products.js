var Products = Backbone.Paginator.requestPager.extend({
	model: Product,
	
	paginator_core: {
		type: "GET",
		dataType: "jsonp",
		url: "/products/"
	},
	
	paginator_ui: {
		firstPage: 0,
		currentPage: 0,
		perPage: 10,
		totalPages: 10
	},
	
	server_api: {
		
	}
});