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

    /* sort Create */
    // let sortMarket = document.querySelectorAll(".right-wrapper .table-thead table thead tr th");
    // sortMarket[0].addEventListener("click", function(e){
    //     let table = document.querySelector(".right-wrapper .table-tbody table");
    //     let replace = replacement( table ); 
    // });
    // let replace = replacement( document.querySelector(".right-wrapper .table-tbody table") ); 
    // function sortTD( index ){    {
    //     replace.ascending( index );   
    // } 
    // function reverseTD( index ){    replace.descending( index );    } 

}

function initializeBindEvent(){
    document.querySelector("#countCandleSelect").addEventListener("change", function(){
        if($Global["data"] != undefined){
            let selectionData = $Global["data"];
            selectMarketData(this.value, selectionData.market, 100);
        }
    });
    document.querySelector("#resetStandardBtn").addEventListener("click", function(){
        saveMarket();
    });
}

function initializeComponentData(){
    serverSocket.initialize();
    bitSocket.initialize();
    selectMarketList();
    selectUniqueTicket();
    setTimeout(function(){
        selectSocketTicker();
    }, 2000);
    setTimeout(function(){
        saveMarket();
    }, 3000);
    setInterval(function(){
        changeMarket();
    }, 5000);
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
    let marketList = JSON.parse(data), table = document.querySelector(".right-wrapper .table-tbody table");

    for(let i = 0; i < marketList.length; i++){
        if(marketList[i].market.indexOf("KRW-") == -1){
            continue;
        }

        tr = createMarketRow(marketList[i]);
        tr.dataset.market = marketList[i].market;
        tr.data = marketList[i];

        tr.addEventListener("click", function(){
            let selectionData = this.data;
            $Global["data"] = selectionData;
            this.classList.toggle("active");
            document.querySelector("#chart-candlestick").data = selectionData.code;
            selectMarketData(document.querySelector("#countCandleSelect").value, selectionData.code, 100);
        });
    
        table.querySelector("tbody").appendChild(tr);
    }

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

function selectSocketTicker(){
    // if(!bitSocket.isSocket()){
    //     bitSocket.initialize();
    // }

    let list = document.querySelectorAll("[data-market]"),array = new Array();
    list.forEach(function(elem, idx){ array.push(elem.data.market) });

    let request = [];
    request.push({"ticket" : $Global["uniqueTicket"]});
    request.push({"type": "ticker","codes": array });
    bitSocket.param.socket.send(JSON.stringify(request));
}

function changePrice(market){
    let marketNode = document.querySelector("[data-market='" + market.code + "']");
    switch(market.change){
        case "RISE" : marketNode.classList = "up"; break;
        case "FALL" : marketNode.classList = "down"; break;
        case "EVENT" : marketNode.classList = ""; break;
    }
    
    let tmp = marketNode.data;
    market["korean_name"] = tmp.korean_name;
    marketNode.data = market;
    marketNode.querySelector(".price>strong").innerHTML = market.trade_price;
    marketNode.querySelector(".price>strong").innerHTML = market.trade_price;
    marketNode.querySelector(".change>p").innerHTML = (market.signed_change_price > 0) ? "+" + new Number(market.signed_change_rate * 100).toFixed(2)+"%" : new Number(market.signed_change_rate).toFixed(2) +"%";
    marketNode.querySelector(".change>em").innerHTML = market.signed_change_price;
    marketNode.querySelector(".price24>p").innerHTML = Math.round(market.acc_trade_price_24h / 1000000).toLocaleString() +"??????";
    
    if(document.querySelector("#chart-candlestick").data == market.code) {
        console.log("update");
    }
}

// 30????????? ?????? ????????????
// 1. 30??? ?????? snapshot?????? ?????? ?????? ????????? 2?????? ??????????????? ?
$Global["rise_market"] = new Object();
function saveMarket(){
    let markets = new Object();
    let tData = $(document.querySelectorAll(".right-wrapper .table-tbody table tr"));
    tData.each(function(idx, elem){
        elem.data["start_time"] = new Date();
        elem.data["start_change_rate"] = new Number(elem.data.signed_change_rate).toFixed(2) 
        markets[elem.data.code] = elem.data;
    });

    $Global["rise_market"] = markets;
    console.log("saveMarket Complete");
}
function isPositive(num) {
    return num >= 0;
}

function changeMarket(){
    let tData = $(document.querySelectorAll(".right-wrapper .table-tbody table tr"));
    let standard;
    let start;
    let change;
    tData.each(function(idx, elem){
        standard = $Global["rise_market"][elem.data.code];
        // ????????? ??????????????? ?????????? ???????????? 
        // ??????(??????) ??????(??????) ?????? - ??????
        // ??????(??????) ??????(??????) ?????? - ?????? 
        // ??????(??????) ??????(??????) ?????? - ??????
        // ??????(??????) ??????(??????) ?????? - ??????
        // ??? ???
        // ??? ???
        // ??? ???
        // ??? ???
        start = new Number(standard.start_change_rate);
        change = new Number(elem.data.signed_change_rate);
        if(isPositive(start) && isPositive(change)){
            standard["now_change_rate"] = change - start;
        } else if(isPositive(start) && !isPositive(change)){
            standard["now_change_rate"] = start + change;
         } else if(!isPositive(start) && isPositive(change)){
            standard["now_change_rate"] = change + start;
        } else if(!isPositive(start) && !isPositive(change)){
            standard["now_change_rate"] = (start - change) * -1;
        }
        // console.log(standard["now_change_rate"]);
        // if(!isPositive(elem.data.signed_change_rate) && !isPositive(standard.start_change_rate)){   // ?????? ?????? 
        //     standard["now_change_rate"] = standard.start_change_rate - -elem.data.signed_change_rate;
        // } else {
        //     standard["now_change_rate"] = elem.data.signed_change_rate - standard.start_change_rate;
        // }
        
        standard["now_signed_change_rate"] = elem.data.signed_change_rate;
        $Global["rise_market"][elem.data.code] = standard;
    });
    let market;
    $("#upTable tbody").empty();
    Object.keys($Global["rise_market"]).map(function(key,elem){
        market = $Global["rise_market"][key];
        $("#upTable tbody").append(createRiseMarketRow(market));
    });

     /* sort Create */
    let replace = replacement( document.querySelector("#upTable") ); 
    replace.descending( 3 ); 
}

function createRiseMarketRow(row){
    let tr,td;

    tr = document.createElement("tr");
    tr.classList = (row.now_change_rate > 0) ? "up" : "down";

    td = document.createElement("td");
    td.innerHTML = row.korean_name +"(" + row.code + ")";
    tr.appendChild(td);

    td = document.createElement("td");
    td.innerHTML = new Number(row.start_change_rate* 100).toFixed(2);
    tr.appendChild(td);
    
    td = document.createElement("td");
    td.innerHTML = new Number(row.now_signed_change_rate* 100).toFixed(2);
    tr.appendChild(td);

    td = document.createElement("td");
    td.innerHTML = new Number(row.now_change_rate* 100).toFixed(2);
    tr.appendChild(td);

    td = document.createElement("td");
    td.innerHTML = "-";
    tr.appendChild(td);

    return tr;
}

function createMarketRow(row){
    let tr,td,a,em,p,strong;

    tr = document.createElement("tr");
    // <td>
    //     <a href="#"><strong>??????</strong></a>
    //     <em>KRW-XRP</em>
    // </td>
    td = document.createElement("td");
    td.classList = "title";
    a = document.createElement("a");
    a.href="#";
    strong = document.createElement("strong");
    strong.innerHTML = row.korean_name;
    a.appendChild(strong);
    td.appendChild(a);

    em = document.createElement("em");
    em.innerHTML = row.market;
    td.appendChild(em);

    tr.appendChild(td);
    // <td class="price">
    //     <strong>15.00</strong>
    //     <span class=""></span>
    // </td>
    td = document.createElement("td");
    td.classList = "price";
    strong = document.createElement("strong");
    strong.innerHTML = "-";
    td.appendChild(strong);
    tr.appendChild(td);
    // <td class="percent">
    //     <p>-14.77%</p>
    //     <em>-2.60</em>
    // </td>
    td = document.createElement("td");
    td.classList = "change";
    p = document.createElement("p");
    p.innerHTML = "-";
    em = document.createElement("em");
    em.innerHTML = "-";
    td.appendChild(p);
    td.appendChild(em);
    tr.appendChild(td);
    // <td class="rAlign">
    //     <p>17,968<i>??????</i></p>
    // </td>
    td = document.createElement("td");
    td.classList = "price24";
    p = document.createElement("p");
    p.innerHTML = "-";
    td.appendChild(p);
    tr.appendChild(td);

    return tr;

}

/* 
2021.03.05 yjjeong order coin
parameter  
market : ex )'KRW-BTC', 'KRW-XRP'
sid : bid : ?????? , ask ??????
volume :  ??????
price : ??????
order : limit : ????????? , price : ?????????(??????), market ?????????(??????)
*/
function orderMarket(){
    const body = {
        market: 'KRW-BTC',
        side: 'bid',
        volume: '0.01',
        price: '100',
        ord_type: 'limit',
    }  
}

// market *	?????? ID (??????)	String
// side *	?????? ?????? (??????)
// - bid : ??????
// - ask : ??????	String
// volume *	????????? (?????????, ????????? ?????? ??? ??????)	NumberString
// price *	?????? ??????. (?????????, ????????? ?????? ??? ??????)
// ex) KRW-BTC ???????????? 1BTC??? 1,000 KRW??? ????????? ??????, ?????? 1000 ??? ??????.
// ex) KRW-BTC ???????????? 1BTC??? ?????? 1????????? 500 KRW ??? ??????, ????????? ?????? ??? ?????? 1000?????? ???????????? 2BTC??? ????????????.
// (???????????? ??????????????? ?????? 1????????? ????????? ?????? ????????? ??? ??????)	NumberString
// ord_type *	?????? ?????? (??????)
// - limit : ????????? ??????
// - price : ????????? ??????(??????)
// - market : ????????? ??????(??????)	String
// identifier	????????? ????????? ????????? (??????)	String (Uniq ??? ??????)

/*
ticket  : uniqueId
type    : ticker : ?????????, ?????? : trade, ?????? : orderbook
codes   : Uppercase field name 
*/
// type	????????? ?????? ??????.
// (????????? -> ticker
// ?????? -> trade,
// ?????? ->orderbook)	String	O
// codes	????????? ?????? ?????? ??????.
// ?????? : codes ????????? ???????????? ???????????? ???????????? ???????????? ?????????.	List	O
// isOnlySnapshot	?????? ???????????? ??????	Boolean	X
// isOnlyRealtime	????????? ????????? ??????	Boolean	X

// u_socket.js:33 Uncaught DOMException: Failed to execute 'postMessage' on 'Worker': MessageEvent object could not be cloned