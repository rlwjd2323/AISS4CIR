const esConn = require('./esConn.js');
const express = require('express');
const mysql = require("mysql");
// 커넥션 연결
var pool = mysql.createPool({
    host: '192.168.0.237',
    post: 3306,
    user: 'sig_app',
    password: '!thffnrpdlxm23',
    database: 'SGTA_CHAT'
});
console.log("dbConn Ok");

//문장 단위에서 사전에 있는 키워드 언급여부 검색
exports.fnExtractDictKeyword = function(socket_id, io, tokenList){
	
	pool.getConnection(function(err,con){
		var inKeyword = "(";
		for(var i=0; i<tokenList.length; i++){
			token = tokenList[i];
			if(i == tokenList.length-1){
				inKeyword += "'"+token+"'";
			}else{
				inKeyword += "'"+token+"'"+",";
			}			
		}
		inKeyword += ")";
		var sql = "SELECT tc_keyword";
		sql += " tc_keyword FROM TB_TA_DICT_KEYWORD";
		sql += " WHERE tc_keyword in";
		sql += inKeyword;
		con.query(sql, tokenList, function(err,result){
			var keywordArray = [];
			for(var j=0; j<result.length; j++){
				var jo = new Object();
				keyword = result[j].tc_keyword;
				keywordArray.push(keyword);
			}
			esConn.fnSearchInfo(socket_id, io, keywordArray);
		});
	});
}




