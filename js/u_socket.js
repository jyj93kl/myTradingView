const bitSocket = {
  param : {
    socket : null,
    desc : "upbit socket"
  },  
  send : function(message){
    this.param.socket.send(JSON.stringify(message));
  },
  open : function(){
    this.param.socket.open();
  },
  close : function(){
    this.param.socket.close();
  },
  reset : function(){
    if(this.param.socket != null) {
      this.param.socket.close();
    }
    this.param.socket.onopen = null;
    this.param.socket.onclose = null;
    this.param.socket.onmessage = null;
    this.param.socekt = null;
  },
  initialize : function(){
    this.param.socket = new WebSocket(upbitUrl.websocket);

    this.param.socket.onopen = function(event) {
      console.log("Server open message : ", event);
    }
    // // 서버로 부터 메시지를 수신한다
    this.param.socket.onmessage = function(event) {
      let reader = new FileReader();
      reader.onload = function(e) {
        changePrice(JSON.parse(reader.result));
      };
      reader.readAsText(event.data);
    }
    // close event handler
    this.param.socket.onclose = function(event) {
      console.log("Server close message: ", event);
    }
    // error event handler
    this.param.socket.onerror = function(event) {
      console.log("Server error message: ", event);
    }
    console.log(this.param.socket);
  },
  getSocket : function(){
    return this.param.socket;
  },
  isSocket : function(){
    (this.param.socket != null) ? true : false;
  }
}