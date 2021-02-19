'use strict';

// BASE_URL: デプロイ後のウェブアプリのURL
const BASE_URL = "https://script.google.com/macros/s/AKfycbwtYeXoa1hqV8grjnh03SstVd1MqT5JMn_nVQJPACRjUhyBMX3YCmhJzg/exec";

async function getData(mode = 1, base_url = BASE_URL) {
  screenLock();

  const url = `${base_url}?mode=${mode}`;
  const res = await fetch(url)
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        return Promise.reject(new Error('Error'));
      }
    })
    .catch(e => {
      console.error(e.message);
      const json_obj = { success: 0 };
      return JSON.stringify(json_obj);
    });

  cancelScreenLock();
  return res;
}

async function sendDataWithGET(form_name, base_url = BASE_URL) {
  screenLock();

  let url = `${base_url}?mode=${document[form_name].mode.value}`;
  for (let i = 0; i < document[form_name].elements.length; i++) {
    const ele_name = document[form_name].elements[i].name;
    if (ele_name == 'submit_button' || ele_name == 'mode' || ele_name == 'checked' || ele_name == 'button')
      continue;
    else {
      // 会費徴収表におけるチェック済み項目をパスする
      const type = document[form_name].elements[i].type;
      if (((type == 'checkbox') && (!document[form_name].elements[i].checked)) || type == 'button')
        continue;
      url += `&${ele_name}=${document[form_name].elements[i].value}`;
    }
  }

  console.log(url);
  const res = await fetch(url)
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        return Promise.reject(new Error('Error'));
      }
    })
    .catch(e => {
      console.error(e.message);
      const json_obj = { success: 0 };
      return JSON.stringify(json_obj);
    });

  cancelScreenLock();
  return res;
}

// ref_arryはKey Valueの基準となる配列。これのKeyの並び順に合わせて、配列が生成される。
function matchKeyInArray(ref_arry, opr_arry, ref_key_index = 0, opr_key_index = 0) {
  let results = [];

  for (const ref_data of ref_arry) {
    const key_val = ref_data[ref_key_index];
    let mached_arry = opr_arry.filter(function (value) {
      return value[opr_key_index] === key_val;
    });
    mached_arry[0].splice(0, 1); // Key要素を削除
    const combined = ref_data.concat(mached_arry[0]);
    results.push(combined);
  }

  return results;
}

function sortArray(array, key_index = 0, ascending = 1) {
  array.sort((a1, a2) => {
    const v1 = a1[key_index], v2 = a2[key_index];
    return (ascending === 1) ? v1 - v2 : v2 - v1;
  });
  return array;
}

// 送信前の確認ダイアログ
function confirmSending(screenlock_dom_class = 'loading-container') {
  if (window.confirm('送信してよろしいですか？')) {
    screenLock();
    return true; // 「OK」時は送信を実行
  } else { // 「キャンセル」時の処理
    event.preventDefault();
    return false; // 送信を中止
  }
}

function displayAsJPY(num) {
  return Number(num).toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' });
}

// Nodeの表示・非表示を切り替える
function switchNodeDisplay(node_id) {
  const node = document.getElementById(node_id);
  if (node.style.display == 'none') {
    node.style.display = 'block';
  } else {
    node.style.display = 'none';
  }
}

// ノードを非表示にする
function hideNode(node_id) {
  document.getElementById(node_id).style.display = "none";
}

// スクリーンロック
function screenLock() {
  if (document.querySelectorAll('.loading-container').length === 0) {
    // スクロールロック
    noScroll();
    // ロック用のdivを生成
    const container = document.createElement('div');
    container.classList.add('loading-container');
    container.innerHTML = `
      <div class="sk-folding-cube">
        <div class="sk-cube1 sk-cube"></div>
        <div class="sk-cube2 sk-cube"></div>
        <div class="sk-cube4 sk-cube"></div>
        <div class="sk-cube3 sk-cube"></div>
      </div>
    `;

    container.style.top = `${window.pageYOffset}px`;
    container.style.left = `${window.pageXOffset}px`;

    const body_dom = document.getElementsByTagName("body").item(0);
    body_dom.appendChild(container);
  }
}

// スクリーンロックを解除する
function cancelScreenLock() {
  returnScroll();
  const container = document.getElementsByClassName('loading-container').item(0);
  container.remove();
}

// Modalの表示・非表示を切り替える
function switchModalDisplay(modal_node_id) {
  document.getElementById(modal_node_id).classList.toggle('is-active');
}

// 数値かどうかをチェック
const isNumber = function (value) {
  return ((typeof value === 'number') && (isFinite(value)) && (value > 0));
};

// スクロール
// スクロール禁止
function noScroll() {
  // PCでのスクロール禁止
  document.addEventListener("mousewheel", scrollControl, { passive: false });
  // スマホでのタッチ操作でのスクロール禁止
  document.addEventListener("touchmove", scrollControl, { passive: false });
}
// スクロール禁止解除
function returnScroll() {
  // PCでのスクロール禁止解除
  document.removeEventListener("mousewheel", scrollControl, { passive: false });
  // スマホでのタッチ操作でのスクロール禁止解除
  document.removeEventListener('touchmove', scrollControl, { passive: false });
}
// スクロール関連メソッド
function scrollControl(event) {
  event.preventDefault();
}

// navbar-burgerが展開できるようにする
function toggleNavBurger() {
  // Get all "navbar-burger" elements
  const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);

  // Check if there are any navbar burgers
  if ($navbarBurgers.length > 0) {

    // Add a click event on each of them
    $navbarBurgers.forEach(el => {
      el.addEventListener('click', () => {

        // Get the target from the "data-target" attribute
        const target = el.dataset.target;
        const $target = document.getElementById(target);

        // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
        el.classList.toggle('is-active');
        $target.classList.toggle('is-active');

      });
    });
  }
}

// export
export { BASE_URL, getData, sendDataWithGET, matchKeyInArray, sortArray, confirmSending, displayAsJPY, switchNodeDisplay, hideNode, screenLock, switchModalDisplay, isNumber, noScroll, cancelScreenLock, toggleNavBurger };