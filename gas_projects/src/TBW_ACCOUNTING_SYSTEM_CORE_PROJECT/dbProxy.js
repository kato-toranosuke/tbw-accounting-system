let MEMBER_DB_NAME = "", PAYMENT_DB_NAME = "", FEE_DB_NAME = "", HEADER_ROW_NUM = 0, ROOT_FOLDER_ID = "", RECEIPT_TEMPLATE_NAME = "", ADMIN_FAMILY_NAME = "", ADMIN_FIRST_NAME = "", ORGANIZATION_NAME = "", YEAR = 0, ADMIN_POSITION_NAME = "", DB_ID = "", ACCOUNTING_DB_NAME="";

// Script Propertyの読み込み
function readProperties() {
  const properties = PropertiesService.getScriptProperties();
  DB_ID = properties.getProperty('DB_ID');
  MEMBER_DB_NAME = properties.getProperty('MEMBER_DB_NAME');
  PAYMENT_DB_NAME = properties.getProperty('PAYMENT_DB_NAME');
  FEE_DB_NAME = properties.getProperty('FEE_DB_NAME');
  HEADER_ROW_NUM = parseInt(properties.getProperty('HEADER_ROW_NUM'), 10);
  ROOT_FOLDER_ID = properties.getProperty('ROOT_FOLDER_ID');
  RECEIPT_TEMPLATE_NAME = properties.getProperty('RECEIPT_TEMPLATE_NAME');
  ADMIN_POSITION_NAME = properties.getProperty('ADMIN_POSITION_NAME');
  ADMIN_FAMILY_NAME = properties.getProperty('ADMIN_FAMILY_NAME');
  ADMIN_FIRST_NAME = properties.getProperty('ADMIN_FIRST_NAME');
  ORGANIZATION_NAME = properties.getProperty('ORGANIZATION_NAME');
  YEAR = properties.getProperty('YEAR');
  ACCOUNTING_DB_NAME = properties.getProperty('ACCOUNTING_DB_NAME');
}

function doPost(postdata) {
  let output;
  // ドキュメントロックを取得する
  const lock = LockService.getScriptLock();
  try {
    // ロックを実施する
    lock.waitLock(10000);

    readProperties();
    const mode = Number(postdata.parameters.mode.toString());
    switch (mode) {
      case 0:
        output = returnResultHtml(postdata);
        break;
      default:
        console.error("invalid mode number: %d", mode);
        throw (new Error(`invalid mode number @ doPost`));
    }

  } catch (error) {
    console.error(error);
    output = ContentService.createTextOutput(`エラーが発生しました。申し訳ありませんが、もう一度お試しください。\n${error.name}: ${error.message}`);
  } finally {
    lock.releaseLock();
    return output;
  }
}

function doGet(getdata) {
  let output_obj = { success: 0, error_message: "this is initial error message." };
  try {
    readProperties();
    const mode = parseInt(getdata.parameter.mode, 10);

    switch (mode) {
      case 1:
        output_obj = getDbData(MEMBER_DB_NAME, HEADER_ROW_NUM, 3);
        break;
      case 2:
        output_obj = getDbData(PAYMENT_DB_NAME, HEADER_ROW_NUM - 1, -1);
        break;
      case 3:
        registerNewFeePaymentData(getdata);
        break;
      case 4:
        output_obj = getDbData(FEE_DB_NAME, HEADER_ROW_NUM, 5);
        break;
      case 5:
        registerNewMembershipFee(getdata);
        break;
      case 6:
        output_obj = getDbData(ACCOUNTING_DB_NAME);
        break;
      case 7:
        registerNewAccounting(getdata);
        break;
      default:
        console.error("invalid mode number: %d", mode);
        throw (new Error(`invalid mode number @ doGet`));
    }

    output_obj.success = 1;
  } catch (error) {
    output_obj.success = 0;
    output_obj.error_name = error.name;
    output_obj.error_message = error.message;
  } finally {
    let output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    output.setContent(JSON.stringify(output_obj));
    return output;
  }
}

