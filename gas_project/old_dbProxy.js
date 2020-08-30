let DB_URL = "", RECEIPT_DB_NAME = "", GOODS_DB_NAME = "", MEMBER_DB_NAME = "", PAYMENT_DB_NAME = "", FEE_DB_NAME = "", HEADER_ROW_NUM = 0, COUNTER_CELL = "", ROOT_FOLDER_ID = "", RECEIPT_TEMPLATE_NAME = "", ADMIN_FAMILY_NAME = "", ADMIN_FIRST_NAME = "", ORGANIZATION_NAME = "", YEAR = 0, ADMIN_POSITION_NAME = "", DB_ID = "1ScS2AkFF1NHxFT5ZlpjW_y9KE25nLXmR39DCqtvq4GQ";

// Script Propertyの読み込み
function readProperties() {
  const properties = PropertiesService.getScriptProperties();
  DB_URL = properties.getProperty('DB_URL');
  RECEIPT_DB_NAME = properties.getProperty('RECEIPT_DB_NAME');
  GOODS_DB_NAME = properties.getProperty('GOODS_DB_NAME');
  MEMBER_DB_NAME = properties.getProperty('MEMBER_DB_NAME');
  PAYMENT_DB_NAME = properties.getProperty('PAYMENT_DB_NAME');
  FEE_DB_NAME = properties.getProperty('FEE_DB_NAME');
  COUNTER_CELL = "B1";
  HEADER_ROW_NUM = parseInt(properties.getProperty('HEADER_ROW_NUM'), 10);
  ROOT_FOLDER_ID = properties.getProperty('ROOT_FOLDER_ID');
  RECEIPT_TEMPLATE_NAME = properties.getProperty('RECEIPT_TEMPLATE_NAME');
  ADMIN_POSITION_NAME = properties.getProperty('ADMIN_POSITION_NAME');
  ADMIN_FAMILY_NAME = properties.getProperty('ADMIN_FAMILY_NAME');
  ADMIN_FIRST_NAME = properties.getProperty('ADMIN_FIRST_NAME');
  ORGANIZATION_NAME = properties.getProperty('ORGANIZATION_NAME');
  YEAR = properties.getProperty('YEAR');
}

let receipt_info = {
  date: "1970/1/1",
  no: "",
  person: "",
  writing: "",
  class: "",
  goods: []
};

function doPost(postdata) {
  readProperties();
  const mode = postdata.parameters.mode.toString();
  if (mode == 0) {
    return returnResultHtml(postdata);
  }
}

