var ThumbView = Backbone.View.extend({
	tagName: "img",
	className: "thumbnail",
	
	initialize: function(){
		this.listenTo(this.model, "destroy", this.remove);
	},
	
	events: {
		"click": "clear"
	},
	
	render: function(){
		this.$el.attr("src", this.model.attributes.url);
		return this;
	},
	
	clear: function(){
		var scope = this;
		this.$el.addClass("deleted");
		setTimeout(function(){
			scope.model.destroy();
		}, 350);
	}
});