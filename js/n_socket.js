const serverSocket = {
  param : {
    socket : null,
    desc : "server socket"
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
    this.param.socekt = null;
  }
  ,
  initialize : function(){
    this.param.socket = io();
  },
  getSocket : function(){
    return this.param.socket;
  },
  isSocket : function(){
    (this.param.socket != null) ? true : false;
  }
}

