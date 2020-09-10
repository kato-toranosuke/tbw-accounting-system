'use strict';

// Script Propertyの読み込み
let MEMBER_DB_NAME, PAYMENT_DB_NAME, FEE_DB_NAME, HEADER_ROW_NUM, ROOT_FOLDER_ID, RECEIPT_TEMPLATE_NAME, ADMIN_FAMILY_NAME, ADMIN_FIRST_NAME, ORGANIZATION_NAME, YEAR, ADMIN_POSITION_NAME, DB_ID, ACCOUNTING_DB_NAME, HEADER_COLOR;
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
  HEADER_COLOR = properties.getProperty('HEADER_COLOR');
}

async function generateReceiptId(fee_id, m_ids, db_name = PAYMENT_DB_NAME, db_id = DB_ID) {
  try {
    let output_obj = { success: 0, error: "this is initial error message.", data: [] };

    const filtered_result = await SpreadSheetsSQL.open(db_id, db_name).select([fee_id]).filter(`${fee_id} = 1`).result();
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
      header_range.setBackground(HEADER_COLOR);
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

    if (last_row > header_row_num) {
      // セル範囲を取得
      const data_range = db.getRange(header_row_num + 1, 1, last_row - header_row_num, last_col);
  
      const data = data_range.getValues();
      output_obj.data = data;
    } else {
      output_obj.data = [];
    }
    
    output_obj.success = 1;
    return output_obj;
  } catch (e) {
    console.error(error);
    throw (new Error(`${error.name}: ${error.message} @ getDbData`));
  }
}