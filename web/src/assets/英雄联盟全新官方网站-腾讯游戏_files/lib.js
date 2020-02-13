"use strict";
/******
 * LOL官方网站通用类/方法
 * 包含:js兼容性,CommFunc封装,通用hover显示触发方法,hover播放层内视频方法,request请求封装类,tab切换类,page分页类
 ******/
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
 * CommFunc
 */
window.L_CommFunc = {
    //主要用来刷新资源的
    ran: String(new Date()).split(":")[1]
};
/**
 * hover效果通用初始化方法
 * 不同树级的元素需要hover效果使用,
 * 移入hover触发者和hover层,给hover层添加.show样式类.移出时去掉
 * show一般为{display:block;animation...}
 * 在display:none时,transition动画不生效,建议改为animation作为进入动画
 * @param hoverFrom 触发hover层的$选择器,可同时多个
 * @param hoverLayer 被触发的hover层$选择器,可同时多个
 * @param each 进入被hover的对象时,是否保持hover触发者的.show样式
 * @param hoverFuncBack hover时的回调函数,选填
 * **/
window.hoverShowInit = function (hoverFrom, hoverLayer, each, hoverFuncBack, delayShow) {
    var hover$ = $(hoverLayer);
    var hoverFrom$ = $(hoverFrom);
    var outTimeout;
    var showTimeout;
    var delayShow = delayShow || 0;
    $(hoverFrom + ',' + hoverLayer).on('mouseenter', function (e) {
        e.preventDefault();
        e.stopPropagation();
        //移入hover层和hover触发者
        clearTimeout(outTimeout);
        clearTimeout(showTimeout);
        showTimeout = setTimeout(function () {
            if (!hover$.hasClass('show')) {
                hover$.addClass('show');
                hoverFuncBack && hoverFuncBack();
            }
            if (each === true && !hoverFrom$.hasClass('show')) {
                hoverFrom$.addClass('show');
            }
        }, delayShow);

    }).on('mouseleave', function (e) {
        e.preventDefault();
        e.stopPropagation();
        //移出hover层和hover触发者,因为元素间隔和子元素的原因,可能会频发触发out,所以使用延迟避免闪烁
        clearTimeout(outTimeout);
        clearTimeout(showTimeout);
        outTimeout = setTimeout(function () {
            hover$.removeClass('show');
            hoverFrom$.removeClass('show');
        }, 100);
    });
};
/**
 * hover播放层内视频通初始化方法,移除时停止播放
 * 内层视频必须带有data-vid,ID,data-width,data-height属性
 * @param container 内层包含视频的$选择器,可同时多个
 */
window.hoverPlayInnerVideo = function (container) {
    var tempcontainer = $(container);
    var innerVideo = tempcontainer.find('[data-vid]');
    var tempVideoPlayer;
    var isPause = true;
    var timeout;
    var playTimeout;
    //创建视频
    tempVideoPlayer = new Txplayer({
        containerId: innerVideo[0].id,
        vid: innerVideo.attr('data-vid'),
        width: innerVideo.attr('width'),
        height: innerVideo.attr('height'),
        autoplay: false
    });
    //监听hover
    tempcontainer.on('mouseenter', function (e) {
        e.stopPropagation();
        e.preventDefault();
        clearTimeout(playTimeout);
        playTimeout = setTimeout(function () {
            try {
                //以免进入时，播放组建还未初始化完成
                tempVideoPlayer.on('ready', function () {
                    tempVideoPlayer.play();
                });
                clearTimeout(timeout);
                tempVideoPlayer.play();
                tempVideoPlayer.unMute();
                isPause = false;
            } catch (e) {
                console.log(e);
            }
        }, 100);
    });
    //离开监听
    tempcontainer.on('mouseleave', function (e) {
        e.stopPropagation();
        e.preventDefault();
        clearTimeout(playTimeout);
        timeout = setTimeout(function () {
            try {
                isPause = true;
                tempVideoPlayer.pause();
                tempVideoPlayer.mute();
            } catch (e) {
                console.log(e);
            }
        }, 100);
    });
    //视频暂停监听,弥补tempVideoPlayer.pause在加载执行不成效,导致视频加载后继续播放
    tempVideoPlayer.on('timeupdate', function () {
        if (isPause === true) {
            clearTimeout(playTimeout);
            tempVideoPlayer.pause();
        }
    })
};
/**
 * 封装Jquery请求类,若请求失败,会重复请求
 * params:{
 * tryTimes:尝试次数,默认3次,
 * tryInterval:每次尝试间隔时间,默认500毫秒
 * $requestType:ajax和getScript,必填,不同类型的接口对应的处理方式不一样,
 * successBack:必填,执行成功回调.
 * errorBack:请求发生错误回调函数,每次发生错误都会执行.该函数必须返回false不发起/true发起,告知错误处理方法是否继续发起下一次请求.
 * failBack:尝试次数用尽,执行失败回调,回调都绑定在改请求对象下执行.
 * timeOut:超时时间,在请求类型为ajax下有效
 * data:在请求类型为ajax下使用,指$.ajax(data),不要包含url,success和error回调函数,使用apiUrl,successBack和failBack
 * apiUrl:必填.
 * attach:附加的对象,可以把某些对象存在这里.
 * }
 * 注意,若使用jsonp,编译相关的参数正常还一直报parsererror错,八成是服务器返回的不是标准json数据,有3种方法:
 * 1要求服务返回正常数据,不能是var 某某值 = {}这种类型,必须是纯{};
 * 2在不能修改的情况下,推荐这个方法,已在示例里更新.在data,添加参数jsonpCallback:test//自己定,再添加一个dataFilter方法:function(data,type){test(某某值)};
 * 3尝试次数设置为1,在data里添加complete函数来处理,complete里能拿到 某某值 这个变量.successBack设置为空函数,
 * **/
