
MessageHandler = function(){
  this.Protocol = require("./HandlingProtocol");
};
/**
 * @param {string} msg_string
 * @return {object|false} message object or false
 */
MessageHandler.prototype.getMsgObject = function(msg_string){
  return JSON.parse(msg_string);
}
MessageHandler.prototype.sendMsgByID = function(msg_object,connection){
  connection.send(JSON.stringify(msg_object));
}
module.exports = MessageHandler;