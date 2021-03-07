let $Global = new Object();
window.onload = function (){
    load('../resources/modules/sharedObject.js').then(function(module){
        $Global["message"] = module.sharedObject;
        initializeApplication();
    });
}

function initializeApplication(){
    console.log("initializeApplication start");
    initializeComponent();
    initializeComponentData();
    initializeBindEvent();
}

function initializeComponent(){
    $Global["mainChart"] = new ApexCharts(document.querySelector("#chart-candlestick"), {
        series: [{ data: [] }],
        chart: { type: 'candlestick', height: 290, id: 'candles'},  
        plotOptions: { 
            candlestick: {
                colors: { upward: '#a52714', downward: '#115dcb'}
            }
        },
        xaxis: { type: 'datetime'}
    });
    $Global["mainChart"].render();

    $("#marketTable").DataTable({
        select: "single",       // select: "multiple" or "single"
        language: {
            zeroRecords: "조회된 DBMS 정보가 없습니다."
        },
        scrollY:        "calc(100vh - 145px)",	//Y축 높이값
        scrollCollapse: false,	//스크롤 고정
        paging:         false,
        lengthChange:   false,
        ordering:       true,
        searching:      true,
        autoWidth:      false,
        info:           false,
        order:          [2,"desc"],
	    columnDefs: [
	    	{ "data": "korean_name", "width": "80px", "targets": 0 , "render": function (data, type, row, meta){
                return row.korean_name;
    		}},
            { "data": "trade_price", "width": "80px", "targets": 1 , "render": function (data, type, row, meta){
                if(row.trade_price){
                    return row.trade_price;
                } else {
                    return "-";
                }
    		}},
            { "data": "signed_change_price", "width": "80px", "targets": 2 , "render": function (data, type, row, meta){
                if(row.signed_change_price){
                    return row.signed_change_price;
                } else {
                    return "-";
                }
    		}},
            { "data": "acc_trade_price_24h", "width": "80px", "targets": 3 , "render": function (data, type, row, meta){
                if(row.acc_trade_price_24h){
                    return row.acc_trade_price_24h;
                } else {
                    return "-";
                }
    		}},
	    ],
	    // rowGroup: {
        //     dataSrc: ['DBMS_NAME'],
        //     startRender: function (rows, data) {
        //     	let html = "";
        //     	data == '' ?
        // 			html = 'none (' + rows.count() + ' items)'
        // 			: html = data + ' (' + rows.count() + ' items)';
        // 		return html;
        //     }
        // },
	    initComplete: function(settings, json) {
            $('#marketTable').DataTable().on('select', function ( e, dt, type, indexes ) {
                let candleMinute = document.querySelector("#countCandleSelect").value;
	    		let candleCount = 100;
                let selectionData = dt.data();
                selectMarketData(candleMinute, selectionData.market, candleCount);
	    	}).on('deselect', function ( e, dt, type, indexes ) {
            
            });
        },
	    createdRow: function(row, rowData, dataIndex) {},
	    drawCallback: function(settings) {},
        rowCallback: function( row, data ) {
	        if (data.market.indexOf("BTC-") != -1 || data.market.indexOf("USDT-") != -1 ) {
	        	$(row).hide();
	        }
            
            if(data.change == "RISE") {
                $(row).switchClass("down","up");
            } else if(data.change == "FALL"){
                $(row).switchClass("up","down");
            } else if(data.change == "EVENT"){
                $(row).removeClass("up down");
            }
	    },
	});

}

function initializeBindEvent(){
    document.querySelector("#countCandleSelect").addEventListener("change", function(){
        if($Global["data"] != undefined){
            let selectionData = $Global["data"];
            selectMarketData(this.value, selectionData.market, 100);
        }
    });
}

function initializeComponentData(){
    serverSocket.initialize();
    bitSocket.initialize();
    selectMarketList();
    selectUniqueTicket();
    // setTimeout(function(){
        // selectSocketTicker();
    // },3000);
    // selectAccounts();
}

function sendData(socket, method, url, request, callback){
    if(callback != null){
        socket.getSocket().off(url).on(url, callback);
    }
    console.log("==== send socket ====", socket.param.desc);
    console.log("==== send method ====", method);
    console.log("==== send url ====", url);
    console.log("==== send request ====", request);
    socket.getSocket().emit(url, JSON.stringify(request));
}

/* upbit function start */
function selectUniqueTicket(){
    let request = new Object();
    sendData(serverSocket, "GET", $Global["message"].uuidv4, request, function(data){
        $Global["uniqueTicket"] = data;
    });
}

function selectMarketList(){
    let request = new Object();
    request["method"] = "GET";
    request["callUrl"] = upbitUrl.selectMarkets;
    sendData(serverSocket, "GET", $Global["message"].selectMarkets, request, function(data){
        let response = JSON.parse(data);
        createMarketTable(response.data);
    });
}

function selectMarketData(minute, market, count){
    let request = new Object();
    request["method"] = "GET";
    request["callUrl"] = dynamicUrl.selectTargetCandle + minute + "?market=" + market + "&count=" + count;
 
    sendData(serverSocket, "GET", $Global["message"].selectMarket, request, function(data){
        let response = JSON.parse(data);
        updateChart(response.data);
    });
}

function selectAccounts(){
    
    let request = new Object();
    request["method"] = "GET";
    request["callUrl"] = upbitUrl.accounts;
 
    sendData(serverSocket, "GET", $Global["message"].accounts, request, function(data){
        let response = JSON.parse(data);
        initAccounts(response.data);
    });
}

