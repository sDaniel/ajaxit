document.getElementsByTagName("html")[0].style.marginTop = "-999999px";
(function ($) {
    var ajaxItMain={
        ajaxItArea: null,
        basePath: null,
        excludeURL: new Array(),
        readyList: null,
        isInit: false,
        onSuccess: null,
        onError: null,
        onStart:null,
        win:(window.document || window),
        protocol:(window.document || window).location.protocol,

        // auto redirect
        redirect: function(){
            var baseURL  = ajaxItMain.protocol + "//"+ ajaxItMain.win.location.host + ajaxItMain.basePath;
            var page     = ajaxItMain.win.location.href;
            var pathName = ajaxItMain.win.location.pathname;
            var query    = '';
            if(page.indexOf('?')!= -1){
                query = page.substring(page.indexOf('?'), page.length);
            }

            if (page.replace(/#.*/, '') != baseURL){ // redirect
                ajaxItMain.win.location.href = baseURL + "#"+ pathName.replace(ajaxItMain.basePath,"") + query;
                return true;
            }else{
                return false;
            }
        },

        // ajax ready list
        getReadyList: function()
        {
            if($.readyList != null)
                this.myreadylist =  $.readyList.slice();
            return this.myreadylist;
        },

        goToHash:function (hash){
            if(!hash){
                hash=ajaxItMain.win.location.hash;
                hash=hash.substring(hash.indexOf('#')+1, hash.length);
            }
            if(hash.indexOf('#') != -1){
                anchor = hash.substring(hash.indexOf('#')+1, hash.length);
                if($('a[name='+anchor+']').length){
                    $(document).scrollTop($('a[name='+anchor+']').offset().top);
                }else if($('#'+anchor).length){
                    $(document).scrollTop($('#'+anchor).offset().top);
                }
            }

        },
        // get page function
        getPage: function(hash) {
            if (hash && hash != '#'){
                $.ajax({
                    type: "GET",
                    url: hash,
                    async:true,
                    error:function (event, request, options, error) {
                        if (ajaxItMain.onError){
                            ajaxItMain.onError(event,request,options,error);
                        }
                    },
                    success:  function (data) {
                        // ----------------- < data >
                        // clearing CDATA
                        data=data.replace(/\<\!\[CDATA\[\/\/\>\<\!\-\-/gi,'');
                        data=data.replace(/\/\/\-\-\>\<\!\]\]\>/gi,'');

                        // extracting the the head and body tags
                        var dataHead = data.match(/<\s*head.*>[\s\S]*<\s*\/head\s*>/ig).join("");
                        var dataBody = data.match(/<\s*body.*>[\s\S]*<\s*\/body\s*>/ig).join("");
                        var dataTitle = data.match(/<\s*title.*>[\s\S]*<\s*\/title\s*>/ig).join("");

                        dataHead  = dataHead.replace(/<\s*head/gi,"<div");
                        dataHead  = dataHead.replace(/<\s*\/head/gi,"</div");

                        dataBody  = dataBody.replace(/<\s*body/gi,"<div");
                        dataBody  = dataBody.replace(/<\s*\/body/gi,"</div");

                        dataTitle = dataTitle.replace(/<\s*title/gi,"<div");
                        dataTitle = dataTitle.replace(/<\s*\/title/gi,"</div");


                        // comments
                        var commentPattern = /\<\!\-\-([\s\S]*?)\-\-\>/ig;

                        // replacing head comment tags
                        var headComments = dataHead.match(commentPattern);
                        if (headComments){
                            $.each(headComments,function(){
                                var comment= $.trim(this);
                                $("head").append(comment);
                            })
                        }
                        dataHead = dataHead.replace(commentPattern,"");

                        // replacing body comment tags
                        var bodyComments = dataBody.match(commentPattern);
                        if (bodyComments){
                            $.each(bodyComments,function(){
                                var comment= $.trim(this);
                                $("body").append(comment);
                            })
                        }
                        dataBody = dataBody.replace(commentPattern,"");

                        // head - body - ajax area
                        var $dataHead    = $(dataHead);
                        var $dataTitle   = $(dataTitle);
                        var $dataBody    = $(dataBody);
                        // --------------------------- < head >
                        // apply new title
                        document.title = $dataTitle.html();

                        $("script",$dataBody).remove();
                        var ajaxItSuccess = 0;
                        var ajaxItSelect  =  ajaxItMain.ajaxItArea.split(",");
                        $.each(ajaxItSelect,function(key,value){
                            $(value,$dataBody).each( function(){
                                var thisSelector  = this.tagName;                              // adding the tagName
                                thisSelector += ($(this).attr("id"))?"#"+$(this).attr("id"):""; // adding id
                                thisSelector += ($(this).attr("class"))?"."+$(this).attr("class").split(" ").join("."):""; // adding id
                                if ($(thisSelector).length){
                                    $(thisSelector).html($(this).html());
                                    ajaxItSuccess++;
                                }
                            })
                        });

                        if (ajaxItSuccess == 0){
                            $("body").html($dataBody.html());
                        }

                        $dataBody    = $(dataBody);

                        // disable current css
                        $("link,style").each(function(){
                            var href = $(this).attr("href");
                            if (!href || $dataHead.find("link[href='"+href+"']").length == 0){
                                $(this).remove();
                            }
                        });

                        // apply new css
                        $dataHead.find("link,style").each(function(){
                            var href = $(this).attr("href");
                            if (!href || $("link[href='"+href+"']").length == 0){
                                $("head").append(this);
                            }
                        });

                        // apply new javascript
                        $dataHead.find("script").each(function(){
                            var src = $(this).attr("src");
                            if (!src || $("script[src='"+src+"']").length == 0){
                                $("head").append(this);
                            }

                        });

                        // --------------------------- < body >
                        // apply body new class and id
                        $("body").attr("class",$dataBody.attr("class"));
                        $("body").attr("id",$dataBody.attr("id"));

                        // apply new javascript
                        $dataBody.find("script").not(":contains('google-analytics.com/ga.js')").each(function(){
                            var src = $(this).attr("src");
                            if (!src || $("script[src='"+src+"']").length == 0){
                                $("body").append(this);
                            }
                        });
                        // --------------------------- < ajaxArea >

                        //----------------------------------- ready list
                        $(ajaxItMain.readyList).each(function(){
                            this();
                        });
                        if (ajaxItMain.onSuccess){
                            ajaxItMain.onSuccess();
                        }
                        document.getElementsByTagName("html")[0].style.marginTop = "0px";
                        ajaxItMain.goToHash();
                    }
                });
            }

            if (ajaxItMain.onStart){
                ajaxItMain.onStart();
            }
        },

        goTo: function(ajaxURL){
            $.history.load(ajaxURL);
        },

        initLinks: function(Selector){
            $(Selector).live("click",function(evt){
                var ajaxLink = $(this).attr('href');
                if($(this).attr('href') && evt.button == 0){
                    var hash = "";
                    if((($(this).attr('href').search('http://') > -1 && ajaxItMain.protocol == 'http:') || ($(this).attr('href').search('https://') > -1) && ajaxItMain.protocol == 'https:') && $(this).attr('href').match(document.domain)){
                        var href=$(this).attr('href').split('/');
                        ajaxLink = '/' + href.slice(3).join('/');
                    }else if ($(this).attr('href').search('http://') > -1 || $(this).attr('href').search('https://') > -1){
                        return true;
                    } else if ($(this).attr('href').search('#')==0){
                        hash = ajaxItMain.win.location.hash;
                        hash = hash.substring(hash.indexOf('#')+1, hash.length);
                        hash = hash.split('#');
                        hash = hash[0];
                        ajaxItMain.win.location.hash = '#'+ hash + $(this).attr('href');
                        return false;
                    } else if ($(this).attr('href').search('/') != 0) {
                        hash = ajaxItMain.win.location.hash;
                        hash = hash.substring(hash.indexOf('#')+1, hash.length);
                        hash = hash.split('#');
                        hash = hash[0];
                        ajaxLink = ajaxItMain.basePath + hash + $(this).attr('href');
                    }

                    if (!evt.isDefaultPrevented() && !ajaxItMain.isExclude(ajaxLink)) {
                        ajaxItMain.goTo(ajaxLink);
                        return false;
                    }
                }
                return true;
            });
        },
        isExclude:function(path){
            var isEx = false;
            path = path.replace(ajaxItMain.basePath,"");
            if (ajaxItMain.excludeURL.length){
                $.each(ajaxItMain.excludeURL, function(key,exURL){
                    exURL = exURL.replace("\\","\\\\");
                    var exReg = new RegExp(exURL,"gi");
                    if (path.match(exReg)){
                        isEx = true;
                    }
                });
            }
            return isEx;
        },
        // this should be added last so it gets all the ready event
        init: function () {
            if (!ajaxItMain.isExclude(ajaxItMain.win.location.pathname)){
                if (!ajaxItMain.redirect()){
                    $(document).ready(function() {
                        if(!ajaxItMain.isInit){
                            ajaxItMain.isInit=true;
                            ajaxItMain.initLinks("a");
                            $.history.init($.ajaxIt.getPage);
                        }
                    });
                    ajaxItMain.readyList = ajaxItMain.getReadyList();
                }
            }else{
                document.getElementsByTagName("html")[0].style.marginTop = "0px";
            }
            
        }
    };

    $.ajaxIt = ajaxItMain;
    
})(jQuery);