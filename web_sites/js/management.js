'use strict';
import { BASE_URL, getData, sendDataWithGET, confirmSending, separateNum, switchNodeDisplay, toggleNavBurger} from './generalFuncs.js';

let accounting_data = [];

window.onload = async function () {
  // formのactionを設定
  document.forms.accounting_info_form.action = BASE_URL;
  document.forms.fee_info_form.action = BASE_URL;
  const properties_data = await displayLatestPropertiesInTable('properties_info_tbody', 8);
  const accoounting_db_data = await displayLatestDataInTable('accounting_info_tbody', 6, [], [8]);
  const fee_db_data = await displayLatestDataInTable('fee_info_tbody', 4, [4], [6, 7, 8, 9, 10]);

  setOptions('target_accounting_id', accounting_data);
  toggleNavBurger();

  await checkSignin();
};

// 新規会費情報登録フォームの対象会計を選ぶセレクタを設定
function setOptions(select_node_id, data) {
  let options_html_str = "";
  data.forEach(datum => {
    options_html_str += `<option value="${datum[0]}">${datum[1]}年度${datum[2]}</option>`
  });
  document.getElementById(select_node_id).innerHTML = options_html_str;
}

async function displayLatestDataInTable(tbody_id, mode, digits_showing_col_nums = [], hidden_col_nums = [], url = BASE_URL) {
  const db_data = await getData(mode, url);
  console.log(db_data);
  if (db_data.success == 1) {
    displayDataInTable(tbody_id, db_data.data, digits_showing_col_nums, hidden_col_nums);

    if (tbody_id === 'accounting_info_tbody')
      accounting_data = db_data.data;
  }
  return db_data;
}

// tableをリセットする
function resetTbody(tbody_id) {
  const old_tbody = document.getElementById(tbody_id);

  // 現在設定されている子要素を全て削除する
  const tbody = old_tbody.cloneNode(false); // 子要素は複製しない。
  old_tbody.parentNode.replaceChild(tbody, old_tbody);
}

// プロパティ情報の表示
async function displayLatestPropertiesInTable(tbody_id, mode) {
  const db_data = await getData(mode);
  console.log(db_data);

  resetTbody(tbody_id);

  const tbody = document.getElementById(tbody_id);
  const obj = db_data.data;

  // sortする
  const keys = Object.keys(obj);
  keys.sort();

  for (const key of keys) {
    if (obj.hasOwnProperty(key)) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <th>${key}</th>
        <td id='td_${key}'><span style='cursor: pointer;'>${obj[key]}</span></td>
      `;
      tbody.appendChild(row);

      // クリックしたとき
      document.querySelector(`#td_${key} > span`).addEventListener('click', { handleEvent: displayForm, value: obj[key], key: key });
    }
  }
}

async function displayForm(event) {
  const key = this.key;
  // フォーム要素の作成
  const form = document.createElement('form');
  form.setAttribute('name', `property_${key}_form`);

  // input要素
  const input = document.createElement('input');
  input.classList.add('input', 'mb-2');
  input.setAttribute('type', 'text');
  input.setAttribute('name', key);
  input.setAttribute('value', this.value);
  input.setAttribute('accept-charset', 'UTF-8');

  // 送信ボタン
  const submit_button = document.createElement('button');
  submit_button.classList.add('button', 'is-primary', 'is-small', 'mr-2');
  submit_button.textContent = 'Change';
  submit_button.setAttribute('type', 'button');
  submit_button.addEventListener('click', { handleEvent: changeProperty, form_name: `property_${key}_form`, target_node_id: 'properties_info_tbody', mode: 8 });

  // キャンセルボタン
  const cancel_button = document.createElement('button');
  cancel_button.classList.add('button', 'is-light', 'is-small');
  cancel_button.textContent = 'Cancel';
  cancel_button.setAttribute('type', 'button');
  cancel_button.addEventListener('click', { handleEvent: displayValue, value: this.value, key: key });

  // mode
  const mode = document.createElement('input');
  mode.setAttribute('type', 'hidden');
  mode.setAttribute('name', 'mode');
  mode.setAttribute('value', 9);
  
  form.append(input, submit_button, cancel_button, mode);

  // 中身の入れ替え
  const span = event.currentTarget; // イベント発生元DOM
  const td = span.parentNode;
  td.replaceChild(form, span);
}

