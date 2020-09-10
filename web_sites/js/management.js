'use strict';
import { BASE_URL, getData, sendDataWithGET, confirmSending, separateNum, switchNodeDisplay } from './generalFuncs.js';

window.onload = async function () {
  // formのactionを設定
  document.forms.accounting_info_form.action = BASE_URL;
  document.forms.fee_info_form.action = BASE_URL;
  const accoounting_db_data =  await displayLatestDataInTable('accounting_info_tbody', 6, [], [8]);
  const fee_db_data = await displayLatestDataInTable('fee_info_tbody', 4, [4], [6,7,8,9,10]);

  // 新規会費情報登録フォームの対象会計を選ぶセレクタを設定
  let options_html_str = "";
  accoounting_db_data.data.forEach(data => {
    options_html_str += `<option value="${data[0]}">${data[1]}年度${data[2]}</option>`
  });
  document.forms.fee_info_form.accounting_id.innerHTML = options_html_str;
};

async function displayLatestDataInTable(tbody_id, mode, digits_showing_col_nums = [], hidden_col_nums=[],url = BASE_URL) {
  const db_data = await getData(mode, url);
  console.log(db_data);
  if (db_data.success == 1) {
    displayDataInTable(tbody_id, db_data.data, digits_showing_col_nums, hidden_col_nums);
  }
  return db_data;
}

function displayDataInTable(tbody_id, data, digits_showing_col_nums = [], hidden_col_nums = []) {
  const old_tbody = document.getElementById(tbody_id);

  // 現在設定されている子要素を全て削除する
  const tbody = old_tbody.cloneNode(false); // 子要素は複製しない。
  old_tbody.parentNode.replaceChild(tbody, old_tbody);

  for (const datum of data) {
    const row = document.createElement('tr');
    let html_str = "";
    for (let i = 0; i < datum.length; i++) {
      // 非表示列設定
      if (hidden_col_nums.includes(i + 1)) break;
      
      if (digits_showing_col_nums.includes(i+1))
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

async function updateScreen(form_name, target_node_id, mode, digits_showing_col_nums, hidden_col_nums) {
  const res = await sendDataWithGET(form_name, BASE_URL);
  if (res.success == 1) {
    displayLatestDataInTable(target_node_id, mode, digits_showing_col_nums, hidden_col_nums);
  }
}