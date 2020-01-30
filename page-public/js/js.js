

var Self = function(name){
  this.name = name;
}
var User = function(name) {
  this.name = name;
  this.is_connected = false;
  this.pc_config = { iceServers: [] };
  this.peer_connection = false;
  this.data_channel = undefined;
  this.id = "";
};
User.prototype.sendDataViaDatachannel = function(msg) {
  this.data_channel.send(msg);
};
User.prototype.prepareConnection = function() {
  if (this.peer_connection) return;
  this.peer_connection = new RTCPeerConnection(this.pc_config);
  this.peer_connection.ondatachannel = this.handleOnDataChannel;
  this.prepareDataChannel();
  this.peer_connection.ontrack = function(e) {
    //console.log(this.name + " ontrack.");
    this.is_connected = true;
  };
  this.peer_connection.onicecandidate =
    ProcessManager.rtcqh.handleIceCandidateEvent;
};
User.prototype.prepareDataChannel = function() {
  //least 1 channel first
  this.data_channel = this.peer_connection.createDataChannel("dataChannel");
  this.data_channel.onopen = this.onDataChannelOpen;
  this.data_channel.onclose = function(e) {
  };
  this.data_channel.onerror = function(e) {
  };
  this.data_channel.onmessage = ProcessManager.rtcmh.handleMsg;
}
User.prototype.makeOfferDescription = async function() {
  if (this.is_connected) return;
  //assure instance
  if (!this.peer_connection) {
    this.prepareConnection();
  }
  let offer = await this.peer_connection.createOffer();
  await this.peer_connection.setLocalDescription(offer);
  return offer;
};
User.prototype.setOfferDescription = async function(sessionDescription) {
  if (this.is_connected) return;
  //assure instance
  if (!this.peer_connection) {
    this.prepareConnection();
  }
  await this.peer_connection.setRemoteDescription(sessionDescription);
};
User.prototype.makeAnswerToOffer = async function() {
  var answer = await this.peer_connection.createAnswer();
  await this.peer_connection.setLocalDescription(answer);
  return;
};
User.prototype.setAnswerDescription = async function(sessionDescription) {
  await this.peer_connection.setRemoteDescription(sessionDescription);
};
User.prototype.handleOnDataChannel = function(e) {
  var pm = ProcessManager;
  if (!pm.rtcqh.is_offerer) {
    var user = pm.um.getUser(pm.rtcqh.current_user);
    user.data_channel = e.channel;
    user.data_channel.onopen = function(e) {
      console.log("receiver onopen:" + JSON.stringify(e));
    };
    user.data_channel.onclose = function(e) {
      console.log("receiver onopen:" + JSON.stringify(e));
    };
    user.data_channel.onmessage = pm.rtcmh.handleMsg;    user.data_channel.onerror = function(e) {
      console.log("receiver onerror:" + JSON.stringify(e));
    };
  }
  pm.rtcqh.moveOnToNextUser();
};
User.prototype.onDataChannelOpen = function(e) {
  var pm = ProcessManager;
  var user = pm.um.getUser(pm.rtcqh.current_user);
  user.id = pm.uim.util.createUniqueDOMId();
  pm.uim.addNewUserBoard(user.name, user.id);
  user.is_connected = true;
  pm.uim.console.logCorrect("WebRTC data channel connected to ["+user.name+"]");
};

const UsersManager = {
  Self: undefined,
  Users: [],
  getInstance: function(process_manager) {
    var ret = Object.assign({}, UsersManager);
    ret.Users = [];
    return ret;
  },
  addSelf(name) {
    ProcessManager.um.Self = new Self(name);
  },
  addNewUser(name) {
    var pm = ProcessManager;
    if (!ProcessManager.um.hasUser(name)) {
      ProcessManager.um.Users.push(new User(name));
    }
  },
  hasUser(name) {
    for (user in ProcessManager.um.Users) {
      if (ProcessManager.um.Users[user].name === name) return true;
    }
    return false;
  },
  /**
   * @param {string} name
   * @return {User|undefined} user
   */
  getUser(name) {
    for (user in ProcessManager.um.Users) {
      if (ProcessManager.um.Users[user].name === name) {
        return ProcessManager.um.Users[user];
      }
    }
    return undefined;
  }
};

