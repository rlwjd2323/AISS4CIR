const dbConn = require('./dbConn.js');
const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: 'http://localhost:9200' });
const { PythonShell } = require('python-shell');
exports.client = client;
console.log("esConn Ok!");


//형태소 분리
exports.fnPosTagging = function(socket_id, io, message){
	var makeQuery = async function(socket_id, io, message) {

		var tokenList = [];
		try{
		const reponse = await client.indices.analyze({
			index:"korea_analyzer",
			body: {												
				"analyzer":"nori_analyzer",
				"text":message
			}
		});
		var responseList = reponse.body.tokens;
		console.log(responseList);
		for(var i=0; i<responseList.length; i++){
			var token = responseList[i].token;
			tokenList.push(token);
		}
		}catch(err){
			console.log(err);
		}
		if(tokenList.length>0){
			dbConn.fnExtractDictKeyword(socket_id, io, tokenList);
		}	
	}
	makeQuery(socket_id, io, message);
}


//키워드로 정보 검색
exports.fnSearchInfo = function(socket_id, io, keywordArray){
	
		var makeQuery = async function(socket_id, io, keywordArray) {
			var result_list = [];
			for(var i=0; i<keywordArray.length; i++){
				var dict_keyword = keywordArray[i];
				try {
					const response = await client.search({
						index:"kb_key",
						type:"tc_description",
						body: {												
							"query": {
								"match" :{
									"quest" : dict_keyword
								}
							} 
						}
					})
					for (var j=0; j<(response.body.hits.hits).length; j++){
						console.log(response.body.hits.hits[j]._source.answer);
						var answer = response.body.hits.hits[j]._source.answer;
						var quest = response.body.hits.hits[j]._source.quest;
						if (answer.length > 0){
							var obj = {
								keyword : quest,
								information : answer
							}
							result_list.push(obj);
						}else{
							console.log("검색 결과 없음");
						}
					}					
				} catch (err) {
					result_list = [];
				}
			}
			console.log(result_list);
			if(result_list.length>0){
				console.log(result_list);
				io.to(socket_id).emit('information', result_list);
				var d = new Date();
				console.log(d.getSeconds());
			}
		}
		makeQuery(socket_id, io, keywordArray);	

}



//대화 내용 삽입 function
exports.fnRegisterContent = function(conversation){
	

	var makeQuery = async function(conversation) {
	  
	  try {
		const response = await client.search({
			index:"chat_info",
			type:"contents",
			body: {}
		})
		var resList = response.body.hits.hits;
		var resList_Len = resList.length-1;
		var id = resList[resList_Len]._id;
		id = Number(id)+1;
		
		
		
		client.index({
			index:"chat_info",
			id:id,
			type:"contents",
			body:{
				"content":conversation
			}
		}, function(err, resp, status){
			var p_id = resp.body._id
			console.log("p_id : "+p_id)
			var options = {
				mode : 'text',
				pythonPath:'C:\\ProgramData\\Anaconda3\\envs\\pandas\\python.exe',
				pythonOptions:['-u'],
				scriptPath:'',
				args:[p_id]
			};
			var test = new PythonShell('python_shell.py', options);
			
				test.on('message',function(yy){
					console.log("??"+p_id);
					console.log(yy);
				});
		});
		
		
	  } catch (err) {
		console.error(err)
	  }
	}
	makeQuery(conversation);
}