function createMarketTable(data){
    // let marketList = JSON.parse(data), table = document.querySelector(".table-tbody table");
    // let params = ["korean_name", "market", "market_warning"], tr, td;

    // for(let i = 0; i < marketList.length; i++){
    //     if(marketList[i].market.indexOf("KRW-") == -1){
    //         continue;
    //     }

    //     tr = document.createElement("tr");
    //     params.map(function(param, index){
    //         td = document.createElement("td");
    //         td.innerHTML = marketList[i][param];
    //         tr.appendChild(td);
    //     });
        
    //     tr.data = marketList[i];
    //     tr.addEventListener("click", function(){
    //       let selectionData = this.data;
    //       $Global["data"] = selectionData;
    //       this.classList.toggle("active");
    //       selectMarketData(document.querySelector("#countCandleSelect").value, selectionData.market, 100);
    //     });
    
    //     table.querySelector("tbody").appendChild(tr);
    // }

    // let marketList = JSON.parse(data), table = document.querySelector(".table-tbody table");
    // let params = ["korean_name", "market", "market_warning"], tr, td;
    // $("#marketTable").dataTable().fnAddData(marketList);
    // $("#marketTable").DataTable().row.add(marketList);
}

function updateChart(data){
    let dataList = new Array(), linearList = new Array(), list = JSON.parse(data), date, linear;

    for(let i = (list.length-1)  ; i >= 0; i--){
      date = new Date(list[i].candle_date_time_utc)
      date.setHours(date.getHours() + 9);
      if(i == (list.length-1)){
        lastDate = date;
      }

      if(i == 0){
        firstDate = date;
      }

      dataList.push({
        x : date,
        y : [list[i].opening_price, list[i].high_price, list[i].low_price, list[i].trade_price]
      })

      linear = {};
      linear["x"] = date;
      linear["y"] = ((list[i].trade_price - list[i].opening_price) < 0) ? list[i].opening_price - list[i].trade_price : list[i].trade_price - list[i].opening_price;
      linear["fillColor"] = ((list[i].trade_price - list[i].opening_price) > 0) ? '#a52714' : '#115dcb'
      linearList.push(linear);
    }
  
    $Global["mainChart"].updateSeries([{ data: dataList }], true);
}

function initAccounts(data){
    console.log(JSON.parse(data));
}
/* upbit function end */
// let reader = new FileReader();
// reader.onload = function() {
//     console.log(JSON.parse(reader.result));
// }

function selectSocketTicker(){
    // if(!bitSocket.isSocket()){
    //     bitSocket.initialize();
    // }

    var list = $("#marketTable").DataTable().rows().data().toArray();
    console.log(list);
    var arr = new Array();
    for(var i = 0; i < list.length; i++){
        if (list[i].market.indexOf("BTC-") != -1 || list[i].market.indexOf("USDT-") != -1 ) {
            continue;
        }
        arr.push(list[i].market);
    }

    // console.log(arr);

    let request = [];
    request.push({"ticket" : $Global["uniqueTicket"]});
    // request.push({"type": "ticker","codes": ["KRW-POWR"] });
    request.push({"type": "ticker","codes": arr });
    bitSocket.param.socket.send(JSON.stringify(request));

    // bitSocket.param.socket.send(JSON.stringify([ {"ticket":"test"}, {"type":"ticker","codes":["KRW-BTC"]} ]))
    // bitSocket.getSocket().onmessage = function (event){
    //     reader.readAsText(event.data);
    // }
    // bitSocket.getSocket().onmessage = function(event) {
    //     reader.readAsText(event.data);
    // }
    // [{"ticket":"UNIQUE_TICKET"},{"type":"trade","codes":["KRW-BTC","BTC-XRP"]}]
    // console.log(request);
    // bitSocket.getSocket().send(JSON.stringify(request));
    // bitSocket.getSocket().send(JSON.stringify(
    //     [ {"ticket":"test"}, {"type":"ticker","codes":["KRW-BTC"]} ]
    // )
    // );
}


function changePrice(market){
    let coin = $("#marketTable").DataTable().row(function ( idx, data, node ) {return (data.market == market.code) ? true : false;});
    let index = coin.index();
    let data = coin.data();
    market["korean_name"] = data.korean_name;
    market["market"] = data.market; 
    console.log("test");
    $("#marketTable").DataTable().row( index ).data( market ).draw(false);
    // cTable.row(someId).data( newData ).draw();
    // var market = {
    //     code: "KRW-BTC"
    // }
    // $("#marketTable").DataTable().rows(function ( idx, data, node ) {return (data.market == market.code) ? true : false;}).data().toArray();

	// $("#marketTable").dataTable().fnUpdate(selectionData, $("#selectedListenerTable tr.selected"), undefined, false);
}

/*
ticket  : uniqueId
type    : ticker : 현재가, 체결 : trade, 호가 : orderbook
codes   : Uppercase field name 
*/
// type	수신할 시세 타입.
// (현재가 -> ticker
// 체결 -> trade,
// 호가 ->orderbook)	String	O
// codes	수신할 시세 종목 정보.
// 주의 : codes 필드에 명시되는 종목들은 대문자로 요청해야 합니다.	List	O
// isOnlySnapshot	시세 스냅샷만 제공	Boolean	X
// isOnlyRealtime	실시간 시세만 제공	Boolean	X

// u_socket.js:33 Uncaught DOMException: Failed to execute 'postMessage' on 'Worker': MessageEvent object could not be cloned