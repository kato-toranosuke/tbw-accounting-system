'use strict';
// const BASE_URL = "https://script.google.com/macros/s/AKfycbzFPVa55eHOhBEGszrKbLOZi7Tr2NTme82t8ZXXqQ/exec";
const BASE_URL = "https://script.google.com/macros/s/AKfycbyW-9RNS4XyVR-Q3__DPA_yxA5xYwNTgnen9Nf2Jyyb-h4LvJun/exec";
const signout_button = document.getElementById('signout_button');
let is_admin_account = 0;

function renderButton() {
  gapi.signin2.render('my-signin2', {
    'scope': 'profile email',
    'width': 210,
    'height': 40,
    'longtitle': true,
    'theme': 'dark',
    'onsuccess': onSuccess,
    'onfailure': onFailure
  });
}

async function onSuccess(googleUser) {
  const profile_id = googleUser.getBasicProfile().getId();
  console.log(profile_id);
  await fetch(BASE_URL, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `profile_id=${profile_id}&mode=1`
  })
    .then(res => res.json())
    .then(json => {
      console.log(json);
      if (json.success == 0) {
        askSignin();
        is_admin_account = 0;
      } else {
        cancelSigninAttention();
        is_admin_account = 1;
      }
    })
    .catch(error => console.error(error));
}

function onFailure(error) {
  checkSignin();
  console.log(error);
}

signout_button.onclick = signOut;
function signOut() {
  var auth2 = gapi.auth2.getAuthInstance();
  auth2.signOut().then(function () {
    console.log('User signed out.');
    checkSignin();
  });
}

// 画面ロック
function cancelSigninAttention(node_id = 'main_content') {
  const content = document.getElementById(node_id);
  const wrapper = content.parentElement;
  const ask_signin = document.getElementById('ask_signin');

  content.style.display = 'block';
  signout_button.style.display = 'block';
  if (ask_signin)
    wrapper.removeChild(ask_signin);
}
function askSignin(node_id = 'main_content') {
  const content = document.getElementById(node_id);
  const wrapper = content.parentElement;
  const ask_signin = document.getElementById('ask_signin');

  if (ask_signin === null) {
    signout_button.style.display = 'none';
    content.style.display = 'none';

    const attention = document.createElement('article');
    attention.id = 'ask_signin';
    attention.classList.add('message', 'is-danger');
    attention.innerHTML = `
        <div class="message-header">
          <p>警告</p>
        </div>
        <div class="message-body">
          管理者アカウントでログインしてください。
        </div>
      `;
    wrapper.appendChild(attention);
  }
}

async function checkSignin() {
  const auth2 = gapi.auth2.init();
  if (auth2.isSignedIn.get() && is_admin_account === 1)
    cancelSigninAttention('main_content');
  else
    askSignin('main_content');
}