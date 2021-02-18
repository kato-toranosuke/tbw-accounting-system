'use strict';

function returnResultHtml(postdata, db_id = DB_ID) {
  let receipt_info = {
    date: "1970/1/1",
    no: "",
    person: "",
    writing: "",
    class: "",
    goods: []
  };
  let output = "";
  try {
    // パラメータを取得
    const ym = postdata.parameters.ym.toString();
    const g_num = postdata.parameters.g_num.toString();
    const receipt_db_name = postdata.parameters.receipt_db_name.toString();
    const goods_db_name = postdata.parameters.goods_db_name.toString();
    const accounting_id = postdata.parameters.accounting_id.toString();

    // レシート情報の取得
    receipt_info.date = postdata.parameters.date.toString();
    receipt_info.writing = postdata.parameters.writing.toString();
    receipt_info.person = postdata.parameters.person.toString();
    receipt_info.class = postdata.parameters.class.toString();

    // DBの取得
    const db = SpreadsheetApp.openById(db_id);
    const goods_db = db.getSheetByName(goods_db_name);
    const receipt_db = SpreadSheetsSQL.open(db_id, receipt_db_name);

    // レシート番号を算出
    let counter_result = receipt_db.select(['ym']).filter(`ym = ${ym}`).result().length;
    // レシート番号を生成
    receipt_info.no = `${accounting_id}-${ym}-${counter_result + 1}`;
    // 行を追加
    receipt_db.insertRows([
      { ym: ym, r_date: receipt_info.date, r_no: receipt_info.no }
    ]);

    // 各物品情報の取得
    for (let i = 0; i <= g_num; i++) {
      let goods_array = [];
      goods_array.push(receipt_info.date);
      goods_array.push(receipt_info.no);
      goods_array.push(receipt_info.person);
      goods_array.push(receipt_info.writing);
      goods_array.push(receipt_info.class);
      goods_array.push(postdata.parameters[`g${i}_div`].toString());
      goods_array.push(postdata.parameters[`g${i}_name`].toString());
      goods_array.push(postdata.parameters[`g${i}_price`].toString());
      goods_array.push(postdata.parameters[`g${i}_q`].toString());
      goods_array.push(postdata.parameters[`g${i}_note`].toString());
      receipt_info.goods.push(goods_array);
    }
    // DBへ登録
    const start_row = goods_db.getLastRow() + 1;
    const start_col = 1;
    goods_db.getRange(start_row, start_col, receipt_info.goods.length, receipt_info.goods[0].length).setValues(receipt_info.goods);
    
    // 結果HTMLファイルの生成
    let result_page = HtmlService.createTemplateFromFile('html/result');
    result_page.r_no = receipt_info.no;
    output = result_page.evaluate();
    output
      .setTitle("TBW会計システム")
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch (error) {
    console.error(error);
    output = ContentService.createTextOutput(`エラーが発生しました。申し訳ありませんが、もう一度お試しください。\n${error.name}: ${error.message}`);
  } finally {
    return output;
  }
}