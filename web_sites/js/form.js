'use strict';

import { BASE_URL, separateNum, hideNode, switchModalDisplay, confirmSending, screenLock} from './generalFuncs.js';

let g_no = 0;
const goods_form = document.getElementById("goods_form");
const date = document.getElementsByName("date")[0];
const g_num = document.getElementsByName("g_num")[0];
const ym = document.getElementsByName("ym")[0];

// 日付の登録
window.onload = function () {
  // フォームのactionを設定する
  document.receipt_form.action = BASE_URL;
  let today = new Date();
  date.value = today.getFullYear() + "/" + (today.getMonth() + 1) + "/" + today.getDate();
  g_num.value = g_no;
  ym.value = (today.getFullYear() % 100) * 100 + (today.getMonth() + 1);
}

// 「物品を追加」ボタンがクリックされた時
document.getElementById("add_button").onclick = function () {
  g_no++;
  g_num.value = g_no;

  // 新しい入力フォームを生成
  let new_goods = document.createElement("p");
  new_goods.id = "g" + g_no;
  new_goods.classList.add('box');
  new_goods.innerHTML = `
        <h1 class="is-size-4 mb-4">Item-${g_no}</h1>
        <!-- 物品名 -->
        <div class="field">
            <label class="label">物品名</label>
            <div class="control">
                <input class="input is-small" type="text" name="g${g_no}_name" accept-charset="UTF-8" required>
            </div>
        </div>

        <!-- 単価 -->
        <!-- 正の整数しか受け取らないようにしたい。正規表現 -->
        <div class="field">
            <label class="label">単　価</label>
            <div class="field has-addons">
                <span class="control button is-static is-small">¥</span>
                <p class="control">
                    <input class="input is-small" type="number" name="g${g_no}_price" accept-charset="UTF-8" required>
                </p>
            </div>
        </div>

        <!-- 数量 -->
        <div class="field">
            <label class="label">数　量</label>
            <div class="control">
                <input class="input is-small" type="number" name="g${g_no}_q" accept-charset="UTF-8" required>
            </div>
        </div>

        <!-- 区分 -->
        <div class="field">
            <label class="label">区　分</label>
            <div class="select">
                <select name="g${g_no}_div" required>
                    <option value="翼">翼</option>
                    <option value="桁">桁</option>
                    <option value="フレーム">フレーム</option>
                    <option value="電装">電装</option>
                    <option value="フェアリング">フェアリング</option>
                    <option value="プロペラ">プロペラ</option>
                    <option value="CFRP">CFRP</option>
                    <option value="CNC">CNC</option>
                    <option value="パイロット">パイロット</option>
                    <option value="全体">全体</option>
                    <option value="鳥通">鳥通</option>
                    <option value="玄武">玄武</option>
                    <option value="文サ">文サ</option>
                    <option value="その他">その他</option>
                </select>
            </div>
        </div>

        <!-- 備考 -->
        <div class="field">
            <label class="label">備　考</label>
            <div class="control">
                <textarea class="textarea is-small" name="g${g_no}_note" rows="2" cols="40"></textarea>
            </div>
        </div>
    `;
  goods_form.appendChild(new_goods);
  // calcTotal()の追加
  document.forms.receipt_form[`g${g_no}_price`].onchange = calcTotal;
  document.forms.receipt_form[`g${g_no}_q`].onchange = calcTotal;

  // 区分の設定
  const is_apply = document.receipt_form.is_apply;
  if (is_apply.checked) {
    const division = document.receipt_form.division;
    // 選択されている選択肢のindexを取得
    const selected_index = division.selectedIndex;
    setGroup(selected_index, g_no);
  }
};

// 「物品を削除」ボタンがクリックされた時
document.getElementById("remove_button").onclick = function () {
  if (g_no > 0) {
    const last_goods = document.getElementById("g" + g_no);
    goods_form.removeChild(last_goods);
    g_no--;
    g_num.value = g_no;
    calcTotal();
  }
};

// 合計金額を取得する
let total = 0; // 合計金額を記録する
const total_area = document.getElementById("total"); // 合計金額を表示する部分

// 合計金額を計算
function calcTotal() {
  total = 0;
  for (let i = 0; i <= g_no; i++) {
    let g_price = document.getElementsByName("g" + i + "_price")[0].value;
    let g_q = document.getElementsByName("g" + i + "_q")[0].value;
    total += g_price * g_q;
  }
  total_area.textContent = separateNum(total);
}
document.forms.receipt_form.g0_price.onchange = calcTotal;
document.forms.receipt_form.g0_q.onchange = calcTotal;

// ノードを非表示にする
document.getElementById('delete-button').onclick = () => {
  hideNode('warning_msg');
};

// Modalの表示・非表示を切り替える
document.getElementById('open-advice-button').onclick = ()=>{
  switchModalDisplay('total-fee-modal');
};
document.getElementById('advice-bg').onclick = () => {
  switchModalDisplay('total-fee-modal');
};
document.getElementById('advice-delete-button').onclick = () => {
  switchModalDisplay('total-fee-modal');
};



// 入力フォームにNGワードが含まれているかチェック
function checkWord(node_name) {
  const input_node = document.getElementsByName(node_name)[0];
  // 但し書きの部分のみ抽出する
  const pre_replacement = input_node.value.replace(/^(但し|但|ただし)[,、]*/, '');
  const description = pre_replacement.replace(/として$/, '');

  // NG Wordのチェック
  const ng_regex = new RegExp(/^(((|商|お)品代?)|((機体|人力飛行機|飛行機)?(制作|製作)?(費|代)?))$/);
  if (ng_regex.test(description)) {
    input_node.setCustomValidity(`「${description}」は但し書きとして認められていません。\nより具体的な内容にしてください。`);
  } else {
    input_node.setCustomValidity("");
  }

  input_node.value = description;
}
document.forms.receipt_form.writing.onchange = () => {
  checkWord('writing');
};

// 送信前の確認
document.forms.receipt_form.addEventListener('submit', confirmSending, false);

// 区分の全物品適用
function switchAllGroup() {
  const is_apply = document.receipt_form.is_apply;
  const division = document.receipt_form.division;

  if (is_apply.checked) {
    // 全物品に区分を適用
    // disabledを解除
    division.disabled = false;
    // 選択されている選択肢のindexを取得
    const selected_index = division.selectedIndex;

    for (let i = 0; i <= g_no; i++) {
      setGroup(selected_index, i);
    }
  } else {
    // disabledを適用
    division.disabled = true;
  }
}
document.forms.receipt_form.division.onchange = switchAllGroup;
document.forms.receipt_form.is_apply.onchange = switchAllGroup;

// 各物品の区分を任意の値に設定する
function setGroup(selected_index, g_num) {
  const goods = document.receipt_form[`g${g_num}_div`];
  goods.selectedIndex = selected_index;
}

console.log(document.getElementsByClassName('abe').length);