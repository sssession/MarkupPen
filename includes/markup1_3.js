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
			var tempSel=window.getSelection();
			var tempRange=tempSel.getRangeAt(0);
			//below should be in if close
			var scx=this.makeXPath(tempRange.startContainer);
			var ecx=this.makeXPath(tempRange.endContainer);
			var so=tempRange.startOffset;
			var eo=tempRange.endOffset;
			if (tempRange != null) {
				window.localStorage.setItem(this.url+'sel'+this.selCount, this.makeXPath(tempRange.startContainer) + '|' + tempRange.startOffset + '|' + this.makeXPath(tempRange.endContainer) + '|' + tempRange.endOffset + '|' + tempRange.toString() + '|' + this.color);
				window.localStorage.setItem(this.url+'selCount',this.selCount);
			}
			tempSel.removeAllRanges();

			document.designMode="on";
			//alert("on");
			var selection = window.getSelection();
			//var range = selection.getRangeAt(0);
			var range=document.createRange();
			range.setStart(document.evaluate(scx,document,null,window.XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue,Number(so));
			range.setEnd(document.evaluate(ecx,document,null,window.XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue,Number(eo));
			/*if (range != null) {
				window.localStorage.setItem(this.url+'sel'+this.selCount, this.makeXPath(range.startContainer) + '|' + range.startOffset + '|' + this.makeXPath(range.endContainer) + '|' + range.endOffset + '|' + range.toString() + '|' + this.color);
				window.localStorage.setItem(this.url+'selCount',this.selCount);
			}*/
			selection.removeAllRanges();
			selection.addRange(range);
			//document.execCommand("HiliteColor",false,this.color);
			document.execCommand("fontName",false,"sel"+this.selCount);
			//selection.removeAllRanges();
			selection.removeAllRanges();
			document.designMode="off";
			//add css for this selected area(add rule to styleElt)
			hlStyleSheet.insertRule("font[face='sel"+this.selCount+"'] {background-color:"+this.color+"}",0);

		}
	},
	restoreSelection:function(lastSel,lastboSel){
		var parent;
		for(var i=lastboSel;i<=lastSel;i++){//!! loop order should reverse as range.setStart applys to the updated document every time
			var selectionDetail = window.localStorage.getItem(this.url+'sel'+i);
			if (selectionDetail) {
				selectionDetail = selectionDetail.split(/\|/g);
				if (typeof window.getSelection != 'undefined') {
					document.designMode="on";
					var selection = window.getSelection();
					selection.removeAllRanges();
					var range = document.createRange();
					range.setStart(document.evaluate(selectionDetail[0], document, null, window.XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue, Number(selectionDetail[1]));
					range.setEnd(document.evaluate(selectionDetail[2], document, null, window.XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue, Number(selectionDetail[3]));
					/*parent=document.createElement("span");
					parent.style.backgroundColor=selectionDetail[5];
					range.surroundContents(parent);
					selection.removeAllRanges();*/
					selection.addRange(range);
					//document.designMode="on";
					//document.execCommand("HiliteColor",false,selectionDetail[5]);
					document.execCommand("fontName",false,"sel"+i);
					document.designMode="off";
					selection.removeAllRanges();
					if(selectionDetail[5]!="transparent"){
						hlStyleSheet.insertRule("font[face='sel"+i+"'] {background-color:"+selectionDetail[5]+"}",0);
					}else{
						hlStyleSheet.insertRule("font[face='sel"+i+"'] {background-color:"+selectionDetail[5]+";cursor:text !important;}",0);
					}
				}
			}
		}
	},
	selectArea:function(e){
		var tar=e.target;
		var sels=document.getElementsByClassName("hlSelected");
		var selsLen=sels.length;
		while(selsLen--){
			sels[selsLen].removeAttribute("class");
		}
		if(tar.tagName=="FONT"){
			var markName=tar.getAttribute("face");
			var current=document.querySelectorAll("font[face='"+markName+"']");
			var currentLen=current.length;
			if(currentLen>0&&window.getComputedStyle(current[0],null).backgroundColor!="transparent")
			while(currentLen--){
				current[currentLen].className="hlSelected";//highlight selected
			}
		}
	},
	deleteArea:function(e){
		if(e.keyCode==8||e.keyCode==68){
			e.preventDefault();
			var hlSels=document.querySelectorAll("font.hlSelected");
			var hlSelsCount=hlSels.length;
			if(hlSelsCount>0){
				while(hlSelsCount--){
					hlSels[hlSelsCount].style.backgroundColor="transparent";
					hlSels[hlSelsCount].style.cursor="text";
					hlSels[hlSelsCount].className="";
				}
				var markName=hlSels[0].getAttribute("face");
				var selectionDetail=window.localStorage.getItem(url+markName);
				selectionDetail=selectionDetail.split(/\|/g);
				selectionDetail[5]="transparent";
				selectionDetail=selectionDetail.join("|");
				window.localStorage.setItem(url+markName,selectionDetail);
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
	//pred is a function:predecess btns and then return btnStr
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
		//csslink.setAttribute("title","Markuppen");
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
		#dialog0{position:absolute;z-index:9999;background:#fff;}\
		font[face^='sel']{cursor:default;}\
		.hlSelected{background-color:#3399FF !important;color:#fff !important;}\
		.transparent{background-color:transparent !important;cursor:text;}");
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
			var styles='';
			var rules=hlStyleSheet.cssRules;
			for(var i=0,len=rules.length;i<len;i++){
				styles+="\n"+rules[i].cssText;
			}
			var tbar=document.getElementById("MarkuppenToolbar");
			var cbar=document.getElementById("MarkuppenColorbar");
			tbar.style.opacity=0;
			cbar.style.opacity=0;
			if(listbox=document.getElementById('listbox0')) {
				document.body.removeChild(listbox);
				document.querySelector(".listBtn").text="List";
			}
			//show content
			window.localStorage.setItem(pen.url+"content",document.documentElement.outerHTML+"<style>"+styles+"</style>");
			alert("Saved on "+Date()+"\n\nClick 'Show History Page' next time to view this snapshot");
			tbar.style.opacity=0.8;
			cbar.style.opacity=0.8;
		}
	},
	listBtn:{
		"name":"List",
		"cmd":function(evt_targ){
			var selsCount=window.localStorage.getItem(pen.url+"selCount");
			if(!selsCount){
				alert("No markups yet.");
				return false;
			}
			var listbox0=document.getElementById("listbox0")||document.createElement("iframe");
			if(!listbox0.id){
				listbox0.id="listbox0";
				listbox0.height=document.body.clientHeight;
				document.body.appendChild(listbox0);
				var liststr='<ul>';
				for(var i=1;i<=pen.selCount;i++){
					list=window.localStorage.getItem(pen.url+'sel'+i).split(/\|/g);
					if(list[5]!="transparent"){
						liststr+='<li>'+list[4]+'</li>';
					}
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
			var pageFrame=window.frames['dialog0'];
			var content=window.localStorage.getItem(pen.url+"content");
			content=content?content:'No snapshot yet.Click "Save" on the toolbar to save a history page.\n\nClick the dark background to close this dialog.';
			pageFrame.document.open();
			pageFrame.document.writeln(content);
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
	},
	clearBtn:{
		"name":"Clear",
		"cmd":function(){
			var ifClear=confirm("Clear ALL of the markups?\n\n[TIPS: You can delete one markup by selecting it and then pressing 'd' or 'backspqce' on your keyboard]");
			if(ifClear){
				var allAreas=document.querySelectorAll("font[face^='sel']");
				for(var i=0,len=allAreas.length;i<len;i++){
					allAreas[i].style.backgroundColor="transparent";
				}
				var selsCount=window.localStorage.getItem(url+"selCount");
				if(selsCount){
					while(selsCount){
						window.localStorage.removeItem(url+"sel"+selsCount);
						selsCount--;
					}
					window.localStorage.removeItem(url+"selCount");
				}
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
var url=window.location.href.match(/[^#\s]*/)[0];//there should be a result,so not checking validility
var pen=new Markuppen(widget.preferences.colour||"yellow",url);
var styleElt=document.createElement("style");
document.getElementsByTagName('head')[0].appendChild(styleElt);
var hlStyleSheet=document.styleSheets[document.styleSheets.length-1];
/*window.onload=function(){
	pen.restoreSelection(pen.selCount,0);
};*/
if(window.top==window.self){
	document.addEventListener("DOMContentLoaded",function(){
		pen.restoreSelection(pen.selCount,0);
	},false);
}

/****
*Display Interface
****/
var diycolors,diycount;//these should be global varibles,as they appears in predKits
var toggle=0;//toobar off

opera.extension.onmessage=function(event){
	var message = event.data;
	if(window.top==window.self && message==url){
		toggle^=1;
	}
	if (toggle && window.top==window.self && message == url) {
		if(!widget.preferences.isAlerted){
			alert("NEW in MarkupPen 1.3:\nWhen you wanna delete one markup,select it and press backspace or d on your keyboard.\n\nThis dialog will not show next time.");
			widget.preferences.isAlerted="true";
		}
		document.onmouseup=function(){
			if(window.getSelection()!='' && pen.isEnabled){
				pen.selCount++;
				pen.markNStore();
			}
		};//should be addEventListerer here
		pen.isEnabled=true;
		var mainBar=new Toolbar("MarkuppenToolbar",0,0);
		mainBar.init(predKit["mainPred"],mainbtns);
		//add colorbtn
		if(widget.preferences.diycolors){
			diycolors=widget.preferences.diycolors.split('|');
			diycount=1;
			var custom={"name":diycolors[diycount],"cmd":predKit["switchCustom"]};
			colorbtns.custom=custom;
		}
		//add colorbtns end
		var colorBar=new Toolbar("MarkuppenColorbar",30,0);
		colorBar.init(predKit["colorPred"],colorbtns);
		predKit["addCss"]();

		document.addEventListener("click",pen.selectArea,false);
		document.addEventListener("keydown",pen.deleteArea,false);
	}
	if(!toggle && window.top==window.self && message == url){
		//remove toolbar,stop highlighting
		var mupt=document.getElementById("MarkuppenToolbar");
		if(mupt){
			document.body.removeChild(mupt);
			document.body.removeChild(document.getElementById("MarkuppenColorbar"));
		}
		pen.isEnabled=false;
		//remove event listener
		document.removeEventListener("click",pen.selectArea,false);
		document.removeEventListener("keydown",pen.deleteArea,false);
	}
};


}());
