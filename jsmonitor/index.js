var fs=require('fs');
request_json = require('request-json');
require('console-stamp')(console, 'HH:MM:ss');
const express = require("express");
const app = express();
const cors=require('cors');

var node_status_buffer      = [];
var node_statistics_buffer  = [];
var total_node_number       = 0;
var node_num                = 0;
var api_response            = [];

//DEFINE NETWORK NODES

var nodesStat = 
	[
		["https://node.infinium.space/"],
		["http://m2pool.eu:27855/"]
    ];

//////////////////////

//DEFINE API PORT/////

var api_port=5003;

//////////////////////

app.listen(api_port, () => console.log("Api started at port",api_port)); //set api port

app.use(express.static('public'));
app.use(cors());
app.get('/', infoPage);
app.get('/getinfo', NodesApi);


function getNodeStats(url, num_of_node)
{
    var client_json_rpc = request_json.createClient(url);
    client_json_rpc.post('/json_rpc', { "jsonrpc": "2.0", "id": "test", "method": "get_status" }, function (err, res, body){
		if (err == null) {
            console.log("reading get_status from "+ url +" [\x1b[32mOK\x1b[0m]");
            node_status_buffer[num_of_node] = body.result;
            client_json_rpc.post('/json_rpc', { "jsonrpc": "2.0", "id": "test", "method": "get_statistics" }, function (err, res, body2){
        		if (err == null) {
                    console.log("reading get_statistics from "+ url +" [\x1b[32mOK\x1b[0m]");
                    node_statistics_buffer[num_of_node] = body2.result;
		        }
		        else {
			        console.log("reading get_statistics from "+ url +" [\x1b[31mERROR\x1b[0m]");
			    console.log(error);
                }
	        }).on("error", (err) => {
                console.log("Error: " + err.message);
            });
		}
		else {
			console.log("reading get_status from "+ url +" [\x1b[31mERROR\x1b[0m]");
			console.log(error);
        }
	}).on("error", (err) => {
        console.log("Error: " + err.message);
    }); 
}

function getNodes() {
    node_num=0;
    nodesStat.forEach(function (node){
        console.log(node[0]);
        var node_ip = node[0];
        getNodeStats(node_ip,node_num)
        node_num++;
    })
    total_node_number = node_num;
}

var t;

function Asemble_Api_Resonse(){
    console.log("total node number: "+total_node_number);
    for (var i = 0; i < total_node_number; i++){
        var json_data;
        console.log(node_status_buffer[i]);
        json_data = JSON.stringify({
            is_available: true,
            node_ip: nodesStat[i],
            height: node_status_buffer[i].top_block_height,
            top_block_hash: node_status_buffer[i].top_block_hash,
            start_time: node_statistics_buffer[i].start_time,
            version: node_statistics_buffer[i].version
        });
        api_response[i] = json_data;
    }
}

function infoPage(request, response) {
    response.send('N/A');
}

function NodesApi(request, response) {
    if(request.headers.node_num>(total_node_number-1))
    {
        response.send(JSON.stringify({
            is_available: false
        }));
    }
    else
    {
        response.send(JSON.parse(''+api_response[request.headers.node_num]));
    }
}

getNodes();

//getNodeStats("https://node.infinium.space:443",0);

setTimeout(function() {
        //console.log(node_status_buffer);
        Asemble_Api_Resonse();
        //console.log(node_status_buffer[1]);
	}, 1000);