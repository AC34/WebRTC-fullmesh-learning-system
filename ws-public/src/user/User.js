/**
 * User
 * @param {*} name 
 * @param {*} socket 
 */
var User = function(name,socket){
  this.name = name;
  this.socket = socket;
}
User.prototype.id="";
User.prototype.name="";
User.prototype.socket=undefined;

module.exports = User;