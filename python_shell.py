import sys
from elasticsearch import Elasticsearch
from eunjeon import Mecab
import json

tagger = Mecab()


# content 가져와서 형태소 분리후 insert	
def ES_search(id):
	print("아이디 : ***************")
	print(id)
	
	es = Elasticsearch("localhost:9200")	
	
	body = {
		"query": {
			"match": {
				"_id": id
			}
		}
	}
	results = es.search(index='chat_info', body=body)
	print(results);
	
	if (results['hits']['hits'] != [] ):
		print("ggg")
		content = results['hits']['hits'][0]['_source']['content']
		
		for i in range(len(content)):
			user = 1
			sentence = content[i]["line"]
			counsel_date = content[i]["counsel_date"]
			j_body = {
				"analyzer": "nori_analyzer",
				"text": sentence
			}
			token = es.indices.analyze(index='korea_analyzer', body=j_body)
			res = token['tokens']
			print("----------")
			for j in range(len(res)):
				keyword = res[j]['token']
				if len(keyword)>1:
					print(keyword);
					body_insert = {
						"count" : int(user),
						"keyword": keyword,
						"counsel_date" : str(counsel_date)
					}
					posr = es.index(index='chat_pos', doc_type='pos_list', body=body_insert)
					print(posr)
if __name__ == "__main__" :
	id = sys.argv[1]
	print(id + ' : 아이디는')
	ES_search(id)