window.RequestApi = function (params) {
    //类型判断
    if (!(this instanceof RequestApi)) return new RequestApi(params);

    /**数据部分*/
    this.tryTimes = params['tryTimes'] || 3;
    this.timeOut = params['timeOut'] || 2000;
    this.tryInterval = params['tryInterval'] || 800;
    this.apiUrl = params.apiUrl;
    this.$requestType = params.$requestType;
    this.successBack = params.successBack;
    this.failBack = params['failBack'] || null;
    this.params = params;
    this.request$ = null;
    this.errorBack = params['errorBack'] || function () {
        return true;
    };
    this.attach = params['attach'] || null;
    /**数据部分 end*/

    /**方法部分*/
    this.requestOne = function (immediately) {
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
            //判断是否选择延后处理
            setTimeout(function () {
                switch (this.$requestType) {
                    case 'ajax': {
                        this.ajax();
                        break;
                    }
                    case 'getScript': {
                        this.getScript();
                        break;
                    }
                }
            }.bind(this), delayTime);
        }
    };
    this.handleError = function (XMLHttpRequest, textStatus) {
        console.log("失败: " + this.apiUrl, textStatus);
        //执行error回调,判断是否应该自动发起下一次尝试
        this.errorBack(XMLHttpRequest, textStatus) && this.requestOne();
    };
    this.ajax = function () {
        var data = this.params.data;
        data['success'] = function (data) {
            this.successBack(data);
        }.bind(this);
        data['timeout'] = this.timeOut;
        data['error'] = this.handleError.bind(this);
        data['url'] = this.apiUrl;
        this.request$ = $.ajax(data);
    };
    this.getScript = function () {
        this.request$ = $.getScript(this.params.apiUrl).done(this.successBack.bind(this)).fail(this.handleError.bind(this));
    };
    /**方法部分 end*/

    //初始化完成,执行第一次尝试
    this.requestOne(true);
};
/**
 * tab切换类,
 * 注意:如没有firstShow=false.会自动选择一个标题trigger(事件);
 * p_title:tab标题选择器
 * p_content:tab内容选择器
 * p_way:触发事件,默认mouseover
 * allowCloseTab:在开启的情况下,再次触发是否执行关闭函数,默认false
 * changeStartBack:开始切换回调事件
 * firstShow:是否在初始化的时候根据selected或者第一个title显示一个content,默认true
 * showMany:是否打开多个,默认false
 * titleShow:{标题切换的参数
                    type:style和class,
                    如果是style则以下参数有效
                    styleKey:默认display
                    in_styleValue:默认block
                    out_styleValue:默认none
                    如果是class,则以下参数有效
                    className:默认.selected
                }
 * contentShow:内容切换的参数,格式与titleShow一致
 * **/
