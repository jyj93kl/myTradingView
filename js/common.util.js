const CommonUtil = {
	jsonAJax: function (type, url, header, requestData, callback){
		if(requestData == null){
			requestData = {};
		}
		$.ajax({
		    url : url,
		    type : type,
		    headers: header,
		    contentType: 'application/json; charset=UTF-8', 
		    dataType: "json",
			crossOrigin : true,
		    data : (type == 'GET')? $.param(requestData) : JSON.stringify(requestData),
		    success : function(data) {
		    	callback(1, data);
		    },
		    error :function(request, status, error){
				console.log("==== error ====" , request);
		    }
		});
	},
};
