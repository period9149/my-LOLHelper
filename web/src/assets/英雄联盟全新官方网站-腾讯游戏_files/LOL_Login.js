/**
 * bind方法兼容性
 */
(function () {
  if (!Function.prototype.bind) {
      Function.prototype.bind = function (oThis) {
          if (typeof this !== "function") {
              throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
          }
          var aArgs = Array.prototype.slice.call(arguments, 1),
              fToBind = this,
              fNOP = function () {
              },
              fBound = function () {
                  return fToBind.apply(this instanceof fNOP && oThis
                      ? this
                      : oThis,
                      aArgs.concat(Array.prototype.slice.call(arguments)));
              };
          fNOP.prototype = this.prototype;
          fBound.prototype = new fNOP();
          return fBound;
      };
  }
}());
/**
 * 请求类,发送错误,会重复请求
 * params:{
 * tryTimes:尝试次数,默认5次,
 * tryInterval:每次尝试间隔时间,默认800毫秒
 * requestType:ajax和getScript,必填,不同类型的接口对应的处理方式不一样,
 * successBack:必填,执行成功回调.
 * errorBack:请求发生错误回调函数,每次发生错误都会执行.该函数必须返回false不发起/true发起,告知错误处理方法是否继续发起下一次请求.
 * failBack:尝试次数用尽,执行失败回调,回调都绑定在改请求对象下执行.
 * data:在请求类型为ajax下使用,但是不要包含url,success和error回调函数,使用apiUrl,successBack和failBack
 * apiUrl:必填.
 * attach:附加的对象,可以把某些对象存在这里.
 * }
 * **/
var T_RequestApi = function (params) {
  //类型判断
  if (!(this instanceof T_RequestApi)) return new T_RequestApi(params);

  this.tryTimes = params['tryTimes'] || 3;
  this.tryInterval = params['tryInterval'] || 500;
  this.timeout = 1500;
  this.apiUrl = encodeURI(params.apiUrl);
  this.requestType = params.requestType || 'ajax';
  this.successBack = params.successBack;
  this.failBack = params['failBack'] || null;
  this.params = params;
  this.requestObject = null;
  this.errorBack = params['errorBack'] || function () {
      return true;
  };
  this.attach = params['attach'] || null;
  this.requestOne(true);
};
T_RequestApi.prototype.requestOne = function (immediately) {
  //判断请求时间
  var delayTime = immediately ? 0 : this.tryInterval;
  //尝试关闭上一个请求
  this.request$ && this.request$.abort();
  if (this.tryTimes === 0) {
      //请求次数用尽,执行失败函数
      this.failBack && this.failBack();
  } else {
      //次数减一
      --this.tryTimes;
      switch (this.requestType) {
          case 'ajax': {
              this.ajax();
              break;
          }
          case 'getScript': {
              this.getScript();
              break;
          }
      }
  }
};
T_RequestApi.prototype.handleError = function (XMLHttpRequest, textStatus) {
  console.log("失败: " + this.apiUrl, textStatus);
  //执行error回调,判断是否应该自动发起下一次尝试
  this.errorBack(XMLHttpRequest, textStatus) && this.requestOne();
};
T_RequestApi.prototype.ajax = function () {
  var defaultData = {
      dataType: 'jsonp',
      xhrFields: { withCredentials: true }
  };
  var ajaxParams = $.extend(defaultData, this.params.data);
  ajaxParams['success'] = function (data) {
      var urlSplit = this.apiUrl.split('/');
      this.successBack(data);
  }.bind(this);
  ajaxParams['timeout'] = this.timeout;
  ajaxParams['error'] = this.handleError.bind(this);
  ajaxParams['url'] = this.apiUrl;
  this.requestObject = $.ajax(ajaxParams);
};
T_RequestApi.prototype.getScript = function () {
  this.requestObject = $.getScript(this.params.apiUrl).done(this.successBack.bind(this)).fail(this.handleError.bind(this));
};
/**
 * 登录模块,单例对象,正确使用方式请看testLogin.js实例代码,
 * 登录组件只负责数据获取和存放,渲染请由相应的模块处理,但本组件提供了一些方法,例如查询大区名称,段位等,自行调用.
 * 登录组件的自身行为由状态决定.外接不应该接触这个状态,因为这个状态可能在异步改变中.
 * 需要了解登录组件目前的状态,请使用checkReady和checkLogined等查询方法,在查询没有ready或者logined之后再注册对应的事件,以免因为异步而造成错误.
 * 如果不是需要每次事件都做出反应,一定要及时的解绑掉,不然会重复触发,导致多次执行业务代码.
 * 以下wegame注释均代表'lol社区',早期判断失误,因为已上线代码,只在注释里申明.
 * **/
