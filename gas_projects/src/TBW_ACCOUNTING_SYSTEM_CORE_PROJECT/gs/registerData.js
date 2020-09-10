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

    // フォルダの生成
    let create_accounting_folder_result;
    if (info.division == '一般会計')
      create_accounting_folder_result = addFolder(ROOT_FOLDER_ID, info.division, [`${info.year}年度`]);
    else
      create_accounting_folder_result = addFolder(ROOT_FOLDER_ID, `${info.year}年度${(info.subject == 'その他') ? info.other_subject : info.subject}`, [`${info.year}年度`, info.division]);
    
    // SSへのSheetの追加
    
    // DBへの登録
    const data = [[info.accounting_id, info.year, `${(info.subject == 'その他') ? info.other_subject : info.subject}`, info.division, "A", "B", info.division_options_list, create_accounting_folder_result.folder_id]];
    simpleRegisterData(ACCOUNTING_DB_NAME, data);
  } catch (error) {
    console.error(error);
    throw (new Error(`${error.name}: ${error.message} @ registerNewAccounting`));
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