function doGet(getdata) {
  readProperties();
  const mode = getdata.parameter.mode;
  if (mode == 1) {
    let output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    output.setContent(JSON.stringify(getDbData(MEMBER_DB_NAME, HEADER_ROW_NUM, 3)));
    return output;
  } else if (mode == 2) {
    let output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    output.setContent(JSON.stringify(getDbData(PAYMENT_DB_NAME, HEADER_ROW_NUM - 1, -1)));
    return output;
  } else if (mode == 3) {
    let output_obj = { success: 0, error: "this is initial error message.", error_name: "" };
    try {
      // パラメータ値を配列に格納する
      const keys = Object.keys(getdata.parameters); // 各パラメータの名前を取得
      let fee_ids = []; // PAYMENT_DBにおける、各fee_idの列数を格納
      let target_mids_arry = []; // 操作対象のmember idを格納

      // 日付
      const date = new Date();
      const today_str = date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate();

      // 各パラメータに対する処理
      for (const key of keys) {
        // modeパラメータは除く
        if (key == 'mode' || key == 'checked')
          continue;

        // keyはPAYMENT_DBにおける、各fee_idの列数を表している。
        // const fee_id_col_num = parseInt(key, 10);
        fee_ids.push(key);

        // 操作対象のmember id
        let target_mids = [];
        for (const target_mid_str of getdata.parameters[key]) {
          const target_mid = parseInt(target_mid_str, 10); // String型でデータが得られるので数値型に変換
          target_mids.push(target_mid);
        }
        target_mids_arry.push(target_mids);
        // const result = generateDataArray4FeeDB(PAYMENT_DB_NAME, target_mids, HEADER_ROW_NUM, fee_id_col_num);

        // r_idsを取得
        const get_rids_result = generateReceiptId(key, target_mids);
        const r_ids = get_rids_result.data;

        // 各メンバーにデータを追加
        for (let i = 0; i < target_mids.length; i++) {
          let update_data_obj = {};
          update_data_obj[key] = 1;
          update_data_obj[`${key}_date`] = today_str;
          update_data_obj[`${key}_id`] = r_ids[i];
          SpreadSheetsSQL.open(DB_ID, PAYMENT_DB_NAME).updateRows(update_data_obj, `m_id = ${target_mids[i]}`);
        }

        // // DBへのデータ登録
        // if (result.success == 0)
        //   throw (new Error(`${result.error}, key: ${key} @generateDataArray4FeeDB`));
        // else
        //   output_obj = registerData(PAYMENT_DB_NAME, { arry: result.data, key_index: 0 }, { start: fee_id_col_num, end: 2, search: 1 });
      }

      // // 領収証の生成
      // const fees_data = getDbData(FEE_DB_NAME);
      // const payment_data = getDbData(PAYMENT_DB_NAME, 1);
      // const members_data = getDbData(MEMBER_DB_NAME);

      // let fee_ids = []; // 操作対象のfee_idを格納した配列
      // for (const fee_id_col_num of fee_id_col_nums) {
      //   // ヘッダー行の情報からfee_idを取得する
      //   const fee_id = payment_data[0][fee_id_col_num];
      //   fee_ids.push(fee_id);
      // }
      // // fee_idに対応した行数
      // const find_fee_ids_res = findRowNumberMatchToKey(FEE_DB_NAME, 1, fee_ids);

      // // 各feeに対して処理する
      // for (let i = 0; i < find_fee_ids_res.data.length; i++) {
      //   const fid_index = find_fee_ids_res.data[i] - (HEADER_ROW_NUM + 1);
      //   const fee_id = fees_data[fid_index][0];
      //   const year = fees_data[fid_index][1];
      //   const subject = fees_data[fid_index][2];
      //   const price = fees_data[fid_index][3];
      //   const receipt_ss_id = fees_data[fid_index][6];
      //   const counterfoil_ss_id = fees_data[fid_index][8];

      //   // 各memberに対する処理
      //   const find_mids_res = findRowNumberMatchToKey(MEMBER_DB_NAME, 1, target_mids[i]);
      //   for (let j = 0; j < find_mids_res.data.length; j++) {
      //     const mid_index = find_mids_res.data[i] - (HEADER_ROW_NUM + 1);
      //     const mid = members_data[mid_index][0];
      //     const family_name = members_data[mid_index][1];
      //     const first_name = members_data[mid_index][2];
      //     const email = members_data[mid_index][5];

      //     const r_id = fees_data

      //     const create_receipt_result = createReceipt(DB_URL, RECEIPT_TEMPLATE_NAME, receipt_ss_id, '領収証',);
      //   }
      // }

      output_obj.success = 1;
    } catch (error) {
      output_obj.success = 0;
      output_obj.error = error.message;
      output_obj.error_name = error.name;
    } finally {
      let output = ContentService.createTextOutput();
      output.setMimeType(ContentService.MimeType.JSON);
      output.setContent(JSON.stringify(output_obj));
      return output;
    }

  } else if (mode == 4) {
    let output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);
    output.setContent(JSON.stringify(getDbData(FEE_DB_NAME, HEADER_ROW_NUM, 4)));
    return output;
  } else if (mode == 5) {
    let output_obj = { success: 0, error: "this is initial error message." };

    try {
      const info = getdata.parameters;
      const create_fee_folder_result = addFolder(ROOT_FOLDER_ID, `${info.year}年度${(info.subject == 'その他') ? info.other_subject : info.subject}_${info.fee_id}`, ['receipt']);
      const create_receipt_result = createFolderAndSS(ROOT_FOLDER_ID, 'receipt', `receipt_${info.fee_id}`, ['receipt', info.fee_id]);
      const create_counterfoil_result = createFolderAndSS(ROOT_FOLDER_ID, 'counterfoil', `counterfoil_${info.fee_id}`, ['receipt', info.fee_id]);
      if (create_fee_folder_result.success == 1 && create_receipt_result.success == 1 && create_counterfoil_result.success == 1) {
        info.fee_folder_id = create_fee_folder_result.folder_id;
        info.receipt_ss_id = create_receipt_result.ss_id;
        info.receipt_folder_id = create_receipt_result.folder_id;
        info.counterfoil_ss_id = create_counterfoil_result.ss_id;
        info.counterfoil_folder_id = create_counterfoil_result.folder_id;

        // DBに情報を登録
        const result = registerData4FeeAndPaymentDb(info);
        if (result.success == 1)
          output_obj.success = 1;
        else
          throw (new Error(`${result.error} @ registerData4FeeAndPaymentDb`));
      } else {
        const error_msg = `create_fee_folder_result: ${create_fee_folder_result.error}\/create_receipt_result: ${create_receipt_result.error}\/create_counterfoil_result: ${create_counterfoil_result.error}`;
        throw (new Error(error_msg));
      }
    } catch (error) {
      output_obj.success = 0;
      output_obj.error = error.message;
      output_obj.error_name = error.name;
    } finally {
      let output = ContentService.createTextOutput();
      output.setMimeType(ContentService.MimeType.JSON);
      output.setContent(JSON.stringify(output_obj));
      return output;
    }
  }
}

