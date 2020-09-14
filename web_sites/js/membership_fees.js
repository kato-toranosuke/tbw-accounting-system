'use strict';
import { BASE_URL, getData, sendDataWithGET, matchKeyInArray, sortArray, confirmSending, toggleNavBurger} from './generalFuncs.js';

window.onload = async function () {
  toggleNavBurger();
  // 前回のレスポンスデータを取得・表示
  // const past_data = JSON.parse(sessionStorage.getItem('pastData'));

  document.fee_form.action = BASE_URL;
  const member_data = await getData(1, BASE_URL);
  const payment_data = await getData(2, BASE_URL);
  const fee_data = await getData(4, BASE_URL);
  if (member_data.success == 1 && payment_data.success == 1) {
    const header = payment_data.data.shift();
    // IDをkeyに昇順でsortする
    const sorted_member_data = sortArray(member_data.data, 0, 1);
    const data = matchKeyInArray(sorted_member_data, payment_data.data, 0, 0);
    displayData(data, header, fee_data.data);
  }
};

async function updateScreen(form_name) {
  const res = await sendDataWithGET(form_name, BASE_URL);
  // 画面遷移時にもレスポンスデータを確認できるようにweb strageにデータを保存する
  // sessionStorage.setItem('pastData', JSON.stringify(res));

  if (res.success == 1) {
    // 画面をリロードする。trueにする事でWEBサーバの情報からリロード。falseはキャッシュからリロード。
    location.reload(true);
  }
}

document.getElementsByName('submit_button')[0].onclick = function () {
  if(confirmSending())
    updateScreen('fee_form');
};

function displayData(data_arry, header_arry, fee_data) {
  const theader = document.getElementById('table_header');
  const tbody = document.getElementById('table_body');
  const fees_num = (header_arry.length - 1) / 3;

  // ヘッダー行を生成する
  const upper_hrow = document.createElement('tr');
  const lower_hrow = document.createElement('tr');

  // ヘッダー上部行
  const th_id = document.createElement('th');
  th_id.setAttribute('rowspan', '2');
  th_id.textContent = 'Name';
  const th_name = document.createElement('th');
  th_name.setAttribute('rowspan', '2');
  th_name.textContent = 'Member ID';
  upper_hrow.append(th_id, th_name);

  // 各会費に対するヘッダ行
  const fee_items = ["Done", "Date", "Receipt ID"];
  if (fees_num > 0) {
    for (let i = 0; i < fees_num; i++) {
      // 会費名の表示部分
      const th_fee = document.createElement('th');
      th_fee.setAttribute('colspan', '3');
      // 会費IDから会費名を取得
      for (const fee_datum of fee_data) {
        if (fee_datum[0] == header_arry[3 * i + 1]) {
          th_fee.textContent = `${fee_datum[1]}年度${fee_datum[2]}`;
          break;
        }
      }
      upper_hrow.appendChild(th_fee);
  
      // Done/Date/Idの表示部分
      for (const item of fee_items) {
        const th_item = document.createElement('th');
        th_item.textContent = item;
        th_item.classList.add('has-text-weight-light');
        lower_hrow.appendChild(th_item);
      }
    }
  }
  theader.append(upper_hrow, lower_hrow);

  // 表本体を作成
  for (const data of data_arry) {
    const row = document.createElement('tr');
    // idとname
    row.innerHTML = `<td>${data[1]} ${data[2]}</td><td>${data[0]}</td>`;

    for (let i = 0; i < fees_num; i++) {
      const done_str = (data[3 * i + 3] == 1) ? `<input type="checkbox" checked name="checked" disabled>` : `<input type="checkbox" name="${header_arry[3 * i + 1]}" value="${data[0]}">`;
      row.insertAdjacentHTML('beforeend', `<td>${done_str}</td><td>${data[3 * i + 4]}</td><td>${data[3 * i + 5]}</td>`);
    }
    tbody.appendChild(row);
  }
}