function registerNewFeePaymentData(getdata) {
  try {
    // パラメータ値を配列に格納する
    const keys = Object.keys(getdata.parameters); // 各パラメータの名前を取得

    // 日付
    const date = new Date();
    const today_str = date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate();
    const today_str_jp = `${date.getFullYear()}年 ${date.getMonth() + 1}月 ${date.getDate()}日`;

    // exportの結果を格納するobj
    let export_pdf_result = {};

    // 各fee_idに対する処理
    for (const key of keys) {
      // modeパラメータは除く
      if (key == 'mode' || key == 'checked')
        continue;

      // 操作対象のmember id
      let target_mids = [];
      for (const target_mid_str of getdata.parameters[key]) {
        const target_mid = parseInt(target_mid_str, 10); // String型でデータが得られるので数値型に変換
        target_mids.push(target_mid);
      }

      // r_idsを取得
      const get_rids_result = generateReceiptId(key, target_mids);
      const r_ids = get_rids_result.data;

      // feeに関わる周辺情報を取得する
      const fee_info = SpreadSheetsSQL.open(DB_ID, FEE_DB_NAME).select(['fee_id', 'year', 'subject', 'price', 'budget_id', 'fee_folder_id', 'receipt_ss_id', 'receipt_folder_id', 'counterfoil_ss_id', 'counterfoil_folder_id']).filter(`fee_id = ${key}`).result();
      const fee_id = fee_info[0].fee_id;
      const year = fee_info[0].year;
      const subject = fee_info[0].subject;
      const price = fee_info[0].price;
      const receipt_ss_id = fee_info[0].receipt_ss_id;
      const counterfoil_ss_id = fee_info[0].counterfoil_ss_id;
      const receipt_folder_id = fee_info[0].receipt_folder_id;
      const description = `${year}年度${subject}`;

      // 各メンバーにデータを追加
      for (let i = 0; i < target_mids.length; i++) {
        const r_id = r_ids[i];
        let update_data_obj = {};
        update_data_obj[key] = 1;
        update_data_obj[`${key}_date`] = today_str;
        update_data_obj[`${key}_id`] = r_id;
        SpreadSheetsSQL.open(DB_ID, PAYMENT_DB_NAME).updateRows(update_data_obj, `m_id = ${target_mids[i]}`);

        // 領収証の作成に関わるメンバーデータを取得
        const member_info = SpreadSheetsSQL.open(DB_ID, MEMBER_DB_NAME).select(['m_id', 'family_name', 'first_name', 'email']).filter(`m_id = ${target_mids[i]}`).result();
        const mid = member_info[0].m_id;
        const family_name = member_info[0].family_name;
        const first_name = member_info[0].first_name;
        const email = member_info[0].email;

        // SS版領収証を生成
        // 領収証の生成
        const create_receipt_result = createReceipt(receipt_ss_id, '領収証', r_id, today_str_jp, mid, family_name, first_name, price, description);
        // 控えの生成
        const create_counterfoil_result = createReceipt(counterfoil_ss_id, '領収証【会計控】', r_id, today_str_jp, mid, family_name, first_name, price, description);

        // PDFを生成
        export_pdf_result = exportSsToPdf(create_receipt_result.ss_id, create_receipt_result.sheet_name, receipt_folder_id);

        // メールを配信
        sendEmail(email, description, export_pdf_result.pdf_blob, today_str_jp, family_name, first_name);
      }
    }
  } catch (error) {
    console.error(error);
    throw (new Error(`${error.name}: ${error.message} @ registerNewFeePaymentData`));
  }
}

function registerNewAccounting(getdata) {
  try {
    const info = getdata.parameters;

  } catch (error) {
    
  }
}