window.L_CommTab = function (params) {
    //创建一个tab切换对象
    var _self = this;
    this.params = params;

    //合并参数
    this.titleShow = {
        type: 'class',
        className: 'selected'
    }
    this.contentShow = {
        type: 'style',
        styleKey: 'display',
        in_styleValue: 'block',
        out_styleValue: 'none'
    }
    params['titleShow'] && $.extend(this.titleShow, params.titleShow);
    params['contentShow'] && $.extend(this.contentShow, params.contentShow);

    this.lastIndex = null;
    this.showMany = params['showMany'] || false;//是否单一显示
    this.v_title = $(params['p_title']);//标题$
    this.v_content = $(params['p_content']);//内容$
    this.p_way = params['p_way'] || 'mouseover';//触发事件
    this.changeStartBack = params['changeStartBack'] || function (e) {
    }//切换回调函数
    this.allowCloseTab = params['allowCloseTab'] || false;//再次点击,是否允许关闭
    this.firstShow = (params['firstShow'] === false) ? 0 : 1;//初始化的时候时候显示selected或者第一个

    //循环赋予下标
    for (var i = 0, j = this.v_title.length; i < j; ++i) {
        this.v_title.eq(i).attr('data-tabindex', i);
        this.v_content.eq(i).attr('data-tabindex', i);
    }
    //改变一个标题或者内容的显示
    this.changeShow = function (aim, index, showParam) {
        var aimAll, aimOne;
        aimAll = (this.showMany) ? null : aim;
        aimOne = aim.eq(index);
        switch (showParam.type) {
            case 'style': {
                aimAll && aimAll.css(showParam.styleKey, showParam.out_styleValue);
                aimOne.css(showParam.styleKey, showParam.in_styleValue);
                break;
            }
            case 'class': {
                aimAll && aimAll.removeClass(showParam.className);
                aimOne.addClass(showParam.className);
                break;
            }
        }
        aimAll && aimAll.attr('data-tabstatus', 'closed');
        aimOne.attr('data-tabstatus', 'opened');
    }
    //关闭函数
    this.closeOne = function (index) {
        switch (this.titleShow.type) {
            case 'style': {
                this.v_title.eq(index).css(this.titleShow.styleKey, this.titleShow.out_styleValue);
                break;
            }
            case 'class': {
                this.v_title.eq(index).removeClass(this.titleShow.className);
                break;
            }
        }
        switch (this.contentShow.type) {
            case 'style': {
                this.v_content.eq(index).css(this.contentShow.styleKey, this.contentShow.out_styleValue);
                break;
            }
            case 'class': {
                this.v_content.eq(index).removeClass(this.contentShow.className);
                break;
            }
        }
        this.v_title.eq(index).attr('data-tabstatus', 'closed');
        this.v_content.eq(index).attr('data-tabstatus', 'closed');
    }
    //切换函数
    this.changeTo = function (index) {
        //执行回调
        this.changeStartBack(this.v_title.eq(index));
        //切换显示标题
        this.changeShow(this.v_title, index, this.titleShow);
        //切换显示内容
        this.changeShow(this.v_content, index, this.contentShow);

        this.lastIndex = index;
    }
    //前进后退切换
    this.changeTitle = function (direction) {
        var goIndex = this.lastIndex;
        switch (direction) {
            case 'prev': {
                --goIndex;
                break;
            }
            case 'next': {
                ++goIndex;
                break;
            }
        }
        if (goIndex < 0) {
            goIndex = this.v_title.length - 1;
        } else if (goIndex >= this.v_title.length) {
            goIndex = 0;
        }
        this.changeTo(goIndex);
    }
    //title绑定事件
    this.v_title.on(this.p_way, function () {
        var tempThis = $(this);
        var tempIndex = tempThis.attr('data-tabindex');
        //重复点击,关闭
        if (tempThis.attr('data-tabstatus') === 'opened' && _self.allowCloseTab) {
            _self.closeOne(tempIndex);
        }
        //正常切换
        else {
            _self.changeTo(tempIndex);
        }
    })
    //主动切换到目前有selected或者第一个
    if (this.firstShow) {
        var tempIndex = this.v_title.parent().children('.selected');
        tempIndex = (tempIndex.length > 0) ? tempIndex.index() : 0;
        this.changeTo(tempIndex);
    }
    return this;
};
/**
 * navigation分页器
 * 需要页面内含有#J_navigation容器和#J_navigationTemplate模板
 * 组件只负责切换和报告切换的页码,不涉及数据操作
 * @param navigationContainer 必填,分页容器的id,
 * @param navigationTemplate 必填,分页模板的id,
 * @param maxPage 必填,整个分页有多少
 * @param dataName 选填,对应数据块名称,多数据块共用一个分页器,并发生异步填充,其他控制组件可以借此判断当前填充数据与当前分页器代表的数据是否一致,同时判断发起请求时的nowPage和当前的nowPage是否一致,保证填充的数据分页为最后一个点击的分页.
 * @param maxShow 选填,默认6,显示多少个分页标签
 * @param initPage 选填,默认1,初始化时,选中第几页
 */
