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
//Components.utils.reportError(cipherText);
const anonremailversion = "0.2.4"; 

var ar_main = {

	reset_remailer : function()
	{
		try
		{
			var check = document.getElementById("new-anonremailkey");
			check.setAttribute("checked",false);
		} catch (ex) {}
		var statusBar = document.getElementById("anonremail-status-bar");
	    statusBar.setAttribute("anon", "inactive");
	},

	toggleAnon : function(mode)
	{
		try
		{
			if(mode)
			{
				var check = document.getElementById("new-anonremailkey");
				if("true" == check.getAttribute("checked"))
					check.setAttribute("checked",false);
				else
					check.setAttribute("checked",true);
			}
		} catch (ex) {}

		var statusBar = document.getElementById("anonremail-status-bar");
		var statusAnon = statusBar.getAttribute("anon");
	    if(statusAnon == "inactive")
			statusBar.setAttribute("anon", "active");
		else
			statusBar.setAttribute("anon", "inactive");
	},

	send_to_anon_remailer : function()
	{
            var strbundle = document.getElementById("anonremail.locale");
		
		try {
			if(gEnigmailVersion < "0.95.5")
			{
				alert(strbundle.getString("anonremail_error_enigmail_version"));
				return false;
			}
		}
		catch(e)
		{
			alert(strbundle.getString("anonremail_error_no_enigmail"));
			return false;
		}
		
		var msgcomposeWindow =	document.getElementById("msgcomposeWindow");

		var emailAddresses = new Array();
		var names = new Array();
		var fullNames = new Array();

		//init the field
		Recipients2CompFields(gMsgCompose.compFields);

		//get a parser-component per xpcom
		var parser = Components.classes["@mozilla.org/messenger/headerparser;1"]
		.getService(Components.interfaces.nsIMsgHeaderParser);

		//use the pasrer to get email-addresses
		var addressCount = parser.parseHeadersWithArray(
			gMsgCompose.compFields.to, 
			emailAddresses, 
			names, 
			fullNames);

		
		if(addressCount > 1)
		{
			//send error: only one address supported
			alert(strbundle.getString("anonremail_error_only_one_address"));
			return false;
		}
		if(addressCount == 0)
		{
			//send error: address missing
			alert(strbundle.getString("anonremail_error_address_missing"));
			return false;
		}

		var recipient = emailAddresses.value[0];

		//get the subject, if empty, than don't insert into anonymous to-remail-text
		var subject_node = document.getElementById("msgSubject");

		var currentEditor = GetCurrentEditor();
		currentEditor.beginTransaction();

		//in this version (0.0.1) no event-binding, but send it per new pushbutton
		if(this.build_anonymous_mail_text(recipient, subject_node.value))
		{
			//delete subject, remailer don't want to have a subject!
			subject_node.value = "";
		} else {
			//error during textprocessing
			alert(strbundle.getString("anonremail_error_text_processing"));
			currentEditor.endTransaction();
			return false;
		}
		
		var ar_prefs = Components.classes["@mozilla.org/preferences-service;1"].
			getService(Components.interfaces.nsIPrefService).getBranch("extensions.anonremail.");

		var remailer = ar_prefs.getCharPref("remaileraddr");
		//show dialog to choose a remailer
		//use default remailer first to have the address to hand
		if(!this.encryptMessage(gMsgCompose.compFields.replyTo,remailer))
		{
			//send error: encryption error
			alert(strbundle.getString("anonremail_error_encryption"));
			currentEditor.endTransaction();
			return false;
		}

		if(!this.append_remailer_pgp_text())
		{
			//send error: text manipulation error
			alert(strbundle.getString("anonremail_error_text_processing"));
			currentEditor.endTransaction();
			return false;
		}
		currentEditor.endTransaction();

		var msgCompFields = gMsgCompose.compFields;
		msgCompFields.to = new Object(remailer);
		msgCompFields.cc = null;
		msgCompFields.bcc = null;
		msgCompFields.replyTo = null;
		msgCompFields.newsgroups = null;
		msgCompFields.followupTo = null;
		msgCompFields.otherRandomHeaders = null;
		CompFields2Recipients(msgCompFields,null);

		return true;
	},
	
	build_anonymous_mail_text : function(recipient, subject)
	{
		var currentEditor = GetCurrentEditor();
		var currentEditorDom = currentEditor.rootElement;
		
		/*
			::
			Anon-To: recipient@address.de
			???
			???##
			???Subject: subject

			text
			text
			text
		*/

		var header = new String("\n::\nAnon-To: ");
		header = String.concat(header,recipient,"\n\n");
		if(subject != "")
		{
			header = String.concat(header,"##\nSubject: ",subject,"\n\n");
		}
		var header_node = document.createTextNode(header);
		currentEditor.insertNode(header_node,currentEditorDom,0);

		return true;
	},

	append_remailer_pgp_text : function()
	{
		var currentEditor = GetCurrentEditor();
		var currentEditorDom = currentEditor.rootElement;
		
		/*
			::
			Encrypted: PGP

			-----BEGIN PGP MESSAGE-----
			<place encrypted output here>
			-----END PGP MESSAGE-----
		*/

		var header = new String("\n::\nEncrypted: PGP\n\n");
		var header_node = document.createTextNode(header);

		currentEditor.insertNode(header_node,currentEditorDom,0);
		return true;
	},

	encryptMessage : function(fromAddr,toAddr)
	{
		var enigmailSvc = GetEnigmailSvc();

		var exitCodeObj    = new Object();
		var statusFlagsObj = new Object();
		var errorMsgObj    = new Object();

		// Get plain text
		var encoderFlags = EnigOutputFormatted | EnigOutputLFLineBreak;
		// (Do we need to set the nsIDocumentEncoder.* flags?)
		var origText = EnigEditorGetContentsAs("text/plain",encoderFlags);
		
		if (origText.length > 0) {
			// Sign/encrypt body text
			var escText = origText; // Copy plain text for possible escaping

			escText = EnigEditorGetContentsAs("text/plain", encoderFlags);
			
			// Encrypt plaintext
			var charset = EnigEditorGetCharset();
			
			// Encode plaintext to charset from unicode
			var plainText = EnigConvertFromUnicode(escText, charset);

			statusFlagsObj.value = nsIEnigmail.TRUSTED_IDENTITY;
			var cipherText = enigmailSvc.encryptMessage(window, null , null, plainText,
							fromAddr, 
							toAddr, 
							ENIG_ENCRYPT|nsIEnigmail.SEND_ALWAYS_TRUST,
							exitCodeObj, 
							statusFlagsObj,
							errorMsgObj);
			
			var exitCode = exitCodeObj.value;

			
			if (cipherText && (exitCode == 0)) {
				// Encryption/signing succeeded; overwrite plaintext
				// Decode ciphertext from charset to unicode and overwrite
				enigReplaceEditorText( cipherText );
				return true;
			}
			else {
				// Restore original text
				enigReplaceEditorText(origText);
				return false;
			}
		}
		return false;
	},
	
	showOptionsDialog : function()
	{
		return window.openDialog("chrome://anonremail/content/options.xul", "_blank", "chrome, modal, resizable=yes");
	},

	showToggleDialog : function()
	{
		return window.openDialog("chrome://anonremail/content/toggle.xul", "_blank", "chrome, modal, resizable=no",document);
	}
};


