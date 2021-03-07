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
    }, 3000);
    // setTimeout(function(){
    //     monitoring();
    // }, 10000);
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
            selectMarketData(document.querySelector("#countCandleSelect").value, selectionData.market, 100);
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

}



// 만약에 값이 바뀐다면 ? 변화의 폭이 5프로 이상일 2퍼센트 이상일경우

// 30초마다 변화 판단하기
// 1. 30초 전의 snapshot값과 현재 값의 차이가 2프로 이상일경우 ?
$Global["rise_market"] = new Object();
function saveMarket(){
    let markets = new Object();
    let tData = $(document.querySelectorAll(".right-wrapper .table-tbody table tr"));
    tData.each(function(idx, elem){
        elem.data["startTime"] = new Date();
        elem.data["startChangeRate"] = new Number(elem.data.signed_change_rate * 100).toFixed(2) 
        markets[elem.data.code] = elem.data;
    });

    $Global["rise_market"] = markets;
}
function changeMarket(){
    let tData = $(document.querySelectorAll(".right-wrapper .table-tbody table tr"));
    let standard;
    tData.each(function(idx, elem){
        standard = $Global["rise_market"][elem.data.code];
        // 기준이 현재값보다 높다면? 마이너스 
        standard["nowChangeRate"] = (standard.signed_change_rate > elem.signed_change_rate) ? elem.change_rate - standard.change_rate : elem.change_rate - standard.change_rate
        $Global["rise_market"][elem.data.code] = standard;
    });
    
    // (nextSnapShot[i].change_rate > prevSnapShot[j].change_rate) || 
    // ((nextSnapShot[i].change_rate < 0 && prevSnapShot[j].change_rate < 0) && (nextSnapShot[i].change_rate < prevSnapShot[j].change_rate) )
   
    // $Global["rise_market"] = ;
}

var prevSnapShot = new Array();
function prevShap(){
    var tData = $(document.querySelectorAll(".right-wrapper .table-tbody table tr"));
    tData.each(function(idx, elem){
        prevSnapShot.push({
            market : elem.data.code,
            korean_name : elem.data.korean_name,
            change_rate : new Number(elem.data.signed_change_rate * 100).toFixed(2) 
        })
    });
    console.log("현재 가격 저장 시간 ---- ", new Date());
}
let upMarket = new Array();
let tmpMarket = new Array();
function monitoring(){
    setInterval(function(){
        let upChangeMarket = new Array();
        let nextSnapShot = new Array();
        let tData = $(document.querySelectorAll(".right-wrapper .table-tbody table tr"));
        tData.each(function(idx, elem){
            nextSnapShot.push({
                market : elem.data.code,
                korean_name : elem.data.korean_name,
                change_rate : new Number(elem.data.signed_change_rate * 100).toFixed(2) 
            })
        });
    
        for(let i = 0 ; i < nextSnapShot.length; i++){
            for(let j = 0; j < prevSnapShot.length; j++){
                if(nextSnapShot[i].code == prevSnapShot[j].code){
                    if  (
                        (nextSnapShot[i].change_rate > prevSnapShot[j].change_rate) || 
                        ((nextSnapShot[i].change_rate < 0 && prevSnapShot[j].change_rate < 0) && (nextSnapShot[i].change_rate < prevSnapShot[j].change_rate) )
                        ){  
                        upChangeMarket.push({
                            market : nextSnapShot[i].market,
                            korean_name : nextSnapShot[i].korean_name,
                            change_rate : new Number(nextSnapShot[i].change_rate - prevSnapShot[j].change_rate).toFixed(2),
                            prex_change_rate : new Number(prevSnapShot[j].change_rate).toFixed(2),
                            next_change_rate : new Number(nextSnapShot[i].change_rate).toFixed(2),
                            count : 0
                        });
                    }
                    prevSnapShot.splice(j,1);
                    break;
                }
            }
        }
        console.log("=======================");
        if(upChangeMarket.length > 0 ){
            upChangeMarket.sort(function(a, b) { // 내림차순
                return b["change_rate"] - a["change_rate"];
            });
            let html = '';
          
            for(let i = 0 ; i < upChangeMarket.length; i++){
                if(i > 4){
                    break;
                } 
                
                // console.log(
                //     "상승 중인 코인 정보 : " + upChangeMarket[i].korean_name +'(' + upChangeMarket[i].market + ')' 
                //     +", 이전 전일대비값 : " + upChangeMarket[i].prex_change_rate
                //     +", 현재 전일대비값 : " + upChangeMarket[i].next_change_rate
                //     +", 변화 폭 : " +  upChangeMarket[i].change_rate
                // );

                html += '<tr>';
                html += '<td>' + upChangeMarket[i].korean_name +'(' + upChangeMarket[i].market + ')</td>';
                html += '<td>' + upChangeMarket[i].prex_change_rate + '</td>';
                html += '<td>' + upChangeMarket[i].next_change_rate + '</td>';
                html += '<td>' + upChangeMarket[i].change_rate + '</td>';
                html += '</tr>';
            }
            
            $("#upTable tbody").empty();
            $("#upTable tbody").append(html);
            let goMarket;
            if($("#goingTable").data("data") == undefined){
                for(let i = 0 ; i < upChangeMarket.length; i++) {
                    upChangeMarket["count"] = 0;
                }
                $("#goingTable").data("data", JSON.stringify(upChangeMarket));
                goMarket = upChangeMarket;
            } else {
                goMarket = JSON.parse($("#goingTable").data("data"));
                for(let i = 0 ; i < upChangeMarket.length; i++){
                    for(let j = 0 ; j < goMarket.length; j++){
                        if(upChangeMarket[i].market == goMarket[j].market) {
                            goMarket[j]["count"] = goMarket[j]["count"] + 1;
                            break;
                        }
                    }
                }

                for(let j = 0 ; j < goMarket.length; j++){
                    if(goMarket[j].count == 0) {
                        goMarket.splice(j,1);
                    }
                }
                $("#goingTable").data("data", JSON.stringify(goMarket));
            }

            goMarket.sort(function(a, b) { // 내림차순
                return b["count"] - a["count"];
            });
            html = '';
            for(let i = 0 ; i < goMarket.length; i++){
                html += '<tr>';
                html += '<td>' + goMarket[i].korean_name +'(' + goMarket[i].market + ')</td>';
                html += '<td>' + goMarket[i].prex_change_rate + '</td>';
                html += '<td>' + goMarket[i].next_change_rate + '</td>';
                html += '<td>' + goMarket[i].change_rate + '</td>';
                html += '<td>' + goMarket[i].count + '</td>';
                html += '</tr>';
            }
            $("#goingTable tbody").empty();
            $("#goingTable tbody").append(html);

        } else {
            console.log("상승 코인 정보 없음");
        }
        console.log("=======================");
        prevShap();
    }, 5000);
    
    prevShap();
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

function noticeUpbit(){

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