window.L_Navigation = function (param) {
    this.templateData = {
        nowPage: null,
        maxPage: param.maxPage,
        maxShow: param.maxShow || 6,
        showIndexArray: null,
        dataName: param.dataName || 'default',
    };

    this.container = $('#' + param.navigationContainer);
    this.navigationTemplateId = param.navigationTemplate;

    //进入第一页
    this.changeTo(param.initPage || 1);

    //监听各标签点击事件
    this.container.on('click', this.monitorClickEvent.bind(this));
};
L_Navigation.prototype.changeTo = function (index) {
    //调整不合规的页面序号
    index = +index;
    if (isNaN(index)) {
        return;
    }
    else if (index <= 0) {
        index = 1;
    } else if (index > this.templateData.maxPage) {
        index = this.templateData.maxPage;
    }
    //改变当前记录的选中页码
    this.templateData.nowPage = index;
    //填充到页面去
    this.fullTemplate();
    //执行回调
    this.onChangePageNumber(this.templateData);
};
L_Navigation.prototype.culPageIndex = function () {
    //计算页码分布;
    var td = this.templateData;
    var resultIndexArray = [];
    //当前页码及之后的
    var temp;
    for (var i = 0, j = td.maxShow; i < j; ++i) {
        temp = td.nowPage + i;
        if (temp > 0 && temp <= td.maxPage) {
            resultIndexArray.push(td.nowPage + i);
        }
    }
    //补前面的
    for (i = 1, j = td.maxShow - resultIndexArray.length; i <= j; ++i) {
        temp = td.nowPage - i;
        if (temp > 0 && temp <= td.maxPage) {
            resultIndexArray.unshift(td.nowPage - i);
        }
    }
    td.showIndexArray = resultIndexArray;
};
L_Navigation.prototype.onClickNavigation = function (data) {
    //点击分页器使用,如果需要监听这个事件的,直接在实例上替换这个函数.
};
L_Navigation.prototype.onChangePageNumber = function (data) {
    //改变页码时执行函数,需要监听这个事件的,直接在实例上替换这个函数.
};
L_Navigation.prototype.fullTemplate = function () {
    //多数据块共用一个分页器,发生页码错误,可以重设nowPage和maxPage再执行这个方法,以刷新分页显示,
    //以上注释是一个补救方法,严格的方法应该是如dataName参数所说.
    //计算当前选中页码时,页码列表的分布
    this.culPageIndex();
    //填充
    this.container.html(template(this.navigationTemplateId, this.templateData));
};
L_Navigation.prototype.monitorClickEvent = function (e) {
    var tempTarget = $(e.target);
    var type = tempTarget.attr('data-type');
    if (!type) return;

    switch (type) {
        case 'index': {
            this.changeTo(tempTarget.html());
            break;
        }
        case 'pre': {
            this.changeTo(this.templateData.nowPage - 1);
            break;
        }
        case 'next': {
            this.changeTo(this.templateData.nowPage + 1);
            break;
        }
        case 'goto': {
            this.changeTo(tempTarget.siblings('input').val());
            break;
        }
    }
    this.onClickNavigation(this.templateData);
};
/******
 * 时间整数单位,转换为日期格式字符串:
 * 常用于视频时长转换,但是注意,有些接口返回的数据是转换过的,注意判断.
 * time:需要转换的时间,
 * unit:时间单位,
 * basePlace:最低保留时间单位,时间不进位到这个单位时,也记为0进位.
 * userTimeParam:[{name:'second',place:'2',separator:'-'},{name:'minute',place:'2'}],对时间基数自定义,从小到大
 * ******/
window.L_timeToDate = function (time, unit, basePlace, userTimeParam) {
    /***定义返回mod和remain函数***/
    var getMod = function (number, mod, place) {
        var place = place * 1 || 0;
        //取mod,并处理保留位数;默认向前保留0位数;若自定义保留位数,10 ^ (place-1)必须大于mod,否则会损失数大位
        var resultMod = (place) ? (Array(place).join(0) + (number % mod)).slice(-place) : (number % mod);
        //去掉mod数后剩下的数
        var resultRemain = number / mod >> 0;
        //返回
        return { mod: resultMod, remain: resultRemain };
    };

    /***每个时间基数的默认参数***/
    var defaultTimeParam = [
        { name: 'millisecond', mod: 1000, place: 0, separator: ':' },
        { name: 'second', mod: 60, place: 2, separator: ':' },
        { name: 'minute', mod: 60, place: 2, separator: ':' },
        { name: 'hour', mod: 24, place: 2, separator: ':' },
        { name: 'day', mod: 31, place: 2, separator: ':' },
        { name: 'month', mod: 12, place: 2, separator: ':' },
        { name: 'year', mod: 10000, place: 0, separator: ':' }
    ];
    var timeNameIndex = {
        millisecond: 0,
        second: 1,
        minute: 2,
        hour: 3,
        day: 4
    };

    /***合并自定义参数进入默认参数***/
    var getArrayByJsonName = function (name, array) {
        for (var i = 0, j = array.length; i < j; ++i) {
            if (array[i].name === name) {
                return array[i];
            }
        }
    };
    var conbineParam = function (u, d) {
        var tempU, tempD;
        for (var i = 0, j = u.length; i < j; ++i) {
            tempU = u[i];
            tempD = getArrayByJsonName(tempU.name, d);
            for (var key in tempU) {
                tempD[key] = tempU[key];
            }
        }
    };
    if (userTimeParam) {
        conbineParam(userTimeParam, defaultTimeParam);
    }

    //去掉最小单位的末尾分隔符
    var firstTimeParam = getArrayByJsonName(unit, defaultTimeParam);
    firstTimeParam.separator = '';


    /***开始转换时间***/
    var counted = '', remain = time, tempParam, tempFuncResult;
    for (var i = timeNameIndex[unit], j = defaultTimeParam.length; i < j; ++i) {
        //拿到最小单位对应的参数
        tempParam = defaultTimeParam[i];
        //计算mod和remain
        tempFuncResult = getMod(remain, tempParam.mod, tempParam.place);
        //合并到返回的字符串
        counted = '' + tempFuncResult.mod + tempParam.separator + counted;

        //替换剩下的数值
        remain = tempFuncResult.remain;

        if (remain === 0 && i >= timeNameIndex[basePlace]) {
            break;
        }
    }
    return counted;
};
/**
 *
 * 十进制数字,单位进制到最大基单位
 * 常用与播放次数转换,但是注意,有些接口返回的数据是转换过的,注意判断.
 * @param oNumber 被转换的帧数
 * @param holdDecimal 保留小数位
 * @param oNumberUnit 被转换的整数单位,参考numberUnit里的key,默认个位
 */
