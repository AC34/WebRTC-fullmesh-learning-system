
//send/receive as in browser-wise
const HandlingProtocol ={
  common:{
    sdp_offer:{
      type:"sdp_offer",
      self:"",
      to:"",
      session_description:""
    },
    sdp_answer_to_offer:{
      type:"sdp_answer_to_offer",
      self:"",
      to:"",
      session_description:""
    }
  },
  send:{
    tell_self_name:{
      type:"tell_self_name",
      self:""
    }
  },
  receive:{
    unknown:{
      type:"unknown"
    },
    name_register_success:{
      type:"name_register_success",
      registered_name:""
    },
    name_register_fail:{
      type:"name_register_fail",
      failed_name:""
    },
    new_user_notice:{
      type:"new_user_notice",
      name:""
    },
    user_logout_notice:{
      type:"user_logout_notice",
      name:""
    }
  }
}
const ReceivedMsgHandler = {
  /**
   * received message from ws signalling server.
   * @param {string} ws_msg 
   */
  getInstance:function(){
    return Object.assign(ReceivedMsgHandler);
  },
  handleMsg:async function(msg_string){
    var msg_obj = JSON.parse(msg_string);
    var msg_type = msg_obj.type;
    var pm = ProcessManager;
    //receive
    var rcv_types = pm.protocol.receive;
    if(msg_type===rcv_types.name_register_success.type){
      pm.uim.deactivateRegisterUi();
      pm.um.addSelf(msg_obj.registered_name);
      pm.uim.console.logCorrect("Successsfully logged in as ["+msg_obj.registered_name+"]");
    }
    if(msg_type===rcv_types.name_register_fail.type){
      pm.uim.console.logError("Name ["+msg_obj.failed_name+"] is already in use.");
    }
    if(msg_type===rcv_types.new_user_notice.type){
      pm.uim.console.logPlain("new user ["+msg_obj.name+"] connected to ws server");
      pm.um.addNewUser(msg_obj.name);
      pm.rtcqh.startOfferSdp(msg_obj.name);
    }
    //common
    var cm_types = pm.protocol.common;
    if(msg_type===cm_types.sdp_offer.type){
      pm.rtcqh.handleOfferSdp(msg_obj.self,msg_obj.session_description);
    }
    if(msg_type===cm_types.sdp_answer_to_offer.type){
      pm.rtcqh.handleAnswerSdp(msg_obj.session_description);
    }
  }
}
const SendMsgCreator = {
  /**
   * @param {string} user_name
   * @return {string} msg stringified
   */
  create_tell_self_name:function(my_name){
    var msg = Object.assign({},ProcessManager.protocol.send.tell_self_name);
    msg.self = my_name;
    return JSON.stringify(msg);
  },
  /**
   * @param {*} my_name  from 
   * @param {*} to_name  to
   * @param {*} sdp sdp
   * @return {string} msg stringified
   */
  create_sdp_offer:function(my_name,to_name,sdp){
    var msg = Object.assign({},ProcessManager.protocol.common.sdp_offer);
    msg.self = my_name;
    msg.to = to_name;
    msg.session_description = sdp;
    return JSON.stringify(msg);
  },
  /**
   * @param {*} my_name  from 
   * @param {*} to_name  to
   * @param {*} sdp answer sdp
   * @return {string} msg stringified
   */
  create_sdp_answer_to_offer:function(my_name,to_name,sdp){
    var msg = Object.assign({},ProcessManager.protocol.common.sdp_answer_to_offer);
    msg.self = my_name;
    msg.to = to_name;
    msg.session_description = sdp;
    return JSON.stringify(msg);
  },
}

const WebSocketSdpHandler = {
  socket:undefined,
  getInstance:function(){
    return Object.create(WebSocketSdpHandler);
  },
  init:function(uri){
    this.socket = new WebSocket(uri);
    this.socket.addEventListener("open",function(){
     ProcessManager.wssh.connectionOpened(); 
    });
    this.socket.addEventListener("close",function(){
      ProcessManager.wssh.connectionClosed();
    });
    this.socket.addEventListener("message",function(e){
      ProcessManager.wssh.handleMsg(e);
    });
  },
  sendMsg(msg_string){
    this.socket.send(msg_string);
  },
  handleMsg(received_raw_msg){
    ProcessManager.rmh.handleMsg(received_raw_msg.data);
  },
  connectionOpened:function(){
    ProcessManager.uim.console.logCorrect("ws connection opened.");
  },
  connectionClosed:function(){
    this.socket.close();
    this.socket = undefined;
    ProcessManager.uim.console.logError("ws connection closed.");
  }
}