function anonremailSendListener(event) {
	try {
		//make sure we are second
		var encoderFlags = EnigOutputFormatted | EnigOutputLFLineBreak;
		var origText = EnigEditorGetContentsAs("text/plain",encoderFlags);
		if(origText.lastIndexOf("-----BEGIN PGP MESSAGE-----") < 0)
		{
			window.removeEventListener('compose-send-message', enigSendMessageListener, true);
			enigSendMessageListener(event);
		}
		
		var statusBar = document.getElementById("anonremail-status-bar");
		var statusAnon = statusBar.getAttribute("anon");
	    if(statusAnon == "active")
		{
			if(!ar_main.send_to_anon_remailer())
			{
				event.preventDefault();
				event.stopPropagation();
			}
		}
	}
	catch (ex) {}
}

function anonremailLoadListener(event) {
	ar_main.reset_remailer();
}

//function anonremailCloseListener(event) {
//	try {
//		Components.utils.reportError("close");
//	}
//	catch (ex) {}
//}

function anonremailReopenListener(event) {
	ar_main.reset_remailer();
}


// Listen to message sending event
window.addEventListener('compose-send-message', anonremailSendListener, true);

window.addEventListener("load", anonremailLoadListener, false);

// Handle recycled windows
//window.addEventListener('compose-window-close', anonremailCloseListener, true);
window.addEventListener('compose-window-reopen', anonremailReopenListener, true);
