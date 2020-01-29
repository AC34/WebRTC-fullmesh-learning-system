var ProcessHandler = function(server) {
  var msh = require("./message/MessageHandler");
  this.MessageHandler = new msh();
  this.server = server;
  this.Users = new Array();
};
/**
 * @param {WebSocket} ws
 * @param {object} msg object
 */
ProcessHandler.prototype.handleMessage = function(ws, msg) {
  var msg_obj = this.MessageHandler.getMsgObject(msg);
  console.log("message_type:" + msg_obj.type);
  console.log("message object" + JSON.stringify(msg_obj));
  //send
  var send_type = this.Protocol.send;
  if (msg_obj.type === send_type.tell_self_name.type) {
    console.log("received name =" + msg_obj.self);
    this.handleUserRegistration(ws, msg_obj);
  }
  //common
  var common_type = this.Protocol.common;
  if (msg_obj.type === common_type.sdp_offer.type) {
    this.handleSdpOffer(msg_obj);
  }
  if (msg_obj.type === common_type.sdp_answer_to_offer.type) {
    this.handleSdpAnswerToOffer(msg_obj);
  }
};
/**
 * @param {WebSocket} ws
 * @param {object} msg object
 */
ProcessHandler.prototype.handleUserRegistration = function(ws, msg_obj) {
  var name = msg_obj.self;
  var reply_type = this.Protocol.receive;
  if (!this.hasUserByName(name)) {
    console.log("does not have user");
    //register
    this.registerNewUser(ws, name);
    var msg = this.util.createMsgObject(
      this,
      reply_type.name_register_success.type
    );
    msg.registered_name = name;
    //notice success
    this.util.sendMsgByName(this, msg, name);
    //notify everyone else
    var notice = this.util.createMsgObject(
      this,
      reply_type.new_user_notice.type
    );
    notice.name = name;
    this.util.sendToAllExcept(this.Users, name, notice);
  } else {
    //user already exists
    console.log("user already exists");
    var msg = this.util.createMsgObject(
      this,
      reply_type.name_register_fail.type
    );
    msg.failed_name = name;
    this.util.sendMsgBySocket(ws, msg);
  }
};
/**
 * @param {object} msg object
 */
ProcessHandler.prototype.handleSdpOffer = function(msg_obj) {
  console.log("sending sdp to " + msg_obj.to);
  if (this.hasUserByName(msg_obj.to)) {
    this.util.sendMsgByName(this, msg_obj, msg_obj.to);
  } else {
    console.log("handleSdpOffer:user not found" + msg_obj.to);
  }
};
/**
 * @param {object} msg object
 */
ProcessHandler.prototype.handleSdpAnswerToOffer = function(msg_obj) {
  console.log("sending sdp asnwer to Offer" + msg_obj.to);
  if (this.hasUserByName(msg_obj.to)) {
    this.util.sendMsgByName(this, msg_obj, msg_obj.to);
  } else {
    console.log("handleSdpAnswerToOffer:user not found" + msg_obj.to);
  }
};
ProcessHandler.prototype.closeConnection = function(ws) {
  this.removeUser(ws);
};
/**
 * @param {string} name
 * @return {bool}
 */
ProcessHandler.prototype.hasUserByName = function(name) {
  for (var user in this.Users) {
    if (this.Users[user].name === name) {
      return true;
    }
  }
  return false;
};
ProcessHandler.prototype.registerNewUser = function(ws, name) {
  if (!this.hasUserByName(name)) {
    console.log("registered new user " + name);
    this.Users.push(new this.User(name, ws));
  }
  console.log("registerNewUser:after:length=" + this.Users.length);
};
ProcessHandler.prototype.removeUser = function(ws) {
  console.log("removing user");
  if (this.Users.length === 0) return;
  for (var user in this.Users) {
    if (this.Users[user].socket === ws) {
      console.log("user deleted " + this.Users[user].name);
      delete this.Users[user];
      return;
    }
  }
};
ProcessHandler.prototype.util = {
  createMsgObject: function(handler, create_type_name) {
    var types = Object.keys(handler.Protocol.receive);
    for (var type in types) {
      if (types[type] === create_type_name) {
        var ret = Object.assign({}, handler.Protocol.receive[create_type_name]);
        return ret;
      }
    }
    return Object.assign({}, handler.Protocol.receive["unknown"]);
  },
  sendMsgByName: function(handler, msg_object, name) {
    for (var user in handler.Users) {
      if (handler.Users[user].name === name) {
        handler.Users[user].socket.send(JSON.stringify(msg_object));
        return true;
      }
    }
    return false;
  },
  sendMsgBySocket: function(socket, msg_object) {
    socket.send(JSON.stringify(msg_object));
  },
  sendToAllExcept(users, exception_user, msg_obj) {
    var targets = users.concat();
    console.log("users length=" + users.length);
    for (var target in targets) {
      if (targets[target].name !== exception_user) {
        targets[target].socket.send(JSON.stringify(msg_obj));
      }
    }
  }
};
ProcessHandler.prototype.User = require("./user/User");
ProcessHandler.prototype.Protocol = require("./message/HandlingProtocol");
ProcessHandler.prototype.MessageHandler = require("./message/MessageHandler");

module.exports = ProcessHandler;
