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
module.exports = HandlingProtocol;