const UiManager = {
  addNewUserBoard: function(user_name, textarea_id) {
    var board = this.util.createElement("div", "", "user-board");
    var title = this.util.createElement("h2", "", "user-name");
    title.innerText = user_name;
    var inputs = this.util.createElement("div", "", "inputs");
    var typing_area = this.util.createElement("div", "", "typing-area");
    var tool_box = this.util.createElement("div", "", "tool-box");
    var submit_msg = this.util.createElement("input", "", "submit-msg");
    submit_msg.value = "OK";
    submit_msg.setAttribute(
      "onclick",
      '    ProcessManager.submitRTCMsg("' +
        textarea_id +
        '","' +
        user_name +
        '");'
    );
    submit_msg.setAttribute("type", "button");
    var message_textarea = this.util.createElement("textarea", textarea_id, "");
    message_textarea.setAttribute("placeholder", "message");
    tool_box.append(submit_msg);
    typing_area.append(message_textarea);
    typing_area.append(tool_box);
    board = this.util.append(board, [title, inputs, typing_area]);
    document.getElementById("users-board").append(board);
  },
  insertSelfMessage: function(user_name, message) {
    var boards = document.getElementsByClassName("user-name");
    var board_num;
    for (var i = 0; i < boards.length; i++) {
      if (boards[i].innerText !== undefined) {
        if (boards[i].innerText.trim() === user_name.trim()) {
          board_num = i;
        }
      }
    }
    if (board_num === undefined) return;
    var dom = this.util.createElement("p", "", "message-self");
    dom.innerText = message;
    var board = document.getElementsByClassName("inputs")[board_num];
    board.append(dom);
    this.scrolldown(user_name);
  },
  insertOtherMessage: function(user_name, message) {
    var boards = document.getElementsByClassName("user-name");
    var board_num;
    for (var i = 0; i < boards.length; i++) {
      if (boards[i].innerText !== undefined) {
        if (boards[i].innerText.trim() === user_name.trim()) {
          board_num = i;
        }
      }
    }
    if (board_num === undefined) return;
    var dom = this.util.createElement("p", "", "message-other");
    dom.innerText = message;
    var board = document.getElementsByClassName("inputs")[board_num];
    board.append(dom);
    this.scrolldown(user_name);
  },
  scrolldown: function(user_name) {
    var boards = document.getElementsByClassName("user-name");
    var board_num;
    for (var i = 0; i < boards.length; i++) {
      if (boards[i].innerText !== undefined) {
        if (boards[i].innerText.trim() === user_name.trim()) {
          board_num = i;
        }
      }
    }
    if (board_num === undefined) return;
    var board = document.getElementsByClassName("inputs")[board_num];
    board.scrollTo(0, board.scrollHeight);
  },
  activateRegisterUi: function() {
    var target = document.querySelector("#register");
    UiManager.util.deleteClassName(target, "inactive");
  },
  deactivateRegisterUi: function() {
    var target = document.querySelector("#register");
    UiManager.util.addClassName(target, "inactive");
  },
  deactivateTypingArea: function() {
    var box = document.querySelector("#typing-area");
    UiManager.util.addClassName(box, "inactive");
  },
  activateTypingArea: function() {
    var box = document.querySelector("#typing-area");
    UiManager.util.deleteClassName(box, "inactive");
  },
  util: {
    createElement: function(node_name, id, class_name) {
      var node = document.createElement(node_name);
      if (id !== undefined) {
        node.id = id;
      }
      if (class_name !== undefined) {
        UiManager.util.addClassName(node, class_name);
      }
      return node;
    },
    append: function(node, append) {
      if (node === undefined || append === undefined) return;
      if (typeof append === "string") {
        node.append(append);
      } else if (Array.isArray(append)) {
        for (var i in append) {
          node.append(append[i]);
        }
      }
      return node;
    },
    addClassName: function(node, class_name) {
      var names = node.className;
      if (names === undefined) {
        return (node.className = class_name);
      }
      while (node.className.indexOf("  ") > -1) {
        names = names.replace("  ", " ");
      }

      var names_list = names.split(" ");
      var contains = false;
      names_list.forEach(
        name =>
          function() {
            if (contains) return;
            if (name === class_name) contains = true;
          }
      );
      names_list.push(class_name);
      if (!contains || names_list.length === 1) {
        node.className = names_list.join(" ").trim();
      }
      return node;
    },
    deleteClassName: function(node, class_name) {
      var names = node.className;
      while (node.className.indexOf("  ") > -1) {
        names = names.replace("  ", " ");
      }
      var names_list = names.split(" ");
      var index = names_list.indexOf(class_name);
      if (index !== -1) names_list.splice(index, 1);
      if (names_list.length === 1) {
        node.className = class_name.trim();
      } else {
        node.className = names_list.join(" ");
      }
      node.className = names_list.join(" ");
    },
    createUniqueDOMId: function() {
      var id = Math.floor(Math.random() * 10000) + 1;
      while (document.getElementById(String(id)) !== null) {
        id = Math.floor(Math.random() * 10000) + 1;
      }
      return String(id);
    }
  },
  console: {
    logPlain: function(msg) {
      var console = document.querySelector("#console");
      var p = document.createElement("p");
      p.innerHTML = msg;
      console.prepend(p);
    },
    logCorrect: function(msg) {
      var console = document.querySelector("#console");
      var p = document.createElement("p");
      p.className = "correct";
      p.innerHTML = msg;
      console.prepend(p);
    },
    logError: function(msg) {
      var console = document.querySelector("#console");
      var p = document.createElement("p");
      p.className = "error";
      p.innerHTML = msg;
      console.prepend(p);
    }
  }
};