window.T_Login = {
  /*当前赛季*/
  nowSeason: 's9',
  /*玩家id*/
  gAccountId: '',
  /*玩家大区id*/
  gAccountArea: '',
  /*头部玩家的游戏数据*/
  gAccountData: {
      MobilePlayerInfo: {}, //社区信息：性别、昵称、头像
      PlayerCommunityInfo: {}, //社区信息：萌币数量、社区等级
      PlayerInfo: {}, //游戏信息：游戏头像id、游戏等级、游戏昵称
      PlayerBattleSummary: {}, //游戏数据统计：总场次、胜率
      PlayerHonor: {}, //游戏数据统计：MVP数
      PlayerProperty: {}, //点券、蓝色精粹
      PlayerRankInfo: {} //游戏信息：段位
  },
  /*登录管理器*/
  LoginManager: null,
  /*普通大区选择器*/
  RoleSelector: null,
  /*事件注册对象哈希值,每次使用++hashCode*/
  hashCode: 1,
  /*事件类型
  * ready:登录组件准备完成,
  * login:登录成功,
  * loseServerLogin:请求接口之后,被回报没有登录.
  * boundArea:绑定wegame大区成功
  * noWegameArea:查询wegame大区失败
  * */
  eventType: { ready: 'ready', login: 'login', loseServerLogin: 'loseServerLogin', boundArea: 'boundArea', noWegameArea: 'noWegameArea' },
  /*事件监听注册对象池*/
  eventBack: {},
  areaCookieKey : 'LOLWebSet_AreaBindInfo',
  /*绑定事件.type:参考eventType,backFunc事件触发回调,回调返回L_login对象做为参数,bindThis事件绑定在哪个对象上执行,同一个对象绑定多个相同事件,最后那个有效*/
  on: function (type, backFunc, bindThis) {
      if (!this.eventType[type]) {
          console.log('T_Login不存在这个事件类型');
          return;
      }
      //依据对象是否有hashCode,判断是否放入过注册对象池
      if (!bindThis['T_LoginHashCode']) {
          //不在对象池内
          var hashCode = ++this.hashCode;
          bindThis.T_LoginHashCode = hashCode;
          this.eventBack[hashCode] = bindThis;
          bindThis.TLoginTrigger = this.bindThisTrigger;
          bindThis.TLoginUnbind = this.bindThisUnbind;
      }
      //将事件信息绑定进入对象
      bindThis['T_LoginEventFunc'] || (bindThis['T_LoginEventFunc'] = {});
      bindThis.T_LoginEventFunc[type] = backFunc.bind(bindThis);
  },
  /*注册对象使用的单独trigger*/
  bindThisTrigger: function (type) {
      //this:bindThis
      T_Login.trigger(type, this.T_LoginHashCode);
  },
  /*执行某个事件,不填hashCode默认执行全部注册对象的事件*/
  trigger: function (type, hashCode) {
      if (!this.eventType[type]) {
          console.log(T_Login, '不存在这个事件类型');
          return;
      }
      if (hashCode) {
          if (this.eventBack[hashCode]) {
              this.eventBack[hashCode].T_LoginEventFunc[type] && this.eventBack[hashCode].T_LoginEventFunc[type](this);
          }
      } else {
          for (var key in this.eventBack) {
              this.eventBack[key].T_LoginEventFunc[type] && this.eventBack[key].T_LoginEventFunc[type](this);
          }
      }
  },
  /*注册对象使用的解绑事件,不填类型默认解绑全部事件*/
  bindThisUnbind: function (type) {
      //this:  bindThis
      if (type) {
          //置空bindthis上的对应事件回调.
          T_Login.unbind(this, type);
      } else {
          T_Login.unbind(this);
      }
  },
  /*解绑某个对象上的事件,不填类型默认解绑全部事件*/
  unbind: function (type, bindThis) {
      if (!bindThis['T_LoginHashCode']) {
          console.log('无法解绑', bindThis, '没有注册过事件,');
          return;
      }
      if (type) {
          //置空bindthis上的对应事件回调.
          bindThis.T_LoginEventFunc[type] = null;
      } else {
          //置空bindthis上的全部事件回调.
          bindThis.T_LoginEventFunc = {};
      }
  },
  /*社区接口前缀*/
  apiWeGame: '//lol.ams.game.qq.com/lol/autocms/v1/transit/LOL/LOLWeb/Official/',
  /**20190408新加入的方法,在checklogin里调用 */
  delayCookie:function(){
      var cookieUin = milo.cookie.get('uin', '');
      if (cookieUin) {
          milo.cookie.set('uin', cookieUin, 365 * 24 * 60 * 60, 'qq.com', '/', false);
          milo.cookie.set('uin_cookie', cookieUin, 365 * 24 * 60 * 60, 'qq.com', '/', false);
          milo.cookie.set('ied_qq', cookieUin, 365 * 24 * 60 * 60, 'qq.com', '/', false);
      }
  },
  /*检查是否已经准备好,如果准备好了,返回true,否则false;执行对应回调*/
  checkReady: function (successBack, failBack) {
      if (this.LoginManager && this.RoleSelector) {
          successBack && successBack(this);
          return true;
      } else {
          failBack && failBack(this);
          return false;
      }
  },
  /*检查是否登录过,如果登录过了,返回true,否则false;执行对应回调*/
  checkLogined: function (successBack, failBack) {
      if (this.gAccountId) {
          successBack && successBack(this);
          return true;
      } else {
          failBack && failBack(this);
          return false;
      }
  },
  /*检查是否绑定了大区,失败函数里需要分5种情况判断处理,具体看testLogin.js->bindAreaF
    * 1,正在wegame大区查询,但结果应该是绑定过wegame大区的,所以监听查询wegame大区成功事件,进入后续处理
    * 2,正在wegame大区查询,但结果可能是没有绑定过wegame大区的,所以监听查询wegame大区失败事件,以执行切换大区并绑定
    * 3,登录组件没有执行过askWegameArea,执行askWegameArea;
    * 4,wegame没有绑定大区数据,执行切换大区并绑定
    * 5,服务器登录已经失效,但是客户端cookie还记录是登录
    * */
  checkBoundArea: function (successBack, failBack) {
      //判断是否有大区id存放和是否已经位于请求大区的流程中.
      if (this.gAccountArea && this.askingArea === false) {
          successBack && successBack(this);
          return true;
      } else {
          failBack && failBack(this);
      }
  },
  /*初始化*/
  init: function () {
      milo.ready(function () {
          need(["biz.login", "biz.roleselector"], function (LoginManager, RoleSelector) {
              this.LoginManager = LoginManager;
              this.RoleSelector = RoleSelector;
              //报告准备完成事件
              this.trigger(this.eventType.ready);
          }.bind(this));
      }.bind(this));
  },
  /*尝试获取登录信息,但并不反馈用户登录*/
  tryLogin: function () {
      this.LoginManager.checkLogin(function () {
          this.delayCookie();
          //登录过了,执行login事件
          this.trigger(this.eventType.login);
          //查询是否绑定wegame大区,进入大区请求流程
          this.askWegameArea();
      }.bind(this));
  },
  /*登录*/
  login: function () {
      this.LoginManager.checkLogin(function () {
          //登录过了,执行login事件
          this.trigger(this.eventType.login);
          //查询是否绑定wegame大区,进入大区请求流程
          this.askWegameArea();
      }.bind(this), function () {
          //没有登陆过,执行登录
          this.LoginManager.login();
      }.bind(this));
  },
  /*注销登录,notReload:不刷新页面*/
  logout: function () {
      this.LoginManager.checkLogin(function () {
          this.LoginManager.logout(function () {
              location.reload();
          });
      }.bind(this));
  },
  /*清理logined cookie,在服务器登录态失效下使用*/
  clearLoginedCookie: function () {
      milo.cookie.clear('IED_LOG_INFO2', '.qq.com', '/');
      milo.cookie.clear('p_uin', '.qq.com', '/');
  },
  /*正在查询大区的标识,以下情况为true:正在查询wegame大区及请求大区数据,如果正在查询大区,则不再响应查询要求,直接绑定查询结果事件处理*/
  askingArea: false,
  /*查询wegame大区绑定*/
  askWegameArea: function () {

	  need(["biz.login"], function (LoginManager) {
	  var self = T_Login;
              var key = self.areaCookieKey + '_' + LoginManager.getUserUin();
	  var cookieStr = milo.cookie.get(key);
	  if(cookieStr){
		var data = JSON.parse(decodeURIComponent(cookieStr));
		self.getWegameAreaSuccess(data);
	  }else{
		self.getWegameAreaFail();
	  }
          })


  },
  /*处理wegame返回的大区数据*/
  getWegameAreaSuccess: function (data) {
      //储存大区和账户数据
      this.gAccountArea = data.areaid;
      this.gAccountId = data.roleid;
      //请求头部玩家信息.异步
      this.getPlayerInfo();
  },
  /*社区查询大区和获取大区对应的数据失败*/
  getWegameAreaFail: function () {
      //查询askIngArea结束
      this.askingArea = false;
      //报告没有wegame大区数据
      this.trigger(this.eventType.noWegameArea);
  },
  /*社区查询和获取大区时,登录态失效*/
  handleLoseServerLogin: function () {
      //查询askIngArea结束
      this.askingArea = false;
      //清理登录cookie
      this.clearLoginedCookie();
      //报告未登录
      this.trigger(this.eventType.loseServerLogin);
  },
  /*绑定、更改大区,成功之后向wegame报告新绑定的大区,注意注意,这个方法除了用户主动切换之外,必须执行askWegameArea来检查是否需要changeArea*/
  changeArea: function () {
      var self = this;
      //发起切换大区
      this.LoginManager.checkLogin(function (LoginManager) {
          $('#J_logout').show();
          $(".J_login").hide();
          $('.J_bindarea').show();
          this.RoleSelector.init({
              'gameId': 'lol',
              'isQueryRole': true,
              'isShutdownSubmit': true,
              'submitEvent': function (roleObject) {
				var cookieData =  roleObject.submitData;
				var key = self.areaCookieKey + '_' + cookieData['roleid'];
				milo.cookie.set(key,encodeURIComponent(JSON.stringify(cookieData)), 365 * 24 * 60 * 60, 'qq.com', '/', false);
              }
          });
          this.RoleSelector.show();
      }.bind(this), function () {
          this.LoginManager.login();
      }.bind(this));
  },
  /*请求头部玩家游戏数据*/
  getPlayerInfo: function () {
      var goUrl = this.apiWeGame + 'MobilePlayerInfo,PlayerCommunityInfo,PlayerInfo,PlayerBattleSummary,PlayerHonor,PlayerProperty,PlayerRankInfo?use=zm,uid,acc&area=' + this.gAccountArea + '&season=' + this.nowSeason;
      new T_RequestApi({
          apiUrl: goUrl,
          attach: this,
          successBack: function (data) {
              if (+data.MobilePlayerInfo.status === 0
                  && +data.PlayerCommunityInfo.status === 0
                  && +data.PlayerInfo.status === 0
                  && +data.PlayerBattleSummary.status === 0
                  && +data.PlayerHonor.status === 0) {

                  //存放玩家游戏数据
                  this.attach.gAccountData = data;
                  //标记大区请求结束
                  this.askingArea = false;
                  //报告大区切换事件成功
                  this.attach.trigger(this.attach.eventType.boundArea);
              } else {
                  this.requestOne();
              }
          },
          failBack: function (e) {
              console.log(e);
              console.log('查询玩家社区信息失败,可能是服务繁忙导致的');
              //有可能是服务器没有响应全部的数据,标记大区请求结束,并切换到绑定大区状态
              this.attach.getWegameAreaFail();
          }
      });
  },
  /*根据大区id查询大区名称*/
  getAreaById: function (areaId) {
      if (+areaId === 31) {
          return "峡谷之巅";
      }
      for (var x in LOLServerSelect.STD_DATA) {
          if (+areaId === +LOLServerSelect.STD_DATA[x].v) {
              var areaInfo = LOLServerSelect.STD_DATA[x].t.split(' ');
              return areaInfo[0];
          }
      }
      return '';
  },
  /*解析排位信息,PlayerRankInfo为社区返回的rank信息对象*/
  parseRankInfo: function (PlayerRankInfo) {
      if (+PlayerRankInfo.msg.retCode === 0) {
          var respRankList = PlayerRankInfo.msg.data.item_list;
          for (var i = 0, j = respRankList.length; i < j; ++i) {
              //获取每个段位的url和名字
              //obj.queue 比赛类型原始数据 1 单双排， 4 灵活组排5v5， 5 灵活组排3v3
              respRankList[i] = T_Login.getTierText(respRankList[i]);
          }
          return respRankList;
      } else {
          //排位无数据
          return [
              {
                  extended_battle_type: "单/双排位赛",
                  extended_queue: "",
                  extended_tier: "暂无段位",
                  extended_tier_url: "//ossweb-img.qq.com/images/lol/space/rank/2019pre/default.png"
              },
              {
                  extended_battle_type: "灵活组排5v5",
                  extended_queue: "",
                  extended_tier: "暂无段位",
                  extended_tier_url: "//ossweb-img.qq.com/images/lol/space/rank/2019pre/default.png"
              },
              {
                  extended_battle_type: "灵活组排3v3",
                  extended_queue: "",
                  extended_tier: "暂无段位",
                  extended_tier_url: "//ossweb-img.qq.com/images/lol/space/rank/2019pre/default.png"
              }
          ];
      }
  },
  /*获取段位等数据,被parseRankInfo调用*/
  getTierText: function (obj) {
      switch (+obj.tier) {
          case 0:
              obj.extended_tier = '最强王者';
              obj.extended_tier_url = '//ossweb-img.qq.com/images/lol/space/rank/2019pre/season_2019_challenger.png';
              break;
          case 1:
              obj.extended_tier = '璀璨钻石';
              obj.extended_tier_url = '//ossweb-img.qq.com/images/lol/space/rank/2019pre/season_2019_diamond_' + (obj.queue + 1) + '.png';
              break;
          case 2:
              obj.extended_tier = '华贵铂金';
              obj.extended_tier_url = '//ossweb-img.qq.com/images/lol/space/rank/2019pre/season_2019_platinum_' + (obj.queue + 1) + '.png';
              break;
          case 3:
              obj.extended_tier = '荣耀黄金';
              obj.extended_tier_url = '//ossweb-img.qq.com/images/lol/space/rank/2019pre/season_2019_gold_' + (obj.queue + 1) + '.png';
              break;
          case 4:
              obj.extended_tier = '不屈白银';
              obj.extended_tier_url = '//ossweb-img.qq.com/images/lol/space/rank/2019pre/season_2019_silver_' + (obj.queue + 1) + '.png';
              break;
          case 5:
              obj.extended_tier = '英勇黄铜';
              obj.extended_tier_url = '//ossweb-img.qq.com/images/lol/space/rank/2019pre/season_2019_bronze_' + (obj.queue + 1) + '.png';
              break;
          case 6:
              obj.extended_tier = '超凡大师';
              obj.extended_tier_url = '//ossweb-img.qq.com/images/lol/space/rank/2019pre/season_2019_master.png';
              break;
          case 7:
              obj.extended_tier = '傲世宗师';
              obj.extended_tier_url = '//ossweb-img.qq.com/images/lol/space/rank/2019pre/season_2019_grandmaster.png';
              break;
          case 8:
              obj.extended_tier = '坚韧黑铁';
              obj.extended_tier_url = '//ossweb-img.qq.com/images/lol/space/rank/2019pre/season_2019_iron_' + (obj.queue + 1) + '.png';
              break;
          default:
              obj.extended_tier = '暂无段位';
              obj.extended_tier_url = '//ossweb-img.qq.com/images/lol/space/rank/2019pre/default.png';
              break;
      }
      switch (+obj.queue) {
          case 0:
              obj.extended_queue = 'Ⅰ';
              break;
          case 1:
              obj.extended_queue = 'Ⅱ';
              break;
          case 2:
              obj.extended_queue = 'Ⅲ';
              break;
          case 3:
              obj.extended_queue = 'Ⅳ';
              break;
          // case 4:
          //     obj.extended_queue = 'Ⅴ';
          //     break;
          default:
              //王者、傲世宗师、超凡大师是没有子段位的
              obj.extended_queue = '';
              break;
      }
      switch (+obj.battle_type) {
          case 3:
              obj.extended_battle_type = '灵活组排5v5';
              break;
          case 4:
              obj.extended_battle_type = '单/双排位赛';
              break;
          case 5:
              obj.extended_battle_type = '灵活组排3v3';
              break;
      }

      return obj;
  },
  /*处理掌盟头像信息 o为原地址*/
  parseLogoUrl: function (o) {
      if (typeof (o) === 'string') {
          var logoUrl = o;
          if ((logoUrl.indexOf('qtl_user') !== -1 || logoUrl.indexOf('//p.qpic.cn/qtlinfo') !== -1) && logoUrl.indexOf('/0') < o.length - 2) {
              logoUrl += '/0';
          }
          return logoUrl;
      }
      if (typeof (o) === 'object') {
          for (var i = 0, j = o.length; i < j; ++i) {
              var obj = o[i];
              var logoUrl = obj.logo_url;
              if ((logoUrl.indexOf('qtl_user') !== -1 || logoUrl.indexOf('//p.qpic.cn/qtlinfo') !== -1) && logoUrl.indexOf('/0') < o.length - 2) {
                  logoUrl += '/0';
              }
              obj.logo_url = logoUrl;
          }
          return o;
      }
  }
};
T_Login.init();