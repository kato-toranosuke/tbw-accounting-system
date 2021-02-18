'use strict';

async function exportSsToPdf(ss_id, sheet_name, folder_id) {
  try {
    let output_obj = { success: -1, error: "this is initial error message.", pdf_blob: "" };

    const sheet_id = await SpreadsheetApp.openById(ss_id).getSheetByName(sheet_name).getSheetId();
    const sheet_id_str = sheet_id.toString(10);

    // urlを生成する
    let url = "https://docs.google.com/spreadsheets/d/" + ss_id + '/export?';

    // PDF作成のオプションを設定
    const opts = {
      exportFormat: "pdf",    // ファイル形式の指定 pdf / csv / xls / xlsx
      format: "pdf",    // ファイル形式の指定 pdf / csv / xls / xlsx
      size: "A4",     // 用紙サイズの指定 legal / letter / A4
      portrait: "false",   // true → 縦向き、false → 横向き
      fitw: "true",   // 幅を用紙に合わせるか
      sheetnames: "false",  // シート名をPDF上部に表示するか
      printtitle: "false",  // スプレッドシート名をPDF上部に表示するか
      pagenumbers: "false",  // ページ番号の有無
      gridlines: "false",  // グリッドラインの表示有無
      fzr: "false",  // 固定行の表示有無
      horizontal_alignment: "CENTER", // 水平方向の位置
      vertical_alignment: "MIDDLE", // 垂直方向の位置
      gid: sheet_id_str   // シートIDを指定
    };

    let url_ext = [];
    for (const opt_name in opts) {
      url_ext.push(opt_name + "=" + opts[opt_name]);
    }
    let options = url_ext.join('&');

    // APIを使用するためのOAuth認証
    const token = await ScriptApp.getOAuthToken();

    // 変更内容を即反映させるメソッド
    await SpreadsheetApp.flush();

    // PDFを作成
    const response = await UrlFetchApp.fetch(url + options, {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });

    const pdf = response.getBlob().setName(sheet_name + '.pdf');

    // 出力先のフォルダを指定
    const folder = DriveApp.getFolderById(folder_id);

    // フォルダに保存
    folder.createFile(pdf);

    output_obj.pdf_blob = pdf;
    output_obj.success = 1;

    return output_obj;
  } catch (error) {
    console.error(error);
    throw (new Error(`${error.name}: ${error.message} @ exportSsToPdf`));
  }
}

async function createReceipt(receipts_ss_id, title, r_id, date, m_id, family_name, first_name, price, description, template_ss_id = DB_ID, template_sheet_name = RECEIPT_TEMPLATE_NAME, position = `${ORGANIZATION_NAME}　${YEAR}年度${ADMIN_POSITION_NAME}`, admin_family_name = ADMIN_FAMILY_NAME, admin_first_name = ADMIN_FIRST_NAME) {
  try {
    let output_obj = { success: 0, ss_id: "", sheet_name: "" };

    const template = await SpreadsheetApp.openById(template_ss_id).getSheetByName(template_sheet_name);
    const receipts_ss = await SpreadsheetApp.openById(receipts_ss_id);
    const receipt = await template.copyTo(receipts_ss);

    // 名前を設定する
    receipt.setName(`${r_id}_${m_id}_${family_name}${first_name}`);
    // 値を設定する
    // 各種値を設定
    const no = `No：${r_id}`;
    const date_str = `発行日：${date}`;
    const name = `${family_name}　${first_name}　様`;
    const description_str = `但し、${description}として上記の金額正に領収いたしました。`;
    const admin_name = `${admin_family_name}　${admin_first_name}`;
    // 値配列を生成
    const values = [title, no, date_str, name, price, description_str, position, admin_name];
    // RangeListをRange[]に変換
    const range = receipt.getRangeList(['E1', 'H3', 'H5', 'B11', 'D14', 'B17', 'H23', 'H25']).getRanges();
    // 値をセルにセット
    for (let i = 0; i < range.length; i++) {
      range[i].setValue(values[i]);
    }

    output_obj.success = 1;
    output_obj.ss_id = receipts_ss_id;
    output_obj.sheet_name = receipt.getName();

    return output_obj;
  } catch (error) {
    console.error(error);
    throw (new Error(`${error.name}: ${error.message} @ createReceipt`));
  }
}

async function sendEmail(to, description, file, date_str, family_name, first_name, admin_family_name = ADMIN_FAMILY_NAME, admin_first_name = ADMIN_FIRST_NAME, admin_position_name = ADMIN_POSITION_NAME, organization_name = ORGANIZATION_NAME, year = YEAR) {
  try {
    const subject = `【${description}】領収証の送付について`;
    const name = `${organization_name} ${admin_position_name}`;
    const body = `
      ${family_name}　${first_name}　様
      
      ${date_str}に${description}を受領しました。領収書をPDFファイルにてお送りいたしますので、ご査収のほどよろしくお願いいたします。
      添付ファイルの不備がございましたら、お手数ですがご一報ください。
      
      ----------------------------------------------
      ${organization_name}　${year}年度${admin_position_name}
      ${admin_family_name}　${admin_first_name}
      `;
    MailApp.sendEmail(to, subject, body, { attachments: file, name: name });
  } catch (error) {
    console.error(error);
    throw (new Error(`${error.name}: ${error.message} @ createReceipt`));
  }
}