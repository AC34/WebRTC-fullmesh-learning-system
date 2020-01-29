
/**
 * @param {string} user name 
 * @param {string|undefined} sdp
 * @param {bool} is sdp offer(false on answer)
 * @param {bool} is offerer
 */
function RTCQueueUser(user_name, sdp,is_sdp_offer,is_offerer) {
  this.name = user_name;
  this.sdp = sdp;
  this.is_sdp_offer = is_sdp_offer;
  this.is_offerer = is_offerer;
};
const RTCMsgProtocol = {
  message:{
    type:"message",
    from:"",
    message:""
  }
}
const RTCMsgCreator = {
  protocol:RTCMsgProtocol,
  createMsg:function(from,message){
    var msg = Object.assign({},this.protocol.message);
    msg.message = message;
    msg.from = from;
    return JSON.stringify(msg);
  }
}
const RTCMsgHandler = {
  /**
   * @param {*} from
   * @param {Object} msg RTCmsgProtocol.*
   */
  handleMsg: function(e) {
    var msg = JSON.parse(e.data);
    var pm = ProcessManager;
    if (msg.type === pm.rtcprotocol.message.type) {
      pm.uim.insertOtherMessage(msg.from, msg.message);
    }
  },
  /**
   * @param {string} user name
   * @param {Object} RTCmsgProtocol.message
   */
  sendMsg: function(to, message) {
    var pm = ProcessManager;
    var msg = pm.rtcmc.createMsg(pm.um.Self.name,message);
    pm.um.getUser(to).sendDataViaDatachannel(msg);
  }
};

var RTCQueueHandler = function() {
  this.current_user = "";
  this.offer_received = false;
  this.offer_sent = false;
  this.is_offerer = false;
  this.answer_sent = false;
  this.answer_set = false;
  this.queue = [];
};
RTCQueueHandler.prototype.startOfferSdp = function(user_name) {
  var pm = ProcessManager;
  if (!this.hasUserName(user_name)) {
    this.current_user = user_name;
  }

  this.is_offerer = true;
  this.answer_sent = false;
  pm.rtcqh.is_offerer = true;

  //assure user
  var pm = ProcessManager;
  if (!pm.um.hasUser(user_name)) {
    pm.um.addNewUser(user_name);
  }
  //make offer(current_user)
  var user = pm.um.getUser(pm.rtcqh.current_user);
  //send
  user.makeOfferDescription();
};
RTCQueueHandler.prototype.handleOfferSdp = function(user_name, sdp) {
  var pm = ProcessManager;
  if (!this.hasUserName(user_name)) {
    this.addUser(user_name, sdp, false, false);
  }
  if(this.current_user===""){
    this.moveOnToNextUser();
  }
  var pm = ProcessManager;
  //assure user
  if (!pm.um.hasUser(user_name)) {
    pm.um.addNewUser(user_name);
  }
  if (pm.rtcqh.current_user === user_name) {
    if (!pm.rtcqh.offer_received) {
      pm.rtcqh.offer_received = true;
      pm.uim.console.logPlain("setting offer sdp from ["+pm.rtcqh.current_user+"]");
      pm.um.getUser(pm.rtcqh.current_user).setOfferDescription(sdp);
      //make answer
      pm.um.getUser(pm.rtcqh.current_user).makeAnswerToOffer();
    }
  }
};
RTCQueueHandler.prototype.handleAnswerSdp = function(sdp) {
  var pm = ProcessManager;
  pm.rtcqh.is_offerer = true;
  if (!pm.rtcqh.answer_set) {
    pm.rtcqh.answer_set = true;
    pm.uim.console.logPlain("setting answer sdp from ["+pm.rtcqh.current_user+"]");
    var pm = ProcessManager;
    var user = pm.um.getUser(pm.rtcqh.current_user);
    user.setAnswerDescription(sdp);
  }
};
RTCQueueHandler.prototype.handleIceCandidateEvent = async function(e) {
  var pm = ProcessManager;
  if (!e.candidate) {
    return;
  }
  if (pm.rtcqh.is_offerer) {
    if (pm.rtcqh.offer_sent) {
      return;
    }
    //sender
    if (!pm.rtcqh.offer_sent) {
      pm.rtcqh.offer_sent = true;
      var user = pm.um.getUser(pm.rtcqh.current_user);
      pm.uim.console.logPlain("sending offer sdp to ["+user.name+"]");
      var sdp = user.peer_connection.localDescription;
      var sdp_msg = pm.smc.create_sdp_offer(pm.um.Self.name, user.name, sdp);
      pm.wssh.sendMsg(sdp_msg);
    } else {
    }
  } else {
    //receiver
    if (!pm.rtcqh.answer_sent) {
      pm.rtcqh.answer_sent = true;
      var user = pm.um.getUser(pm.rtcqh.current_user);
      pm.uim.console.logPlain("sending answer sdp to ["+user.name+"]");
      var answer = user.peer_connection.localDescription;
      var answer_msg = pm.smc.create_sdp_answer_to_offer(
        pm.um.Self.name,
        user.name,
        answer
      );
      pm.wssh.sendMsg(answer_msg);
    }
  }
};
RTCQueueHandler.prototype.getUser = function(user_name) {
  for (var i in this.queue) {
    if (this.queue[i].name === user_name) {
      return this.queue[i];
    }
  }
  return undefined;
};

/**
 * @param {string} user name
 * @param {string|undefined} sdp
 * @param {bool} is sdp offer(false on answer)
 * @param {bool} is offerer
 */
RTCQueueHandler.prototype.addUser = function(
  user_name,
  sdp,
  is_sdp_offer,
  is_offerer
) {
  if (!this.hasUser) {
    var user = new RTCQueueUser(user_name, sdp, is_sdp_offer, is_offerer);
    ProcessManager.rtcqh.queue.push(user);
  } else {
  }
};
RTCQueueHandler.prototype.initialize = function(){
  pm.rtcqh.offer_received = false;
  pm.rtcqh.offer_sent = false;
  pm.rtcqh.is_offerer = false;
  pm.rtcqh.answer_sent = false;
  pm.rtcqh.answer_set = false;
}
RTCQueueHandler.prototype.moveOnToNextUser = function() {
  var pm = ProcessManager;
  pm.rtcqh.offer_received = false;
  pm.rtcqh.offer_sent = false;
  pm.rtcqh.is_offerer = false;
  pm.rtcqh.answer_sent = false;
  pm.rtcqh.answer_set = false;
  var users = "";
  for (var user in pm.rtcqh.queue) {
    users += pm.rtcqh.queue[user].name + " , ";
  }

  if (this.queue.length > 0) {
    this.current_user = this.queue[0].name;
    this.is_offerer = false;
    var sdp = this.queue[0].sdp;
    this.queue.shift();
    if (this.is_offerer) {
      this.startOfferSdp(this.current_user);
    } else {
      this.handleOfferSdp(this.current_user, sdp);
    }
  }
};
RTCQueueHandler.prototype.hasUserName = function(user_name) {
  var has = false;
  for (var i in this.queue) {
    if (has) break;
    if (this.queue[i].name === user_name) {
      has = true;
    }
  }
  if (this.current_user === user_name) {
    has = true;
  }
  return has;
};