function createReceipt(template_ss_url, template_sheet_name, receipts_ss_id, title, r_id, date, m_id, family_name, first_name, price, description, position = `${ORGANIZATION_NAME}　${YEAR}年度${ADMIN_POSITION_NAME}`, admin_family_name = ADMIN_FAMILY_NAME, admin_first_name = ADMIN_FIRST_NAME) {
  let output_obj = { success: 0, error: "this is initial error message.", receipts_ss_id: "", receipt_sheet_name: "" };
  try {
    const template = SpreadsheetApp.openByUrl(template_ss_url).getSheetByName(template_sheet_name);
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
    output_obj.receipts_ss_id = receipts_ss_id;
    output_obj.receipt_sheet_name = receipt.getName();
  } catch (error) {
    output_obj.success = 0;
    output_obj.error = error.message;
    throw (new Error(`${error.name}: ${error.message} @ createReceipt`));
  } finally {
    return output_obj;
  }
}

function createFolderAndSS(root_folder_id, folder_name, ss_name, parent_folders_names = []) {
  let output_obj = { success: 0, error: "this is initial error message.", folder_id: "", ss_id: "" };

  try {
    // SSを配置するフォルダを作成する
    const folder_result = addFolder(root_folder_id, folder_name, parent_folders_names);
    if (folder_result.success == 1) {
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
    } else {
      throw (new Error(`failed creating folder.`));
    }
  } catch (error) {
    output_obj.success = 0;
    output_obj.error = error.message;
    throw (new Error(`${error.name}: ${error.message} @ createFolderAndSS`));
  } finally {
    return output_obj;
  }
}