window.L_converUnit = function (oNumber, oNumberUnit, holdDecimal) {
    var oNumberUnit = oNumberUnit || 'ones';
    //单位顺序,从小到大
    var unitKeyOrder = {
        ones: 0,
        tenThousand: 1,
        hundredMillion: 2
    };
    var numberUnitData = [
        {
            key: 'ones',
            baseNumber: 1,
            chat: ''
        },
        {
            key: 'tenThousand',
            baseNumber: 10000,
            chat: '万'
        },
        {
            key: 'hundredMillion',
            baseNumber: 100000000,
            chat: '亿'
        }
    ];
    //将oNumber转为个位
    oNumber *= numberUnitData[unitKeyOrder[oNumberUnit]].baseNumber;
    //循环判断进位,从最大开始计算
    var temp;
    var result = oNumber;
    var tempPow;
    for (var i = numberUnitData.length - 1, j = unitKeyOrder[oNumberUnit]; i >= j; --i) {
        temp = numberUnitData[i];
        result = oNumber / temp.baseNumber;
        if (result >= 1) {
            if (typeof (holdDecimal) !== 'undefined') {
                tempPow = Math.pow(10, holdDecimal);
                result = Math.round(result * tempPow) / tempPow;
            }
            result += temp.chat;
            break;
        }
    }
    return result;
};
/**
 * 转换更新时间,超过一天的直接返回完整日期
 * 常用于更新时间.
 * */
window.convertUpdate = function (oDate) {
    var iDate = new Date(oDate.replace(/\-/g, '/'));
    var nDate = new Date();
    var difference = nDate - iDate;

    var clockDate = [
        {
            chat: '天',
            base: 1000 * 60 * 60 * 24
        },
        {
            chat: '小时',
            base: 1000 * 60 * 60
        },
        {
            chat: '分钟',
            base: 1000 * 60
        },
        {
            chat: '秒',
            base: 1000
        }
    ];
    var result = oDate.substr(0, 10);
    if (difference / clockDate[0].base >= 1) {
        return result;
    }
    for (var i = 1, j = clockDate.length; i < j; ++i) {
        result = difference / clockDate[i].base;
        if (result >= 1) {
            result = result >> 0;
            result += clockDate[i].chat + '前';
            return result;
        }
    }
};
/*从json对象数组,寻找一个返回条件值相同的,如all:true,会返回result和remain两种数据*/
window.searchKeyValueEqualArray = function (aArray, key, value, all) {
    var tempA;
    var result = [];
    var remain = [];
    for (var ai = 0, aj = aArray.length; ai < aj; ++ai) {
        tempA = aArray[ai];
        if (tempA[key] == value) {
            if (all) {
                result.push(tempA);
            } else {
                return tempA;
            }
        } else {
            remain.push(tempA);
        }
    }
    aArray = null;
    return {
        result: result,
        remain: remain
    }
};
/** 缩放页面,以解决内容尺寸过大问题*/
window.L_ZoomPage = {
    minWidth: 1246,
    maxWidth: 1358 + 16 + 42,
    zoomBox: null,
    window$: null,
    $el: null,
    $body: null,
    isIe: null,
    init: function () {
        this.isIe = L_isIE();
        this.zoomBox = $('.g-zoombox');
        this.window$ = $(window);
        this.$el = $('.comm-head,.comm-topact,.foot-wrap');
        this.$body = $('body');
        //处理屏幕缩放
        this.window$.on('resize', this.checkScale.bind(this));
        this.checkScale();
    },
    checkScale: function () {
        //处理缩放盒子
        var screenW = this.window$.width();
        var scaleW, scaleV;
        if (screenW > this.minWidth && this.maxWidth > screenW) {
            scaleW = screenW;
        } else if (screenW <= this.minWidth) {
            scaleW = this.minWidth;
        } else {
            scaleW = this.maxWidth;
        }
        scaleV = scaleW / this.maxWidth;
        this.zoomBox.css({
            'zoom': scaleV
        });
        if (this.isIe) {
            this.ieHandle(scaleV);
        }
    },
    //ie额外处理
    ieHandle: function (scaleV) {
        var pageW = this.window$.width();
        if (pageW < 1247) {
            this.$body.css('overflowX', 'scroll');
        } else {
            this.$body.css('overflowX', 'hidden');
        }
        //ie,zoom之后margin居中失败
        if (pageW < this.maxWidth && pageW > this.minWidth) {
            this.zoomBox.css('marginLeft', (pageW - this.zoomBox.width() * scaleV) / 2 - 8);
        } else {
            this.zoomBox.css('marginLeft', '0');
        }
    }
};
/**
 * 扩展milo懒加载部分,
 * 封装随时增加懒加载元素的方法,
 * 新增触发懒加载后替换data-imgsrc为img的src
 * 元素只会触发一次懒加载回调,但是
 * 因为活动大图会缩小360高度导致懒加载组件判断失败,所以需要在改动后需要再次将元素加入到懒加载组件内,重新计算位置信息,
 * 这样势必会导致再次执行回调函数,所以回调函数内都需要做判断是否已经执行过
 * 同时,因为会将所有增加过监听的元素重新绑定,所以不要绑定太多元素,遍历量会很大.
 * **/
