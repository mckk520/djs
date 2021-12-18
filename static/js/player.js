$(function() {
    var classid = $('#classid').val();
    var status = "0";
    var meida = {m4a: "/index.php/dance/play/url/wap/"+$('#danceid').val()};
    var thetime = $('.jp-current-time').text();
	var ua = navigator.userAgent;
    if(ua.match(/(iPhone|iPod|ios|android)/i) && thetime=="00:00"){
	$("body").append('<div id="playbtn" onclick="wapplay()"></div>');
    }else{
		$("#playbtn").remove();
	}
	
	$("#Player1").jPlayer({
	    ready : function() {
			$(this).jPlayer("setMedia", meida).jPlayer("play");
		},
		play: function() {
		    $(this).jPlayer('play');
		    $("#playbtn").click();
			$(this).jPlayer("pauseOthers");
		},
	    swfPath : "/js/",
		autoPlay : true,
		supplied : "mp3,m4a,mp4",
		wmode : "window",
		smoothPlayBar: true,
	    timeupdate : function(event) {
			$("#jp_audio_0").remove();
		},
		ended:function(event) {
		    getNext();
			/**var xlink = $('#xlink').attr('href');
			if(xlink != 'undefined'){
			    window.location.replace(xlink);
			}**/
		},
		error: function(event) {
		  layer.msg('版权问题或其它原因无法播放'); 
		},
	
	});
	
/* 默认获取播放列表 */
$.post('/index.php/dance/player/getbflist', {
		id: $('#danceid').val()
	}, function(res) {
		setbflist(res);
},"json");


});

/* 公共变量 */
var rerData;
var bid = 0;
/* 给播放列表数据 */
function setbflist(arr){
    rerData = arr;
    arr = Array.from(arr);
    var html = '';
    for (var i = 0; i < arr.length; i++) {
        var data = arr[i];
        var cls = '';
        if(parseInt(data['id']) == parseInt($('#danceid').val())){
           cls = 'nowplay';
           bid = i;
        }
        html += '<div class="player_tab_list_ulist_li '+cls+' bflist_'+data['id']+'"><div class="layui-row"><div class="layui-col-md8 layui-col-xs8"><div class="player_tab_list_ulist_title"><a href="/dance/play-'+data['id']+'.html">'+data['name']+'</a></div></div><div class="layui-col-md2 layui-col-xs2"><div class="player_tab_list_ulist_hits">'+data['hits']+'人</div></div><div class="layui-col-md2 layui-col-xs2"><div class="player_tab_list_ulist_cz"><a href="JavaScript:;" onclick="bflist_del('+data['id']+')">删除</a></div></div></div></div>';
    }
    $('#plist_1').html(html);
}

/* 获取历史记录列表 */
function getlslist(){
    $.post('/index.php/dance/player/getlslist', {
	}, function(res) {
		setlslist(res);
},"json");
    
}
/* 给历史记录列表数据 */
function setlslist(arr){
    arr = Array.from(arr);
    var html = '';
    for (var i = 0; i < arr.length; i++) {
        var data = arr[i];
        var cls = '';
        if(parseInt(data['id']) == parseInt($('#danceid').val())){
           cls = 'nowplay';
        }
        html += '<div class="player_tab_list_ulist_li '+cls+' lslist_'+data['id']+'><div class="layui-row"><div class="layui-col-md8 layui-col-xs8"><div class="player_tab_list_ulist_title"><a href="/dance/play-'+data['id']+'.html">'+data['name']+'</a></div></div><div class="layui-col-md2 layui-col-xs2"><div class="player_tab_list_ulist_hits">'+data['hits']+'人</div></div><div class="layui-col-md2 layui-col-xs2"><div class="player_tab_list_ulist_cz"><a href="JavaScript:;" onclick="bflist_add('+data['id']+')">加入</a></div></div></div></div>';
    }
    $('#plist_2').html(html);
}
/* 播放列表 - 删除 */
function bflist_del(id){
    $.post('/index.php/dance/player/bflistdel', {
        id:id
	}, function(res) {
		$('.bflist_'+id).remove();
		layer.msg('删除成功');
    },"json");
}
/* 播放列表 - 加入 */
function bflist_add(id){
    $.post('/index.php/dance/player/getbflist', {
        id:id
	}, function(res) {
		setbflist(res);
		layer.msg('添加成功');
		$('#bflist_bt').click();
    },"json");
}

//下一首
function getNext(){
	var tempid = rerData.length-1;
	if(tempid==-1) return;
	tempid = bid+1;
	location.href = '/dance/play-'+rerData[tempid]['id']+'.html';
}
//上一首
function getPre(){
	var tempid = rerData.length-1;
	if(tempid==-1) return;
	tempid = bid-1;
	location.href = '/dance/play-'+rerData[tempid]['id']+'.html';
}
function wapplay(){
	$("#Player1").jPlayer('play');
	$("#playbtn").remove();
}
