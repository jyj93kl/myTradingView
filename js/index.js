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
    }, 5000);
    setInterval(function(){
        changeMarket();
    }, 10000);
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
    let marketList = JSON.parse(data), table = document.querySelector(".table-tbody table");

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
    marketNode.querySelector(".price24>p").innerHTML = Math.round(market.acc_trade_price_24h / 1000000).toLocaleString() +"백만";
    
    if(document.querySelector("#chart-candlestick").data == market.code) {
        console.log("update");
    }
}

// 30초마다 변화 판단하기
// 1. 30초 전의 snapshot값과 현재 값의 차이가 2프로 이상일경우 ?
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
}
function isPositive(num) {
    return num >= 0;
}

function changeMarket(){
    let tData = $(document.querySelectorAll(".right-wrapper .table-tbody table tr"));
    let standard;
    tData.each(function(idx, elem){
        standard = $Global["rise_market"][elem.data.code];
        // 기준이 현재값보다 높다면? 마이너스 
        // 음수(기준) 음수(현재) 기준 - 현재
        // 음수(기준) 양수(현재) 현재 - 기준 
        // 양수(기준) 음수(현재) 현재 - 기준
        // 양수(기준) 양수(현재) 현재 - 기준
        if(!isPositive(elem.data.signed_change_rate) && !isPositive(standard.start_change_rate)){
            standard["now_change_rate"] = standard.start_change_rate - -elem.data.signed_change_rate;
        } else {
            standard["now_change_rate"] = elem.data.signed_change_rate - standard.start_change_rate;
        }
        
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

    return tr;
}

function createMarketRow(row){
    let tr,td,a,em,p,strong;

    tr = document.createElement("tr");
    // <td>
    //     <a href="#"><strong>리플</strong></a>
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
    //     <p>17,968<i>백만</i></p>
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
sid : bid : 매수 , ask 매도
volume :  개수
price : 금액
order : limit : 지정가 , price : 시장가(매수), market 시장가(매도)
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

// market *	마켓 ID (필수)	String
// side *	주문 종류 (필수)
// - bid : 매수
// - ask : 매도	String
// volume *	주문량 (지정가, 시장가 매도 시 필수)	NumberString
// price *	주문 가격. (지정가, 시장가 매수 시 필수)
// ex) KRW-BTC 마켓에서 1BTC당 1,000 KRW로 거래할 경우, 값은 1000 이 된다.
// ex) KRW-BTC 마켓에서 1BTC당 매도 1호가가 500 KRW 인 경우, 시장가 매수 시 값을 1000으로 세팅하면 2BTC가 매수된다.
// (수수료가 존재하거나 매도 1호가의 수량에 따라 상이할 수 있음)	NumberString
// ord_type *	주문 타입 (필수)
// - limit : 지정가 주문
// - price : 시장가 주문(매수)
// - market : 시장가 주문(매도)	String
// identifier	조회용 사용자 지정값 (선택)	String (Uniq 값 사용)

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