"use strict";
(function () {
    /** 图片轮播广告位js  **/
    window.Promo = {
        containerWidth: 820,
        autoPlayDelay: 3000,
        promoImgList: null,
        promoTitleSpan: null,
        nowIndex: null,
        amount: 5,
        timeOut: null,
        init: function () {
            var templist = $('#promoTitleList').append($('#promoImgList .title'));
            this.promoImgList = $('#promoImgList');
            this.promoTitleSpan = templist.children('span');
            this.initControl();
            this.promoImgList.find('.loading-tip').remove();
        },
        /**控制逻辑*/
        initControl: function () {
            //应用宽度
            this.promoImgList.css('width', this.containerWidth * this.amount + 'px');
            this.promoTitleSpan.css('width', this.containerWidth / this.amount + 'px');
            //标题hover事件
            this.promoTitleSpan.unbind().on('mouseover', function (e) {
                var $this = $(this);
                var index = +$this.index();
                Promo.moveNext(index);
                window['PTTSendClick'] && PTTSendClick('indexScrollHover', 'scroll-' + $this.attr('data-bannerid'), $this.text());
            });
            //开始
            this.moveNext(0);
        },
        /**移动动画,传入了下标,则转到下标对应图;没有传递,则转到下一张*/
        moveNext: function (index) {
            var nextIndex;
            if (typeof (index) !== 'undefined') {
                nextIndex = index;
            } else {
                nextIndex = ++this.nowIndex;
                nextIndex >= this.amount && (nextIndex = 0);
            }

            //清理自动播放事件准备下一次自动播放
            clearTimeout(this.timeOut);
            this.timeOut = setTimeout(this.moveNext.bind(this), this.autoPlayDelay);

            //图片移动
            this.promoImgList.animate({
                'marginLeft': -nextIndex * 820 + 'px'
            }, {
                queue: false,
                duration: 200
            });
            this.promoTitleSpan.removeClass('selected').eq(nextIndex).addClass('selected');

            //记录当前图片下标
            this.nowIndex = nextIndex;
        }
    };
    /** 新闻列表,newslist.js的精简版
     * 注意:
     * 新增了一种接口,切与其他接口都不同,所以新增一个子模块来处理数据请求和过程,渲染层*/
    var NewsJs = {
        pageMaxNews: 7,
        /*用以多个异步请求同时填充新闻导致的错乱,于新闻中心页使用分页器代表的数据类型识别相似*/
        nowShowId: null,
        /*数据缓存,加载过的数据就不再加载,直接由sendOneRequest返回*/
        dataCache: {},
        newsListContainer: null,
        init: function () {
            this.newsListContainer = $('#J_newsListContainer');
            this.delayRunFunc();
            //懒加载监听,放弃
            // DelayExpand.addDelay({
            //     $el: $('.m-news'),
            //     delayRunFunc: this.delayRunFunc.bind(this)
            // });
        },
        delayLoaded: false,
        delayRunFunc: function () {
            if (this.delayLoaded) return;
            this.delayLoaded = true;
            //新闻tab切换,自动选择初始化第一个标签
            new L_CommTab({
                p_title: '.m-news [data-newsId]',
                //tab切换回调事件
                changeStartBack: function ($title) {
                    var newsId = $title.attr('data-newsId');
                    var newsTit = $title.text();
                    var apiType = $title.attr('data-apitype');
                    this.changeNewsTab(newsId, apiType);
                    //上报数据
                    window['PTTSendClick'] && PTTSendClick('Notice', 'Notice' + ($title.index() + 1), newsTit);
                }.bind(this)
            });
        },
        /**获取拼接后的api*/
        getApi: function (newsId) {
            return '//apps.game.qq.com/cmc/zmMcnTargetContentList?r0=jsonp&page=1&num=' + this.pageMaxNews + '&target=' + newsId + '&source=web_pc';
        },
        changeNewsTab: function (newsId, apiType) {
            //将当前NewsJs设置为最终现在显示的id
            this.nowShowId = newsId;
            //判断类型进入不同的数据请求和处理流程
            if (apiType === 'cross') {
                this.TypeCross.sendOneRequest(newsId);
            } else {
                this.sendOneRequest(newsId);
            }
        },
        /*发出一个新闻列表请求*/
        sendOneRequest: function (newsId) {
            addLoadingTip('ing', '#J_newsListContainer', 'li');
            //判断是否有数据缓存
            if (this.dataCache[newsId]) {
                this.getNewsSuccess(newsId, this.dataCache[newsId]);
            } else {
                var requestParam = {
                    apiUrl: this.getApi(newsId),
                    $requestType: 'ajax',
                    attach: this,
                    data: {
                        type: "get",
                        dataType: 'jsonp',
                        jsonp: 'r1',
                        xhrFields: {
                            withCredentials: true
                        }
                    },
                    successBack: function (e) {
                        if (+e.status === 1) {
                            //执行成功回调
                            this.attach.getNewsSuccess(newsId, e.data);
                        }
                    },
                    failBack: function () {
                        addLoadingTip('fail', '#J_newsListContainer', 'li', true);
                    }
                };
                RequestApi(requestParam);
            }
        },
        getNewsSuccess: function (newsId, newsData) {
            //有可能是通过缓存过来的,所以通过缓存判断是否需要再处理一次数据
            if (!this.dataCache[newsId]) {
                this.handleData(newsData);
                //存缓存
                this.dataCache[newsId] = newsData;
                newsData.newsId = newsId;
            }
            this.fullNews(newsId, newsData.result);
        },
        /**处理数据*/
        handleData: function (newsData) {
            var result = newsData.result;
            var tempOne, sTagIdsArray, backKey, temp;
            //上报的参数处理 deng
            var popiDocID = []; //文章id
            var popsType = []; //文章类型
            var hrefArr = []; //上报的url
            for (var i = 0, j = result.length; i < j; ++i) {
                tempOne = result[i];
                //截取时间字符串
                tempOne.l_time = tempOne.sIdxTime.substr(5, 5);

                //计算tag样式,遍历查找sTagIds数组里的id
                backKey = sTagIdsTagsKey.ndefault;
                if (tempOne.sVID) {
                    backKey = sTagIdsTagsKey.video;
                }
                else if (tempOne['sTagIds']) {
                    sTagIdsArray = tempOne.sTagIds.split(',');
                    for (var i2 = sTagIdsArray.length - 1; i2 >= 0; --i2) {
                        temp = sTagIdsTagsKey[sTagIdsArray[i2]];
                        if (temp) {
                            backKey = temp;
                            break;
                        }
                    }
                }
                tempOne.tagData = backKey;

                if (tempOne.sRedirectURL) {
                    var href = tempOne.sRedirectURL;
                    if (href.indexOf('docid') > 0) {
                        tempOne.sRedirectURL = href;
                    } else {
                        if (href.indexOf('?') > 0) {
                            tempOne.sRedirectURL = href + '&docid=' + tempOne.iDocID;
                        } else {
                            tempOne.sRedirectURL = href + '?docid=' + tempOne.iDocID;
                        }

                    }
                } else {
                    if (tempOne.sVID) {
                        tempOne.sRedirectURL = '//lol.qq.com/v/v2/detail.shtml?docid=' + tempOne.iDocID;
                    } else {
                        //拼接为个人中心详情页
                        tempOne.sRedirectURL = '//lol.qq.com/news/detail.shtml?docid=' + tempOne.iDocID;
                    }
                }


                // 处理曝光数据 deng
                popiDocID.push(tempOne.iDocID);
                popsType.push('news');
                hrefArr.push(tempOne.sRedirectURL);
            }
            // 新闻 曝光上报
            SendEAS.sendNewsPOP(popiDocID.join('|'), popsType.join('|'), hrefArr.join('|'))
        },
        /**请求成功之后,填充数据,newsDataList:数组*/
        fullNews: function (newsId, newsDataList) {
            //对比newsId是否与现在被选中的id一致
            if (this.nowShowId === newsId) {
                this.newsListContainer.html(template('J_newsItemTemplate', newsDataList));
            }
        },
        /**新增处理cross接口的子模块 */
        TypeCross: {
            /*数据缓存,加载过的数据就不再加载,直接由sendOneRequest返回*/
            dataCache: {},
            /**获取拼接后的api*/
            getApi: function (newsId) {
                return '//apps.game.qq.com/cmc/cross?serviceId=3&source=zm&tagids=' + newsId + '&typeids=1,2&withtop=yes&limit=7';
            },
            /*发出一个新闻列表请求*/
            sendOneRequest: function (newsId) {
                addLoadingTip('ing', '#J_newsListContainer', 'li');
                //判断是否有数据缓存
                if (this.dataCache[newsId]) {
                    this.getNewsSuccess(newsId, this.dataCache[newsId]);
                } else {
                    var requestParam = {
                        apiUrl: this.getApi(newsId),
                        $requestType: 'ajax',
                        attach: this,
                        data: {
                            type: "get",
                            xhrFields: {
                                withCredentials: true
                            }
                        },
                        successBack: function (e) {
                            if (+e.status === 0) {
                                //执行成功回调
                                this.attach.getNewsSuccess(newsId, e.data);
                            }
                        },
                        failBack: function () {
                            addLoadingTip('fail', '#J_newsListContainer', 'li', true);
                        }
                    };
                    RequestApi(requestParam);
                }
            },
            getNewsSuccess: function (newsId, newsData) {
                //有可能是通过缓存过来的,所以通过缓存判断是否需要再处理一次数据
                if (!this.dataCache[newsId]) {
                    this.handleData(newsData);
                    //存缓存
                    this.dataCache[newsId] = newsData;
                    newsData.newsId = newsId;
                }
                NewsJs.fullNews(newsId, newsData.items);
            },
            /**处理数据*/
            handleData: function (newsData) {
                var result = newsData.items;
                var tempOne, sTagIdsArray, backKey, temp;
                //上报的参数处理 deng
                var popiDocID = []; //文章id
                var popsType = []; //文章类型
                var hrefArr = []; //上报的url
                for (var i = 0, j = result.length; i < j; ++i) {
                    tempOne = result[i];
                    //截取时间字符串
                    tempOne.l_time = tempOne.sIdxTime.substr(5, 5);

                    //计算tag样式,遍历查找sTagIds数组里的id
                    backKey = sTagIdsTagsKey.ndefault;
                    if (!tempOne.sRedirectURL && tempOne.sVID) {
                        backKey = sTagIdsTagsKey.video;
                    }
                    else if (tempOne['sTagIds']) {
                        sTagIdsArray = tempOne.sTagIds.split(',');
                        for (var i2 = 0, j2 = sTagIdsArray.length; i2 < j2; ++i2) {
                            temp = sTagIdsTagsKey[sTagIdsArray[i2]];
                            if (temp) {
                                backKey = temp;
                                break;
                            }
                        }
                    }
                    tempOne.tagData = backKey;

                    if (tempOne.sRedirectURL) {
                        var href = tempOne.sRedirectURL;
                        if (href.indexOf('docid') > 0) {
                            tempOne.sRedirectURL = href;
                        } else {
                            if (href.indexOf('?') > 0) {
                                tempOne.sRedirectURL = href + '&docid=' + tempOne.iDocID;
                            } else {
                                tempOne.sRedirectURL = href + '?docid=' + tempOne.iDocID;
                            }

                        }
                    } else {
                        if (tempOne.sVID) {
                            tempOne.sRedirectURL = '//lol.qq.com/v/v2/detail.shtml?docid=' + tempOne.iDocID;
                        } else {
                            //拼接为个人中心详情页
                            tempOne.sRedirectURL = '//lol.qq.com/news/detail.shtml?docid=' + tempOne.iDocID;
                        }
                    }


                    // 处理曝光数据 deng
                    popiDocID.push(tempOne.iDocID);
                    popsType.push('news');
                    hrefArr.push(tempOne.sRedirectURL);
                }
                // 新闻 曝光上报
                SendEAS.sendNewsPOP(popiDocID.join('|'), popsType.join('|'), hrefArr.join('|'))
            }
        }
    };
    /** 活动部分,actcenter.js的精简版*/
    var ActionJs = {
        /**绑定相关事件并读取正在进行的活动*/
        init: function () {
            addLoadingTip('ing', '#J_actListContainer', 'li');
            this.loadData();
            //懒加载滚动监听,放弃
            // DelayExpand.addDelay({
            //     $el: $('.m-act'),
            //     delayRunFunc: this.delayRunFunc.bind(this)
            // });
        },
        delayLoaded: false,
        delayRunFunc: function () {
            if (this.delayLoaded) return;
            this.delayLoaded = true;
            //活动和右侧游戏导航进入动画
            $('.m-act,.m-gamefunc-nav').addClass('indexpart-show');
        },
        loadData: function () {
            //加载除商城特惠外全部活动
            var requestParam = {
                apiUrl: '//ossweb-img.qq.com/images/clientpop/act/lol/lol_act_1_index.js?v=' + L_CommFunc.ran,
                $requestType: 'getScript',
                successBack: function () {
                    try {
                        if (action) {
                            ActionJs.checkLoadOver();
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
            //加载商城活动
            var requestTHParam = {
                apiUrl: '//ossweb-img.qq.com/images/clientpop/act/lol/lol_act_4_index.js?v=' + L_CommFunc.ran,
                $requestType: 'getScript',
                successBack: function () {
                    try {
                        if (match) {
                            ActionJs.checkLoadOver();
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
            RequestApi(requestTHParam);
        },
        /**下面四个为数据缓存*/
        All: null,
        ZZJX: null,
        SCTH: null,
        CQHD: null,
        /**检查数据是否加载完成,并做相应处理*/
        checkLoadOver: function () {
            if (window['action'] && window['match']) {
                //捕获这两个原始数据
                this.All = action;
                this.SCTH = match;

                var temp;
                //遍历寻找"正在进行",标记"长期活动"及标记"不定期活动",没有结束的放到全部活动的最前面
                var newAllZZJX = [];
                var newAllOhter = [];
                this.ZZJX = [];
                this.CQHD = [];
                for (var i = 0, j = this.All.length; i < j; ++i) {
                    temp = this.All[i];
                    if (+temp.iDate === -2 && +temp.iStatus === 998) {
                        //标记不定期活动
                        temp.isUnknown = true;
                        this.ZZJX.push(temp);
                        newAllZZJX.push(temp);
                    } else if (+temp.iDate === 0 && +temp.iStatus === 999) {
                        //标记长期活动
                        temp.isLong = true;
                        this.CQHD.push(temp);
                        newAllZZJX.push(temp);
                    } else if (window.activityDataHandle.culRemainTime(temp) > 0) {
                        this.ZZJX.push(temp);
                        newAllZZJX.push(temp);
                    } else {
                        newAllOhter.push(temp);
                    }
                }
                this.All = newAllZZJX.concat(newAllOhter);
                for (var i = 0, j = this.SCTH.length; i < j; ++i) {
                    temp = this.SCTH[i];
                    if (+temp.iDate === -2 && +temp.iStatus === 998) {
                        //标记商城不定期活动
                        temp.isUnknown = true;
                    } else if (+temp.iDate === 0 && +temp.iStatus === 999) {
                        //标记商城长期活动
                        temp.isLong = true;
                    } else if (window.activityDataHandle.culRemainTime(temp) > 0) {
                        this.ZZJX.push(temp);
                    }
                }
                //绑定操作事件,初始化tab点击
                new L_CommTab({
                    p_title: '.m-act [data-actname]',
                    changeStartBack: function ($title) {
                        //获取被点击的tab所带的actname
                        var dataName = $title.attr('data-actname');
                        var dataTit = $title.text();
                        //获取前4个,并填充
                        ActionJs.fullAction(ActionJs.getOnePageData(dataName, 0, 4));
                        window['PTTSendClick'] && PTTSendClick('act', 'act-' + dataName, dataTit);

                    }
                });
            }
        },
        /**获取一个分页数据,dataType数据类型;dataStartIndex,dataLength所需数据的位置*/
        getOnePageData: function (dataType, dataStartIndex, dataLength) {
            //判断DataControl是否有这个数据
            if (!this[dataType]) {
                console.log('没有这个分页数据类型在DataControl');
            }
            //返回所需的分页数据
            return this.searchData(dataType, dataStartIndex, dataLength);
        },
        /**按照数据名称和所需数据位置查找并返回数据*/
        searchData: function (dataType, dataStartIndex, dataLength) {
            var tempArray = this[dataType].slice(dataStartIndex, dataStartIndex + dataLength);
            //遍历处理活动状态
            this.handleData(tempArray);
            //返回活动数据列表和当前数据长度下的总页数
            return tempArray;
        },
        /**将一组原始数组计算是否"长期活动","new"和"结束提示"*/
        handleData: function (tempArray) {
            var tempOne;
            for (var i = 0, j = tempArray.length; i < j; ++i) {
                tempOne = tempArray[i];
                if (tempOne.isLong) {
                    //长期活动的提示
                    tempOne.remainTip = "长期活动";
                } else if (tempOne.isUnknown) {
                    //不定期活动的提示
                    tempOne.remainTip = "限时活动";
                } else {
                    tempOne.remainTip = window.activityDataHandle.culOverTimeTip(tempOne);
                }
                //计算是否是new
                tempOne.isNew = window.activityDataHandle.checkNewAct(tempOne);
            }
        },
        /**填充列表*/
        fullAction: function (data) {
            $('#J_actListContainer').html(template('J_actItemTemplate', {
                list: data
            }));
        }
    };
    /**  版本更新部分  **/
    var NewVersion = {
        versionVideo: null,
        init: function () {
            addLoadingTip('ing', '#J_newChampionContainer');
            addLoadingTip('ing', '#J_newSkinContainer');
            addLoadingTip('ing', '#J_newVersionContainer');
            addLoadingTip('ing', '#J_clubDeveloperContainer');
            addLoadingTip('ing', '#J_newModelContainer');
            this.loadData();
            //懒加载滚动监听
            DelayExpand.addDelay({
                $el: $('.m-version-nav'),
                delayRunFunc: this.delayRunFunc.bind(this)
            });
        },
        delayLoaded: false,
        delayRunFunc: function () {
            if (this.delayLoaded) return;
            this.delayLoaded = true;
            //活动和右侧游戏导航进入动画
            $('.m-new-championskin,.m-version-nav').addClass('indexpart-show');
        },
        loadData: function () {
            //发出请求加载新皮肤,新英雄,新版本,新手办,开发者交流数据
            if (window['OfficialWebsiteCfg']) {
                //其他模块加载过这个js数据,直接填充
                //填充数据
                NewVersion.fullData();
                //绑定交互事件
                NewVersion.bindEvent();
            } else {
                var requestParam = {
                    apiUrl: '//lol.qq.com/act/AutoCMS/publish/LOLWeb/OfficialWebsite/website_cfg.js?v=' + L_CommFunc.ran,
                    $requestType: 'getScript',
                    successBack: function () {
                        try {
                            if (OfficialWebsiteCfg) {
                                //填充数据
                                NewVersion.fullData.bind(NewVersion)();
                                //绑定交互事件
                                NewVersion.bindEvent.bind(NewVersion)();
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
            //发出请求加载周免数据
            var requestFreeParam = {
                apiUrl: '//lol.qq.com/biz/hero/free.js?v=' + L_CommFunc.ran,
                $requestType: 'getScript',
                successBack: function () {
                    try {
                        if (LOLherojs && LOLherojs.free) {
                            //填充周免数据
                            NewVersion.fullFreeChampion();
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
            RequestApi(requestFreeParam);
        },
        /**填充数据*/
        fullData: function () {
            //新英雄
            if (OfficialWebsiteCfg['champion']) {

                var champion = OfficialWebsiteCfg.champion;
                $('#J_newChampionContainer').html(template('J_newChampionTemplate', champion)).on("mouseenter", function (e) {

                    window['PTTSendClick'] && PTTSendClick('newchampionskin', 'newchampionskin-newchampion', '新英雄');

                });
                this.getNewChampionAbility();
            }
            //新皮肤
            if (OfficialWebsiteCfg['skin']) {
                var mainSkin = OfficialWebsiteCfg.skin[0];
                mainSkin.vid = this.cutVid(mainSkin.hover);
                //截取更多皮肤的数量,以免服务器传递太多数据过来
                var moreskin = OfficialWebsiteCfg.skin.slice(1, 8);
                $('#J_newSkinContainer').html(template('J_newSkinTemplate', mainSkin)).on("mouseenter", function (e) {
                    window['PTTSendClick'] && PTTSendClick('newchampionskin', 'newchampionskin-newSkin', '新皮肤');
                });
                $('#J_moreNewSkinContainer').html(template('J_moreNewSkinTemplate', moreskin));
                hoverPlayInnerVideo('#J_newSkinContainer,.m-more-skin');
            }
            //游戏新版本
            if (OfficialWebsiteCfg['version']) {
                var version = OfficialWebsiteCfg.version;
                version.vid = this.cutVid(version.hover);
                $('#J_newVersionContainer').html(template('J_newVersionTemplate', version)).on("mouseenter", function (e) {
                    window['PTTSendClick'] && PTTSendClick('version', 'version-versionupdate', '新版本');
                });
                hoverPlayInnerVideo('#J_newVersionContainer');
            }
            //新手办
            if (OfficialWebsiteCfg['peripheral']) {
                var peripheral = OfficialWebsiteCfg.peripheral;
                $('#J_newModelContainer').html(template('J_newModelTemplate', peripheral)).on("mouseenter", function (e) {
                    window['PTTSendClick'] && PTTSendClick('version', 'version-newModel', '新手办');
                });
            }
            //开发者
            if (OfficialWebsiteCfg['developer']) {
                var developer = OfficialWebsiteCfg.developer;
                $('#J_clubDeveloperContainer').html(template('J_clubDeveloperTemplate', developer)).on("mouseenter", function (e) {
                    window['PTTSendClick'] && PTTSendClick('version', 'version-developerdetail', '开发者');
                });
            }
        },
        /**填充周免数据*/
        fullFreeChampion: function () {
            //填充模板
            $('#J_freeChampionContainer').html(template('J_freeChampionTemplate', LOLherojs.free));
            $('.week-free-champion>.week-free-a').on("mouseover", function () {
                window['PTTSendClick'] && PTTSendClick('version', 'version-free', '周免');
            });
        },
        /**获取新英雄能力属性数据**/
        getNewChampionAbility: function () {
            //获取新英雄id
            var championId = +$('#J_championAbility').attr('data-championId');
            //没有填新英雄id,不显示数据
            if (!championId) {
                $('#J_championAbility .champion-ability').hide();
                return;
            }
            //加载属性数据
            var requestParam = {
                apiUrl: '//game.gtimg.cn/images/lol/act/img/js/hero/' + championId + '.js?v=' + L_CommFunc.ran,
                $requestType: 'ajax',
                data: {
                    dataType: "json"
                },
                successBack: function (data) {
                    try {
                        if (data && data.hero) {
                            NewVersion.handleChampionInfo(data.hero);
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
        },
        /**处理新英雄属性数据*/
        handleChampionInfo: function (data) {
            var championAbility = $('#J_championAbility');
            championAbility.find('#J_attackBar').css('width', data.attack * 10 + '%');
            championAbility.find('#J_magicBar').css('width', data.magic * 10 + '%');
            championAbility.find('#J_defenseBar').css('width', data.defense * 10 + '%');
            championAbility.find('#J_hardBar').addClass('h' + Math.round(data.difficulty * 3 / 10));
        },
        /**绑定交互事件*/
        bindEvent: function () {
            //显示更多新皮肤
            $('.m-new-skin-one .herf-more').on('click', function () {
                $('.m-new-skin-one .inner-hover').addClass('show');
            });
            //关闭更多新皮肤
            $('.m-new-skin-one .hover-back').on('click', function () {
                $('.m-new-skin-one .inner-hover').removeClass('show');
            });

            //初始化周免hover
            hoverShowInit('.week-free-a', '.week-free-hover');
            //新皮肤hover显示更多
            hoverShowInit('.m-new-skin-one', '.m-more-skin', true);
        },
        /**腾讯视频链接里截出视频id*/
        cutVid: function (txvideourl) {
            txvideourl = txvideourl.replace(/\//g, ' ');
            var result = txvideourl.match('\ {1}(\\S*).htm');
            if (result) {
                return result[1];
            } else {
                return false;
            }
        }
    };
    /** 视频和专辑,带数据缓存
     * 专辑请求流程:1请求视频中心配置数据,2从视频中心取出某一天的专辑id去请求专辑列表数据,3从专辑数据里取出作者id,请求作者数据,4获取作者头像数据,5填充专辑
     * 视频请求流程:1请求视频中心配置数据获取标签,2请求某列表数据,3填充
     * **/
    window.VideoProgram = {
        init: function () {
            this.loadData();
            //懒加载滚动监听
            DelayExpand.addDelay({
                $el: $('.g-wrap-vp'),
                delayRunFunc: this.delayRunFunc.bind(this)
            });
            //监听hover预览
            this.hoverImg.init();
        },
        delayLoaded: false,
        delayRunFunc: function () {
            if (this.delayLoaded) return;
            this.delayLoaded = true;
            $('.m-fresh-video,.m-hotprogram').addClass('indexpart-show');
        },
        loadData: function () {
            //加载视频中心配置数据,加载完成后进入专辑和视频的初始化
            var requestParam = {
                apiUrl: '//lol.qq.com/act/AutoCMS/publish/LOLWeb/VideoCenterCfg/video_cfg.js?v=' + L_CommFunc.ran,
                $requestType: 'getScript',
                successBack: function () {
                    try {
                        if (VideoCenterCfg) {
                            //请求成功,执行对应函数
                            VideoProgram.getVideoCenterCfgSuccess();
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
        },
        /**视频中心配置文件加载成功,进入视频和专辑流程*/
        getVideoCenterCfgSuccess: function () {
            this.programProcess.init();
            this.videoProcess.init();
        },
        /*专辑执行流程*/
        programProcess: {
            /*专辑数据缓存,避免重复请求*/
            programDataCache: {},
            /*最后一次切换请求需要填充的数据标识,填充时判断,以免多个异步请求填充时造成错乱*/
            lastFullprogram: null,
            /*专辑swiper*/
            programSwiper: null,
            /*初始化*/
            init: function () {
                //专辑tab切换
                var programTab = new L_CommTab({
                    p_title: '.m-hotprogram .part-tab-title>li',
                    firstShow: false,
                    //tab切换回调事件
                    changeStartBack: function ($title) {
                        var day = $title.attr('data-programDay');
                        var tabTit = $title.text();
                        this.changeProgramDay(day);
                        window['PTTSendClick'] && PTTSendClick('hotprogram', 'hotprogram-' + day, tabTit);
                    }.bind(this)
                });
                //判断当前是星期几,进入今天的专辑
                programTab.v_title.eq(new Date().getDay() - 1).trigger('mouseover');

                //鼠标移入不滚动,出去继续滚
                $('#J_HotprogramList').on('mouseover', function () {
                    this.programSwiper && this.programSwiper.stopAutoplay();
                }.bind(this)).on('mouseout', function () {
                    this.programSwiper && this.programSwiper.startAutoplay();
                }.bind(this));
            },
            /*切换专辑tab*/
            changeProgramDay: function (programDay) {
                //记录一次切换请求需要填充的数据标识
                this.lastFullprogram = programDay;
                //进入请求数据和填充数据流程
                this.getProgramData(programDay);
            },
            /*请求某天的专辑信息,VideoCenterCfg数据必须已经完成加载*/
            getProgramData: function (programDay) {
                addLoadingTip('ing', '#J_programContainer', 'li');
                //判断是否有缓存
                if (this.programDataCache[programDay]) {
                    this.fullProgram(programDay, this.programDataCache[programDay]);
                } else {
                    //该天专辑id
                    var programDayId = VideoCenterCfg.album_rec[programDay].toString();
                    var requestParam = {
                        apiUrl: '//apps.game.qq.com/cmc/zmMcnCollectionList?r0=jsonp&collectionid=' + programDayId + '&source=web_pc',
                        $requestType: 'ajax',
                        attach: this,
                        data: {
                            type: "get",
                            dataType: 'jsonp',
                            jsonp: 'r1'
                        },
                        successBack: function (e) {
                            try {
                                if (e.msg === 'OK') {
                                    //请求成功,交由attach引用programProcess的成功函数处理
                                    this.attach.getProgramDataSuccess(programDay, e);
                                } else {
                                    //再次请求
                                    this.requestOne();
                                }
                            } catch (e) {
                                console.log(e);
                                //再次请求
                                this.requestOne();
                            }
                        },
                        failBack: function () {
                            addLoadingTip('fail', '#J_programContainer', 'li', true);
                        }
                    };
                    RequestApi(requestParam);
                }
            },
            /*处理某天的专辑信息请求完成,请求作者信息,以便获取头像*/
            getProgramDataSuccess: function (programDay, programData) {
                //获取作者id
                var authorId = [];
                for (var i = 0, j = programData.data.result.length; i < j; ++i) {
                    authorId.push(programData.data.result[i].authorID);
                }
                authorId = authorId.toString();
                var requestParam = {
                    apiUrl: '//apps.game.qq.com/cmc/zmMcnAuthorList?r0=jsonp&authorid=' + authorId,
                    $requestType: 'ajax',
                    attach: this,
                    data: {
                        type: "get",
                        dataType: 'jsonp',
                        jsonp: 'r1'
                    },
                    successBack: function (e) {
                        try {
                            if (e.msg === 'OK') {
                                //请求成功,交由attach引用programProcess的成功函数处理
                                this.attach.getAuthorSuccess(programDay, programData, e);
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
            },
            /*获取作者信息成功,最终处理专辑和作者数据到模板需要的结构,并存入缓存*/
            getAuthorSuccess: function (programDay, programData, authorData) {
                var programResult = programData.data.result;
                var authorResuld = authorData.data.result;
                var authorID, oneProgram, skva;
                for (var pi = 0, pj = programResult.length; pi < pj; ++pi) {
                    //遍历对比作者数据,把作者头像和uuid增加进专辑数据
                    oneProgram = programResult[pi];
                    authorID = oneProgram.authorID;
                    skva = window.searchKeyValueEqualArray(authorResuld, 'authorID', authorID);
                    oneProgram.avatar = skva.avatar;
                    oneProgram.uuid = skva.uuid;
                    //处理sLatestItem字符串为json
                    oneProgram.sLatestItem && (oneProgram.sLatestItem = $.parseJSON(oneProgram.sLatestItem));
                }
                //存入缓存
                this.programDataCache[programDay] = programData;

                //填充
                this.fullProgram(programDay, programData);
            },
            /*填充专辑*/
            fullProgram: function (programDay, programData) {
                //判断是否是最后一次请求的填充
                if (this.lastFullprogram !== programDay) return;
                //填充
                $('#J_programContainer').html(template(
                    'J_programTemplate',
                    programData.data
                ));
                //重新初始化swiper
                var ifLoop = (programData.data.result.length < 4) ? (false) : (true);
                this.programSwiper && this.programSwiper.destroy();
                this.programSwiper = new Swiper('#J_HotprogramList', {
                    slidesPerView: 3,
                    slidesPerGroup: 3,
                    autoplay: 3000,
                    autoplayDisableOnInteraction: false,
                    loop: ifLoop,
                    simulateTouch: false,
                    onFirstInit: function (swiper) {
                        swiper.setWrapperTranslate(0, 0, 0);
                    }
                });
                if (ifLoop) {
                    $('.hotprogram-list-left,.hotprogram-list-right').css('display', 'block');
                } else {
                    $('.hotprogram-list-left,.hotprogram-list-right').css('display', 'none');
                }
                //左右按钮
                $('.hotprogram-list-left').unbind().on('click', function () {
                    this.programSwiper && this.programSwiper.swipePrev();
                }.bind(this));
                $('.hotprogram-list-right').unbind().on('click', function () {
                    this.programSwiper && this.programSwiper.swipeNext();
                }.bind(this));
            }
        },
        /*视频执行流程*/
        videoProcess: {
            /*最新视频数据缓存,避免重复请求*/
            flashVideoDataCache: {},
            //视频tab title打上最新tag的id
            newTags: ['1933'],
            /*初始化交互操作*/
            init: function () {
                //根据配置信息填充标题,"推荐"接口不一样需要注意,其他的都用分类的"最新"id
                var titleLi = '<li data-tabvalue="recommend" data-page="1">推荐</li>';
                var temptags;
                for (var i = 0, j = VideoCenterCfg.tags.length; i < j; ++i) {
                    temptags = VideoCenterCfg.tags[i];
                    if (this.newTags.indexOf('' + temptags.cates[0].value) !== -1) {
                        titleLi += "<li data-tabvalue='" + temptags.cates[0].value + "' data-page='1'>" + temptags.name + "<i class='icon-new-1'></i></li>";
                    } else {
                        titleLi += "<li data-tabvalue='" + temptags.cates[0].value + "' data-page='1'>" + temptags.name + "</li>";
                    }
                }
                $('.m-fresh-video .part-tab-title').html(titleLi);
                //专辑tab切换,自动选择一个标签初始化
                new L_CommTab({
                    p_title: '.m-fresh-video .part-tab-title>li',
                    //tab切换回调事件
                    changeStartBack: function ($title) {
                        setTimeout(function () {
                            this.responseVedioTabChange($title);
                        }.bind(this), 0);
                    }.bind(this)
                });
                //换一换/下一页按钮点击方法
                $('#change-batche').bind('click', function () {
                    var nowSelectedTitle = $(".m-fresh-video .part-tab-title .selected");
                    var pageNumber = nowSelectedTitle.attr('data-page');
                    nowSelectedTitle.attr('data-page', +pageNumber + 1);
                    //请求数据方法
                    VideoProgram.videoProcess.responseVedioTabChange(nowSelectedTitle);
                });
            },
            /*切换视频tab响应方法*/
            responseVedioTabChange: function ($title) {
                var tabvalue = $title.attr('data-tabvalue');
                //获取当前分类的page页码
                var pagenumber = $title.attr('data-page');
                //进入请求流程
                this.requestVedioList(tabvalue, pagenumber);
                //根据tab类型切换右边"下一页"/"换一换"
                if (tabvalue === 'recommend') {
                    $('#change-batche').html('<span class="change-batche">' + '换一批' + '<i class="icon-hyp"></i>' + '</span>');
                }
                //普通分类
                else {
                    $('#change-batche').html('<span class="change-page">' + '下一页' + '<i class="icon-page"></i>' + '</span>');
                }
                //上报切换数据
                window['PTTSendClick'] && PTTSendClick('newVideo', 'newVideo-' + tabvalue, "切换官网最新视频分类");
            },
            /*请求列表数据*/
            requestVedioList: function (tabvalue, pagenumber) {
                addLoadingTip('ing', '#J_flashVideoContainer', 'li', true);
                //判断是否有缓存
                if (this.flashVideoDataCache['' + tabvalue + pagenumber]) {
                    //存在缓存,直接填充
                    this.fullVideo(this.flashVideoDataCache['' + tabvalue + pagenumber]);
                } else {
                    var apiUrl;
                    if (tabvalue === 'recommend') {
                        apiUrl = '//apps.game.qq.com/cmc/zmMcnRecommendedVideoCenterVideoList?r0=jsonp&reset=0&num=8&source=web_pc';
                    } else {
                        apiUrl = '//apps.game.qq.com/wmp/v3.1/?p0=3&p1=searchKeywordsList&page=' + pagenumber + '&pagesize=8&order=sIdxTime&type=iTag&id=' + tabvalue + '&r0=jsonp&source=web_pc';
                    }
                    var requestParam = {
                        apiUrl: apiUrl,
                        $requestType: 'ajax',
                        attach: this,
                        data: {
                            type: "get",
                            dataType: 'jsonp',
                            jsonp: 'r1'
                        },
                        successBack: function (e) {
                            try {
                                if (e.msg === 'OK') {
                                    //推荐请求成功,交由attach引用programProcess的成功函数处理
                                    e.data.pagenumber = pagenumber;
                                    e.data.tabvalue = tabvalue;
                                    this.attach.requestVedioListSuccess(e.data);
                                } else if (+e.status === 0) {
                                    //其他几个分页请求成功,交由attach引用programProcess的成功函数处理
                                    e.msg.pagenumber = pagenumber;
                                    e.msg.tabvalue = tabvalue;
                                    this.attach.requestVedioListSuccess(e.msg);
                                } else {
                                    //再次请求
                                    this.requestOne();
                                }
                            } catch (e) {
                                console.log(e);
                                //再次请求
                                this.requestOne();
                            }
                        },
                        failBack: function () {
                            if (this.attach.lastFullFlashVideo !== tabvalue) return;
                            addLoadingTip('fail', '#J_flashVideoContainer', 'li', true);
                        }
                    };
                    RequestApi(requestParam);
                }
            },
            /*列表数据请求成功,处理数据并请求预览图数据*/
            requestVedioListSuccess: function (listData) {
                //截断为8个
                listData.result = listData.result.slice(0, 8);
                var tempResult = listData.result;
                //上报的参数处理 deng
                var popiDocID = []; //文章id
                var popsType = []; //文章类型
                var hrefArr = [];
                for (var i = 0, j = tempResult.length; i < j; ++i) {
                    //推荐的数据全是没转过的,其他四个分页部分转换
                    if (listData.tabvalue === 'recommend') {
                        //转换视频时间长度
                        tempResult[i].iTime = window.L_timeToDate(tempResult[i].iTime, 'second', 'minute');
                        //转换播放次数
                        tempResult[i].iTotalPlay = window.L_converUnit(tempResult[i].iTotalPlay, 'ones', 1);
                    }
                    //转换更新时间
                    tempResult[i].sIdxTime = window.convertUpdate(tempResult[i].sIdxTime);

                    // 处理曝光数据 deng
                    popiDocID.push(tempResult[i].iDocID);
                    popsType.push('video');
                    hrefArr.push(tempResult[i].sUrl);
                }
                //放入缓存
                this.flashVideoDataCache['' + listData.tabvalue + listData.pagenumber] = listData;
                //填充
                this.fullVideo(listData);
                // 视频 曝光上报
                SendEAS.sendVideoPOP(popiDocID.join('|'), popsType.join('|'), hrefArr.join('|'))

                //请求封面图数据
                var vidArray = [];
                for (var i = 0, j = listData.result.length; i < j; ++i) {
                    vidArray.push(listData.result[i].sVID);
                }
                VideoProgram.hoverImg.getHoverImg(vidArray);
            },
            /*填充*/
            fullVideo: function (listData) {
                //获取当前tab 标题数据,若数据不符合,则放弃填充
                var nowSelectedTitle = $(".m-fresh-video .part-tab-title .selected");
                var tabvalue = nowSelectedTitle.attr('data-tabvalue');
                var pagenumber = nowSelectedTitle.attr('data-page');
                if (listData.tabvalue == tabvalue && listData.pagenumber == pagenumber) {
                    $('#J_flashVideoContainer').html(template('J_flashVideoTemplate', listData));
                }
            }
        },
        /*hover预览图封面流程*/
        hoverImg: {
            /*数据缓存,以vid为key*/
            dataCache: {},
            /*size key*/
            sizeKey: '640_360',
            init: function () {
                //监听所有需要hover读取预览图的视频
                var _self = this;
                $('body').on('mousemove', '.video-item', function (e) {
                    _self.handleMousemove(e, this);
                }).on('mouseout', '.video-item', function () {
                    $(this).find('.video-pre-wrap').hide();
                });
            },
            /*处理鼠标移动事件*/
            handleMousemove: function (event, dom) {
                var offsetX = event.offsetX;
                //不支持offsetX 跳出;
                if (!offsetX) return;

                var $dom = $(dom),
                    vid = $dom.data('vid'),
                    data = this.dataCache[vid];
                //判断是否存在数据
                if (typeof data === 'undefined' || +data.retcode !== 0) return;
                data = data.fields.smart_pic_infos[this.sizeKey];
                var domWidth = $dom.width(),
                    imgLength = data.length;

                //每张图的移动间隔
                var moveStep = domWidth / imgLength;
                //步数对应的图片顺序
                var posIndex = Math.ceil(offsetX / moveStep);
                //寻找这个顺序对应的图片
                var showData = window.searchKeyValueEqualArray(data, 'pos', posIndex);

                $dom.find('.video-pre-img').attr('src', showData.url);
                $dom.find('.video-pre-wrap').show();

                $dom.find('.video-pre-bar>i').css('width', 100 / imgLength * posIndex + '%');
            },
            /*获取预览图数据*/
            getHoverImg: function (vidArray) {
                var vidStringList = vidArray.join(',');
                var requestParam = {
                    apiUrl: '//union.video.qq.com/fcgi-bin/data?otype=json&union_jsonp=1&tid=1269&appid=20001800&appkey=3e303d6412e2d71d&idlist=' + vidStringList,
                    $requestType: 'ajax',
                    attach: this,
                    data: {
                        type: "get",
                        dataType: 'jsonp'
                    },
                    successBack: function (e) {
                        try {
                            if (e.results && e.results.length) {
                                //处理数据
                                this.attach.handleData(e.results);
                            } else {
                                //再次请求
                                this.requestOne();
                            }
                        } catch (e) {
                            console.log(e);
                            //再次请求
                            this.requestOne();
                        }
                    },
                };
                RequestApi(requestParam);
            },
            /*处理获取到的数据,并缓存*/
            handleData: function (result) {
                var resultOne, fields, data;
                for (var i = 0, j = result.length; i < j; ++i) {
                    resultOne = result[i];

                    if (+resultOne.retcode !== 0) continue;

                    fields = resultOne.fields;
                    this.dataCache[resultOne.id] = resultOne;
                    if (fields.smart_pic_infos) {
                        fields.smart_pic_infos = JSON.parse(fields.smart_pic_infos);
                        //排除pos=0的图片
                        data = fields.smart_pic_infos[this.sizeKey];
                        for (var i2 = 0, j2 = data.length; i2 < j2; ++i2) {
                            if (+data[i2].pos === 0) {
                                data.splice(i2, 1);
                                break;
                            }
                        }
                    }
                }
            }
        }
    };
    /**  游戏功能导航部分  **/
    var SlideNav = {
        init: function () {
            this.bssHover();
        },
        /*玩家社区hover效果*/
        bssHover: function () {
            var hover$ = $('#slideNavHover');
            //延迟关闭,以免频繁触发关闭和hover
            var timeout;
            $('#J_gamebss,#slideNavHover').on('mouseover', function (e) {
                e.preventDefault();
                e.stopPropagation();
                clearTimeout(timeout);
                if (!hover$.hasClass('show')) {
                    hover$.addClass('show');
                }
            }).on('mouseout', function (e) {
                e.preventDefault();
                e.stopPropagation();
                clearTimeout(timeout);
                timeout = setTimeout(function () {
                    hover$.removeClass('show');
                }, 100);
            })
        }
    };
    /**  侧边栏,监听 **/
    var RightNavBar = {
        navBar: null,
        navtitle: null,
        window$: null,
        windowDocument: null,
        init: function () {
            this.windowDocument = $(window.document);
            this.window$ = $(window);
            this.navtitle = $('.rightnav-bar [data-scrollto]');
            this.navBar = $('.rightnav-bar');
            //处理屏幕缩放
            this.window$.on('resize', this.checkShow.bind(this));
            this.checkShow();
            //处理滚动
            this.windowDocument.on('scroll', this.handleScroll.bind(this));
            this.handleScroll();
            //绑定点击导航跳转
            var scrollEl = $('[data-scrollto]');
            scrollEl.on('click', function () {
                var tempThis = $(this);
                var aimEl = $(tempThis.attr('data-scrollto'));
                $('html,body').animate({
                    scrollTop: aimEl.offset().top
                }, 200);
                RightNavBar.changeTitleClass(tempThis);
            });
            $('.rn-polo').on('click', function () {
                $('html,body').animate({
                    scrollTop: 0
                });
            });
        },
        handleScroll: function () {
            var scrollTop = this.windowDocument.scrollTop();
            //判断是否可以显示回到顶部
            if (scrollTop > 250) {
                this.navBar.addClass('showTop');
            } else {
                this.navBar.removeClass('showTop');
            }
            //判断标题激活
            var needChangeEl;
            var tempTop;
            for (var i = 0, j = this.navtitle.length; i < j; ++i) {
                tempTop = $(this.navtitle.eq(i).attr('data-scrollto')).offset().top;
                if (scrollTop + this.window$.height() / 2 > tempTop) {
                    needChangeEl = this.navtitle.eq(i);
                }
            }
            if (needChangeEl) {
                this.changeTitleClass(needChangeEl);
            } else {
                this.changeTitleClass(null);
            }
        },
        changeTitleClass: function ($el) {
            this.navtitle.removeClass('selected');
            $el && $el.addClass('selected');
        },
        checkShow: function () {
            if (this.windowDocument.width() < 1428) {
                this.navBar.removeClass('show');
            } else {
                this.navBar.addClass('show');
            }
        }
    };
    /**
     * 赛事部分js 负责赛事头条的请求以及引入赛事模板
     * 流程：
     * 1填写matchId，
     * 2请求lpl后台对应需要显示的赛事配置接口，
     * 3查询模板配置文件indexMatchConfig.js里是否有对应的模板
     * 4读取并写入赛事模板，由模板负责自身的数据渲染
     * 注意:为了避免内存泄漏,切换赛事时,渲染过的模板dom会以none的形式留存在页面内.所以,模板的dom之间不能有相同的id
     * **/
    var EventJs = {
        matchId: 134, //官网每次只显示一种赛事，这个赛事可能分为很多子赛事，如常规赛，季后赛等等，由gameType决定。
        configData: null, //上面赛事对应的显示配置文件
        nowMatch: null,
        gameModeList: window.gameModeList,
        init: function () {
            //读取css文件
            $('head').append('<link rel="stylesheet" href="/v3/css/index-match.css">');

            //懒加载监听,滚动监听
            DelayExpand.addDelay({
                $el: $('.g-wrap-match'),
                delayRunFunc: this.delayRunFunc.bind(this)
            });
            //监听预约按钮
            $('.m-events-container').on('click', '[data-dinyue]', function (e) {
                var tempTarget = $(e.target);
                if (+tempTarget.data('ordered') === 1) {
                    this.canceldinyue(tempTarget);
                } else {
                    this.dinyue(tempTarget);
                }
            }.bind(this));
        },
        delayLoaded: false,
        delayRunFunc: function () {
            if (this.delayLoaded) return;
            this.delayLoaded = true;
            $('.g-wrap-match').addClass('indexpart-show');
            this.loadMatchConfig();
        },
        loadMatchConfig: function () {
            addLoadingTip('ing', '.m-events-container', 'span', true);
            //读取模板配置文件
            var requestMatchConfigParam = {
                apiUrl: '//lol.qq.com/v3/index-match-module/indexMatchConfig.js?v=' + L_CommFunc.ran,
                $requestType: 'getScript',
                attach: this,
                successBack: function () {
                    try {
                        if (window['indexMatchConfig']) {
                            this.attach.getDataSuccess();
                        }
                    } catch (e) {
                        console.log(e);
                        //再次请求
                        this.requestOne();
                    }
                },
                failBack: function () {
                    addLoadingTip('fail', '.m-events-container', 'li', true);
                }
            };
            RequestApi(requestMatchConfigParam);
            //读取要显示的赛事配置文件
            var requestConfigParam = {
                apiUrl: '//lpl.qq.com/web201612/data/LOL_MATCH2_GAME_' + this.matchId + '_GAMETYPE_INFO.js?v=' + L_CommFunc.ran,
                $requestType: 'getScript',
                attach: this,
                successBack: function () {
                    try {
                        if (+GameTypeList.status === 0) {
                            this.attach.configData = GameTypeList.msg;
                            this.attach.getDataSuccess();
                        }
                    } catch (e) {
                        console.log(e);
                        //再次请求
                        this.requestOne();
                    }
                },
                failBack: function () {
                    addLoadingTip('fail', '.m-events-container', 'li', true);
                }
            };
            RequestApi(requestConfigParam);
            //读取官网赛事头条
            var requestEventNewsParam = {
                apiUrl: '//lol.qq.com/cms/match2/data/LOL_MATCH2_NEWS_RECOMMEND_126_INFO.js?v=' + L_CommFunc.ran,
                $requestType: 'ajax',
                attach: this,
                data: {
                    dataType: 'json'
                },
                successBack: function (e) {
                    try {
                        if (+e.status === 0) {
                            this.attach.getEventNewsSuccess(e.msg);
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
            RequestApi(requestEventNewsParam);
            //读取战队数据
            var requestTeamParam = {
                apiUrl: '//lpl.qq.com/web201612/data/LOL_MATCH2_TEAM_LIST.js',
                $requestType: 'getScript',
                attach: this,
                successBack: function () {
                    try {
                        if (+TeamList.status === 0) {
                            window.TeamList = TeamList.msg;
                            this.attach.getDataSuccess();
                        } else {
                            //再次请求
                            this.requestOne();
                        }
                    } catch (e) {
                        console.log(e);
                        //再次请求
                        this.requestOne();
                    }
                },
                failBack: function () {
                    addLoadingTip('fail', '#m-events-container', 'span', true);
                }
            };
            RequestApi(requestTeamParam);
        },
        getDataSuccess: function () {
            //配置数据和战队数据都已经准备好
            if (this.configData && window['TeamList'] && window['indexMatchConfig']) {
                this.loadConfigSuccess();
                //清理掉加载提示
                $('.m-events-container').html('');
            }
        },
        loadConfigSuccess: function () {
            //填充头部标题,并给需要默认显示的比赛加selected；
            var matchTabLi = '';
            var tempKeyData;
            for (var i = 0, j = this.configData.length; i < j; ++i) {
                tempKeyData = this.configData[i];
                //需要把matchid和gametype都挂在赛事标题上，以便赛事模板从标题上获取数据
                matchTabLi += '<li data-default="' + tempKeyData.iDefault + '" data-open="' + tempKeyData.iOpen + '" data-matchid="' + this.matchId + '" data-gametype="' + tempKeyData.GameTypeId + '" data-configid="' + this.matchId + '_' + tempKeyData.GameTypeId + '">' + tempKeyData.GameTypeName + '</li>';
                //matchTabLi += '<li data-default="' + tempKeyData.iDefault + '" data-open="1" data-matchid="' + this.matchId + '" data-gametype="' + tempKeyData.GameTypeId + '" data-configid="' + this.matchId + '_' + tempKeyData.GameTypeId + '">' + tempKeyData.GameTypeName + '</li>';
            }
            $('.g-wrap-match .part-tab-title').html(matchTabLi).children('[ data-default=1]').addClass('selected');
            //初始化一个标题,给需要默认显示的比赛加select
            new L_CommTab({
                p_title: '.g-wrap-match .part-tab-title>li',
                //tab切换回调事件
                changeStartBack: function ($title) {
                    this.changeMatchTab($title.data('matchid'), $title.data('gametype'), $title.data('open'));
                    window['PTTSendClick'] && PTTSendClick('match', 'match-tab' + ($title.index() + 1), $title.text())
                }.bind(this)
            });
        },
        /*请求赛事新闻成功*/
        getEventNewsSuccess: function (data) {
            if (!data[127].length > 0) return;
            var innerData = data[127][0];
            var news = $('#J_eventTopNews').html('<img src="' + innerData.sIMG + '" width="25" height="25" alt="' + innerData.sTitle + '">' + innerData.sTitle);
            news.attr('href', innerData.sUrl).attr('onclick', "PTTSendClick('match','match-sj','" + innerData.sTitle + "')").css('display', 'block');
        },
        /*切换赛事tab*/
        changeMatchTab: function (matchKey, gameType, open) {
            //标记最后一个赛事key,以免异步请求填充错误
            this.nowMatch = matchKey + '_' + gameType;
            //判断是否已经存在这个赛事
            var nowMatch = $('.m-events-container>#' + matchKey + '_' + gameType);
            if (nowMatch.length) {
                //切换内容区域
                this.changeContent();
            } else {
                //判断是否是敬请期待
                if (+open === 1) {
                    this.getMatchHtm(indexMatchConfig[matchKey][gameType], matchKey, gameType);
                } else {
                    var tempString = this.produceWait();
                    this.putInPage(tempString, matchKey, gameType);
                }
            }
        },
        /*请求一个赛事模板*/
        getMatchHtm: function (url, matchKey, gameType) {
            //没有请求地址会默认为请求首页的地址导致出错,所以中断去往敬请期待.
            if (!url) {
                var tempString = this.produceWait();
                this.putInPage(tempString, matchKey, gameType);
                return;
            };
            //读取配置文件
            var getMatchHtm = {
                apiUrl: url,
                $requestType: 'ajax',
                data: {
                    dataType: 'html'
                },
                attach: this,
                successBack: function (e) {
                    this.attach.putInPage(e, matchKey, gameType);
                },
                failBack: function () {
                    this.attach.putInPage("<div class='wait-tip'><img src='//ossweb-img.qq.com/images/lol/v3/polo-sleep.gif'><a>服务器开小差了，请稍后重试</a></div>", matchKey, gameType);
                }
            };
            RequestApi(getMatchHtm);
        },
        /*将赛事模板文件加入到页面*/
        putInPage: function (htmString, matchKey, gameType) {
            var htmdiv = $(document.createElement('div')).attr('id', matchKey + '_' + gameType).append(htmString);
            htmdiv.css('display', 'none').addClass('match-show');
            $('.m-events-container').append(htmdiv);
            //切换内容区域
            this.changeContent();
        },
        /*切换内容区域*/
        changeContent: function () {
            $('.m-events-container>div').css('display', 'none');
            $('#' + this.nowMatch).css('display', 'block');
        },
        /*生成敬请等待*/
        produceWait: function () {
            return "<div class='wait-tip'><img src='//ossweb-img.qq.com/images/lol/v3/polo.gif'><a>敬请期待</a></div>";
        },
        /*预约*/
        dDinYueUrl: "//apps.game.qq.com/lol/match/apis/searchVideoSubscibe.php",
        dinyue: function ($btn) {
            var qtMatchId = $btn.attr('data-dinyue');
            var self = this;
            /*检查登录状态*/
            var loginS = function (tLogin) {
                //已经登录,发起预约请求
                var goUrl = self.dDinYueUrl + "?type=1&r1=retObj&elements_id=" + qtMatchId;
                $.getScript(goUrl, function () {
                    if (+retObj.status === 0) {
                        alert("预约成功");
                        $btn.html('取消预约').attr('data-ordered', '1');
                    } else {
                        if (retObj.msg === "Already Subscribed") {
                            alert("您已经预约过这场赛事");
                            $btn.html('取消预约').attr('data-ordered', '1');
                        } else {
                            alert(retObj.msg);
                        }
                    }
                });
            };
            var loginF = function (tLogin) {
                //还未登录,监听登录成功事件
                tLogin.on(tLogin.eventType.login, loginS, self);
                //发起登录
                tLogin.login();
            };

            /*检查组件初始化状态*/
            var readyS = function (tLogin) {
                //登录组件成功初始化,判断登录状态
                tLogin.checkLogined(loginS, loginF);
            };
            var readyF = function (tLogin) {
                //登录组件还在初始化,监听初始化成功事件
                tLogin.on(tLogin.eventType.ready, readyS, self);
            };
            T_Login.checkReady(readyS, readyF);
        },
        canceldinyue: function ($btn) {
            var qtMatchId = $btn.attr('data-dinyue');
            var self = this;
            var goUrl = self.dDinYueUrl + "?type=2&r1=retObj&elements_id=" + qtMatchId;
            $.getScript(goUrl, function () {
                if (+retObj.status === 0) {
                    alert("取消预约成功");
                    $btn.html('预约').attr('data-ordered', '0');
                } else {
                    alert(retObj.msg);
                }
            });
        }
    };
    /**  英雄资料  **/
    var ChampionData = {
        championList: null,
        listScroll: null,
        init: function () {
            addLoadingTip('ing', '#J_championItemContainer', 'li', true);
            //懒加载监听
            DelayExpand.addDelay({
                $el: $('.g-wrap-championlist'),
                delayRunFunc: this.delayRunFunc.bind(this)
            });
        },
        /**懒加载组件判断滚到到容器的位置时,执行切换图片的地址.监听容器而不是img,是因为屏幕外的元素滚动进入屏幕内,懒加载组件无法正确判断位置*/
        delayLoaded: false,
        delayRunFunc: function () {
            if (this.delayLoaded) return;
            //已经滚动到英雄资料
            this.delayLoaded = true;
            $('.g-wrap-championlist>.g-wrap').addClass('indexpart-show');
            //先判断是否有英雄列表数据,用newLOLherojs全局变量存放
            if (window.newLOLherojs) {
                //填充数据
                ChampionData.fullChampionData();
                //初始化滚动
                ChampionData.initScroll();
            } else {
                var requestParam = {
                    apiUrl: '//game.gtimg.cn/images/lol/act/img/js/heroList/hero_list.js?v=' + L_CommFunc.ran,
                    $requestType: 'ajax',
                    data: {
                        dataType: 'json'
                    },
                    successBack: function (data) {
                        try {
                            if (data && data.hero) {
                                window.newLOLherojs = data;
                                //填充数据
                                ChampionData.fullChampionData();
                                //初始化滚动
                                ChampionData.initScroll();
                            } else {
                                //再次请求
                                this.requestOne();
                            }
                        } catch (e) {
                            console.log(e);
                            //再次请求
                            this.requestOne();
                        }
                    },
                    failBack: function () {
                        addLoadingTip('fail', '#J_championItemContainer', 'li', true);
                    }
                };
                RequestApi(requestParam);
            }
        },
        fullChampionData: function () {
            //因为从champion.js切换到了hero_list.js,为了不修改shtml里的渲染模板,所以特别使用js替换下模板内容
            var championItem = document.getElementById("championItem");
            var tempInnerHTML = championItem.innerHTML;
            tempInnerHTML = tempInnerHTML.replace("{{each data}}", "{{each}}");
            tempInnerHTML = tempInnerHTML.replace("{{$value.id}}.png", "{{$value.alias}}.png");
            tempInnerHTML = tempInnerHTML.replace("id={{$value.id}}", "id={{$value.heroId}}");
            tempInnerHTML = tempInnerHTML.replace("champion.{{$value.id}}", "champion.{{$value.alias}}");
            tempInnerHTML = tempInnerHTML.replace("$value.tags", "$value.roles");
            championItem.innerHTML = tempInnerHTML;
            //填充全部英雄数据
            var container = $('#J_championItemContainer');
            container.html(template('championItem', window.newLOLherojs.hero));

            //监听分类筛选
            this.monitorSort();
        },
        /*初始化滚动条*/
        initScroll: function () {
            this.listScroll = new Swiper('#J_ChampionListContainer', {
                scrollContainer: true,
                mode: 'vertical',
                preventLinks: true,
                grabCursor: true,
                cssWidthAndHeight: true,
                mousewheelControl : true,
                scrollbar: {
                    container: '#J_ChampionListContainer>.scrollbar',
                    hide: false,
                    draggable: true
                }
            });
        },
        /**监听分类筛选*/
        monitorSort: function () {
            var tempLi = $('#J_championSortType>li');
            tempLi.on('click', function () {
                tempLi.removeClass('selected');
                var sort = $(this).addClass('selected').attr('data-sort');
                //统一转成小写
                sort = sort.toLowerCase();
                var tabTxt = $(this).text()
                ChampionData.showTagChampion(sort);
                window['PTTSendClick'] && PTTSendClick('championlist', 'championlist-' + ($(this).index() + 1), tabTxt);
            });
        },
        /**显示某个标签的英雄,隐藏其他英雄*/
        showTagChampion: function (tag) {
            this.championList || (this.championList = $('#J_championItemContainer>li'));
            if (tag === 'all') {
                this.championList.css('display', 'block');
            } else {
                this.championList.each(function () {
                    var tempThis = $(this);
                    if (tempThis.attr('data-tags').indexOf(tag) === -1) {
                        tempThis.css('display', 'none');
                    } else {
                        tempThis.css('display', 'block');
                    }
                })
            }
            //重新初始化滚动条
            this.listScroll.reInit();
            this.listScroll.resizeFix();
            this.listScroll.setWrapperTranslate(0, 0, 0);
        }
    };
    /**  fanart部分  **/
    var FanartJs = {
        init: function () {
            addLoadingTip('ing', '#J_fanartContainer', 'li', true);
            //懒加载监听
            DelayExpand.addDelay({
                $el: $('.g-wrap-fanart'),
                delayRunFunc: this.delayRunFunc.bind(this)
            });
            //初始化合作媒体按钮hover,同时在回调里初始化swiper
            hoverShowInit('.href-partner', '.partner-list-container', false, this.hoverbackInitSwiper.bind(this));
            //监听点赞
            $('#J_fanart').on('click', '[data-zan]', this.requestZan);
        },
        delayLoaded: false,
        delayRunFunc: function () {
            if (this.delayLoaded) return;
            this.delayLoaded = true;
            $('.fanart-left,.fanart-right').addClass('indexpart-show');
            //发出请求加载精品专栏
            if (window['OfficialWebsiteCfg']) {
                //其他模块加载过这个js数据,直接填充
                FanartJs.fullCorneradv();
            } else {
                var requestParam = {
                    apiUrl: '//lol.qq.com/act/AutoCMS/publish/LOLWeb/OfficialWebsite/website_cfg.js?v=' + L_CommFunc.ran,
                    $requestType: 'getScript',
                    successBack: function () {
                        try {
                            if (OfficialWebsiteCfg) {
                                FanartJs.fullCorneradv();
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
            //请求fanart数据
            var requestFanartParam = {
                apiUrl: '//apps.game.qq.com/lol/lolapi/recommendContentList.php?r1=fanartdata&a0=recommendList&page=1&pagesize=20&source=web_pc',
                $requestType: 'ajax',
                data: {
                    dataType: 'script'
                },
                successBack: function () {
                    try {
                        if (+fanartdata.status === 0) {
                            //填充
                            FanartJs.fullFanart(fanartdata);
                        } else {
                            //再次请求
                            this.requestOne();
                        }
                    } catch (e) {
                        console.log(e);
                        //再次请求
                        this.requestOne();
                    }
                },
                failBack: function () {
                    addLoadingTip('fail', '#J_fanartContainer', 'li', true);
                }
            };
            RequestApi(requestFanartParam);
            //请求媒体链接数据
            var requestMediaParam = {
                apiUrl: '/v3/js/mediaData.js',
                $requestType: 'getScript',
                successBack: function (e) {
                    try {
                        if (L_mediaData) {
                            //填充
                            FanartJs.fullMediaData(L_mediaData);
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
            RequestApi(requestMediaParam);

            //处理右边三个图片的加载
            $('#J_fanart').find("[data-imgsrc]").each(function () {
                var tempThis = $(this);
                tempThis.attr('src', tempThis.attr('data-imgsrc'));
            });
        },
        /**填充fanart*/
        fullFanart: function (data) {
            //截取前8个
            data.msg.data = data.msg.data.slice(0, 8);
            $('#J_fanartContainer').html(template('J_fanartTemplate', {
                list: data.msg.data,
                fanartClassData: this.fanartClassData
            }));
            //调整图片尺寸
            //this.monitorImgLoad(data.msg.data);
        },
        /**监听图片加载并调整图片尺寸,废弃*/
        monitorImgLoad: function (list) {
            var fanartImg;
            //监听加载同时计算一次,免得加载先于load完成
            for (var i = 0, j = list.length; i < j; ++i) {
                fanartImg = $('#fanart' + i);
                fanartImg.on('load', function () {
                    FanartJs.adaptFanartImg(this);
                });
                this.adaptFanartImg(fanartImg[0]);
            }
        },
        adaptFanartImg: function (img) {
            var fanartImg = $(img);
            if (!img['naturalWidth']) return;

            var n_imgWidth = img.naturalWidth;
            var n_imgHeight = img.naturalHeight;

            var r_imgWidth, r_imgHeight;
            if (n_imgWidth > n_imgHeight) {
                fanartImg.css({
                    height: '176px',
                    width: 'auto'
                });
                r_imgHeight = 176;
                r_imgWidth = Math.ceil(176 / n_imgHeight * n_imgWidth);
            } else {
                fanartImg.css({
                    width: '192px',
                    height: 'auto'
                });
                r_imgWidth = 192;
                r_imgHeight = Math.ceil(192 / n_imgWidth * n_imgHeight);
            }
            fanartImg.css({
                left: '50%',
                top: '50%',
                marginTop: -r_imgHeight / 2 + 'px',
                marginLeft: -r_imgWidth / 2 + 'px'
            })
        },
        /**填充精品专栏*/
        fullCorneradv: function () {
            if (OfficialWebsiteCfg['corneradv']) {
                var corneradv = OfficialWebsiteCfg.corneradv;
                //填充模板
                $('#J_mainColumn').html(template('J_mainColumnTemplate', corneradv));
            }
        },
        /**填充媒体链接*/
        fullMediaData: function (mediaData) {
            $('#J_partnerContainer').html(template('J_partnerTemplate', mediaData));
        },
        scrollSwiper: null,
        /*初始化合作媒体滚动条,需要在display:block之后初始化*/
        hoverbackInitSwiper: function () {
            window['PTTSendClick'] && PTTSendClick('fanart', 'fanart-other4', '合作媒体');
            if (this.scrollSwiper) return;
            this.scrollSwiper = new Swiper('#J_partnerList', {
                scrollContainer: true,
                mode: 'vertical',
                preventLinks: true,
                mousewheelControl: true,
                grabCursor: true,
                scrollbar: {
                    container: '#J_partnerList>.scrollbar',
                    hide: false,
                    draggable: true
                }
            });
        },
        /*点赞*/
        requestZan: function (e) {
            var self = FanartJs;
            var tempTarget = $(e.target),
                iContentId, zanBtn;
            if (tempTarget.attr('data-zan')) {
                zanBtn = tempTarget;
            } else {
                zanBtn = tempTarget.parent();
            }
            iContentId = zanBtn.attr('data-zan');
            var params = {
                'iContentId': iContentId,
                'serviceType': 'lol',
                'sAction': 'zanContent',
                'sModel': 'zan',
                'actId': 16
            };
            var dataCallback = function (ret) {
                if (ret.iRet == '0') {
                    self.zanSuccess(zanBtn, ret.jData.iZanCount);
                } else if (ret.iRet == '-9999') {
                    alert(ret.sMsg);
                } else if (ret.iRet == '-1') {
                    T_Login.login();
                }
            };
            var requestData = {
                apiUrl: '//apps.game.qq.com/cms/index.php' + '?r0=jsonp&v=' + Math.random(),
                $requestType: 'ajax',
                timeout: 5000,
                tryTimes: 1,
                data: {
                    data: params,
                    dataType: 'jsonp',
                    xhrFields: {
                        withCredentials: true
                    }
                },
                successBack: dataCallback,
                failBack: function () {
                    alert("很抱歉，服务器暂时繁忙，请您稍后再试！");
                }
            };
            new RequestApi(requestData);
        },
        /*点赞成功*/
        zanSuccess: function ($btn, number) {
            $btn.addClass('on');
            $btn.children('.number').text(number);
        }
    };
    /**
     * 首页Js入口
     * */
    var LolIndex = {
        /**首页js初始化*/
        init: function () {
            //懒加载
            DelayExpand.init();
            //新闻
            NewsJs.init();
            //活动
            ActionJs.init();
            //赛事
            EventJs.init();
            //视频
            VideoProgram.init();
            //侧边栏
            RightNavBar.init();
            //新版本资料
            NewVersion.init();
            //游戏功能导航
            SlideNav.init();
            //fanart
            FanartJs.init();
            //英雄资料
            ChampionData.init();
        }
    };
    LolIndex.init();
})(window);