window.DelayExpand = {
    needAddDelayQueue: [],//还没加入到懒加载监听的队列
    addedDelayQueue: [],//已经加入到懒加载的监听队列
    delayLoad: null,
    /**引入milo懒加载部分*/
    init: function () {
        // 引入delayLoad组件
        need(["biz.delayLoad"], function (e) {
            DelayExpand.delayLoad = e;
            //把在加载期间要求绑定懒加载的对象绑定一遍.
            DelayExpand.forNeedAddDelayQueue();
        });
    },
    /**增加一个需要监听的$对象*/
    addDelay: function (data) {
        this.needAddDelayQueue.push(data);
        //懒加载组件还没加载好,暂时跳过新增,等待组件加载完成之后执行this.forNeedAddDelayArray();
        if (!this.delayLoad) return;

        this.forNeedAddDelayQueue();
    },
    /**遍历needAddDelayArray,加入到监听*/
    forNeedAddDelayQueue: function () {
        var tempOne;
        for (var i = 0, j = this.needAddDelayQueue.length; i < j; ++i) {
            tempOne = this.needAddDelayQueue[i];
            if (tempOne.hasOwnProperty('delayRunFunc')) {
                //有处理函数,说明只是这个dom需要监听
                this.delayLoad.lazyLoad(tempOne.$el[0], tempOne.delayRunFunc);
            } else {
                //没有处理函数,是子元素要监听
                tempOne.$el.find('[delayload]').each(function () {
                    var tempThis = $(this);
                    DelayExpand.delayLoad.lazyLoad(this, tempThis.attr('delayload'));
                });
            }
        }
        //不再清空队列,保留元素记录,应对注释里说的情况
        //this.needAddDelayQueue = [];
    }
};
/**
 * 新闻类型数据存放
 * 有5种样式,
 * 1 news 默认, 分配给新闻/娱乐/纯其他
 * 2 inform 公告 分配给官方及下列
 * 3 event 赛事 分配给赛事及下列
 * 4 amusement 娱乐 ->分配给视频及下列
 * 5 tutorial 教学 ->分配给教学及下列
 * 若资讯里出现视频标签,也就是去往视频中心的,就默认使用video.
 * */
