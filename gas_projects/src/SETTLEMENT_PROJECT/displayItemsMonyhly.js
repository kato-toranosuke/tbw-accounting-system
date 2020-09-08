const HEADER_ROW_NUM = 3; // 参照先SSのヘッダー行の行数
const THIS_SS_HEADER_ROW_NUM = 3; // このSSのヘッダー行の行数
const AGGREGATION_HEADER_ROW_NUM = 2; // 「集計用データ」のシートのヘッダー行の行数

function onEdit() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();

  // 編集対象のシートを判別する
  const sheet_name = sheet.getSheetName();
  if (sheet_name !== '支出' && sheet_name !== '収入' && sheet_name !== '集計用データ') {
    // 既に入力されている内容を消去する
    const last_row = sheet.getLastRow();
    if (last_row > THIS_SS_HEADER_ROW_NUM) {
      sheet.getRange(THIS_SS_HEADER_ROW_NUM + 1, 1, last_row - THIS_SS_HEADER_ROW_NUM, sheet.getLastColumn()).clear();
    }

    // 処理中の表示
    sheet.getRange('A4').setValue("処理中");

    // 各月のSpreadsheetのurlを取得
    const aggregation_sheet = ss.getSheetByName('集計用データ');
    const vals = aggregation_sheet.getRange(3, 1, aggregation_sheet.getLastRow() - AGGREGATION_HEADER_ROW_NUM, 2).getValues();
    const months = vals.map(element => element[0]);
    const urls = vals.map(element => element[1]);

    // 表示範囲を取得
    const display_period = sheet.getRange('B2').getValue();
    // 対象区分の取得
    const target_division = sheet.getRange('A1').getValue();
    // 各月への対応
    if (display_period !== '年間') {
      // 該当urlの発見
      const target_url = urls[months.indexOf(display_period)];
      
      if (target_url !== "") {
        // データの取得
        const target_sheet = SpreadsheetApp.openByUrl(target_url).getSheetByName(target_division);
        const last_row = target_sheet.getLastRow();
        if (last_row > HEADER_ROW_NUM) {
          const items = target_sheet.getRange(HEADER_ROW_NUM + 1, 1, last_row - HEADER_ROW_NUM, 10).getValues();
          if (items[0][0] !== "")
            sheet.getRange(THIS_SS_HEADER_ROW_NUM + 1, 1, items.length, items[0].length).setValues(items);
          else
            sheet.getRange('A4').setValue("この月のデータがありません。");
        } else {
          sheet.getRange('A4').setValue("この月のデータがありません。");
        }
      } else {
        // urlが設定されていなかった場合
        sheet.getRange('A4').setValue("スプレッドシートのURLが設定されていません。");
      }

    } else {
      // 年間への対応
      let annual_items = [];
      urls.forEach((url, index) => {
        if (url !== "") {
          const sheet_month = SpreadsheetApp.openByUrl(url).getSheetByName(target_division);
          const last_row = sheet_month.getLastRow();

          // 物品が登録されている月のみデータを取得
          if (last_row > HEADER_ROW_NUM) {
            const items = sheet_month.getRange(HEADER_ROW_NUM + 1, 1, last_row - HEADER_ROW_NUM, 10).getValues();
            // 4行目には数式が代入されているため、さらに配列がからではないかを確認
            if (items[0][0] !== "")
              annual_items = annual_items.concat(items);
          }
        }
      });

      // 値を表示する
      if (annual_items.length > 0)
        sheet.getRange(THIS_SS_HEADER_ROW_NUM + 1, 1, annual_items.length, annual_items[0].length).setValues(annual_items);
    }
  }
}
