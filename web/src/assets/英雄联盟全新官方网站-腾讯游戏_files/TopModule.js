"use strict";
/******
 * TopModulejs
 * 包含:顶部hover控制,顶部登录js
 ******/
function htmlspecialchars(str) {
    str = str.replace(/&/g, '&amp;');
    str = str.replace(/</g, '&lt;');
    str = str.replace(/>/g, '&gt;');
    str = str.replace(/"/g, '&quot;');
    str = str.replace(/'/g, '&#039;');
    return str;
}

(function () {
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
     * hover效果通用初始化方法
     * 不同树级的元素需要hover效果使用,
     * 移入hover触发者和hover层,给hover层添加.show样式类.移出时去掉
     * show一般为{display:block;animation...}
     * 在display:none时,transition动画不生效,建议改为animation作为进入动画
     * @param hoverFrom 触发hover层的选择器
     * @param hoverLayer 被触发的hover层选择器
     * @param hoverFuncBack hover时的回调函数,选填
     * **/
    var T_hoverShowInit = function (hoverFrom, hoverLayer, hoverFuncBack, showDelay) {
        var hover$ = $(hoverLayer);
        var timeout;
        var showTimeout;
        var showDelay = showDelay || 0;
        $(hoverFrom + ',' + hoverLayer).on('mouseenter', function (e) {
            e.preventDefault();
            e.stopPropagation();
            //移入hover层和hover触发者
            clearTimeout(timeout);
            clearTimeout(showTimeout);
            showTimeout = setTimeout(function () {
                if (!hover$.hasClass('show')) {
                    hover$.addClass('show');
                    hoverFuncBack && hoverFuncBack();
                }
            }, showDelay);
        }).on('mouseleave', function (e) {
            e.preventDefault();
            e.stopPropagation();
            //移出hover层和hover触发者,因为元素间隔和子元素的原因,可能会频发触发out,所以使用延迟避免闪烁
            clearTimeout(timeout);
            clearTimeout(showTimeout);
            timeout = setTimeout(function () {
                hover$.removeClass('show');
            }, 100);
        });
    };
    /** 加载顶部活动进行缩小判断,版本信息填充*/
    var TopAct = {
        windowDocument: null,
        topAct: null,
        isSmall: false,
        init: function () {
            //判断是否显示顶部活动
            var topact = $('.comm-topact');
            if (topact.length && topact.css('display') !== 'none') {
                this.handleTopact();
                //请求版本信息
                setTimeout(function () {
                    this.getVersionShtml();
                }.bind(this), 300);
            }
        },
        getVersionShtml: function () {
            //发出请求加载版本号,新皮肤,新英雄,新版本,新手办,开发者交流数据
            if (window['OfficialWebsiteCfg']) {
                //其他模块加载过这个js数据,直接填充
                this.handleVersion(window.OfficialWebsiteCfg);
            } else {
                var requestParam = {
                    apiUrl: '//lol.qq.com/act/AutoCMS/publish/LOLWeb/OfficialWebsite/website_cfg.js?v=' + L_CommFunc.ran,
                    $requestType: 'getScript',
                    successBack: function () {
                        try {
                            if (OfficialWebsiteCfg) {
                                //填充
                                TopAct.handleVersion(window.OfficialWebsiteCfg);
                            } else {
                                //再次请求
                                this.requestOne();
                            }
                        } catch (e) {
                            console.log(e);
                            //再次请求
                            this.requestOne();
                        }
                    }
                };
                RequestApi(requestParam);
            }
        },
        handleTopact: function () {
            var data = HeadCfg;
            //判断是否显示大图
            var topBigImg = $('.topact-big-img');
            if ($('.comm-topact').height() > 400) {
                topBigImg.attr('src', data.head_big);
            }
            //判断是否有按钮图片需要替换
            if (data.btn) {
                $('.top-act-link').css({
                    backgroundImage: 'url(' + data.btn + ')',
                    backgroundPosition: 'center center',
                    backgroundSize: 'auto'
                })
            }
            //判断是否移动位置
            data.btn_pos && $('.top-act-link').addClass(data.btn_pos);

            var topSmall = $('.topact-small-img');
            topSmall.attr('src', data.head_sm);
            this.topAct = $('.comm-topact');
            data.btn_url && $('.top-act-link').attr('href', data.btn_url);
            this.windowDocument = $(window.document).on('scroll', this.handleScroll.bind(this));
            this.handleScroll();
        },
        handleScroll: function () {
            if (this.isSmall) return;
            var scrollTop = this.windowDocument.scrollTop();
            //判断是否可以显示回到顶部
            if (scrollTop > 0) {
                this.topAct.removeClass('big');
                this.isSmall = true;
                setTimeout(function () {
                    window['DelayExpand'] && DelayExpand.forNeedAddDelayQueue();
                }, 600);
            }
        },
        /*处理版本信息*/
        handleVersion: function (OfficialWebsiteCfg) {
            var versionContainer = $('#J_topActVersion');
            if (!OfficialWebsiteCfg || !OfficialWebsiteCfg.button) {
                versionContainer.hide();
                return;
            };
            var versionNum = OfficialWebsiteCfg.button.version;
            var versionLINK = OfficialWebsiteCfg.button.href;
            versionNum && versionContainer.find('em').html(versionNum);
            versionLINK && versionContainer.find('.top-version-link').attr("href", versionLINK).on('click', function () {
                //点击上报
                if (!SendEAS.EASReady) return
                var versionLinkUrl = versionLINK.split('?')[0];
                var versionLinkArr = versionLinkUrl.split('/');
                var contentId = versionLinkArr[versionLinkArr.length - 1].split('.')[0];
                EAS.iu.click({
                    'actionType': 'click',
                    'vUrl': 'index',
                    'clickUrl': versionLINK,
                    'contentId': contentId,
                    'contentType': 'news',
                    'contentSource': 'topversionlink'
                });
                EAS.iu.click({
                    'actionType': 'pop',
                    'contentId': contentId,
                    'contentType': 'news',
                    'contentSource': 'topversionlink'
                });
            });
        }
    };
    /** 登录信息模块,依赖登录组件*/
    var TopLogin = {
        init: function () {
            //检查登录组件初始化状态回调函数
            var readyS = function (tLogin) {
                //解绑ready监听
                tLogin.unbind(tLogin.eventType.ready, this);
                //登录组件成功初始化,判断登录状态
                tLogin.checkLogined(loginS, loginF);
            }.bind(this);
            var readyF = function (tLogin) {
                //登录组件还在初始化,监听初始化成功事件
                tLogin.on(tLogin.eventType.ready, readyS, this);
            }.bind(this);

            //检查登录组件登录状态回调函数
            var loginS = function (tLogin) {
                //解绑login监听
                tLogin.unbind(tLogin.eventType.login, this);
                //已经登录,判断大区绑定状态
                tLogin.checkBoundArea(bindAreaS, bindAreaF);
            }.bind(this);
            var loginF = function (tLogin) {
                //还未登录,监听登录成功事件
                tLogin.on(tLogin.eventType.login, loginS, this);
                //尝试登录
                tLogin.tryLogin();
            }.bind(this);

            //检查登录组件大区状态回调函数
            var bindAreaS = function (tLogin) {
                //绑定大区成功,解绑事件
                tLogin.unbind(tLogin.eventType.boundArea, this);
                //执行头部登录部分信息处理
                this.handleAndSetPlayerInfo();
            }.bind(this);
            var noBindWegame = function (tLogin) {
                //wegame没有绑定大区数据,只是尝试登录,不主调起切换大区
                //tLogin.changeArea();
                //转到待绑定大区样式
                $('.head-userinfo-brief>p').css('display', 'none');
                $('.login-unbindarea').css('display', 'block');
            }.bind(this);
            var loseServerLogin = function (tLogin) {
                //服务器登录态失效,切换回为登录样式
                $('.unlogin').css('display', 'block');
                $('.logined').css('display', 'none');
            }.bind(this);
            var bindAreaF = function (tLogin) {
                /**
                 * 查询wegame绑定大区失败,分5种情况
                 * 1,正在wegame大区查询,但结果应该是绑定过wegame大区的,所以监听查询wegame大区成功事件,进入后续处理
                 * 2,正在wegame大区查询,但结果可能是没有绑定过wegame大区的,所以监听查询wegame大区失败事件,以执行切换大区并绑定
                 * 3,登录组件没有执行过askWegameArea,执行askWegameArea;
                 * 4,wegame没有绑定大区数据,执行切换大区并绑定
                 * 5,服务器登录已经失效,但是客户端cookie还记录是登录
                 */

                //监听获取wegame大区成功事件
                tLogin.on(tLogin.eventType.boundArea, bindAreaS, this);
                //监听获取wegame大区失败事件
                tLogin.on(tLogin.eventType.noWegameArea, noBindWegame, this);
                //监听服务登录态失效事件
                tLogin.on(tLogin.eventType.loseServerLogin, loseServerLogin, this);

                //没有wegame大区数据或者没有执行过askWegameArea
                if (!tLogin.askingArea) {
                    //执行查询wegame大区函数,不需要判断是否需要切换大区,因为askWegameArea会报告前面监听的两个事件
                    tLogin.askWegameArea();
                }
            }.bind(this);

            //执行初始化状态检查
            T_Login.checkReady(readyS, readyF);
        },
        /*处理并显示头部玩家数据*/
        handleAndSetPlayerInfo: function () {
            //开始处理
            var data = T_Login.gAccountData;
            var $head = $('.comm-head');

            //处理头像和昵称
            if (data.MobilePlayerInfo.msg.res.uuid_prifle_list) {
                var zmInfo = data.MobilePlayerInfo.msg.res.uuid_prifle_list[0];
                if (zmInfo['logo_url']) {
                    var logoUrl = T_Login.parseLogoUrl(zmInfo.logo_url);
                    $head.find('.head-userinfo-avatar img').attr('src', logoUrl);
                }
                $head.find('.head-userinfo-normal .logined>.logined-name').text(zmInfo.nick);
            }
            //转换登录部分的显示样式
            $head.find('.unlogin').hide();
            $head.find('.logined').show();
            $head.find('.select-area').text(T_Login.getAreaById(T_Login.gAccountArea));
            $head.find('.user-name').text(data.PlayerInfo.msg.name);

            //战绩信息
            var totalWinNum = 0; //总局数饼图胜场数
            var totalLoseNum = 0; //总局数饼图败场数
            var playerBattleSummaryData = data.PlayerBattleSummary.msg.data.item_list || [];
            for (var i = 0, j = playerBattleSummaryData.length; i < j; ++i) {
                var obj = playerBattleSummaryData[i];
                totalWinNum += obj.win_num;
                totalLoseNum += obj.lose_num + obj.leave_num;
            }
            var winRate = (totalWinNum && Math.round(totalWinNum / (totalWinNum + totalLoseNum) * 100)) + '%';

            $('#commHeadMatchCount').text(totalWinNum + totalLoseNum);
            $('#commHeadWinRate').text(winRate);

            $('#commHeadDianQuan').text(data.PlayerProperty.msg.rp_amount);
            $('#commHeadJingCui').text(data.PlayerProperty.msg.ip_amount);

            //段位信息
            var rankList = T_Login.parseRankInfo(data.PlayerRankInfo);
            var rankInfo = rankList && rankList[0];
            if (rankInfo) {
                rankInfo.extended_tier_url && $('#commHeadTierImg').attr('src', rankInfo.extended_tier_url);
                rankInfo.extended_tier && $('#commHeadTier').text(rankInfo.extended_tier);
                rankInfo.extended_queue && $('#commHeadQueue').text(rankInfo.extended_queue);
            }
        }
    };
    /** 搜索框模块*/
    var TopSearch = {
        init: function () {
            //判定点击事件跳转
            $('.search-direct-href').on('click', 'li', this.clickHref);
            //绑定点击搜索按钮事件
            $('#J_hoverSearchBtn').on('click', this.clickHoverSearchBtn);
            //绑定回车键搜索
            $('#J_hoverSearchInput').on('keypress', function (e) {
                if (e.keyCode === 13) {
                    this.clickHoverSearchBtn();
                }
            }.bind(this));
            //清楚记录
            $('#J_hoverClearRecord').on('click', this.clearRecord.bind(this));
            //绑定hover方法
            this.searchHover();
            //读取cookie记录
            this.getCookieRecord();
        },
        searchHover: function () {
            var searchHover = $('.search-hover-wrap');
            $('#J_headSearchBtn').on('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                searchHover.addClass('show');
                $('#J_hoverSearchInput').focus();
                TopSearch.getCookieRecord();
            });
            $('#J_btnCloseSearch').on('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                searchHover.removeClass('show');
            });
        },
        /*判断是否显示记录栏*/
        checkRecordShow: function () {
            //getCookieRecord调用后执行
            if (!this.cookieArray.length) {
                $('.search-hover-bottom').removeClass('show');
            } else {
                $('.search-hover-bottom').addClass('show');
            }
        },
        clickHoverSearchBtn: function () {
            var temp = $('#J_hoverSearchInput');
            TopSearch.gotoSearchPage(temp.val());
            temp.val('');
        },
        clickHref: function () {
            var tempThis = $(this);
            TopSearch.gotoSearchPage(tempThis.text());
        },
        cookieArray: [],
        /*获取搜索记录，并刷新记录栏显示*/
        getCookieRecord: function () {
            var temp = milo.cookie.get('topSearchRecord');
            if (temp) {
                this.cookieArray = temp.split('^,^');
            } else {
                this.cookieArray = [];
            }
            this.fullRecord();
            this.checkRecordShow();
        },
        /*填充搜索记录*/
        fullRecord: function () {
            //只由getCookieRecord调用
            var liString = '';
            for (var i = 0, j = this.cookieArray.length; i < j; ++i) {
                liString += '<li>' + htmlspecialchars(this.cookieArray[i]) + '</li>';
            }
            $('.search-direct-href').html(liString);
        },
        /*写入搜索记录进入cookie*/
        cookieRecord: function (value) {
            //相同关键字,放弃存储
            for (var i = 0, j = this.cookieArray.length; i < j; ++i) {
                if (this.cookieArray[i] === value) return;
            }
            this.cookieArray.unshift(value);
            this.cookieArray = this.cookieArray.slice(0, 5);
            milo.cookie.set('topSearchRecord', this.cookieArray.join('^,^'));
        },
        /*清除搜索记录*/
        clearRecord: function () {
            milo.cookie.clear('topSearchRecord');
            this.getCookieRecord();
        },
        /*前往搜索页*/
        gotoSearchPage: function (value) {
            if (!value) return;
            this.cookieRecord(value);
            value = encodeURI(value);
            window.open('//lol.qq.com/search/index.shtml?keyword=' + value);
            //读取记录,刷新记录栏显示
            this.getCookieRecord();
        }
    };
    /** 顶部hover控制 **/
    var TopHoverControl = {
        init: function () {
            //初始化导航hover
            T_hoverShowInit('.head-nav', '.head-nav-sub', false, 300);
            //初始化掌盟hover
            T_hoverShowInit('.head-app-normal', '.head-app-hover');
            //初始化login hover
            T_hoverShowInit('.head-userinfo-normal', '.head-login-hover');
        }
    };
    /** 顶部导航列表 **/
    var TopHeadNav = {
        init: function () {
            TopHeadNav.requestPCSiteNavsCfg();
        },
        //请求顶部导航接口数据
        requestPCSiteNavsCfg: function () {
            new T_RequestApi({
                apiUrl: '//lol.qq.com/act/AutoCMS/publish/LOLWeb/PCSiteNavsCfg/PCSiteNavsCfg.js',
                requestType: 'getScript',
                successBack: function (data) {
                    //渲染顶部导航及顶部子导航
                    $('#J_headNav').html(template('J_headNavTemplate', { list: PCSiteNavsCfg }));
                    $('#J_headNavSub').html(template('J_headNavSubTemplate', { list: PCSiteNavsCfg }));
                }
            });
        }
    };
    /** Top入口 **/
    var TopModulejs = {
        init: function () {
            TopAct.init();
            TopHoverControl.init();
            TopLogin.init();
            TopSearch.init();
            TopHeadNav.init();
        }
    };
    TopModulejs.init();
})(window);
