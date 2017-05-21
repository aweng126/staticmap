
	var canvas,context;
	var zoom=13;
	var height=768;
	var width=1366;
	
	var blockImgs=[];//瓦片存储
	var startPositionX=0;//绘图起始点
	var startPositionY=0;//绘图起始点
	var firstDraw=true;//绘图前判断是否清空画布
	var imgIsLoaded;//图片是否加载完成;
	var imgScale=1;//图片缩放尺度

	 var map = new  BMap.Map("allmap");   //使用百度地图API辅助计算经纬度
	 var center = new BMap.Point(116.403,39.914);	//初始地图中心
	 map.centerAndZoom(center, zoom);
	 var temp =  new BMap.Point(116.403,39.914);	//存储每个瓦片的中心经纬度
     var before=map.pointToPixel(center);

     var now = map.pixelToPoint(before); 
	(function init(){
		canvas=document.getElementById('container');
		context=canvas.getContext('2d');
		loadImg(center,width,height,zoom);
	})();
	 
	 
	 function loadImg(){	//加载图片
		var len= arguments.length; 
		if (len==4) {
			firstDraw=true;
			for (var i = 0; i <9; i++) {
				temp=toBlock(arguments[0],arguments[1],arguments[2],i);
				console.log(temp,Date());
				loadImg(temp.lng,temp.lat,width/3,height/3,zoom,i);
			}				
		}else{
			var blockImg=new Image();
			var position = arguments[5];	
			blockImg.src="http://api.map.baidu.com/staticimage/v2?ak=uotMOqTFFeM7oGdpQU8dA7r4Xw72xod4&center="+arguments[0]+","+arguments[1]+"&width=" + arguments[2] + "&height="+ arguments[3] + "&zoom="+arguments[4]+"&copyright=1";			
			blockImg.onload=function(){
				var image=blockImg;
				drawImage(position,image,width,height);
			};
			blockImgs[position]=blockImg;
		}

	 }

	function drawImage(position,image,width,height){//重绘图片
		if(canvas.style.cursor=="move"){		//移动状态更改起始点的计算方法
			startPositionX+=(position%3)*width/3;
			startPositionY+=Math.floor(position/3)*height/3;
		}else{
			startPositionX=(position%3)*width/3;
			startPositionY=Math.floor(position/3)*height/3;		
		}
		console.log(position,startPositionX,startPositionY,Date());

		if (firstDraw&&canvas.style.cursor=="move") {	//清除之前的图片
			context.clearRect(0,0,canvas.width,canvas.height);
		}

		context.drawImage(image,0,0,image.width,image.height,startPositionX,startPositionY,image.width*imgScale,image.height*imgScale);

		if(canvas.style.cursor=="move"){		//还原起始点
			startPositionX-=(position%3)*width/3;
			startPositionY-=Math.floor(position/3)*height/3;
		}else{
			startPositionX=0;
			startPositionY=0;
		}
		firstDraw=false;
	}
	 
	 
	canvas.onmousedown=function(event){ 		//移动
		var pos=windowToCanvas(canvas,event.clientX,event.clientY);
		canvas.onmousemove=function(event){	//移动中仅操作已有瓦片
			canvas.style.cursor="move";
			var pos1=windowToCanvas(canvas,event.clientX,event.clientY);
			var x=pos1.x-pos.x;
			var y=pos1.y-pos.y;
			pos=pos1;
			startPositionX+=x;
			startPositionY+=y;
			firstDraw=true;
			for (var i = 0; i < 9; i++) {
				drawImage(i,blockImgs[i],width*imgScale,height*imgScale);
			}
		};
		
		
		canvas.onmouseup=function(){	//鼠标松开时重新加载瓦片，并重绘地图
			canvas.onmousemove=null;
			canvas.onmouseup=null;
			canvas.style.cursor="default";

			var before=map.pointToPixel(center); 	//计算新的中心点的经纬度
			before.x-=startPositionX;
			before.y-=startPositionY;
			center = map.pixelToPoint(before);

			loadImg(center,width,height,zoom);
		};
		canvas.onmouseout=function(){
			canvas.onmousemove=null;
			canvas.onmouseup=null;
			canvas.style.cursor="default";
		};
	};


	canvas.onmousewheel=canvas.onwheel=function(event){		//缩放
		var pos=windowToCanvas(canvas,event.clientX,event.clientY);
		event.wheelDelta=event.wheelDelta?event.wheelDelta:(event.deltaY*(-120));//判断滚轮

		console.log(event);

		if(event.wheelDelta>0&&zoom<19){	//放大		

			imgScale=imgScale*2;
			startPositionX=startPositionX*2-pos.x;
			startPositionY=startPositionY*2-pos.y;
			zoom+=1;
		
		}else if(event.wheelDelta<0&&zoom>3){				//缩小
			imgScale=imgScale/2;
			startPositionX=startPositionX*0.5+pos.x*0.5;
			startPositionY=startPositionY*0.5+pos.y*0.5;
			zoom-=1;
		}
		console.log(startPositionX,startPositionY,imgScale);
		
		for (var i = 0; i < 9; i++) {	//缩放原有的图片，等待加载新瓦片
			drawImage(i,blockImgs[i],width*imgScale,height*imgScale);
		}
		imgScale=1;

		map.centerAndZoom(center, zoom);
		var before=map.pointToPixel(center);
		before.x+=startPositionX;
		before.y+=startPositionY;
		center = map.pixelToPoint(before);

		loadImg(center,width,height,zoom);	//加载新瓦片，重会地图

	};
	 
	 
	function windowToCanvas(canvas,x,y){	//将坐标转化为在canvas中对应坐标
		var bbox = canvas.getBoundingClientRect();
		return {
			x:x - bbox.left - (bbox.width - canvas.width) / 2,
			y:y - bbox.top - (bbox.height - canvas.height) / 2
		};
	}


	function toBlock(center,width,height,index){		//计算每个瓦片的中心点的经纬度
		var before=map.pointToPixel(center);
		switch (index){
			case 0:
			  	before.x -=width/3;
		 		before.y -=height/3;
			  	break;
			case 1:
		 		before.y -=height/3;
			  	break;
			case 2:
			  	before.x +=width/3;
		 		before.y -=height/3;
			  	break;
			case 3:
			  	before.x -=width/3;
			  	break;
			case 4:
			  	break;
			case 5:
			  	before.x +=width/3;
			  	break;
			case 6:
				before.x -=width/3;
		 		before.y +=height/3;
			  	break;
			  case 7:
		 		before.y +=height/3;
			  	break;
			  case 8:
				before.x +=width/3;
		 		before.y +=height/3;
			  	break;
		}
		 var now = map.pixelToPoint(before);
		 return now;
	}


/*	$("#searchbutton").click(function(){
		var searchContent=$("#searchcontent").text();
		console.log(searchContent.length);
		console.log("111"+searchContent+"222");
	})*/
	


  $("#searchbutton").click(function(){
  	console.log("lllllllllllllllllllll");
  })