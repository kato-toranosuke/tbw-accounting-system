function onEdit(event) {

  const ui = SpreadsheetApp.getUi();

  // 会員情報のシートかどうか判定する
  const db = SpreadsheetApp.getActiveSpreadsheet();
  const target_sheet = db.getActiveSheet();
  const target_sheet_name = target_sheet.getSheetName();

  const col = event.range.getColumn();

  if (target_sheet_name === 'member_db' && col === 1) {
    const fee_payment_db = db.getSheetByName('fee_payment_db');

    const a1 = event.range.getA1Notation();
    const range = target_sheet.getRange(a1);
    const values = range.getValues();

    // Tips: event.valueは常にstring型。valueはnumber/string型。
    // １つのセルに対し、値の変更があった場合の処理
    // if (event.oldValue !== undefined && event.value !== undefined) {
    if (event.value !== undefined) {
      let payment_ids = fee_payment_db.getRange(1, 1, fee_payment_db.getLastRow(), 1).getValues();
      // 一次配列に変換
      payment_ids = payment_ids.reduce((pre, current) => {
        pre.push(...current);
        return pre;
      }, []);

      // event.oldValueはstringなのでNumberに変換する。
      const old_id = Number(event.oldValue);
      const index = payment_ids.indexOf(old_id);
      console.log(old_id);
      console.log(event.oldValue);

      const start_row = (index === -1) ? fee_payment_db.getLastRow() + 1 : index + 1;
      fee_payment_db.getRange(start_row, 1).setValue(values[0][0]);

      // alertを出現させる
      ui.alert('確認', `fee_payment_dbのA${start_row}セルの値（member_id）を、${old_id}から${event.value}に変更しました。`, ui.ButtonSet.OK);

    } else if (values.length > 1) {
      let tmp_vals = [];
      for (let i = 0; i < values.length; i++) {
        tmp_vals.push(values[i][0]);
      }
      fee_payment_db.getRange(fee_payment_db.getLastRow() + 1, 1, tmp_vals.length, 1).setValues(tmp_vals);
    }

  } else if (target_sheet_name === 'fee_payment_db' && col === 1) {
    ui.alert('警告', `member_idを変更しても、member_dbと連携されません。変更を戻してください。`, ui.ButtonSet.OK);
  }
}