var ProcessManager = {
  wssh: undefined,
  rmh: undefined,
  um: undefined,
  rtcqh: undefined,
  rtcmh: RTCMsgHandler,
  rtcmc: RTCMsgCreator,
  smc: SendMsgCreator,
  uim: UiManager,
  protocol: HandlingProtocol,
  rtcprotocol: RTCMsgProtocol,
  getInstance: function() {
    return Object.create(ProcessManager);
  },
  init: function() {
    ProcessManager.uim.console.logPlain("dom loaded.");
    ProcessManager.um = UsersManager.getInstance();
    ProcessManager.rmh = ReceivedMsgHandler.getInstance();
    ProcessManager.rtcqh = new RTCQueueHandler();
    ProcessManager.wssh = WebSocketSdpHandler.getInstance();
    ProcessManager.wssh.init("ws://localhost:5001");
    //events
    document
      .querySelector("#user-register-submit")
      .addEventListener("click", function() {
        ProcessManager.registerSelf();
      });
    document
      .querySelector("#user-name-field")
      .addEventListener("keyup", function(e) {
        if ((e.keyCode === 13)) {
          ProcessManager.registerSelf();
        }
      });
  },
  registerSelf: function() {
    var user_name = document.querySelector("#user-name-field").value;
    if (user_name === "") {
      this.uim.console.logError("user name cannot be empty.");
      return;
    }
    var msg = ProcessManager.smc.create_tell_self_name(user_name);
    ProcessManager.wssh.sendMsg(msg);
  },
  submitRTCMsg: function(id, user_name) {
    var pm = ProcessManager;
    var msg = document.getElementById(id).value;
    document.getElementById(id).value = "";
    pm.uim.insertSelfMessage(user_name, msg);
    pm.rtcmh.sendMsg(user_name, msg);
  }
};
window.onload = function() {
  ProcessManager = ProcessManager.getInstance();
  ProcessManager.init();
};
