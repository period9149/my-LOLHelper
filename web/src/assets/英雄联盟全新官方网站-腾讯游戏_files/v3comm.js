/**全官网都需要用的东西才放到这里,有一个页面不用都不能放,其他站禁止引入*/
(function() {
    /**右下角活动小导航加载*/
    var loadHotActRB = function() {
        setTimeout(function() {
            loadScript(location.protocol + "//ossweb-img.qq.com/images/clientpop/js/gpmtips.js", function() {});
        }, 3000);
    };
    /**EAS数据上报*/
    window.SendEAS = {
        EASReady: false,
        init: function() {
            //初始化,并标记初始化成功.
            this.initEAS();
            window['T_Login'] && T_Login.checkBoundArea(function() {
                this.initEAS();
            }.bind(this), function() {
                T_Login.on(T_Login.eventType.boundArea, this.initEAS, this);
            }.bind(this))
        },
        /**初始化EAs*/
        initEAS: function() {
            EAS.need('iu', function() {
                EAS.iu.init({
                    'userId': T_Login.gAccountId,
                    'openId': '',
                    'area': T_Login.gAccountArea,
                    'serviceType': 'lol',
                    'iuName': 'w_lol'
                }, function() {
                    SendEAS.EASReady = true;
                });
            });
        },
        /**发送pv新闻点击*/
        sendNewsPV: function(vUrl, clickUrl, docid) {
            if (!this.EASReady) return;
            // EAS.iu.click({
            //     'actionType': 'pv',
            //     'vUrl': vUrl,
            //     'clickUrl': clickUrl,
            //     'contentId': docid,
            //     'contentType': 'news',
            //     'contentSource': 'list'
            // });
            EAS.iu.click({
                'actionType': 'click',
                'vUrl': vUrl,
                'clickUrl': clickUrl,
                'contentId': docid,
                'contentType': 'news',
                'contentSource': 'list'
            });
        },
        /**新闻曝光*/
        sendNewsPOP: function(docid, contentType, clickUrl) {
            if (!this.EASReady) return;
            EAS.iu.click({
                'actionType': 'pop',
                'contentId': docid,
                'contentType': contentType,
                'contentSource': 'list',
                'clickUrl': clickUrl
            })
        },
        /**发送pv活动点击 不是KOL的接口，去除这里的上报*/
        sendActPV: function(vUrl, clickUrl, iActId) {
            if (!this.EASReady) return;
            // EAS.iu.click({
            //     'actionType': 'pv',
            //     'vUrl': vUrl,
            //     'clickUrl': clickUrl,
            //     'contentId': iActId,
            //     'contentType': vUrl,
            //     'contentSource': 'list'
            // });
            EAS.iu.click({
                'actionType': 'click',
                'vUrl': vUrl,
                'clickUrl': clickUrl,
                'contentId': iActId,
                'contentType': vUrl,
                'contentSource': 'list'
            });
        },
        /**发送pv视频点击*/
        sendVideoPV: function(vUrl, clickUrl, docid) {
            if (!this.EASReady) return;
            // EAS.iu.click({
            //     'actionType': 'pv',
            //     'vUrl': vUrl,
            //     'clickUrl': clickUrl,
            //     'contentId': docid,
            //     'contentType': 'video',
            //     'contentSource': 'list'
            // });
            EAS.iu.click({
                'actionType': 'click',
                'vUrl': vUrl,
                'clickUrl': clickUrl,
                'contentId': docid,
                'contentType': 'video',
                'contentSource': 'list'
            });
        },
        /**视频曝光*/
        sendVideoPOP: function(docid, contentType, clickUrl) {
            if (!this.EASReady) return;
            EAS.iu.click({
                'actionType': 'pop',
                'contentId': docid,
                'contentType': contentType,
                'contentSource': 'list',
                'clickUrl': clickUrl
            })
        },
        /**发送pv fanart点击*/
        sendFanartPV: function(vUrl, clickUrl, iContentId) {
            if (!this.EASReady) return;
            EAS.iu.click({
                'actionType': 'click',
                'vUrl': vUrl,
                'clickUrl': clickUrl,
                'contentId': iContentId,
                'contentType': 'pic',
                'contentSource': 'recommend'
            });
        },
        /**发送轮播pv点击*/
        sendPromoPV: function(vUrl, clickUrl, bannerId) {
            if (!this.EASReady) return;
            EAS.iu.click({
                'actionType': 'click',
                'vUrl': vUrl,
                'clickUrl': clickUrl,
                'contentId': bannerId,
                'contentType': 'act',
                'contentSource': 'Promo'
            });
        }

    };
    window.SendEAS.init();
    /** Top入口 **/
    var V3CommJs = {
        init: function() {
            loadHotActRB();
            //处理缩放
            L_ZoomPage.init();
        }
    };
    V3CommJs.init();
})(window);
