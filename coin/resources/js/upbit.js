function marketAll(){

  var requestData = new Object();
  requestData["method"] = "GET";
  requestData["callUrl"] = upbitUrl.selectMarkets;
  // console.log(requestData);
  socket.emit("UPBIT_API", JSON.stringify(requestData));
}

function marketTarget(){

  var requestData = new Object();
  requestData["method"] = "GET";
  requestData["callUrl"] = upbitUrl.selectMarket;
  // console.log(requestData);
  socket.emit("UPBIT_API", JSON.stringify(requestData));
}

function selectTargetCandle(minute, market, count){
  var requestData = new Object();
  requestData["method"] = "GET";
  requestData["callUrl"] = dynamicUrl.selectTargetCandle + minute + "?market=" + market + "&count=" + count;
  upbitUrl.selectTargetCandle = requestData["callUrl"];

  // console.log(requestData);
  socket.emit("UPBIT_API", JSON.stringify(requestData));
}

socket.on("UPBIT_API", function(data) {
  let response = JSON.parse(data);
  // console.log(response);
  switch(response.url){
    case upbitUrl.selectMarkets : createMarkets(response.data); break;
    case upbitUrl.selectMarket : createTickers(response.data); break;
    case upbitUrl.selectTargetCandle : createApexChart(response.data); break;
    
    default : null;
  }
});

function createMarkets(data){
  let list = JSON.parse(data);
  let table = document.querySelector(".table-tbody table");
  
  for(let i = 0; i < list.length; i++){
    if(list[i].market.indexOf("KRW-") == -1){
      continue;
    }
    let tr,td;
    tr = document.createElement("tr");

    td = document.createElement("td");
    td.dataset.index = 0;
    td.innerHTML = list[i].korean_name;
    tr.appendChild(td);
    
    td = document.createElement("td");
    td.dataset.index = 1;
    td.innerHTML = list[i].market;
    tr.appendChild(td);

    td = document.createElement("td");
    td.dataset.index = 2;
    td.innerHTML = list[i].market_warning;
    tr.appendChild(td);
    
    tr.data = list[i];
    tr.addEventListener("click", function(){
      let selectionData = this.data;
      this.classList.toggle("active");
      selectTargetCandle(document.querySelector("#countCandleSelect").value, selectionData.market, 60);
    });

    table.querySelector("tbody").appendChild(tr);
  }

}

function createTickers(data){
  let list = JSON.parse(data);
  console.log(list);
  console.log("list.length ", list.length)
}
socket.off("test").on("test", function(){
  console.log("test");
});
let apexChart;
function createApexChart(data){

  let dataList = new Array();
  let linearList = new Array();
  let list = JSON.parse(data);
  let date;
  let linear;
  for(let i = (list.length-1) ; i >= 0; i--){
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

  apexChart.updateSeries([{
    data: dataList
  }], true);

}
