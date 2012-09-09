(function(){

var Markuppen=function(color,beingMarkedPage){
	this.color=color;
	this.url=beingMarkedPage;
	this.isEnabled=true;
	this.selCount=window.localStorage.getItem(this.url+'selCount')||0;
};
Markuppen.prototype={
	constructor:Markuppen,
	makeXPath:function(node, currentPath){
		currentPath = currentPath || '';
		switch (node.nodeType) {
			case 3:
			case 4:
				return this.makeXPath(node.parentNode, 'text()[' + (document.evaluate('preceding-sibling::text()', node, null, window.XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength + 1) + ']');
			case 1:
				return this.makeXPath(node.parentNode, node.nodeName + '[' + (document.evaluate('preceding-sibling::' + node.nodeName, node, null, window.XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null).snapshotLength + 1) + ']' + (currentPath ? '/' + currentPath : ''));
			case 9:
				return '/' + currentPath;
			default:
				return '';
		}
	},
	markNStore:function(){
		if (typeof window.getSelection !== 'undefined') {
			var selection = window.getSelection();
			var range = selection.getRangeAt(0);
			if (range != null) {
				window.localStorage.setItem(this.url+'sel'+this.selCount, this.makeXPath(range.startContainer) + '|' + range.startOffset + '|' + this.makeXPath(range.endContainer) + '|' + range.endOffset + '|' + range.toString() + '|' + this.color);
				window.localStorage.setItem(this.url+'selCount',this.selCount);
			}
			document.designMode="on";
			document.execCommand("HiliteColor",false,this.color);
			document.designMode="off";
		}
	},
	restoreSelection:function(lastSel,lastboSel){
		for(var i=lastboSel;i<=lastSel;i++){//!! loop order should reverse as range.setStart applys to the updated document every time
			var selectionDetail = window.localStorage.getItem(this.url+'sel'+i);
			if (selectionDetail) {
				selectionDetail = selectionDetail.split(/\|/g);
				if (typeof window.getSelection != 'undefined') {
					var selection = window.getSelection();
					selection.removeAllRanges();
					var range = document.createRange();
					range.setStart(document.evaluate(selectionDetail[0], document, null, window.XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue, Number(selectionDetail[1]));
					range.setEnd(document.evaluate(selectionDetail[2], document, null, window.XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue, Number(selectionDetail[3]));
					selection.addRange(range);
					document.designMode="on";
					document.execCommand("HiliteColor",false,selectionDetail[5]);
					document.designMode="off";
					selection.removeAllRanges();
				}
			}
		}
	}
};

var Toolbar=function(id,top,right){
	this.id=id;
	this.top=top;
	this.right=right;
	this.bar=document.createElement("div");
	
	var bar=this.bar;
	bar.setAttribute('id',this.id);
	bar.style.zIndex=9999;//could create a css file to store this settings
	bar.style.position="fixed";
	bar.style.top=this.top+"px";
	bar.style.right=this.right+"px";
	document.body.appendChild(bar);//when new a Toolbar a div will appear on the top right
};
Toolbar.prototype={
	constructor:Toolbar,
	//init() will generate a toolbar with btns bound with functions
	//pred is a function,predecess btns and then return btnStr
	init:function(pred,btns){
		var bar=this.bar;
		var btnStr='';
		bar.innerHTML=pred(btns);
		bar.onclick=function(){
			var evt=evt||window.event;
			var evt_targ=evt.srcElement||evt.target;
			if(evt_targ.tagName=="A"){
				btns[evt_targ.getAttribute('class')]["cmd"](/* optional */evt_targ);
			}
		};
	}
};
/*****
* predKit stores predcessor functions,i.e. switch Pen Color
*****/
var predKit={
	mainPred:function(btns){
		var ret="";
		for(btn in btns){
			ret+='<a class="'+btn+'">'+btns[btn]["name"]+'</a>';
		}
		return ret;
	},
	colorPred:function(btns){
		var ret="";
		for(btn in btns){
			ret+='<a class="'+btn+'" style="background-color:'+btns[btn]["name"]+'">'+btns[btn]["name"]+'</a>';
		}
		return ret;
	},
	addCss:function(){
		var csslink = document.createElement('link');
		csslink.setAttribute('rel', "stylesheet");
		csslink.setAttribute('type', "text/css");
		csslink.setAttribute('href', "data:text/css,@charset 'utf-8';\
		/* Document */\
		#MarkuppenToolbar,#MarkuppenColorbar{color:#fff;background:#000;opacity:0.8;border-radius:4px;padding:4px 0 4px 6px;font-size:16px;font-family:'Helvetica',sans-serif;}\
		#MarkuppenToolbar a{color:#fff;cursor:pointer;margin-right:6px;text-decoration:none;}\
		#MarkuppenToolbar a:hover{color:#000;background:#fff;}\
		#MarkuppenColorbar a{display:inline-block;margin-right:6px;width:20px;height:20px;border-radius:12px;border:1px solid #ccc;text-indent:-9em;overflow:hidden;}\
		#overlay0{position:absolute;top:0;z-index:9998;background:#000;opacity:0.5;}\
		#listbox0{background:#EBEFF4;position:fixed;top:0;left:0;padding:20px;z-index:9999;}\
		#dialog0{position:absolute;z-index:9999;background:#fff;}");
		document.getElementsByTagName('head')[0].appendChild(csslink);
	},
	switchColor:function(evt_targ){
		pen.color=evt_targ.text;//pen is globar variable
	},
	switchCustom:function(evt_targ){//here diycolors,diycount are global variables
		diycount===diycolors.length-1?diycount=1:diycount++;
		evt_targ.style.backgroundColor=diycolors[diycount];
		evt_targ.text=diycolors[diycount];
		pen.color=evt_targ.text;
	}
};

var mainbtns={
	saveBtn:{
		"name":"Save",
		"cmd":function(){
			//remove toolbar and iframes firstly
			var tbar=document.getElementById("MarkuppenToolbar");
			var cbar=document.getElementById("MarkuppenColorbar");
			tbar.style.opacity=0;
			cbar.style.opacity=0;
			if(listbox=document.getElementById('listbox0')) {
				document.body.removeChild(listbox);
				document.querySelector(".listBtn").text="List";
			}
			//if(document.getElementById('listbox0'))
			//show content
			window.localStorage.setItem(pen.url+"content",document.documentElement.outerHTML);
			alert("Saved on"+Date());
			tbar.style.opacity=0.8;
			cbar.style.opacity=0.8;
		}
	},
	listBtn:{
		"name":"List",
		"cmd":function(evt_targ){
			var listbox0=document.getElementById("listbox0")||document.createElement("iframe");
			if(!listbox0.id){
				listbox0.id="listbox0";
				listbox0.height=document.body.clientHeight;
				document.body.appendChild(listbox0);
				var liststr='<ul>';
				for(var i=1;i<=pen.selCount;i++){
					list=window.localStorage.getItem(pen.url+'sel'+i).split(/\|/g);
					liststr+='<li>'+list[4]+'</li>';
				}
				liststr+="</ul>";
				var listFrame=window.frames['listbox0'];
				listFrame.document.open();
				listFrame.document.write(liststr);
				listFrame.document.close();
				evt_targ.text="Close List";
			}
			else{
				document.body.removeChild(listbox0);
				evt_targ.text=this["name"];
			}
		}
	},
	showBtn:{
		"name":"Show History Page",
		"cmd":function(){
			if(listbox=document.getElementById("listbox0")){
				document.removeChild(listbox);
				document.querySelector(".listBtn").text="List";
			}
			//create background
			var overlay0=document.getElementById("overlay0")||document.createElement("div");
			if(!overlay0.id){
				overlay0.id="overlay0";
				overlay0.style.height=document.body.scrollHeight+"px";
				overlay0.style.width =document.body.scrollWidth+"px";
				document.body.appendChild(overlay0);
			}
			//create dialog
			var dialog0=document.getElementById("dialog0")||document.createElement("iframe");
			if(!dialog0.id){
				dialog0.id="dialog0";
				dialog0.style.height=document.body.clientHeight*4/5+"px";
				dialog0.style.width =document.body.clientWidth*4/5+"px";
				dialog0.style.top=document.body.clientHeight/20+"px";
				dialog0.style.left=document.body.clientWidth/10+"px";
				document.body.appendChild(dialog0);
			}
			//show content in dialog
			var pageFrame=window.frames['dialog0']
			pageFrame.document.open();
			pageFrame.document.write(window.localStorage.getItem(pen.url+"content"));
			pageFrame.document.close();
			//bind events for overlay0
			overlay0.onclick=function(){
				document.body.removeChild(document.getElementById('dialog0'));
				document.body.removeChild(document.getElementById('overlay0'));
			};
		}
	},
	stopBtn:{
		"name":"Stop Highlighting",
		"cmd":function(evt_targ){
			if(pen.isEnabled){
				pen.isEnabled=false;
				evt_targ.text="Turn on Highlighting"
			}
			else{
				pen.isEnabled=true;
				evt_targ.text=this["name"];
			}
		}
	}
};

var colorbtns={
	red:{"name":"#f47983","cmd":predKit["switchColor"]},
	yellow:{"name":"yellow","cmd":predKit["switchColor"]},
	blue:{"name":"#44cef6","cmd":predKit["switchColor"]},
	green:{"name":"#96ce54","cmd":predKit["switchColor"]}
};


/****
*Repaint
****/

var pen=new Markuppen(widget.preferences.colour||"yellow",window.location.href);
window.onload=function(){
	pen.restoreSelection(pen.selCount,0);
};

/****
*Display Interface
****/
var diycolors,diycount;//these should be global varibles,as they appears in predKits
opera.extension.onmessage=function(event){
	var message = event.data;
	if (window.top==window.self && message == window.location.href) {
		document.onmouseup=function(){
			if(window.getSelection()!='' && pen.isEnabled){
				pen.selCount++;
				pen.markNStore();
			}
		};
		var mainBar=new Toolbar("MarkuppenToolbar",0,0);
		mainBar.init(predKit["mainPred"],mainbtns);
		//add colorbtn
		if(widget.preferences.diycolors!="undefined"){
			diycolors=widget.preferences.diycolors.split('|');
			diycount=1;
			var custom={"name":diycolors[diycount],"cmd":predKit["switchCustom"]};
			colorbtns.custom=custom;
		}
		//add colorbtns end
		var colorBar=new Toolbar("MarkuppenColorbar",30,0);
		colorBar.init(predKit["colorPred"],colorbtns);
		predKit["addCss"]();
	}
};


}());