'use strict';

async function registerNewFeePaymentData(getdata) {
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
      const get_rids_result = await generateReceiptId(key, target_mids);
      const r_ids = get_rids_result.data;

      // feeに関わる周辺情報を取得する
      const fee_info = await SpreadSheetsSQL.open(DB_ID, FEE_DB_NAME).select(['fee_id', 'year', 'subject', 'price', 'budget_id', 'fee_folder_id', 'receipts_ss_id', 'receipts_folder_id', 'counterfoils_ss_id', 'counterfoils_folder_id']).filter(`fee_id = ${key}`).result();
      const fee_id = fee_info[0].fee_id;
      const year = fee_info[0].year;
      const subject = fee_info[0].subject;
      const price = fee_info[0].price;
      const receipts_ss_id = fee_info[0].receipts_ss_id;
      const counterfoils_ss_id = fee_info[0].counterfoils_ss_id;
      const receipts_folder_id = fee_info[0].receipts_folder_id;
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
        const member_info = await SpreadSheetsSQL.open(DB_ID, MEMBER_DB_NAME).select(['m_id', 'family_name', 'first_name', 'email']).filter(`m_id = ${target_mids[i]}`).result();
        const mid = member_info[0].m_id;
        const family_name = member_info[0].family_name;
        const first_name = member_info[0].first_name;
        const email = member_info[0].email;

        // SS版領収証を生成
        // 領収証の生成
        const create_receipt_result = await createReceipt(receipts_ss_id, '領収証', r_id, today_str_jp, mid, family_name, first_name, price, description);
        // 控えの生成
        const create_counterfoil_result = await createReceipt(counterfoils_ss_id, '領収証【会計控】', r_id, today_str_jp, mid, family_name, first_name, price, description);

        // PDFを生成
        export_pdf_result = await exportSsToPdf(create_receipt_result.ss_id, create_receipt_result.sheet_name, receipts_folder_id);

        // メールを配信
        sendEmail(email, description, export_pdf_result.pdf_blob, today_str_jp, family_name, first_name);
      }
    }
  } catch (error) {
    console.error(error);
    throw (new Error(`${error.name}: ${error.message} @ registerNewFeePaymentData`));
  }
}

async function registerNewAccounting(getdata) {
  try {
    const info = getdata.parameters;

    // フォルダの生成
    let create_accounting_folder_result;
    if (info.division == '一般会計')
      create_accounting_folder_result = await addFolder(ROOT_FOLDER_ID, info.division, [`${info.year}年度`]);
    else
      create_accounting_folder_result = await addFolder(ROOT_FOLDER_ID, `${info.year}年度${(info.subject == 'その他') ? info.other_subject : info.subject}`, [`${info.year}年度`, info.division]);
    
    // 出納帳フォルダを追加
    const create_accounting_book_folder_result = await addFolder(create_accounting_folder_result.folder_id, 'account_books', []);

    // SSへのSheetの追加
    const receipt_db_name = `${info.accounting_id}_receipt_db`;
    const goods_db_name = `${info.accounting_id}_goods_db`;
    const receipt_db = SpreadsheetApp.openById(DB_ID).insertSheet(receipt_db_name, 0);
    const goods_db = SpreadsheetApp.openById(DB_ID).insertSheet(goods_db_name, 1);
    // ヘッダーの設定
    // 値の設定
    const receipt_db_header = ['ym', 'r_date', 'r_no'];
    const goods_db_header = ['date', 'no', 'person', 'writing', 'class', 'division', 'g_name', 'g_price', 'g_q', 'g_note'];
    receipt_db.appendRow(receipt_db_header);
    goods_db.appendRow(goods_db_header);
    // 背景色の設定
    const receipt_header_range = receipt_db.getRange(1, 1, 1, receipt_db_header.length);
    receipt_header_range.setBackground(HEADER_COLOR);
    receipt_header_range.setFontWeight('bold');
    const goods_header_range = goods_db.getRange(1, 1, 1, goods_db_header.length);
    goods_header_range.setBackground(HEADER_COLOR);
    goods_header_range.setFontWeight('bold');

    // DBへの登録
    const data = [[info.accounting_id, info.year, `${(info.subject == 'その他') ? info.other_subject : info.subject}`, info.division, receipt_db_name, goods_db_name, info.division_options_list, create_accounting_folder_result.folder_id]];
    simpleRegisterData(ACCOUNTING_DB_NAME, data);
  } catch (error) {
    console.error(error);
    throw (new Error(`${error.name}: ${error.message} @ registerNewAccounting`));
  }
}

async function registerNewMembershipFee(getdata) {
  try {
    const info = getdata.parameters;

    // 対象会計のフォルダIDを取得
    const sql_result = await SpreadSheetsSQL.open(DB_ID, ACCOUNTING_DB_NAME).select(['folder_id', 'accounting_id']).filter(`accounting_id = ${info.accounting_id}`).result();
    console.log(sql_result);
    const folder_id = sql_result[0].folder_id;

    const create_fee_folder_result = await addFolder(folder_id, `${(info.subject == 'その他') ? info.other_subject : info.subject}`, ['receipts']);
    const create_receipt_folder_result = await addFolder(create_fee_folder_result.folder_id, 'receipts', []);
    const create_counterfoil_folder_result = await addFolder(create_fee_folder_result.folder_id, 'counterfoils', []);
    console.log('end add folders');

    // SSを追加
    const create_receipt_ss_result = await createSS(create_receipt_folder_result.folder_id, `${info.fee_id}_receipts`);
    const create_counterfoil_ss_result = await createSS(create_counterfoil_folder_result.folder_id, `${info.fee_id}_counterfoils`);
    console.log('end create ss');

    info.fee_folder_id = create_fee_folder_result.folder_id;
    info.receipt_ss_id = create_receipt_ss_result.ss_id;
    info.receipt_folder_id = create_receipt_folder_result.folder_id;
    info.counterfoil_ss_id = create_counterfoil_ss_result.ss_id;
    info.counterfoil_folder_id = create_counterfoil_folder_result.folder_id;

    // DBに情報を登録
    registerData4FeeAndPaymentDb(info);

  } catch (error) {
    console.error(error);
    throw (new Error(`${error.name}: ${error.message} @ registerNewMembershipFee`));
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

async function registerNewProperty(getdata) {
  try {
    const info = getdata.parameters;
    const properties = PropertiesService.getScriptProperties();
    for (const key in info) {
      if (info.hasOwnProperty(key)) {
        if (key != 'mode')
          properties.setProperty(key, info[key].toString());
      }
    }
  } catch (error) {
    console.error(error);
    throw (new Error(`${error.name}: ${error.message} @ registerNewProperty`));
  }
}