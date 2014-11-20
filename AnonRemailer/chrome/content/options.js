/*
The contents of this file are subject to the Mozilla Public
License Version 1.1 (the "MPL"); you may not use this file
except in compliance with the MPL. You may obtain a copy of
the MPL at http://www.mozilla.org/MPL/

Software distributed under the MPL is distributed on an "AS
IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
implied. See the MPL for the specific language governing
rights and limitations under the MPL.

The Original Code is AnonRemailer. 
(Using API - calls to Enigmail, which has its own 
license-restrictions to notice.)

The Initial Developer of the Original Code is 
<eiji.anonremail@googlemail.com>.


Alternatively, the contents of this file may be used under the
terms of the GNU General Public License (the "GPL"), in which case
the provisions of the GPL are applicable instead of
those above. If you wish to allow use of your version of this
file only under the terms of the GPL and not to allow
others to use your version of this file under the MPL, indicate
your decision by deleting the provisions above and replace them
with the notice and other provisions required by the GPL.
If you do not delete the provisions above, a recipient
may use your version of this file under either the MPL or the
GPL.
*/
function doContext()
{
	var linkbox = document.getElementById("remailer-list");
	var selectArray = linkbox.selectedItems;
	if(selectArray && selectArray.length == 1)
	{
		var listcells = selectArray[0].childNodes;
		var listcell = listcells.item(1);

		var addrbox = document.getElementById("new-remailer");
		addrbox.value = listcell.getAttribute("label");
	}
	return true;
}

function doDefault()
{
	var addrbox = document.getElementById("new-remailer");
	var linkbox = document.getElementById("new-remailerstats");
	var keybox = document.getElementById("new-remailerstatskeys");
	
	
	addrbox.value = "anon@deuxpi.ca";
	linkbox.value = "http://echolot.theremailer.net/rlist.txt";
	keybox.value = "http://echolot.theremailer.net/pgp-all.asc";

	return true;
}

function onLoad()
{
	//retrieve preferences
	var addrbox = document.getElementById("new-remailer");
	var linkbox = document.getElementById("new-remailerstats");
	var keybox = document.getElementById("new-remailerstatskeys");
	
	var ar_prefs = Components.classes["@mozilla.org/preferences-service;1"].
		getService(Components.interfaces.nsIPrefService).getBranch("extensions.anonremail.");

	addrbox.value = ar_prefs.getCharPref("remaileraddr");
	linkbox.value = ar_prefs.getCharPref("echolotaddr");
	keybox.value = ar_prefs.getCharPref("echolotaddrkeys");
	
	return true;
}

function doOK()
{
	//save preferences
	var addrbox = document.getElementById("new-remailer");
	var linkbox = document.getElementById("new-remailerstats");
	var keybox = document.getElementById("new-remailerstatskeys");

	var ar_prefs = Components.classes["@mozilla.org/preferences-service;1"].
		getService(Components.interfaces.nsIPrefService).getBranch("extensions.anonremail.");

	ar_prefs.setCharPref("remaileraddr",addrbox.value);
	ar_prefs.setCharPref("echolotaddr",linkbox.value);
	ar_prefs.setCharPref("echolotaddrkeys",keybox.value);

	return true;
}

function doRead()
{
	//get link from entry
	var link = document.getElementById("new-remailerstats").value;
	//listbox to insert statistics
	var list = document.getElementById('remailer-list');

	//delete cells
	var childnodes = list.childNodes;
	for(var i = (childnodes.length -1); i > 1; --i)
	{
		list.removeItemAt(childnodes.item(i));
	}

	//label to update statistics creation time
	var label = document.getElementById('lastupdate-remailer');

	try {
		//read the textfile from the web
		var req = new XMLHttpRequest();
		req.open('GET',link, true);
		req.onreadystatechange = function () {
			if (req.readyState == 4) {

				var text = new String(req.responseText);

				var idx = text.lastIndexOf("Last update:");
				if(idx < 0)
				{
					var strbundle = document.getElementById("anonremail.locale");
					alert(strbundle.getString("anonremail_options_wrongformat"));
					return false;
				}

				text = text.substr(idx);
				var lines = text.split('\n');

				label.setAttribute("value",lines[0]);

				var regex = new RegExp("([^ ]*)[ ]*([^ ]*@[^ ]*)[ ]*([?#+-._*^ ]*)[ ]*([^ ]*)[ ]*([^ ]*)"); 
				var remailerlist = null;
				for(var i = 3; i < lines.length; ++i)
				{
					remailerlist = regex.exec(lines[i]);
					if(!remailerlist)
						continue;
					var listitem = document.createElement("listitem");

					for(var j = 1; j < remailerlist.length; ++j)
					{
						var listcell = document.createElement("listcell");
						listcell.setAttribute("label",remailerlist[j]);
						listitem.appendChild(listcell);
					}
					list.appendChild(listitem);

				}
			}
			return true;
		};

		req.send(null);
	} catch(e) {
		var strbundle = document.getElementById("anonremail.locale");
		alert(strbundle.getString("anonremail_options_error"));
	}

	return true;
}