function registerNewMembershipFee(getdata) {
  try {
    const info = getdata.parameters;
    const create_fee_folder_result = addFolder(ROOT_FOLDER_ID, `${info.year}年度${(info.subject == 'その他') ? info.other_subject : info.subject}_${info.fee_id}`, ['receipt']);
    const create_receipt_result = createFolderAndSS(ROOT_FOLDER_ID, 'receipt', `receipt_${info.fee_id}`, ['receipt', info.fee_id]);
    const create_counterfoil_result = createFolderAndSS(ROOT_FOLDER_ID, 'counterfoil', `counterfoil_${info.fee_id}`, ['receipt', info.fee_id]);

    info.fee_folder_id = create_fee_folder_result.folder_id;
    info.receipt_ss_id = create_receipt_result.ss_id;
    info.receipt_folder_id = create_receipt_result.folder_id;
    info.counterfoil_ss_id = create_counterfoil_result.ss_id;
    info.counterfoil_folder_id = create_counterfoil_result.folder_id;

    // DBに情報を登録
    registerData4FeeAndPaymentDb(info);

  } catch (error) {
    console.error(error);
    throw (new Error(`${error.name}: ${error.message} @ registerNewMembershipFee`));
  }
}

function sendEmail(to, description, file, date_str, family_name, first_name, admin_family_name = ADMIN_FAMILY_NAME, admin_first_name = ADMIN_FIRST_NAME, admin_position_name = ADMIN_POSITION_NAME, organization_name = ORGANIZATION_NAME, year = YEAR) {
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

function exportSsToPdf(ss_id, sheet_name, folder_id) {
  try {
    let output_obj = { success: -1, error: "this is initial error message.", pdf_blob: "" };

    const sheet_id = SpreadsheetApp.openById(ss_id).getSheetByName(sheet_name).getSheetId();
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
    const token = ScriptApp.getOAuthToken();

    // 変更内容を即反映させるメソッド
    SpreadsheetApp.flush();

    // PDFを作成
    const response = UrlFetchApp.fetch(url + options, {
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

function createReceipt(receipts_ss_id, title, r_id, date, m_id, family_name, first_name, price, description, template_ss_id = DB_ID, template_sheet_name = RECEIPT_TEMPLATE_NAME, position = `${ORGANIZATION_NAME}　${YEAR}年度${ADMIN_POSITION_NAME}`, admin_family_name = ADMIN_FAMILY_NAME, admin_first_name = ADMIN_FIRST_NAME) {
  try {
    let output_obj = { success: 0, ss_id: "", sheet_name: "" };

    const template = SpreadsheetApp.openById(template_ss_id).getSheetByName(template_sheet_name);
    const receipts_ss = SpreadsheetApp.openById(receipts_ss_id);
    const receipt = template.copyTo(receipts_ss);

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

function createFolderAndSS(root_folder_id, folder_name, ss_name, parent_folders_names = []) {
  try {
    let output_obj = { success: 0, folder_id: "", ss_id: "" };

    // SSを配置するフォルダを作成する
    const folder_result = addFolder(root_folder_id, folder_name, parent_folders_names);
    // Spread Sheetを新規作成する
    const ss_id = SpreadsheetApp.create(ss_name).getId();
    // Spread SheetをFileオブジェクトとして取得する。
    const file = DriveApp.getFileById(ss_id);
    // 作成したフォルダ下にssを追加
    DriveApp.getFolderById(folder_result.folder_id).addFile(file);
    // ssをマイドライブから削除
    DriveApp.getRootFolder().removeFile(file);

    // 返り値を設定
    output_obj.success = 1;
    output_obj.folder_id = folder_result.folder_id;
    output_obj.ss_id = ss_id;

    return output_obj;
  } catch (error) {
    console.error(error);
    throw (new Error(`${error.name}: ${error.message} @ createFolderAndSS`));
  }
}

function addFolder(root_folder_id, new_folder_name, parent_folders_names = []) {
  try {
    let output_obj = { success: 0, folder_id: "" };

    const root_folder = DriveApp.getFolderById(root_folder_id);
    // 親フォルダのチェック
    let parent_folder = root_folder;
    if (parent_folders_names != []) {
      for (const folder_name of parent_folders_names) {
        // フォルダ名で検索
        const folders = parent_folder.searchFolders(`title contains "${folder_name}"`);
        if (folders.hasNext()) {
          // フォルダ名が一致するフォルダがある場合
          parent_folder = folders.next();
        } else {
          // ない場合、作成する
          parent_folder.createFolder(folder_name);
          parent_folder = parent_folder.getFoldersByName(folder_name).next();
        }
      }
    }
    // 目的のフォルダ下に新規フォルダを作成する
    const new_folder_id = parent_folder.createFolder(new_folder_name).getId();

    output_obj.success = 1;
    output_obj.folder_id = new_folder_id;

    return output_obj;
  } catch (error) {
    console.error(error);
    throw (new Error(`${error.name}: ${error.message} @ addFolder`));
  }
}

function registerData4FeeAndPaymentDb(info, db_id = DB_ID) {
  try {
    // 会費情報の追加
    const subject = (info.subject != 'その他') ? info.subject : info.other_subject;
    const data = [[info.fee_id, parseInt(info.year, 10), subject, parseInt(info.price, 10), info.accounting_id, info.fee_folder_id, info.receipt_ss_id, info.receipt_folder_id, info.counterfoil_ss_id, info.counterfoil_folder_id]];
    simpleRegisterData(FEE_DB_NAME, data);

    // SpreadSheetsSQL.open(db_id, FEE_DB_NAME).insertRows([{fee_id: info.fee_id, year: info.year, subject}]);

    // 支払い情報の追加
    const hdata = [[info.fee_id, `${info.fee_id}_date`, `${info.fee_id}_id`]];
    simpleRegisterData(PAYMENT_DB_NAME, hdata, 1);

  } catch (error) {
    console.error(error);
    throw (new Error(`${error.name}: ${error.message} @ registerData4FeeAndPaymentDb`));
  }
}

function generateReceiptId(fee_id, m_ids, db_name = PAYMENT_DB_NAME, db_id = DB_ID) {
  try {
    let output_obj = { success: 0, error: "this is initial error message.", data: [] };

    const filtered_result = SpreadSheetsSQL.open(db_id, db_name).select([fee_id]).filter(`${fee_id} = 1`).result();
    // 支払済の件数
    let payments_num = filtered_result.length;
    // r_idの生成
    for (const m_id of m_ids) {
      const r_id = `${fee_id}-${++payments_num}`;
      output_obj.data.push(r_id);
    }
    output_obj.success = 1;

    return output_obj;
  } catch (error) {
    console.error(error);
    throw (new Error(`${error.name}: ${error.message} @ generateReceiptId`));
  }
}

function simpleRegisterData(db_name, data, header_mode = 0, header_row_num = HEADER_ROW_NUM) {
  try {
    const db = SpreadsheetApp.openById(DB_ID).getSheetByName(db_name);
    if (header_mode == 0) {
      db.getRange(db.getLastRow() + 1, 1, data.length, data[0].length).setValues(data);
    } else {
      const header_range = db.getRange(header_row_num, db.getLastColumn() + 1, data.length, data[0].length);
      header_range.setValues(data);
      header_range.setBackground('silver');
      header_range.setFontWeight('bold');
    }
  } catch (error) {
    console.error(error);
    throw (new Error(`${error.name}: ${error.message} @ simpleRegisterData`));
  }
}

// function getDbData(db_name, items = [],db_id = DB_ID) {
//   let output_obj = { success: 0, data: [], error: "this is initial error message." };
//   try {
//     const db_data = SpreadSheetsSQL.open(db_id, db_name).select(items).result();
//     output_obj.success = 1;
//     output_obj.data = db_data;
//   } catch (error) {
//     console.error(error.message);
//     output_obj.success = 0;
//     output_obj.error = error.message;
//   } finally {
//     return output_obj;
//   }
// }

// header_row_num: ヘッダー行数を格納
function getDbData(db_name, header_row_num = HEADER_ROW_NUM, last_col_num = 0, db_id = DB_ID) {
  try {
    let output_obj = { success: 0, data: [], error: "this is initial error message." };

    const db = SpreadsheetApp.openById(db_id).getSheetByName(db_name);
    // データ範囲を取得
    const last_row = db.getLastRow();
    const last_col = (last_col_num > 0) ? last_col_num : db.getLastColumn();

    // セル範囲を取得
    const data_range = db.getRange(header_row_num + 1, 1, last_row - header_row_num, last_col);

    const data = data_range.getValues();
    output_obj.success = 1;
    output_obj.data = data;

    return output_obj;
  } catch (e) {
    console.error(error);
    throw (new Error(`${error.name}: ${error.message} @ getDbData`));
  }
}