function addFolder(root_folder_id, new_folder_name, parent_folders_names = []) {
  let output_obj = { success: 0, error: "this is initial error message.", folder_id: "" };

  try {
    const root_folder = DriveApp.getFolderById(root_folder_id);

    // 親フォルダのチェック
    let parent_folder = root_folder;
    if (parent_folders_names != []) {
      for (const folder_name of parent_folders_names) {
        // フォルダ名で検索
        // const folders = parent_folder.getFoldersByName(folder_name);
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
  } catch (error) {
    output_obj.success = 0;
    output_obj.error = error.message;
    throw (new Error(`${error.name}: ${error.message} @ addFolder`));
  } finally {
    return output_obj;
  }
}

function registerData4FeeAndPaymentDb(info) {
  // 件名の設定
  let subject = info.subject;
  if (subject == 'その他')
    subject = info.other_subject;

  // 会費情報の追加
  const data = [[info.fee_id, parseInt(info.year, 10), subject, parseInt(info.price, 10), "", info.fee_folder_id, info.receipt_ss_id, info.receipt_folder_id, info.counterfoil_ss_id, info.counterfoil_folder_id]];
  const result = simpleRegisterData(FEE_DB_NAME, data);

  // 支払い情報の追加
  let output_obj = { success: 0, error: "this is initial error message." };
  if (result.success == 1) {
    const hdata = [[info.fee_id, `${info.fee_id}_date`, `${info.fee_id}_id`]];
    output_obj = simpleRegisterData(PAYMENT_DB_NAME, hdata, 1);
  } else {
    output_obj.success = 0;
    output_obj.error = error.message;
  }

  return output_obj;
}

function generateReceiptId(fee_id, m_ids, db_name = PAYMENT_DB_NAME, db_id = DB_ID) {
  let output_obj = { success: 0, error: "this is initial error message.", data: [] };
  try {
    const filtered_result = SpreadSheetsSQL.open(db_id, db_name).select([fee_id]).filter(`${fee_id} = 1`).result();
    // 支払済の件数
    let payments_num = filtered_result.length;
    // r_idの生成
    for (const m_id of m_ids) {
      const r_id = `${fee_id}-${++payments_num}`;
      output_obj.data.push(r_id);
    }
    output_obj.success = 1;
  } catch (error) {
    console.error(error.message);
    output_obj.success = 0;
    output_obj.error = error;
  } finally {
    return output_obj;
  }
}

function generateDataArray4FeeDB(db_name, form_data, header_row_num, fee_id_col_num) {
  let output_obj = { success: 0, error: "this is initial error message.", data: [] };
  try {
    const db = SpreadsheetApp.openByUrl(DB_URL).getSheetByName(db_name);
    // 日付
    const date = new Date();
    const today_str = date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate();
    // 領収証番号の生成
    const f_id_str = db.getRange(header_row_num, fee_id_col_num).getValue();
    let done_values = db.getRange(header_row_num + 1, fee_id_col_num, db.getLastRow() - header_row_num, 1).getValues();
    done_values = Array.prototype.concat.apply([], done_values);
    // 支払済の件数を数え上げる
    let payments_num = 0;
    for (const val of done_values) {
      if (val == 1)
        payments_num++;
    }
    // DBに登録する配列の生成
    let register_arry = [];
    for (const m_id of form_data) {
      const r_id = `${f_id_str}-${++payments_num}`;
      let row = [];
      row.push(m_id, 1, today_str, r_id);
      register_arry.push(row);
    }

    output_obj.success = 1;
    output_obj.data = register_arry;
  } catch (error) {
    console.error(error.message);
    output_obj.success = 0;
    output_obj.error = error;
  } finally {
    return output_obj;
  }
}

function simpleRegisterData(db_name, data, header_mode = 0, header_row_num = HEADER_ROW_NUM) {
  let output_obj = { success: 2 };
  try {
    const db = SpreadsheetApp.openByUrl(DB_URL).getSheetByName(db_name);
    if (header_mode == 0) {
      db.getRange(db.getLastRow() + 1, 1, data.length, data[0].length).setValues(data);
    } else {
      const header_range = db.getRange(header_row_num, db.getLastColumn() + 1, data.length, data[0].length);
      header_range.setValues(data);
      header_range.setBackground('silver');
      header_range.setFontWeight('bold');
    }
    output_obj.success = 1;
  } catch (error) {
    console.error(error.message);
    output_obj.error = error.message;
    output_obj.success = 0;
  } finally {
    return output_obj;
  }
}

function findRowNumberMatchToKey(db_name, key_col_num, key_vals = [], start_row_num = 1, db_url = DB_URL) {
  let output_obj = { success: 0, error: "this is initial error message.", data: [] };
  try {
    const db = SpreadsheetApp.openByUrl(db_url).getSheetByName(db_name);
    let indices = db.getRange(start_row_num, key_col_num, db.getLastRow(), 1).getValues();
    indices = Array.prototype.concat.apply([], indices);

    for (const key_val of key_vals) {
      const row_num = indices.indexOf(key_val) + 1;
      output_obj.data.push(row_num);
    }
    output_obj.success = 1;
  } catch (error) {
    console.error(error.message);
    output_obj.success = 0;
  } finally {
    return output_obj;
  }
}

function registerData(db_name, data = { arry: [], key_index: 0 }, col_info = { start: 1, end: 1, search: 1 }, db_url = DB_URL) {
  let output_obj = { success: 0 };
  try {
    const db = SpreadsheetApp.openByUrl(db_url).getSheetByName(db_name);
    let indices = db.getRange(1, col_info.search, db.getLastRow(), 1).getValues();
    // 一次元配列化
    indices = Array.prototype.concat.apply([], indices);

    for (let d of data.arry) {
      const key_val = d[data.key_index];
      // キー値に対応する行を取得
      const row = indices.indexOf(key_val) + 1;
      // DBに情報を登録
      d.shift(); // 先頭要素（つまりKey Value: m_id）を削除
      let val = [];
      val.push(d);
      db.getRange(row, col_info.start, val.length, val[0].length).setValues(val);
    }
    output_obj.success = 1;
  } catch (error) {
    console.error(error.message);
    output_obj.success = 0;
    output_obj.error = error.message;
  } finally {
    return output_obj;
  }
}

// header_row_num: ヘッダー行数を格納
function getDbData(db_name, header_row_num = HEADER_ROW_NUM, last_col_num = 0, db_url = DB_URL) {
  let output_obj = { success: 0, data: [], error: "this is initial error message." };

  try {
    const db = SpreadsheetApp.openByUrl(db_url).getSheetByName(db_name);
    // データ範囲を取得
    const last_row = db.getLastRow();
    const last_col = (last_col_num > 0) ? last_col_num : db.getLastColumn();

    // セル範囲を取得
    const data_range = db.getRange(header_row_num + 1, 1, last_row - header_row_num, last_col);

    const data = data_range.getValues();
    output_obj.success = 1;
    output_obj.data = data;
  } catch (e) {
    console.error(e.message);
    output_obj.success = 0;
  } finally {
    return output_obj;
  }
}

function returnResultHtml(postdata) {
  const db = SpreadsheetApp.openByUrl(DB_URL);
  const receipt_db = db.getSheetByName(RECEIPT_DB_NAME);
  const goods_db = db.getSheetByName(GOODS_DB_NAME);

  // パラメータを取得
  const ym = postdata.parameters.ym.toString();
  const g_num = postdata.parameters.g_num.toString();

  // レシート情報の取得
  receipt_info.date = postdata.parameters.date.toString();
  receipt_info.writing = postdata.parameters.writing.toString();
  receipt_info.person = postdata.parameters.person.toString();
  receipt_info.class = postdata.parameters.class.toString();

  // レシート番号を算出
  let counter_result = receipt_db.getRange(COUNTER_CELL).setFormula(`=COUNTIF(A:A, ${ym})`).getValue();
  // レシート番号を生成
  receipt_info.no = `${ym}-${counter_result + 1}`;
  // 行を追加
  receipt_db.appendRow([ym, receipt_info.date, receipt_info.no]);

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
  let result_page = HtmlService.createTemplateFromFile('result');
  result_page.r_no = receipt_info.no;
  const html_output = result_page.evaluate();
  html_output
    .setTitle("TBW会計システム")
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');

  return html_output;
}