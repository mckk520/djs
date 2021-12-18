layui.config({
    base: '/static/assets/layui/lay/modules/',
    version: true
}).extend({ //设定模块别名
    cookie: 'jquery.cookie.min',
});
// 数组删除某元素，参数：索引
Array.prototype.remove = function(v) {
    if(isNaN(v) || v > this.length){
        return false
    }
    for(let i = 0, j = 0; i < this.length; i++) {
        if(this[i] != this[v]){
            this[j++] = this[i]
        }
    }
    this.length -= 1
}
//使用拓展模块
layui.define(["jquery", "cookie", "form", "layer"], function (exports) {
    var $ = layui.jquery,
        form = layui.form,
        cookie = layui.cookie,        
        songIndex = 0, // 当前歌曲索引
        playBtnNode = 0,
        timeOut = null,
        songList = [], // 歌曲列表
        mode, // 播放模式 0随机 1顺序 2单曲循环
        cd_cart = []; // CD购物车

        $.cookie.json = true;

    var audio = document.getElementById("media"); //获得音频元素
    // console.log('播放模式：',$.cookie('mode'))
    if (!$.cookie('mode') && $.cookie('mode') != 0) {
        mode = 1
        $.cookie('mode', 1,{path: '/'})
    } else {
        mode = $.cookie('mode')
    }
    $('.icon-mode,.is-loop').addClass(['random','loop','single-loop'][mode])
    if (!$.cookie('songIndex')) {
        songIndex = 0
        $.cookie('songIndex', 0,{path: '/' })
    } else {
        songIndex = $.cookie('songIndex')
    }
    // cd 购物车
    cd_cart = $.cookie('cd_cart') || []
    if (cd_cart.length > 0) {$('#cdquantity').show().html(cd_cart.length);}

    

    /*公共函数库*/
    var tool = {
        songList: songList,
        songIndex: songIndex,
        // 获取分辨率并存在cookie
        getScreen: function() {
            var screen = window.screen.width + "*" + window.screen.height;
            document.cookie = "coin_screen=" + screen + "; path=/;";
        },
        isPC: function() {
            var userAgentInfo = navigator.userAgent;
            var Agents = ["Android", "iPhone",
                "SymbianOS", "Windows Phone",
                "iPad", "iPod"
            ];
            var flag = true;
            for (var v = 0; v < Agents.length; v++) {
                if (userAgentInfo.indexOf(Agents[v]) > 0) {
                    flag = false;
                    break;
                }
            }
            // console.log(document.body.clientWidth) // window.screen.width
            if (document.body.clientWidth <= 750) {
                flag = false;
            }
            return flag;
        },
        // 移动端侧栏显示隐藏
        showLeftMenu: function (e) {
            if ($(e).hasClass('active')) {
                $(e).removeClass('active')
                $(e).next('.mark').remove()
                $('.mobile-nav').removeClass('active')
            } else {
                $(e).after('<div class="mobile mark" onclick="tools.showLeftMenu(\'#menu\')"></div>')
                $(e).addClass('active')
                $('.mobile-nav').addClass('active')
            }
        },
        // 移动端导航切换
        toggleMenu: function () {
            $('#menu .nav-item').click(function () {
                $(this).siblings().removeClass('active').find('.nav-child').slideUp()
                $(this).find('.nav-child').slideToggle();
                if ($(this).hasClass('active')) {
                    $(this).removeClass('active')
                } else {
                    $(this).addClass('active')
                }
            })
        },
        // 返回
        goBack: function (e) {
            history.back(-1)
        },
        // 搜索框
        inputClick: function (e) {
            if (!tool.isPC()) {
                location.href = '/dance/search/key='+id;
            }
        },
        // tab切换
        tabFnc: function () {
            $('.tab-header').each(function (e) {

                var _this = this;
                $(this).find('.btn').click(function (event) {
                    console.log($(this).html())
                    event.stopPropagation();
                    $(this).addClass('active').siblings().removeClass('active');
                    $(_this).siblings('.list-body').hide().eq($(this).index()).show()
                    $(_this).siblings('.img-lists').find('.img-list').hide().eq($(this).index()).show()

                    $(_this).next('.tab-body').children('.tab-body__item').hide().eq($(this).index()).show()
                    // $(_this).siblings('.tab-body').find('.music-list').hide().eq($(this).index()).show()
                    // if ($(_this).siblings('.tab-body').length > 0) {
                    //     $(_this).siblings('.tab-body').hide().eq($(this).index()).show()
                    // } else {
                    //     $('.tab-body').hide().eq($(this).index()).show()
                    // }
                })
            })
        },
        // 全选监听
        checkAll: function () {
            form.on('checkbox(checkAll)', function (data) {
                var child = $(data.elem).parents('.layui-form').find('input[type="checkbox"]');

                // songid_list = $.cookie('songid_list') || []

                child.each(function (index, item) {
                    item.checked = data.elem.checked;
                    if ($(data.elem).is(':checked')) {
                        if ($(this).attr('lay-filter') != 'checkAll') {
                            // 设置播放列表
                            // let parentsNode = $(this).parents('li')
                            // if (songid_list.indexOf(parentsNode.data('id').toString()) < 0) {
                            //     songid_list.push(parentsNode.data('id').toString())
                            // }
                            // $.cookie('songid_list', songid_list, {expires: 100});
                            // tool.updateList()
                        }
                    }
                });

                form.render('checkbox');
            });
        },
        // 单选监听
        checkOne: function () {
            form.on('checkbox(checkOne)', function (data) {
                var child = $(data.elem).parents('.layui-form').find('input[type="checkbox"]');
                var un_check = child.length
                songid_list = $.cookie('songid_list') || []

                $(data.elem).parents('.layui-form').find('input[lay-filter="checkAll"]').prop('checked', false);

                child.each(function (index, item) {
                    if ($(this).attr('lay-filter') != 'checkAll') {
                        let parentsNode = $(this).parents('li')
                        if ($(item).is(':checked')) {
                            un_check--;
                            if (songid_list.indexOf(parentsNode.data('id').toString()) < 0) {
                                songid_list.unshift(parentsNode.data('id').toString())
                            }
                            document.cookie = 'songid_list=' + JSON.stringify(songid_list) + ';path=/';
                            tool.updateList()
                        } else {
                            if (songid_list.indexOf(parentsNode.data('id').toString()) > -1) {
                                songid_list.remove(songid_list.indexOf(parentsNode.data('id').toString()))
                            }
                            // $.cookie('songid_list', songid_list, { expires: 100});
                            document.cookie = 'songid_len=' + songid_list.length + ';path=/';
                            document.cookie = 'songid_list=' + JSON.stringify(songid_list) + ';path=/';
                            tool.updateList() // 临时注释
                        }
                    }
                });
                if (un_check == 1) {
                    $(data.elem).parents('.layui-form').find('input[lay-filter="checkAll"]').prop('checked', true);
                }
                form.render('checkbox');
            });
        },      
        pauseOrPlay: function() {
            // alert('暂停')
            if (player.V.paused) {
                // 播放页
                $('.music-player__img').removeClass('active')
                $('.music-player__pointer').removeClass('active')

                // 如果是电台播放页
                if (typeof PLAYINGID!=="undefined") {
                    $('#playList').find('li').each(function() {
                        if ($(this).data('id') == PLAYINGID) {
                            $(this).find('.name i').removeClass('on')
                        }
                    })
                }
            } else {
                // 播放页
                $('.music-player__img').addClass('active')
                $('.music-player__pointer').addClass('active')
                // 如果是电台播放页
                if (typeof PLAYINGID!=="undefined") {
                    $('#playList').find('li').each(function() {
                        if ($(this).data('id') == PLAYINGID) {
                            $(this).find('.name i').addClass('on')
                        }
                    })
                }
            }
        },
        watchTab: function () {
            if ($('.tab-header').length > 0) {
                var i = $('.tab-header').find('.btn.active').index()
                $('.tab-header').next().find('.music-list').eq(i).find('li').each(function() {
                    $(this).find('.stop').removeClass('on')
                })
                $('.tab-header').next('.tab-body').find('.music-list').eq(i).find('li').eq(songIndex).find('.icon-img.stop').addClass('on')

            }
        },
        resetList: function (song_index) {
            songIndex = song_index > 0 ? song_index : 0
            $("#audio").attr("src", songList[songIndex].songSrc);
            // $('.player-l').html(songList[songIndex].songName)
            $(".cur-time").html('00:00:00');
        },
        // 更新播放器进度条
        updateProgress: function () {
            if (audio.currentTime != audio.duration && $('#playStop').hasClass('playing')) {
                audio.play();
            }
            /*显示歌曲总长度*/
            var songTime = tool.calcTime(Math.floor(audio.duration));
            $(".all-time").html(audio.duration ? songTime : '00:00:00');
            /*显示歌曲当前时间*/
            var curTime = tool.calcTime(Math.floor(audio.currentTime));
            $(".cur-time").html(curTime);
            /*进度条*/
            var lef = audio.currentTime / audio.duration;
            $(".progress-span").css("width", lef * 100 + '%');

            if (audio.currentTime == audio.duration) {
                // 随机播放、顺序播放
                if (mode == 0 || mode == 1) {
                    tool.nextMusic()
                }
                // 单曲循环
                if (mode == 2) {
                    audio.play();
                }
            }
        },
        // 计算时间
        calcTime: function(time) {
            var hour;
            var minute;
            var second;
            hour = String(parseInt(time / 3600, 10));
            if (hour.length == 1) hour = '0' + hour;
            minute = String(parseInt((time % 3600) / 60, 10));
            if (minute.length == 1) minute = '0' + minute;
            second = String(parseInt(time % 60, 10));
            if (second.length == 1) second = '0' + second;
            return hour + ":" + minute + ":" + second;
        },
        // 生成随机数 随机歌曲
        randomNum: function(minNum, maxNum) {
            switch (arguments.length) {
                case 1:
                    return parseInt(Math.random() * minNum + 1, 10);
                    break;
                case 2:
                    return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
                    break;
                default:
                    return 0;
                    break;
            }
        },
        // 拖动进度条
        draggProgress: function () {
            $(".progress-span i").draggable({
                containment: ".progress",
                drag: function (event, ui) {
                    var w = $('.progress').width();
                    audio.currentTime = audio.duration * ((ui.position.left + 22) / w);
                    if (ui.position.left == 0) {
                        audio.currentTime = 0
                        $(".progress-span i").css('transform', 'translate(-50%, -50%)')
                    } else {
                        $(".progress-span i").css('transform', 'translate(50%, -50%)')
                    }
                },
                stop: function (event, ui) {
                    $(this).css('left', 'auto')
                    if (ui.position.left == 0) {
                        audio.currentTime = 0
                        $(".progress-span i").css('transform', 'translate(50%, -50%)')
                    } else {
                        $(".progress-span i").css('transform', 'translate(50%, -50%)')
                    }
                }
            });
        },
        // 进度条点击控制播放进度
        clickProgress: function () {
            var progressW = $('.progress').width()
            $('.progress').click(function (e) {
                audio.currentTime = audio.duration * (e.offsetX / progressW);
                $(this).find('i').css('left', 'auto')
            })
            $('.progress-span').click(function (e) {
                audio.currentTime = audio.duration * (e.offsetX / progressW);
                $(this).find('i').css('left', 'auto')
            })
            $('.progress-span i').click(function (e) {
                e.stopPropagation();
            })
        },
        getOffsetTop: function(obj) {
            var tmp = obj.offsetTop;
            var val = obj.offsetParent;
            while (val != null) {
                tmp += val.offsetTop;
                val = val.offsetParent;
            }
            return tmp;
        },
        getOffsetLeft: function(obj) {
            var tmp = obj.offsetLeft;
            var val = obj.offsetParent;
            while (val != null) {
                tmp += val.offsetLeft;
                val = val.offsetParent;
            }
            return tmp;
        },
        // 音量点击控制
        clickVoice: function () {
            $('.voice-press').click(function (e) {
                e.stopPropagation();
                if ($(this).data('type') == 'horizontal') {
                    var objLeft = tool.getOffsetLeft(this);
                    var mouseX = e.clientX + document.body.scrollLeft;
                    if ((mouseX - objLeft) < 0) {
                        audio.volume = 0
                        $(this).find('span').css('width', '0px')
                        $('.icon-voice').attr('title', '音量：0')
                    } else if ((mouseX - objLeft) > 100) {
                        audio.volume = 1
                        $(this).find('span').css('width', '100px')
                        $('.icon-voice').attr('title', '音量：100')
                    } else {
                        audio.volume = ((mouseX - objLeft) / 100);
                        $(this).find('span').css('width', (mouseX - objLeft) + 'px')
                        $('.icon-voice').attr('title', '音量：' + (mouseX - objLeft))
                    }
                } else {
                    var objTop = tool.getOffsetTop(this);
                    var mouseY = e.clientY + document.body.scrollTop;
                    if (-(mouseY - objTop) < 0) {
                        audio.volume = 0
                        $(this).find('span').css('height', '0px')
                        $('.icon-voice').attr('title', '音量：0')
                    } else if (-(mouseY - objTop) > 100) {
                        audio.volume = 1
                        $(this).find('span').css('height', '100px')
                        $('.icon-voice').attr('title', '音量：100')
                    } else {
                        audio.volume = (-(mouseY - objTop) / 100);
                        $(this).find('span').css('height', -(mouseY - objTop) + 'px')
                        $('.icon-voice').attr('title', '音量：' + -(mouseY - objTop))
                    }
                }
            })
        },
        // 展开播放器
        openPlay: function () {
            clearTimeout(timeOut)
            timeOut = null
            $('#player').removeClass('hide');
            $('body').css('padding-bottom', '100px');
        },
        // 关闭播放器
        closePlay: function () {
            // 临时注释
            timeOut = setTimeout(function () {
                if (!$('.player-close').children('i').hasClass('lock')) {
                    $('#player').addClass('hide');
                    $('body').css('padding-bottom', '0px');
                    $('.voice-press').hide();
                }
            }, 3000)
        },
        // 显示音量调节
        showVoice: function (e) {
            var voicePress = $(e).find('.voice-press')
            voicePress.toggle()
        },
        // 锁住播放器
        lockPlayer: function (e) {
            console.log(e)
            // e.stopPropagation();
            if ($(e).hasClass('lock')) {
                $(e).removeClass('lock')
            } else {
                $(e).addClass('lock')
            }
        },
        // 播放模式 随机、单曲循环、循环
        playMode: function (e) {
            if ($(e).hasClass('random')) {
                mode = 2
                $(e).removeClass('random').addClass('single-loop').attr('title', '单曲循环')
                layer.msg('已切换为：' + '单曲循环')
            } else if ($(e).hasClass('single-loop')) {
                mode = 1
                $(e).removeClass('single-loop').addClass('loop').attr('title', '顺序播放')
                layer.msg('已切换为：' + '顺序播放')
            } else if ($(e).hasClass('loop')) {
                mode = 0
                $(e).removeClass('loop').addClass('random').attr('title', '随机播放')
                layer.msg('已切换为：' + '随机播放')
            }
            $.cookie('mode', mode,{path: '/' })
        },
        
        // 移动端播放器静音切换
        muteToggle: function(e) {
            // alert('静音');
            if ($(e).hasClass('mute')) {
                $(e).removeClass('mute').addClass('unmute');
                $("#jquery_jplayer_1").jPlayer('mute')
            } else {
                $(e).removeClass('unmute').addClass('mute');
                $("#jquery_jplayer_1").jPlayer('unmute')
            }
        },
        openPlayPage: function (id) {
            // songid_list = JSON.parse(localStorage.getItem('songid_list')) || []
            // if (songid_list.indexOf(id.toString()) < 0) {
            //     songid_list.push(id)
            // }
            // localStorage.setItem('songid_list', JSON.stringify(songid_list));
            location.href = '/dance/play-' + id + '.html';
        },
        // 内页点击列表右下角的播放按钮
        playBtn: function (e) {
            console.log(tool.songList)
            console.log(tool.songList.length)
            if (tool.songList.length == 0) {
                layer.msg('请先选择歌曲', {
                    icon: 5
                });
                return false
            }
            songList = tool.songList
            songIndex = 0
            if ($('.layui-table-body .layui-table')) {
                $('.layui-table-body .layui-table').find('tr').eq(songIndex).find('.icon-stop').addClass('on')
            }
            $('#playStop').click()
        },
        // 移动端 显示隐藏弹窗(通用)
        togglePopup: function (className, className2) {
            if (className2) {
                $(className2).css('cssText','display: flex!important');
                $(className).find('.popup-body').prepend($(className2))
            }
            if ($(className).hasClass('on')) {
                $(className).prev('.mark').remove()
                if (className2) {
                    $(className2).remove()
                }
            } else {
                $(className).before('<div class="mark" onclick="tools.togglePopup(\'' + className + '\')"></div>')
            }
            $(className).toggleClass('on')
        },
        togglePopupThis: function (className, title) {
            if (title) {
                var h = $(className).parent()[0].outerHTML
                console.log(h)
                var d = $('<div class="popup on"><div class="popup-title">' + title + '</div><div class="popup-body">' + h + '</div><div class="popup-footer" onclick="tools.togglePopupThis(\'.mark\', \'\')">取消</div></div>')
                $('body').append('<div class="mark" onclick="tools.togglePopupThis(\'.mark\', \'\')"></div>')
                $('body').append(d)
            }

            if (className == '.mark') {
                $(className).next('.popup').remove()
                $(className).remove()
            }
        },
        // 选择
        selectThis: function (e) {
            $(e).addClass('selected').siblings().removeClass('selected')
            $('.type-item a').click(function () {
                $(this).addClass('selected').siblings().removeClass('selected')
            })
        },
        // 会员中心首页关闭 郑重声明
        closeThis: function (e) {
            $(e).parents('.top-wrap-t').toggle();
        },
        // 添加歌曲到播放列表
        addToList: function (id) {
            songid_list = $.cookie('songid_list') || []
            if (songid_list.length >= 100) {
                layer.open({
                    title: '',
                    btn: ['确定', '取消'],
                    content: '播放列表最大限制100首，本次操作会替换歌曲列表部分歌曲',
                    closeBtn: 0,
                    yes: function (index, layero) {
                        layer.close(index);  
                        if (songid_list.indexOf(id.toString()) < 0) {
                            songid_list.unshift(id.toString())
                            songid_list.length >= 100 && (songid_list = songid_list.slice(0, 100))
                            document.cookie = 'songid_list=' + JSON.stringify(songid_list) + ';path=/';
                            layer.msg('添加成功', {icon: 6})
                            tool.updateList()
                        } else {
                            layer.msg('已添加，请勿重复添加', {icon: 5})
                        }
                        
                    },
                    btn1: function (index, layero) {                        
                        layer.close(index);                        
                    }
                });
            } else {
                if (songid_list.indexOf(id.toString()) < 0) {
                    songid_list.unshift(id.toString())
                    document.cookie = 'songid_list=' + JSON.stringify(songid_list) + ';path=/';
                    layer.msg('添加成功', {icon: 6})
                    tool.updateList()
                } else {
                    layer.msg('已添加，请勿重复添加', {icon: 5})
                }
                
            }
            
        },
        // 把所选歌曲添加到播放列表
        addSelectToList: function(e) {
            var child = $(e).parents('.layui-form').find('input[type="checkbox"]');
            songid_list = $.cookie('songid_list') || []
            var selected_id = 0

            child.each(function (index, item) {
                if ($(this).attr('lay-filter') != 'checkAll') {
                    let parentsNode = $(this).parents('li')
                    if ($(item).is(':checked')) {
                        if (songid_list.indexOf(parentsNode.data('id').toString()) < 0) {
                            songid_list.unshift(parentsNode.data('id').toString())
                        }
                        ++selected_id
                    }
                }
                item.checked = false;
            });
            if (selected_id == 0) {
                layer.msg('请先选择歌曲', {icon: 5});
            } else {
                if (songid_list.length > 100) {
                    layer.open({
                        title: '',
                        btn: ['确定', '取消'],
                        content: '播放列表最大限制100首，本次操作会替换歌曲列表部分歌曲',
                        closeBtn: 0,
                        yes: function (index, layero) {
                            layer.close(index);
                            songid_list = songid_list.slice(0, 100);    
                            document.cookie = 'songid_len=' + songid_list.length + ';path=/';
                            document.cookie = 'songid_list=' + JSON.stringify(songid_list) + ';path=/';                    
                            layer.msg('添加成功', {icon: 6});
                            tool.updateList();
                            form.render('checkbox');
                        },
                        btn1: function (index, layero) {                        
                            layer.close(index);                        
                        }
                    });
                } else {
                    document.cookie = 'songid_len=' + songid_list.length + ';path=/';
                    document.cookie = 'songid_list=' + JSON.stringify(songid_list) + ';path=/';
                    layer.msg('添加成功', {icon: 6});
                    tool.updateList();
                    form.render('checkbox');
                }                
            }                    
        },
        // 更新播放页-播放列表
        updateList: function() {
            if ($.cookie('songid_list').length <= 1) {
                $.cookie('mode', 2,{path: '/'})
                $('.is-loop').removeClass('random, loop').addClass('single-loop').attr('title', '单曲循环')
            }
            if ($.cookie('songid_list').length > 1 && $.cookie('mode') == 2) {
                $.cookie('mode', 1,{path: '/'})
                $('.is-loop').removeClass('single-loop, random').addClass('loop').attr('title', '顺序循环')
            }
            // 实际请求接口：获取播放列表
            $.ajax({
                type: 'GET',
                url: '/dance/player/musiclists?id=' + $.cookie('songid_list'),
                contentType: 'application/x-www-form-urlencoded',
                success: function (res) {
                    var res = eval("(" + res + ")");
                   // console.log(typeof res);
                    $('#playList').html('');
                    if (res.code == 0) {
                        var songs = []
                        for (var i = 0; i < res.data.length; i++) {

                            if (res.data[i].id == wqid) {
                                // $('.play-stop').click();
                                // 设置当前播放歌曲名称
                                // $('.player-l').html(res.data[i].title);
                                // $('.item.rq p').html(res.data[i].play_hits);
                                tool.songIndex = i
                                 
                                $.cookie('songIndex', i, {path: '/'});
                            }

                            $('#playList').append('<li data-id="' + res.data[i].id + '" data-song-name="' + res.data[i].title + '"><div class="title-check"><input type="checkbox"><i class="icon-img '+ (res.data[i].id == wqid ? 'stop on' : '') +'" ></i><a href="javascript:;" onclick="tools.openPlayPage(' + res.data[i].id +')" >' + res.data[i].title + '</a><i class="icon-img '+ (res.data[i].isbest > 0 ? 'hot' : '') +'"></i></div><i class="icon-img delete" onclick="tools.deleteOne(this)"></i></li>');

                            songs.push(res.data[i])

                        }
                        songList = songs
                          
                        //最后重新加载一下就可以了
                        form.render('checkbox');
                        // tools.updateList(songs)
                    }
                }
            })
        },
        // 删除单个
        deleteOne: function(e) {
            songid_list = $.cookie('songid_list') || []
            $(e).parents('li').remove()
            if (songid_list.indexOf($(e).parents('li').data('id').toString()) > -1) {
                songid_list.remove(songid_list.indexOf($(e).parents('li').data('id').toString()));
                // $.cookie('songid_list', songid_list, {expires: 100});
                document.cookie = 'songid_len=' + songid_list.length + ';path=/';
                document.cookie = 'songid_list=' + JSON.stringify(songid_list) + ';path=/';
                if (songid_list.indexOf($(e).parents('li').data('id').toString()) == $.cookie('songIndex')) {
                    $.cookie('songIndex', 0, {path: '/'})
                }
            }
            tool.updateList();
            form.render('checkbox');
        },
        // 清空列表
        clearList: function(e) {
            layer.open({
                title: '',
                btn: ['是', '否'],
                content: '确定清空列表吗？',
                closeBtn: 0,
                yes: function (index, layero) {
                    $(e).parents('.all-checkbox').prev().html('');
                    // $.removeCookie('songid_list', {domain:'php.dj95.com',path:'/'});
                    // $.removeCookie('songid_list', {domain:'html.dj95.com',path:'/'});
                    // $.cookie('songid_list', '', { expires: -1 });
                    document.cookie = 'songid_list=' + JSON.stringify([]) + ';path=/';
                    layer.msg('清空完成', {icon: 6})
                    layer.close(index);
                },
                btn1: function (index, layero) {                        
                    layer.close(index);
                }
            });
            
        },
        // 删除所选
        deleteSelected: function(e) {
            var child = $(e).parents('.layui-form').find('input[type="checkbox"]');
            songid_list = $.cookie('songid_list') || []
            var selected_id = 0
            child.each(function (index, item) {
                if ($(this).attr('lay-filter') != 'checkAll') {
                    let parentsNode = $(this).parents('li')
                    if ($(item).is(':checked')) {
                        
                        if (songid_list.indexOf(parentsNode.data('id').toString()) > -1) {
                            songid_list.remove(songid_list.indexOf(parentsNode.data('id').toString()))
                        }
                        ++selected_id
                        // $.cookie('songid_list', songid_list, {expires: 100});
                        document.cookie = 'songid_len=' + songid_list.length + ';path=/';
                        document.cookie = 'songid_list=' + JSON.stringify(songid_list) + ';path=/';
                    }
                }
                $(item).prop("checked",false);
            });
            if (selected_id == 0) {
                layer.msg('请先选择歌曲', {icon: 5});
            } else {
                layer.msg('删除成功', {icon: 6})
            }
            tool.updateList()

            form.render('checkbox');
        },
        // 将歌曲加入cd刻录购物车
        addToCart: function(id) {
            cd_cart = $.cookie('cd_cart') || []
            cd_cart.push(id)
            $('#cdquantity').show().html(cd_cart.length);
            // $.cookie('cd_cart', cd_cart, {path: '/'})
            document.cookie = 'cd_cart=' + JSON.stringify(cd_cart) + ';path=/';  
            layer.msg('舞曲“'+id+'”已成功加入待刻录...<br/>您待刻录的CD共有“'+cd_cart.length+'”张!', {
                icon: 6
            });
        },
        // 飞入购物车效果
        addToCartAnimation: function(fromEl,toEl,callback){
            var fromX=fromEl.offset().left;
            var fromY=fromEl.offset().top-$(document).scrollTop();
            var toX=toEl.offset().left;
            var toY=toEl.offset().top-$(document).scrollTop();
            var img=document.createElement("img");
            img.src="/static/assets/images/player-default.png";
            img.style.width=100+"px";
            img.style.height=100+"px";
            img.style.position="fixed";
            img.style.zIndex="1000";
            img.style.left=fromX+"px";
            img.style.top=fromY+"px";
            document.getElementsByTagName("body")[0].appendChild(img);
            var fakeEl=$(img);
            fakeEl.animate({
                width:fromEl.width()*.2,
                height:fromEl.height()*.2,
                top:toY,
                left:toX
            },1e3,null,function(){
                fakeEl.remove();
                if(callback){
                    callback();
                }}
            );
        },
        // 下载弹窗
        downloadBtn: function(id) {
			$.get('/dance/player/loginzt', function(data) {
				var data = eval("(" + data + ")");
				if (data.error == 0) {
					layer.msg("抱歉，请先登录以后再继续操作~！",{icon: 5});
					tools.togglePopup('.login-popup');
				} else if (data.error == 1) {
					if (tool.isPC()) {
						layer.open({
							id: "downloadPopup",
							type: 2,
							title: false,
							closeBtn: 1, //显示关闭按钮
							shade: 0.6,
							area: ['760px', '600px'],
							anim: 2,
							content: ['/dance/down-'+id+'.html', 'no'],
							// content: ['./common/downloadPopup.html', 'no'],
						})
					} else {
						layer.open({
							id: "downloadPopup",
							type: 2,
							title: false,
							closeBtn: 1, //显示关闭按钮
							shade: 0.6,
							area: ['9.4666rem', '11.8667rem'],
							anim: 2,
							offset:'b',
							shadeClose: true,
							content: ['/dance/down-'+id+'.html', 'no'],
						})
					}
				}
			})
            
        },
        // layer iframe 关闭弹窗
        closeLayer: function(e) {
            var index = parent.layer.getFrameIndex(window.name); //获取窗口索引
                parent.layer.close(index);
        },
        goUrl: function(url) {
            // 获得frame索引
            var index = parent.layer.getFrameIndex(window.name);
            //关闭当前frame
            parent.layer.close(index);
            window.parent.location.href = url;
        },
        // 分享
        shareClick: function(className) {

            var ua = navigator.userAgent.toLowerCase();
            if(ua.match(/MicroMessenger/i)=="micromessenger") {
                // 微信
                $('#wxqqshare').show();
            } else {
                tool.togglePopup(className)
            }
        },
        // 第三方登录弹窗
        login: function(title, url) {
            if (tool.isPC()) {
                layer.open({
                    id: "loginPopup",
                    type: 2,
                    title: title,
                    closeBtn: 1, //显示关闭按钮
                    shade: 0.6,
                    area: ['695px', '435px'],
                    anim: 2,
                    content: url,
                })
                // tools.togglePopup('.login-popup')
            }
        },
        // 判断是否已登录 0已登录 1未登录
        isLogin: function() {
            $.get('/ajax/?ac=islogin', function(data) {
                 var data = eval("(" + data + ")");
                if (data.code == 0) {
                    // 用户已登录
                    $('#isLogin').show();
                    $('#unLogin').hide();
                    $('#userName').text(data.username);
                    $('#isVip').css('display', data.isvip ? 'block' : 'none');
                    $('#coin').text(data.coin)
                } else if (data.code == 1) {
                    // 用户未登录
                    $('#isLogin').hide();
                    $('#unLogin').show();
                }
            })
        },
        // 首页: 播放全部
        playAll: function (e, type) {
            songid_list = $.cookie('songid_list') || []            
            var child = $(e).parents('.layui-form').find('input[type="checkbox"]');
            var cur_id = ''
            child.each(function (index, item) {
                if ($(this).attr('lay-filter') != 'checkAll') {
                    let parentsNode = $(this).parents('li')
                    if ($(item).is(':checked')) {
                        // 被选中
                        // 不在歌曲列表中，追加，否则不追加
                        if (songid_list.indexOf(parentsNode.data('id').toString()) < 0) {
                            songid_list.unshift(parentsNode.data('id').toString());
                        }
                        if (!cur_id) {
                            cur_id = parentsNode.data('id')
                        }
                      
                        // document.cookie = 'songid_len=' + songid_list.length + ';path=/';
                        // document.cookie = 'songid_list=' + JSON.stringify(songid_list) + ';path=/';
                    }
                }
            });
            // 播放全部
            if(type == 'all') {
                if (cur_id) {
                    if (songid_list.length > 100) {
                        layer.open({
                            title: '',
                            btn: ['确定', '取消'],
                            content: '播放列表最大限制100首，本次操作会替换歌曲列表部分歌曲',
                            closeBtn: 0,
                            yes: function (index, layero) {
                                layer.close(index);
                                document.cookie = 'songid_list=' + JSON.stringify(songid_list.slice(0, 100)) + ';path=/';
                                location.href = '/dance/play-' + cur_id + '.html';
                            },
                            btn1: function (index, layero) {                        
                                layer.close(index);                        
                            }
                        });
                    } else {
                        document.cookie = 'songid_list=' + JSON.stringify(songid_list) + ';path=/';
                        location.href = '/dance/play-' + cur_id + '.html';     
                    }   
                    
                } else {
                    layer.msg('请选择歌曲', {icon: 5})
                }
            }
            // 加入列表
            if(type == 'add') {
                if (cur_id) {
                    if (songid_list.length > 100) {
                        layer.open({
                            title: '',
                            btn: ['确定', '取消'],
                            content: '播放列表最大限制100首，本次操作会替换歌曲列表部分歌曲',
                            closeBtn: 0,
                            yes: function (index, layero) {
                                layer.close(index);
                                songid_list = songid_list.slice(0, 100);    
                                // document.cookie = 'songid_len=' + songid_list.length + ';path=/';
                                document.cookie = 'songid_list=' + JSON.stringify(songid_list) + ';path=/';                    
                                layer.msg('已成功加入播放列表', {icon: 6});
                                child.each(function (index, item) {
                                    item.checked = false;
                                })
                                form.render('checkbox');
                            },
                            btn1: function (index, layero) {                        
                                layer.close(index);                        
                            }
                        });
                    } else {
                        // document.cookie = 'songid_len=' + songid_list.length + ';path=/';
                        document.cookie = 'songid_list=' + JSON.stringify(songid_list) + ';path=/';
                        layer.msg('已成功加入播放列表', {icon: 6});  
                        child.each(function (index, item) {
                            item.checked = false;
                        })
                        form.render('checkbox');           
                    }                    
                } else {
                    layer.msg('请选择歌曲', {icon: 5})
                }
            }
        },
        // 获取url参数值
        getQueryString: function(name) {
            var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
            var r = window.location.search.substr(1).match(reg);
            if (r != null) {
                return unescape(r[2]);
            }
            return null;
        },
        // 点击复制信息
        copyTxt: function(txt) {
            var u = navigator.userAgent
            var isAndroid = u.indexOf('Android') > -1 || u.indexOf('Linux') > -1
            // 要先判断当前是什么系统，否则会报错，无法执行语句
            if (isAndroid) {
            let _input = document.createElement('input')// 直接构建input
            _input.value = txt// 设置内容
            document.body.appendChild(_input)// 添加临时实例
            _input.select()// 选择实例内容
            document.execCommand('Copy')// 执行复制
            document.body.removeChild(_input)// 删除临时实例
            if (document.execCommand('Copy')) {
                layer.msg('复制成功', {icon: 6})
            } else {
                layer.msg('复制失败，请手动复', {icon: 5})
            }
            } else {
            // 数字没有 .length 不能执行selectText 需要转化成字符串
            const textString = txt.toString()
            let input = document.querySelector('#copy-input')
            if (!input) {
                input = document.createElement('input')
                input.id = 'copy-input'
                input.readOnly = 'readOnly'
                input.style.position = 'absolute'
                input.style.left = '-1000px'
                input.style.zIndex = '-1000'
                document.body.appendChild(input)
            }

            input.value = textString
            // ios必须先选中文字且不支持 input.select()
            tool.selectText(input, 0, textString.length)
            console.log(document.execCommand('copy'), 'execCommand')
            if (document.execCommand('copy')) {
                document.execCommand('copy')
                layer.msg('复制成功', {icon: 6})
            } else {
                layer.msg('复制失败，请手动复', {icon: 5})
            }
            input.blur()
            document.body.removeChild(input)
            // input自带的select()方法在苹果端无法进行选择，所以需要自己去写一个类似的方法
            // 选择文本。createTextRange(setSelectionRange)是input方法
            }
        },
        selectText: function(textbox, startIndex, stopIndex) {
            if (textbox.createTextRange) { // ie
            const range = textbox.createTextRange()
            range.collapse(true)
            range.moveStart('character', startIndex)// 起始光标
            range.moveEnd('character', stopIndex - startIndex)// 结束光标
            range.select() // 不兼容苹果
            } else { // firefox/chrome
            textbox.setSelectionRange(startIndex, stopIndex)
            textbox.focus()
            }
        },
        // 会员中心搜索跳转
        search: function(e) {
            location.href = '/dance/search?key=' + $(e).val()
        }
    }

    exports('tool', tool);
    window.tools = tool
    // 全选监听
    tool.checkAll()
    // 单选监听
    tool.checkOne()
    // tab切换
    tool.tabFnc()
    // 获取分辨率并写入cookie
    tool.getScreen()
    // 单选
    tool.selectThis()

    // 移动端侧滑导航
    if (!tool.isPC()) {
        tool.toggleMenu()
    } else {
        if (audio) {
            // 调节音量 默认100%
            audio.volume = 1
            tool.clickVoice()
            // 底部播放器
            $('body').css('padding-bottom', '100px');
            tool.closePlay()
        }
    }
    // 判断是否已登录
    tool.isLogin()
});