window.sTagIdsTagsKey = {
    ndefault: { n_tag: '默认', n_class: 'news', c_tag: '新闻' },
    video: { n_tag: '带视频id', n_class: 'amusement', c_tag: '视频' },
    1253: { n_tag: '视频', n_class: 'amusement', c_tag: '视频' },
    1254: { n_tag: '视频-娱乐', n_class: 'amusement', c_tag: '视频' },
    1255: { n_tag: '视频-娱乐-主播视频', n_class: 'amusement', c_tag: '视频' },
    1256: { n_tag: '视频-娱乐-精彩操作', n_class: 'amusement', c_tag: '视频' },
    1257: { n_tag: '视频-娱乐-欢乐搞笑', n_class: 'amusement', c_tag: '视频' },
    1258: { n_tag: '视频-娱乐-同人动画', n_class: 'amusement', c_tag: '视频' },
    1259: { n_tag: '视频-娱乐-其他', n_class: 'amusement', c_tag: '视频' },
    1260: { n_tag: '视频-赛事', n_class: 'amusement', c_tag: '视频' },
    1261: { n_tag: '视频-赛事-比赛集锦', n_class: 'amusement', c_tag: '视频' },
    1262: { n_tag: '视频-赛事-人物采访', n_class: 'amusement', c_tag: '视频' },
    1263: { n_tag: '视频-赛事-分析评论', n_class: 'amusement', c_tag: '视频' },
    1264: { n_tag: '视频-赛事-其他', n_class: 'amusement', c_tag: '视频' },
    1496: { n_tag: '视频-赛事-全场回顾', n_class: 'amusement', c_tag: '视频' },
    1265: { n_tag: '视频-教学', n_class: 'amusement', c_tag: '视频' },
    1266: { n_tag: '视频-教学-外服抢先看', n_class: 'amusement', c_tag: '视频' },
    1267: { n_tag: '视频-教学-玩法教学', n_class: 'amusement', c_tag: '视频' },
    1268: { n_tag: '视频-教学-版本解读', n_class: 'amusement', c_tag: '视频' },
    1269: { n_tag: '视频-教学-其他', n_class: 'amusement', c_tag: '视频' },
    1270: { n_tag: '视频-官方', n_class: 'amusement', c_tag: '视频' },
    1271: { n_tag: '视频-官方-CG动画', n_class: 'amusement', c_tag: '视频' },
    1272: { n_tag: '视频-官方-音乐作品', n_class: 'amusement', c_tag: '视频' },
    1273: { n_tag: '视频-官方-英雄', n_class: 'amusement', c_tag: '视频' },
    1274: { n_tag: '视频-官方-皮肤', n_class: 'amusement', c_tag: '视频' },
    1275: { n_tag: '视频-官方-开发者基地', n_class: 'amusement', c_tag: '视频' },
    1276: { n_tag: '视频-官方-其他', n_class: 'amusement', c_tag: '视频' },
    1278: { n_tag: '娱乐趣闻', n_class: 'news', c_tag: '娱乐' },
    1279: { n_tag: '娱乐与趣闻', n_class: 'news', c_tag: '娱乐' },
    1280: { n_tag: '赛事', n_class: 'event', c_tag: '赛事' },
    1281: { n_tag: '赛事-国内赛事', n_class: 'event', c_tag: '赛事' },
    1282: { n_tag: '赛事-其他赛区', n_class: 'event', c_tag: '赛事' },
    1283: { n_tag: '赛事-国际赛事', n_class: 'event', c_tag: '赛事' },
    1284: { n_tag: '赛事-其他', n_class: 'event', c_tag: '赛事' },
    1285: { n_tag: '教学', n_class: 'tutorial', c_tag: '教学' },
    1286: { n_tag: '教学-英雄教学', n_class: 'tutorial', c_tag: '教学' },
    1287: { n_tag: '教学-综合攻略', n_class: 'tutorial', c_tag: '教学' },
    1288: { n_tag: '教学-版本解读', n_class: 'tutorial', c_tag: '教学' },
    1289: { n_tag: '教学-外服快讯', n_class: 'tutorial', c_tag: '教学' },
    1290: { n_tag: '教学-其他', n_class: 'tutorial', c_tag: '教学' },
    1291: { n_tag: '官方', n_class: 'inform', c_tag: '官方' },
    1292: { n_tag: '官方-公告', n_class: 'inform', c_tag: '公告' },
    1293: { n_tag: '官方-新闻', n_class: 'inform', c_tag: '新闻' },
    1294: { n_tag: '官方-其他', n_class: 'inform', c_tag: '其他' },
    1334: { n_tag: '官方-版本', n_class: 'inform', c_tag: '版本' },
    1569: { n_tag: '官方-论坛', n_class: 'inform', c_tag: '论坛' },
    1295: { n_tag: '其他', n_class: 'news', c_tag: '其他' },
    1934: { n_tag: '掌盟', n_class: 'news', c_tag: '新闻' },
    1938: { n_tag: '掌盟-图文', n_class: 'news', c_tag: '新闻' },
    1940: { n_tag: '掌盟-教学', n_class: 'tutorial', c_tag: '教学' },
    1939: { n_tag: '掌盟-视频', n_class: 'amusement', c_tag: '视频' },
    1941: { n_tag: '掌盟-教学', n_class: 'amusement', c_tag: '视频' },
    1942: { n_tag: '掌盟-娱乐', n_class: 'amusement', c_tag: '视频' }
};
/**
 * 赛事部分游戏模式的对应关系
 * 1234...是gamemode的值
 */
window.gameModeList = {
    1: 'BO1',
    2: 'BO2',
    3: 'BO3',
    4: 'BO5',
    5: '射手模式',
    6: '刺客模式',
    7: '克隆大作战',
    8: '双人共玩',
    9: '魄罗王大战',
    10: '极限闪击战',
    11: '无限火力'
}
/**判断是否是ie兼容性使用*/
window.L_isIE = function () {
    if (!!window.ActiveXObject || "ActiveXObject" in window) {
        return true;
    }
    else {
        return false;
    }
};
/**加载提示封装*/
window.addLoadingTip = function (tipType, parent$select, containertag, needPolo) {
    var containertag = containertag || "span";
    var wrap = $(document.createElement(containertag));
    wrap.addClass('loading-tip');
    var poloimg = $('<img>');

    var tipA = $('<a></a>');
    switch (tipType) {
        case 'fail': {
            poloimg.attr('src', '//ossweb-img.qq.com/images/lol/v3/polo-sleep.gif');
            tipA.text('加载失败,请稍后重试');
            break;
        }
        case 'ing': {
            poloimg.attr('src', '//ossweb-img.qq.com/images/lol/v3/polo.gif');
            tipA.text('正在加载');
            break;
        }
    }
    if (needPolo) {
        wrap.append(poloimg);
    }
    wrap.append(tipA);
    $(parent$select).html(wrap);
    return wrap;
};

