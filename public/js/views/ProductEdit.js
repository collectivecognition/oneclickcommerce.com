ProductEditView = Backbone.View.extend({
	el: "#product-edit",
	
	model: new Product(),
	
	initialize: function(){
		Backbone.Validation.bind(this, {
			valid: function(view, attr){
				var group = view.$el.find("." + attr + "-group");
				group.removeClass("error");
				group.find(".help-inline").hide();	
			},
			
			invalid: function(view, attr, err){
				var group = view.$el.find("." + attr + "-group");
				group.addClass("error");
				group.find(".help-inline").html(err);
				group.find(".help-inline").show();
			}
		});
		
		this.listenTo(this.thumbs, "add", this.addThumb);
		this.listenTo(this.model, "change", this.format);
		
		// Rate limited simulation of change events on inputs
		// Handle copy/paste, deletion, etc..
		var vals = {}, scope = this;
		setInterval(function(){
			$.each(scope.$("input"), function(a, e){
				var now = new Date().getTime();
				var then = $(e).data("lastChanged") || 0;
				if(now - then > 1000){
					var id = $(e).attr("id");
					var val = $(e).val();
					if(val !== vals[id])
						$(e).change();
					vals[id] = val;
					$(e).data("lastChanged", now);
				}
			});
		}, 100);
		
		// Set initial map location to current city using HTML5 geolocation API and the Google geocoder API
		var scope = this;
		if(navigator && navigator.geolocation){
			navigator.geolocation.getCurrentPosition(function(pos){
				if(!$("#address").val() && !$("#address").is(":focus")){
					var geocoder = new google.maps.Geocoder();
					if(geocoder){
						var latLng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
						geocoder.geocode({latLng: latLng}, function(res, status){
							if(status == google.maps.GeocoderStatus.OK && res){
								$("#address").val(res[0].formatted_address);
								scope.updateMap(true);
							}
						});
					}
				}
			}, 
			
			function(err){},
			
			{
				enableHighAccuracy: false,
				timeout: 10000,
				maximumAge: Math.Infinity
			});
		}
	},
	
	render: function(){},
	
	events: {
		"submit form": "sell",
		// "blur input": "check",
		// "blur textarea": "check",
		"click #upload-link": "upload",
		"change": "updateMap"
	},
	
	thumbs: new Thumbs,
	
	upload: function(){
		var scope = this;
		filepicker.pickMultiple({
			mimetypes: ["image/*"],
			services: ["COMPUTER"]
		},function(files){
			for(var f in files){
				var img = $("<img>");
				var url = files[f].url;
				img.addClass("thumbnail");
				img.attr("src", url);
				scope.thumbs.add({url: url});
			}
		});	
	},
	
	check: function(e){
		if(e) e.preventDefault();
		var data = {
			price: $("#price").val(),
			description: $("#description").val(),
			email: $("#email").val(),
			address: $("#address").val(),
			images: null // Hack to get around backbone-validation not liking arrays
		}
		this.model.set(data);
		var valid = this.model.isValid(true);
		this.model.set({images: this.thumbs});
		return valid;
	},
	
	sell: function(e){
		e.preventDefault();
		if(this.check(e)){
			this.model.save(null, {
				success: function(model, res, opt){
					// FIXME Backbone.history.navigate("#product/" + res.id);
					window.location = "/product/" + res.id;
				},
				
				error: function(model, xhr, opt){
					// FIXME
				}
			});

		}
	},
	
	addThumb: function(thumb){
		var view = new ThumbView({model: thumb});
		this.$("#thumbs").append(view.render().el);
	},
	
	format: function(){
		var num = this.model.attributes.price / 1;
		if(!isNaN(num)){
			this.model.attributes.price = new Number(num).toFixed(2);
			this.$("#price").val(this.model.attributes.price);
		}
	},
	
	lastUpdate: new Date().getTime(),
	
	updateMap: function(force){
		var now = new Date().getTime();
		if(now - this.lastUpdate > 2000 || force){
			address = encodeURI($("#address").val());
			if(address.length > 5){
				var url = "http://maps.googleapis.com/maps/api/staticmap?center=" + address + "&zoom=13&size=410x150&maptype=roadmap&sensor=false";
				this.$("#map").attr("src", url);
				this.$("#map").addClass("loading");
			}else{
				this.$("#map").removeClass("loading");
			}
		}
		lastUpdate = now;
		/*
		$.getJSON("/geocode", {address: $("#address").val()}, function(data, status, xhr){
			console.log(data);
		});
		*/
	}
});