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

function onLoad()
{
	var checkkey = window.arguments[0].getElementById("new-anonremailkey");
	var checkbox = document.getElementById("new-anoncheckbox");
	checkbox.setAttribute("checked",checkkey.getAttribute("checked"));
	return true;
}

function doOK()
{
	var checkkey = window.arguments[0].getElementById("new-anonremailkey");
	var checkbox = document.getElementById("new-anoncheckbox");
	checkkey.setAttribute("checked",checkbox.getAttribute("checked"));

	var statusBar = window.arguments[0].getElementById("anonremail-status-bar");

    if(checkbox.getAttribute("checked"))
		statusBar.setAttribute("anon", "active");
	else
		statusBar.setAttribute("anon", "inactive");

	return true;
}