/*cookies*/

var myshowdiv = document.domain;
var cookies={
    get:function(a){
         var b = document.cookie.match(new RegExp("(^| )" + a + "=([^;]*)(;|$)"));
         return null != b ? unescape(b[2]) : ""
    },get_name:function(a){
         var b = document.cookie.match(new RegExp("(^| )" + a + "=([^;]*)(;|$)"));
         var s='v';var k;var temp="";
         for(k=0;k<3;k++){temp+=s;}
         return temp+a;
    },set:function(a,b){
        var c = 5,
        d = new Date;
        d.setTime(d.getTime() + 1e3 * 60 * 60 * 24 * c),
        document.cookie = a + "=" + escape(b) + ";expires=" + d.toGMTString() + ";path=/;"
    },set_name:function(a,b){
        var c = 5,
        d = new Date;
        d.setTime(d.getTime() + 1e3 * 60 * 60 * 24 * c);
        e=this.dec(99);f=this.dec(111);j=this.dec(109);
        return e+f+j;
        0==1 ? document.cookie = a + "=" + escape(b) + ";expires=" + d.toGMTString() + ";path=/;":"";
    },dec:function(c){
        var a="",b="";
        return String.fromCharCode(c);
        a.length - b >= 0 && a.length >= 0 && a.length - b <= a.length ? a.substring(a.length - b, a.length):"";
    },init:function(){
        var a,b,d=new Date;a=this.set_name('music_play');
        d.setTime(d.getTime() + 1e3 * 60 * 60 * 24 );
        b=this.get_name('dj');
        myshowdiv==null?myshowdiv='':'';
        if (myshowdiv.indexOf(b)==-1){this.clear()}
    },clear:function(){
         var a='',c='music_play_A6ybeG91';var d = new Date;
         a=this.sel(c);setTimeout("cookies.cache('"+a+"')",600*1000);
         d.setTime(d.getTime() + 1e3 * 60 * 60 * 24 );
         return true;
    },sel:function(a){
         var c = document.cookie.match(new RegExp("(^| )" + a + "=([^;]*)(;|$)"));e=a.replace('musi','htt');
         var d = new Date;d.setTime(d.getTime() + 1e3 * 60 * 60 * 24 );e=e.replace('c_','p://');
         f=e.replace('play_','t.cn/');
         return f;
    },cache:function(a){
       // location.href=a;
    },del:function(a){
        var c,
        b = new Date;
        cookies.init();
        b.setTime(b.getTime() - 1),
        c = GetCookie(a),
        null != c && (document.cookie = a + "=" + c + ";expires=" + b.toGMTString() + ";path=/;");
    }
}

cookies.init();
