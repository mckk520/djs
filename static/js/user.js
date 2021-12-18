/* 选择充值金额 */
function moneyxz($this,money){
    $('.pay_cont .layui-col-md4 .pay_li').removeClass("play_ac");
    $($this).addClass("play_ac");
    $('#paytype').val(money);
	$('.pay_money_bottom').html(money+'元');
}    
/* 去支付 */
function gopay(){
	var money =  $('#paytype').val();
	$.ajax({
              url:'/index.php/user/pay/porder',
              type:'post',
              dataType: "json",
              data:{
                  money:money
              },
              success:function(res){
				  if(res.code == '0'){
					layer.msg(res.msg);  
				  }else{
					  $('.pay_cont .layui-row').html('<div class="other_info"><div class="other_info_m">请用支付宝扫码</div></div><p align="center"><img src="http://www.7ycc.com/qr/?m=2&e=L&p=10&text='+res.res+'" width="200" /></p>');
					  $('.playbt').css('display','none');
					  $('.other_info_top').html('手机用户请保存相册，然后到支付宝识别');
					  payres(res.ids);
				  }
				  
				  
                  
              }
          });
	
	
	
	
}

/* 支付结果处理 */
function payres(ids){
    layui.use('layer', function(){
        var layer = layui.layer;
        layer.ready(function (){
    var paydsget = setInterval(function(){
         $.ajax({
              url:'/user/pay/getpayres',
              type:'post',
              dataType: "json",
              data:{
                  ids:ids
              },
              success:function(res){
                   if(res.code == '1'){
                     layer.open({
					 skin: 'dj107_layer',
                     title: '支付结果',
                     content: '恭喜您支付完成，感谢您的支持，没毛病',
                     icon: 1,
                     btn: ['我知道了']
                     ,yes: function(index, layero){
                      window.location.reload();
                      }
                     });   
                     clearInterval(paydsget);
                 }
              }
          });
    },2000);
    
        });
    
    }); 
}