/**赛事数据处理部分*/
window.matchDataHandle = {
    /*处理赛事状态，以便模板渲染时样式对应*/
    MatchStatusData: [['wait', '未开始'], ['now', '正在直播'], ['over', '已结束']],
    handleStatus: function (MatchStatus) {
        return this.MatchStatusData[+MatchStatus - 1];
    },
    /*分离对局两队名称*/
    splitMatchName: function (matchName) {
        var res = ['', ''];
        if (matchName.indexOf('vs') !== -1) {
            res = matchName.split('vs');
        } else if (matchName.indexOf('VS') !== -1) {
            res = matchName.split('VS');
        }
        for (var i = 0, j = res.length; i < j; ++i) {
            res[i] = res[i].replace(/\s+/g, '');
        }
        return res;
    },
    /*判断哪队胜利*/
    checkWin: function (dataOne) {
        //哪队赢了
        if (dataOne.ScoreA > dataOne.ScoreB) {
            dataOne.isAWin = 'win';
        } else if (dataOne.ScoreA < dataOne.ScoreB) {
            dataOne.isBWin = 'win';
        }
    },
    /**
     * 处理比赛时间
     * needFixed:对象，制定某一个类型的时间是否小于10时保留0；key位gY,gMonth,等
     * */
    convertMatchTime: function (matchDate, needFixed) {
        var tempDate = new Date(matchDate.replace(/\-/g, '/'));
        var tempdate = { dateObj: tempDate };
        tempdate['gY'] = tempDate.getFullYear();
        tempdate['gMonth'] = tempDate.getMonth() + 1;
        tempdate['gD'] = tempDate.getDate();
        tempdate['gH'] = tempDate.getHours();
        tempdate['gM'] = tempDate.getMinutes();
        if (needFixed) {
            for (var key in needFixed) {
                var temp = tempdate[key];
                tempdate[key] = (temp < 10) ? ("0" + temp) : (temp);
            }
        }
        return tempdate;
    },
    /*从json对象数组,寻找一个返回条件值相同的下标*/
    searchKeyValueEqualArray: function (aArray, key, value) {
        var tempA;
        for (var ai = 0, aj = aArray.length; ai < aj; ++ai) {
            tempA = aArray[ai];
            if (tempA[key] == value) {
                return ai
            }
        }
        return false;
    },
    /*搜索需要初始化显示的比赛，顺序为第一个正在直播的-第一个未开始的，最后一局*/
    getFirstShowMatch: function (matchList) {
        //寻找第一个正在直播的比赛
        var fristShowMatch = this.searchKeyValueEqualArray(matchList, 'MatchStatus', '2');
        //没有找到正在直播的，寻找最近一个未开始的。
        if (fristShowMatch === false) {
            fristShowMatch = this.searchKeyValueEqualArray(matchList, 'MatchStatus', '1');
        }
        //没有找到未开始的，转到最后
        if (fristShowMatch === false) {
            fristShowMatch = matchList.length - 1;
        }
        return fristShowMatch;
    }
};
/**活动模块数据处理部分 */
window.activityDataHandle = {
    /**将日期从横杠转为斜杠并实例化对应的时间对象*/
    getDate: function (dateStaring) {
        return new Date(dateStaring.replace(/\-/g, '/'));
    },
    /**计算结束剩余时间*/
    culRemainTime: function (oneData) {
        if (!oneData.dtEnd) return '';
        var nowDate = new Date();
        var dtEnd = this.getDate(oneData.dtEnd + ' 23:59:59');

        return (dtEnd - nowDate) / 86400000;
    },
    /**根据剩余时间返回提示字符串*/
    culOverTimeTip: function (oneData) {
        var remainTime = this.culRemainTime(oneData);
        if (remainTime <= 1 && remainTime > 0) {
            return '今天结束';
        } else if (remainTime < 0) {
            return '已结束';
        } else if (remainTime > 1) {
            return (remainTime >> 0) + '天后结束';
        } else {
            return '';
        }
    },
    /**计算是否是新活动,如果开始时间离现在小于7天则认为是新活动*/
    checkNewAct: function (oneData) {
        if (!oneData.dtBegin) return false;

        var nowDate = new Date();
        var dtBegin = this.getDate(oneData.dtBegin);

        if ((nowDate - dtBegin) / 86400000 < 7) {
            return true;
        } else {
            return false;
        }
    }
}
window.LOLDataUnit = {
    /**从数据数组中,通过字段和值获取对应值的全部数据 */
    filterDataFromDataList:function(data,key,value){
        var rs = [];
        if(data && key){
            for(var k in data){
                var tempOne = data[k];
                if(tempOne[key] === value){
                    rs.push(tempOne);
                }
            }
        }
        return rs;
    }
}