function changeProperty(event) {
  if (confirmSending()) {
    updateScreen(this.form_name, this.target_node_id, this.mode);
  }
}

async function displayValue(event) {
  const span = document.createElement('span');
  span.textContent = this.value;
  span.setAttribute('style', 'cursor: pointer;');
  span.addEventListener('click', { handleEvent: displayForm, value: this.value, key: this.key });

  const form = event.currentTarget.parentNode;
  const td = form.parentNode;
  td.replaceChild(span, form);
}


function displayDataInTable(tbody_id, data, digits_showing_col_nums = [], hidden_col_nums = []) {
  resetTbody(tbody_id);
  const tbody = document.getElementById(tbody_id);
  for (const datum of data) {
    const row = document.createElement('tr');
    let html_str = "";
    for (let i = 0; i < datum.length; i++) {
      // 非表示列設定
      if (hidden_col_nums.includes(i + 1)) break;

      if (digits_showing_col_nums.includes(i + 1))
        // 桁表示
        html_str += `<td>¥${separateNum(datum[i])}</td>`;
      else
        html_str += `<td>${datum[i]}</td>`
    }
    row.innerHTML = html_str;
    tbody.appendChild(row);
  }
}

// 新規会費情報の追加に関する処理
const accounting_subject_node = accounting_info_form.subject;
accounting_subject_node.onchange = function () {
  if (accounting_subject_node.value == 'その他')
    document.getElementById('accounting_other_subject').style.display = 'block';
  else
    document.getElementById('accounting_other_subject').style.display = 'none';
};

const fee_subject_node = fee_info_form.subject;
fee_subject_node.onchange = function () {
  if (fee_subject_node.value == 'その他')
    document.getElementById('fee_other_subject').style.display = 'block';
  else
    document.getElementById('fee_other_subject').style.display = 'none';
};

// フォームの表示非表示切り替えボタン
function switchForm(node_id_list) {
  for (const node_id of node_id_list) {
    switchNodeDisplay(node_id);
  }
}

// accounting info
const add_accounting_info = document.getElementById('add_accounting_info');
add_accounting_info.onclick = function () {
  switchForm(['add_accounting_info', 'remove_accounting_info', 'accounting_info_form']);
};
const remove_accounting_info = document.getElementById('remove_accounting_info');
remove_accounting_info.onclick = function () {
  switchForm(['add_accounting_info', 'remove_accounting_info', 'accounting_info_form']);
};
// 送信ボタンが押された場合
accounting_info_form.submit_button.onclick = function () {
  if (confirmSending()) {
    switchForm(['add_accounting_info', 'remove_accounting_info', 'accounting_info_form']);
    updateScreen('accounting_info_form', 'accounting_info_tbody', 6, [], [8]);
  }
};

// fee info
const add_fee_info = document.getElementById('add_fee_info');
add_fee_info.onclick = function () {
  switchForm(['add_fee_info', 'remove_fee_info', 'fee_info_form']);
};
const remove_fee_info = document.getElementById('remove_fee_info');
remove_fee_info.onclick = function () {
  switchForm(['add_fee_info', 'remove_fee_info', 'fee_info_form']);
};
// 送信ボタンが押された場合
fee_info_form.submit_button.onclick = function () {
  if (confirmSending()) {
    switchForm(['add_fee_info', 'remove_fee_info', 'fee_info_form']);
    updateScreen('fee_info_form', 'fee_info_tbody', 4, [4], [6, 7, 8, 9, 10]);
  }
};

async function updateScreen(form_name, target_node_id, mode, digits_showing_col_nums=[], hidden_col_nums=[]) {
  const res = await sendDataWithGET(form_name, BASE_URL);
  if (res.success == 1) {
    if (form_name.includes('property')) {
      await displayLatestPropertiesInTable(target_node_id, mode);
    } else {
      await displayLatestDataInTable(target_node_id, mode, digits_showing_col_nums, hidden_col_nums);
    }
    if (form_name === 'accounting_info_form')
      setOptions('target_accounting_id', accounting_data);
  }
}